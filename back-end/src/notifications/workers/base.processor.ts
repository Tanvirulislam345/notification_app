import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger.service';
import { MetricsService } from '../../common/metrics.service';
import { Channel, NotificationStatus } from '../../common/enums';
import { DlqService } from '../../queue/dlq.service';
import { MAX_ATTEMPTS, NotificationJob } from '../../queue/queue.constants';
import { ChannelResolver } from '../channels/channel-resolver.service';
import { NotificationLog } from '../entities/notification-log.entity';

/**
 * Shared worker logic for every channel. Tries each provider in the resolver's
 * fallback chain; on total failure it throws so BullMQ retries with backoff.
 * Stateless — scale by raising concurrency or running more worker processes.
 */
export abstract class BaseChannelProcessor extends WorkerHost {
  protected constructor(
    protected readonly channel: Channel,
    protected readonly resolver: ChannelResolver,
    protected readonly logs: Repository<NotificationLog>,
    protected readonly metrics: MetricsService,
    protected readonly logger: AppLogger,
    protected readonly dlq: DlqService,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<unknown> {
    const data = job.data;
    const attempt = job.attemptsMade + 1;
    await this.logs.update(
      { id: data.logId },
      {
        attempts: attempt,
        lastAttemptAt: new Date(),
        status: NotificationStatus.PENDING,
      },
    );

    const providers = this.resolver.resolve(this.channel);
    if (providers.length === 0) {
      throw new Error(`No available provider for channel ${this.channel}`);
    }

    let lastError: Error | undefined;
    for (const provider of providers) {
      try {
        const res = await provider.send({
          logId: data.logId,
          userId: data.userId,
          correlationId: data.correlationId,
          recipient: data.recipient,
          subject: data.subject,
          body: data.body,
          isAdmin: data.isAdmin,
        });

        await this.logs.update(
          { id: data.logId },
          {
            status: NotificationStatus.SENT,
            errorMessage: null,
            lastAttemptAt: new Date(),
          },
        );
        this.metrics.incSent(this.channel, res.provider);
        this.metrics.observeLatency(
          this.channel,
          (Date.now() - job.timestamp) / 1000,
        );
        this.logger.event('delivered', {
          logId: data.logId,
          channel: this.channel,
          provider: res.provider,
          correlationId: data.correlationId,
          attempt,
        });
        return res;
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(
          `provider ${provider.name} failed: ${lastError.message}`,
        );
      }
    }

    // All providers failed this attempt → record + rethrow so BullMQ retries.
    this.metrics.incFailed(this.channel);
    await this.logs.update(
      { id: data.logId },
      {
        status: NotificationStatus.FAILED,
        errorMessage: lastError?.message ?? 'delivery failed',
        lastAttemptAt: new Date(),
      },
    );
    throw lastError ?? new Error('delivery failed');
  }

  /** Shared terminal-failure handler: move to DLQ once retries are exhausted. */
  protected async handleFailure(
    job: Job<NotificationJob> | undefined,
    err: Error,
  ): Promise<void> {
    if (!job) return;
    // Dead-letter once the job has exhausted its OWN configured attempts
    // (falls back to the default cap when opts.attempts is unset).
    const maxAttempts = job.opts?.attempts ?? MAX_ATTEMPTS;
    if (job.attemptsMade >= maxAttempts) {
      await this.dlq.deadLetter(job.data, err?.message ?? 'max retries exceeded');
    }
  }
}

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { NotificationStatus } from '../common/enums';
import { DeadLetterRecord } from '../notifications/entities/dead-letter.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import {
  EMAIL_QUEUE,
  INAPP_QUEUE,
  MAX_ATTEMPTS,
  NotificationJob,
  queueForChannel,
} from './queue.constants';
import { notifBackoff } from './backoff';

/**
 * Owns the Dead Letter Queue: records terminally-failed jobs, lists them for
 * the admin dashboard, and re-enqueues them on manual retry.
 */
@Injectable()
export class DlqService {
  constructor(
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(INAPP_QUEUE) private readonly inappQueue: Queue,
    @InjectRepository(NotificationLog)
    private readonly logs: Repository<NotificationLog>,
    @InjectRepository(DeadLetterRecord)
    private readonly dlq: Repository<DeadLetterRecord>,
    private readonly logger: AppLogger,
    private readonly metrics: MetricsService,
  ) {}

  /** Called by workers when a job exhausts all retries. */
  async deadLetter(job: NotificationJob, reason: string): Promise<void> {
    await this.logs.update(
      { id: job.logId },
      { status: NotificationStatus.DLQ, errorMessage: reason },
    );
    await this.dlq.save(
      this.dlq.create({
        notificationLogId: job.logId,
        reason,
        rawPayload: job as unknown as Record<string, unknown>,
      }),
    );
    this.metrics.incDlq(job.channel);
    this.logger.event('notification dead-lettered', {
      logId: job.logId,
      channel: job.channel,
      correlationId: job.correlationId,
      reason,
    });
  }

  list(): Promise<DeadLetterRecord[]> {
    return this.dlq.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  /** Re-enqueue a dead-lettered job onto its channel queue. */
  async retry(id: string): Promise<{ id: string; requeued: boolean }> {
    const record = await this.dlq.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`DLQ record ${id} not found`);
    }
    const job = record.rawPayload as unknown as NotificationJob;
    const queue = job.channel === 'IN_APP' ? this.inappQueue : this.emailQueue;

    await this.logs.update(
      { id: job.logId },
      { status: NotificationStatus.PENDING, errorMessage: null },
    );
    await queue.add(queueForChannel(job.channel), job, {
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'custom' },
    });
    await this.dlq.update({ id }, { retried: true });

    this.logger.event('DLQ entry manually retried', {
      dlqId: id,
      logId: job.logId,
      correlationId: job.correlationId,
    });
    return { id, requeued: true };
  }
}

// Re-exported so the worker settings can reference the same strategy.
export { notifBackoff };

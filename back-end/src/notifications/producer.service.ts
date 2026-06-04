import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AppLogger } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { RateLimiterService } from '../common/rate-limiter.service';
import { Channel, NotificationStatus } from '../common/enums';
import { PreferencesService } from '../preferences/preferences.service';
import { TemplatesService } from '../templates/templates.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  EMAIL_QUEUE,
  INAPP_QUEUE,
  NotificationJob,
  queueForChannel,
} from '../queue/queue.constants';
import { ChannelResolver } from './channels/channel-resolver.service';
import { NotificationLog } from './entities/notification-log.entity';

export interface ProduceResult {
  userId: string;
  channel: Channel;
  logId?: string;
  status: 'queued' | 'delayed' | 'sent' | 'skipped' | 'failed';
  reason?: string;
  delayMs?: number;
  correlationId: string;
}

interface ProduceInput {
  channel: Channel;
  templateName?: string;
  variables?: Record<string, unknown>;
  body?: string;
  subject?: string;
  /** Targets the shared admin room (batch toAdmins). */
  isAdmin?: boolean;
}

/**
 * Producer: validates eligibility (opt-in, quiet hours, rate limit), persists a
 * PENDING log, and enqueues the job — or, on the sync path, delivers inline.
 * Owns the correlation id that threads through the whole lifecycle.
 */
@Injectable()
export class ProducerService {
  constructor(
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(INAPP_QUEUE) private readonly inappQueue: Queue,
    @InjectRepository(NotificationLog)
    private readonly logs: Repository<NotificationLog>,
    private readonly users: UsersService,
    private readonly preferences: PreferencesService,
    private readonly templates: TemplatesService,
    private readonly resolver: ChannelResolver,
    private readonly rateLimiter: RateLimiterService,
    private readonly metrics: MetricsService,
    private readonly logger: AppLogger,
  ) {}

  private queueFor(channel: Channel): Queue {
    return channel === Channel.IN_APP ? this.inappQueue : this.emailQueue;
  }

  private recipientFor(user: User, channel: Channel): string {
    return channel === Channel.EMAIL ? user.email : user.id;
  }

  /** Merge user-derived fields into the template variables. */
  private mergeVars(user: User, vars: Record<string, unknown> = {}) {
    return {
      firstName: user.name?.split(' ')[0] ?? '',
      name: user.name,
      email: user.email,
      ...vars,
    };
  }

  /**
   * Async path: run eligibility checks, persist a PENDING log, enqueue.
   * `correlationId` is reused across a batch so related sends trace together.
   */
  async produce(
    userId: string,
    input: ProduceInput,
    correlationId = uuid(),
  ): Promise<ProduceResult> {
    const base = { userId, channel: input.channel, correlationId };
    const user = await this.users.findById(userId);
    if (!user) {
      return { ...base, status: 'skipped', reason: 'user_not_found' };
    }

    // 1. Opt-in check
    const pref = await this.preferences.getPreference(userId, input.channel);
    if (pref && !pref.optedIn) {
      this.logger.event('skipped: opted out', base);
      return { ...base, status: 'skipped', reason: 'opted_out' };
    }

    // 2. Rate limit (per user + channel sliding window)
    const rl = await this.rateLimiter.consume(userId, input.channel);
    if (!rl.allowed) {
      this.metrics.incRateLimited(input.channel);
      this.logger.event('skipped: rate limited', { ...base, limit: rl.limit });
      return { ...base, status: 'skipped', reason: 'rate_limited' };
    }

    // 3. Quiet hours → delay, don't drop
    const delayMs = pref ? this.preferences.quietHoursDelayMs(user, pref) : 0;

    // 4. Render template
    const vars = this.mergeVars(user, input.variables);
    const rendered = await this.templates.render(
      input.templateName,
      input.channel,
      vars,
      input.body,
      input.subject,
    );

    // 5. Persist PENDING log
    const log = await this.logs.save(
      this.logs.create({
        userId,
        channel: input.channel,
        templateId: rendered.templateId,
        status: NotificationStatus.PENDING,
        correlationId,
        attempts: 0,
        payload: {
          recipient: this.recipientFor(user, input.channel),
          subject: rendered.subject,
          body: rendered.body,
          templateName: input.templateName,
          variables: vars,
          isAdmin: input.isAdmin ?? false,
        },
      }),
    );

    // 6. Enqueue
    const job: NotificationJob = {
      logId: log.id,
      userId,
      channel: input.channel,
      correlationId,
      recipient: this.recipientFor(user, input.channel),
      subject: rendered.subject ?? undefined,
      body: rendered.body,
      templateName: input.templateName,
      variables: vars,
      isAdmin: input.isAdmin ?? false,
    };
    await this.queueFor(input.channel).add(
      queueForChannel(input.channel),
      job,
      delayMs > 0 ? { delay: delayMs } : undefined,
    );

    this.metrics.incEnqueued(input.channel);
    this.logger.event(delayMs > 0 ? 'enqueued (delayed)' : 'enqueued', {
      ...base,
      logId: log.id,
      delayMs,
    });

    return {
      ...base,
      logId: log.id,
      status: delayMs > 0 ? 'delayed' : 'queued',
      delayMs,
    };
  }

  /**
   * Sync path for OTPs/alerts: bypasses the queue (and quiet hours) to deliver
   * inline within seconds. Still honours opt-in and is fully logged.
   */
  async produceSync(
    userId: string,
    input: ProduceInput,
    correlationId = uuid(),
  ): Promise<ProduceResult> {
    const base = { userId, channel: input.channel, correlationId };
    const user = await this.users.findById(userId);
    if (!user) return { ...base, status: 'skipped', reason: 'user_not_found' };

    const pref = await this.preferences.getPreference(userId, input.channel);
    if (pref && !pref.optedIn) {
      return { ...base, status: 'skipped', reason: 'opted_out' };
    }

    const vars = this.mergeVars(user, input.variables);
    const rendered = await this.templates.render(
      input.templateName,
      input.channel,
      vars,
      input.body,
      input.subject,
    );
    const recipient = this.recipientFor(user, input.channel);

    const log = await this.logs.save(
      this.logs.create({
        userId,
        channel: input.channel,
        templateId: rendered.templateId,
        status: NotificationStatus.PENDING,
        correlationId,
        attempts: 1,
        lastAttemptAt: new Date(),
        payload: {
          recipient,
          subject: rendered.subject,
          body: rendered.body,
          templateName: input.templateName,
          variables: vars,
          isAdmin: input.isAdmin ?? false,
        },
      }),
    );

    const providers = this.resolver.resolve(input.channel);
    let lastError: Error | undefined;
    for (const provider of providers) {
      try {
        const res = await provider.send({
          logId: log.id,
          userId,
          correlationId,
          recipient,
          subject: rendered.subject ?? undefined,
          body: rendered.body,
          isAdmin: input.isAdmin ?? false,
        });
        await this.logs.update(
          { id: log.id },
          { status: NotificationStatus.SENT, lastAttemptAt: new Date() },
        );
        this.metrics.incSent(input.channel, res.provider);
        return { ...base, logId: log.id, status: 'sent' };
      } catch (err) {
        lastError = err as Error;
      }
    }

    await this.logs.update(
      { id: log.id },
      {
        status: NotificationStatus.FAILED,
        errorMessage: lastError?.message ?? 'no provider available',
        lastAttemptAt: new Date(),
      },
    );
    this.metrics.incFailed(input.channel);
    return {
      ...base,
      logId: log.id,
      status: 'failed',
      reason: lastError?.message ?? 'no_provider',
    };
  }
}

import { OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { AppLogger } from '../../common/logger.service';
import { MetricsService } from '../../common/metrics.service';
import { Channel } from '../../common/enums';
import { DlqService } from '../../queue/dlq.service';
import { notifBackoff } from '../../queue/backoff';
import { INAPP_QUEUE, NotificationJob } from '../../queue/queue.constants';
import { ChannelResolver } from '../channels/channel-resolver.service';
import { NotificationLog } from '../entities/notification-log.entity';
import { BaseChannelProcessor } from './base.processor';

@Processor(INAPP_QUEUE, {
  concurrency: parseInt(process.env.INAPP_WORKER_CONCURRENCY ?? '50', 10),
  settings: { backoffStrategy: (attemptsMade: number) => notifBackoff(attemptsMade) },
})
export class InAppWorker extends BaseChannelProcessor {
  constructor(
    resolver: ChannelResolver,
    @InjectRepository(NotificationLog) logs: Repository<NotificationLog>,
    metrics: MetricsService,
    logger: AppLogger,
    dlq: DlqService,
  ) {
    super(Channel.IN_APP, resolver, logs, metrics, logger, dlq);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NotificationJob>, err: Error) {
    await this.handleFailure(job, err);
  }
}

import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadLetterRecord } from '../notifications/entities/dead-letter.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { DlqService } from './dlq.service';
import {
  EMAIL_QUEUE,
  INAPP_QUEUE,
  MAX_ATTEMPTS,
} from './queue.constants';

/**
 * BullMQ setup: shared Redis connection + one queue per channel with
 * at-least-once defaults (custom backoff, jobs retained on failure for DLQ).
 * Global so producer/workers can inject the queues anywhere.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
        defaultJobOptions: {
          attempts: MAX_ATTEMPTS,
          backoff: { type: 'custom' },
          removeOnComplete: 1000,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: INAPP_QUEUE }),
    TypeOrmModule.forFeature([NotificationLog, DeadLetterRecord]),
  ],
  providers: [DlqService],
  exports: [BullModule, DlqService],
})
export class QueueModule {}

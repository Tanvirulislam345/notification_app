import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Injection token for the shared ioredis client. */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Provides a single shared ioredis connection used by the rate limiter and the
 * Socket.IO Redis adapter. (BullMQ manages its own connections via BullModule.)
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

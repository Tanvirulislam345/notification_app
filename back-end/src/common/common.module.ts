import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { RateLimiterService } from './rate-limiter.service';

/**
 * Cross-cutting providers shared everywhere: structured logging, Prometheus
 * metrics, and the Redis rate limiter. Global so feature modules need no import.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [AppLogger, MetricsService, RateLimiterService],
  exports: [AppLogger, MetricsService, RateLimiterService],
})
export class CommonModule {}

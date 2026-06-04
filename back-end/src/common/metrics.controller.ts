import { Controller, Get, Header } from '@nestjs/common';
import { register as defaultRegister } from 'prom-client';
import { MetricsService } from './metrics.service';

/** GET /metrics — Prometheus-compatible scrape endpoint. */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', defaultRegister.contentType)
  async scrape(): Promise<string> {
    return this.metrics.metrics();
  }
}

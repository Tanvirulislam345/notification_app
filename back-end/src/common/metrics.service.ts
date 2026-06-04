import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import { Channel } from './enums';

/**
 * Prometheus metrics. Exposed at GET /metrics (see MetricsController).
 * Tracks the full notification lifecycle for observability.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  private readonly enqueued: Counter<string>;
  private readonly sent: Counter<string>;
  private readonly failed: Counter<string>;
  private readonly dlq: Counter<string>;
  private readonly rateLimited: Counter<string>;
  private readonly deliveryLatency: Histogram<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });

    this.enqueued = new Counter({
      name: 'notifications_enqueued_total',
      help: 'Notifications enqueued',
      labelNames: ['channel'],
      registers: [this.registry],
    });
    this.sent = new Counter({
      name: 'notifications_sent_total',
      help: 'Notifications successfully delivered',
      labelNames: ['channel', 'provider'],
      registers: [this.registry],
    });
    this.failed = new Counter({
      name: 'notifications_failed_total',
      help: 'Notification delivery attempts that failed',
      labelNames: ['channel'],
      registers: [this.registry],
    });
    this.dlq = new Counter({
      name: 'notifications_dlq_total',
      help: 'Notifications dead-lettered after exhausting retries',
      labelNames: ['channel'],
      registers: [this.registry],
    });
    this.rateLimited = new Counter({
      name: 'notifications_rate_limited_total',
      help: 'Notifications denied by the rate limiter',
      labelNames: ['channel'],
      registers: [this.registry],
    });
    this.deliveryLatency = new Histogram({
      name: 'notification_delivery_seconds',
      help: 'Seconds from enqueue to successful delivery',
      labelNames: ['channel'],
      buckets: [0.5, 1, 2, 3, 5, 10, 30, 60, 300, 1800],
      registers: [this.registry],
    });
  }

  incEnqueued(channel: Channel) {
    this.enqueued.inc({ channel });
  }
  incSent(channel: Channel, provider: string) {
    this.sent.inc({ channel, provider });
  }
  incFailed(channel: Channel) {
    this.failed.inc({ channel });
  }
  incDlq(channel: Channel) {
    this.dlq.inc({ channel });
  }
  incRateLimited(channel: Channel) {
    this.rateLimited.inc({ channel });
  }
  observeLatency(channel: Channel, seconds: number) {
    this.deliveryLatency.observe({ channel }, seconds);
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}

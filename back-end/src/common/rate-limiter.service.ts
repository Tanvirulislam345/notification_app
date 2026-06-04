import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Channel } from './enums';
import { REDIS_CLIENT } from './redis.module';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * Per-user, per-channel rate limiting via a Redis sorted-set sliding window.
 * Each send records `now` as a ZSET member; the window is the trailing
 * `windowSec` seconds. Atomic via a single Lua script (no race conditions).
 */
@Injectable()
export class RateLimiterService {
  // KEYS[1]=key  ARGV[1]=now(ms)  ARGV[2]=windowMs  ARGV[3]=max  ARGV[4]=member
  private readonly script = `
    redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
    local count = redis.call('ZCARD', KEYS[1])
    if count < tonumber(ARGV[3]) then
      redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
      redis.call('PEXPIRE', KEYS[1], ARGV[2])
      return 1
    end
    return 0
  `;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  private limitFor(channel: Channel): { max: number; windowSec: number } {
    if (channel === Channel.EMAIL) {
      return {
        max: this.config.get<number>('rateLimit.email.max', 5),
        windowSec: this.config.get<number>('rateLimit.email.windowSec', 3600),
      };
    }
    return {
      max: this.config.get<number>('rateLimit.inapp.max', 60),
      windowSec: this.config.get<number>('rateLimit.inapp.windowSec', 3600),
    };
  }

  /**
   * Atomically check + consume one token. `nowMs` is injectable for testing.
   */
  async consume(
    userId: string,
    channel: Channel,
    nowMs = Date.now(),
  ): Promise<RateLimitResult> {
    const { max, windowSec } = this.limitFor(channel);
    const key = `ratelimit:${channel}:${userId}`;
    const member = `${nowMs}-${Math.floor(nowMs % 1000)}`;

    const allowed = (await this.redis.eval(
      this.script,
      1,
      key,
      String(nowMs),
      String(windowSec * 1000),
      String(max),
      member,
    )) as number;

    const count = await this.redis.zcard(key);
    return {
      allowed: allowed === 1,
      remaining: Math.max(0, max - count),
      limit: max,
    };
  }
}

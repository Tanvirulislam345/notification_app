import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';

/**
 * Structured JSON logger (Winston). Every lifecycle event carries a
 * correlationId so a single notification can be traced enqueue → delivery.
 */
@Injectable()
export class AppLogger implements NestLoggerService {
  private readonly logger: Logger;

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    this.logger = createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        isProd ? format.json() : format.combine(format.colorize(), format.simple()),
      ),
      transports: [new transports.Console()],
    });
  }

  /** Structured lifecycle event log. */
  event(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(message, meta);
  }

  log(message: any, ...optional: any[]): void {
    this.logger.info(message, { optional });
  }
  error(message: any, ...optional: any[]): void {
    this.logger.error(message, { optional });
  }
  warn(message: any, ...optional: any[]): void {
    this.logger.warn(message, { optional });
  }
  debug(message: any, ...optional: any[]): void {
    this.logger.debug(message, { optional });
  }
  verbose(message: any, ...optional: any[]): void {
    this.logger.verbose(message, { optional });
  }
}

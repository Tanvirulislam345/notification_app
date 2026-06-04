/**
 * Centralised, typed configuration loaded from environment variables.
 * Consumed via Nest's ConfigService: `config.get('redis.host')`.
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  workerOnly: boolean;
  devUserHeader: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  mail: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    from: string;
    sendgridApiKey?: string;
  };
  workers: {
    emailConcurrency: number;
    inappConcurrency: number;
  };
  rateLimit: {
    email: { max: number; windowSec: number };
    inapp: { max: number; windowSec: number };
  };
}

const toInt = (v: string | undefined, fallback: number): number => {
  const n = parseInt(v ?? '', 10);
  return Number.isNaN(n) ? fallback : n;
};

const toBool = (v: string | undefined, fallback = false): boolean =>
  v === undefined ? fallback : v.toLowerCase() === 'true';

export default (): AppConfig => ({
  port: toInt(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  workerOnly: toBool(process.env.WORKER_ONLY, false),
  devUserHeader: process.env.DEV_USER_HEADER ?? 'x-user-id',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    user: process.env.DB_USER ?? 'notif',
    password: process.env.DB_PASSWORD ?? 'notif',
    name: process.env.DB_NAME ?? 'notifications',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  mail: {
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: toInt(process.env.SMTP_PORT, 1025),
    smtpSecure: toBool(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER || undefined,
    smtpPassword: process.env.SMTP_PASSWORD || undefined,
    from: process.env.MAIL_FROM ?? 'Notifications <no-reply@example.com>',
    sendgridApiKey: process.env.SENDGRID_API_KEY || undefined,
  },
  workers: {
    emailConcurrency: toInt(process.env.EMAIL_WORKER_CONCURRENCY, 25),
    inappConcurrency: toInt(process.env.INAPP_WORKER_CONCURRENCY, 50),
  },
  rateLimit: {
    email: {
      max: toInt(process.env.RATE_LIMIT_EMAIL_MAX, 5),
      windowSec: toInt(process.env.RATE_LIMIT_EMAIL_WINDOW_SEC, 3600),
    },
    inapp: {
      max: toInt(process.env.RATE_LIMIT_INAPP_MAX, 60),
      windowSec: toInt(process.env.RATE_LIMIT_INAPP_WINDOW_SEC, 3600),
    },
  },
});

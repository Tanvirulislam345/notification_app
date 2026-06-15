export interface AppConfig {
  port: number;
  nodeEnv: string;
  db: { host: string; port: number; user: string; password: string; name: string };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresDays: number;
  };
  mail: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    from: string;
  };
  appUrl: string;
  invitationTtlDays: number;
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
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 5433),
    user: process.env.DB_USER ?? 'auth',
    password: process.env.DB_PASSWORD ?? 'auth',
    name: process.env.DB_NAME ?? 'saas_auth',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-min-32-chars-long-enough',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-32-chars-long',
    refreshExpiresDays: toInt(process.env.JWT_REFRESH_EXPIRES_DAYS, 7),
  },
  mail: {
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: toInt(process.env.SMTP_PORT, 1025),
    smtpSecure: toBool(process.env.SMTP_SECURE),
    smtpUser: process.env.SMTP_USER || undefined,
    smtpPassword: process.env.SMTP_PASSWORD || undefined,
    from: process.env.MAIL_FROM ?? 'SaaS Auth <no-reply@example.com>',
  },
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  invitationTtlDays: toInt(process.env.INVITATION_TTL_DAYS, 7),
});

import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { UserPreference } from './preferences/entities/user-preference.entity';
import { NotificationTemplate } from './templates/entities/notification-template.entity';
import { NotificationLog } from './notifications/entities/notification-log.entity';
import { DeadLetterRecord } from './notifications/entities/dead-letter.entity';

loadEnv();

/**
 * Standalone DataSource used by the TypeORM CLI (migrations) and the seed script.
 * The Nest app builds its own DataSource from the same entity list in app.module.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'notif',
  password: process.env.DB_PASSWORD ?? 'notif',
  database: process.env.DB_NAME ?? 'notifications',
  entities: [
    User,
    UserPreference,
    NotificationTemplate,
    NotificationLog,
    DeadLetterRecord,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn'],
});

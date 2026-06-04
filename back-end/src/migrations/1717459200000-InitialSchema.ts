import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: enums, the five core tables, and supporting indexes.
 * Mirrors the entity definitions exactly.
 */
export class InitialSchema1717459200000 implements MigrationInterface {
  name = 'InitialSchema1717459200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── enums ────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "channel_enum" AS ENUM ('EMAIL', 'IN_APP', 'SMS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_status_enum" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DLQ')`,
    );

    // ── users ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "timezone" character varying NOT NULL DEFAULT 'UTC',
        "isAdmin" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    );

    // ── user_preferences ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "channel" "channel_enum" NOT NULL,
        "optedIn" boolean NOT NULL DEFAULT true,
        "quietHoursStart" TIME,
        "quietHoursEnd" TIME,
        "priority" integer NOT NULL DEFAULT 100,
        CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_channel" UNIQUE ("userId", "channel"),
        CONSTRAINT "FK_pref_user" FOREIGN KEY ("userId")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pref_userId" ON "user_preferences" ("userId")`,
    );

    // ── notification_templates ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notification_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "channel" "channel_enum" NOT NULL,
        "subject" character varying,
        "bodyTemplate" text NOT NULL,
        CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_name_channel" UNIQUE ("name", "channel")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_template_name" ON "notification_templates" ("name")`,
    );

    // ── notification_logs ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "channel" "channel_enum" NOT NULL,
        "templateId" uuid,
        "status" "notification_status_enum" NOT NULL DEFAULT 'PENDING',
        "payload" jsonb NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "lastAttemptAt" TIMESTAMP WITH TIME ZONE,
        "errorMessage" text,
        "correlationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_log_userId" ON "notification_logs" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_log_user_created" ON "notification_logs" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_log_status" ON "notification_logs" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_log_correlation" ON "notification_logs" ("correlationId")`,
    );

    // ── dead_letter_records ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "dead_letter_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "notificationLogId" uuid NOT NULL,
        "reason" text NOT NULL,
        "rawPayload" jsonb NOT NULL,
        "retried" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dead_letter_records" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_dlq_logId" ON "dead_letter_records" ("notificationLogId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dead_letter_records"`);
    await queryRunner.query(`DROP TABLE "notification_logs"`);
    await queryRunner.query(`DROP TABLE "notification_templates"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE "channel_enum"`);
  }
}

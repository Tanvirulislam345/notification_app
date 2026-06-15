import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSchema1781513887766 implements MigrationInterface {
    name = 'AuthSchema1781513887766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "isEmailVerified" boolean NOT NULL DEFAULT false, "timezone" character varying NOT NULL DEFAULT 'UTC', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "refreshTokenHash" character varying NOT NULL, "deviceInfo" jsonb, "ipAddress" character varying, "lastActive" TIMESTAMP WITH TIME ZONE, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_55fa4db8406ed66bc704432842" ON "user_sessions" ("userId") `);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "organizationId" uuid, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleId" uuid NOT NULL, "permissionId" uuid NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d430a02aad006d8a70f3acd7d0" ON "role_permissions" ("roleId", "permissionId") `);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_organization_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "roleId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_67a0f13e9780a6529709487d8b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c144eb5d08cc3b35531bbc76bd" ON "user_organization_memberships" ("userId", "organizationId") `);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "organizationId" uuid NOT NULL, "roleId" uuid NOT NULL, "token" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97ab59cb592c7cec109741b592" ON "invitations" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9139f00cebfadced76bca3084" ON "invitations" ("organizationId") `);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d6a19d4b4f6c62dcd29daa497e" ON "password_reset_tokens" ("userId") `);
        await queryRunner.query(`CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "verifiedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_3d1613f95c6a564a3b588d161ae" UNIQUE ("token"), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_10f285d038feb767bf7c2da14b" ON "email_verification_tokens" ("userId") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid, "userId" uuid, "action" character varying NOT NULL, "entity" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d031e6155834882f54dcd6b4f" ON "audit_logs" ("organizationId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2d031e6155834882f54dcd6b4f"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10f285d038feb767bf7c2da14b"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6a19d4b4f6c62dcd29daa497e"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9139f00cebfadced76bca3084"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97ab59cb592c7cec109741b592"`);
        await queryRunner.query(`DROP TABLE "invitations"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c144eb5d08cc3b35531bbc76bd"`);
        await queryRunner.query(`DROP TABLE "user_organization_memberships"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d430a02aad006d8a70f3acd7d0"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55fa4db8406ed66bc704432842"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}

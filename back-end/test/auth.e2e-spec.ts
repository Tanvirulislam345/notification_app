import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth System (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = moduleRef.get(DataSource);

    // Clean up any leftover test data
    await dataSource.query(
      `DELETE FROM user_sessions WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM email_verification_tokens WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM password_reset_tokens WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM user_organization_memberships WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(`DELETE FROM organizations WHERE name = 'Test Org E2E'`);
    await dataSource.query(`DELETE FROM users WHERE email = 'e2e-test@example.com'`);
  }, 30000);

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM user_sessions WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM email_verification_tokens WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM password_reset_tokens WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(
      `DELETE FROM user_organization_memberships WHERE "userId" IN (SELECT id FROM users WHERE email = 'e2e-test@example.com')`,
    );
    await dataSource.query(`DELETE FROM organizations WHERE name = 'Test Org E2E'`);
    await dataSource.query(`DELETE FROM users WHERE email = 'e2e-test@example.com'`);
    await app.close();
  }, 30000);

  describe('POST /auth/register', () => {
    it('registers a new tenant and returns success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'e2e-test@example.com',
          password: 'Password123!',
          organizationName: 'Test Org E2E',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('verify your account');
    });

    it('rejects duplicate email registration with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'e2e-test@example.com',
          password: 'Password123!',
          organizationName: 'Another Org',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login (before email verify)', () => {
    it('rejects login if email not verified with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-test@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('verifies email with valid token from DB', async () => {
      const tokenRow = await dataSource.query(
        `SELECT token FROM email_verification_tokens
         WHERE "userId" = (SELECT id FROM users WHERE email = 'e2e-test@example.com')
         ORDER BY "expiresAt" DESC LIMIT 1`,
      );
      expect(tokenRow.length).toBeGreaterThan(0);
      const token = tokenRow[0]?.token;

      const res = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Email verified');
    });
  });

  describe('POST /auth/login (after email verify)', () => {
    it('returns accessToken and sets HTTP-only cookies on success', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-test@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('e2e-test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-test@example.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /organizations/me (protected route)', () => {
    it('returns org info when authenticated via Bearer token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-test@example.com', password: 'Password123!' });

      const accessToken = loginRes.body.accessToken;
      const res = await request(app.getHttpServer())
        .get('/organizations/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Org E2E');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/organizations/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('returns safe response for registered email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'e2e-test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link');
    });

    it('returns same safe response for unknown email (no enumeration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'notregistered@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link');
    });
  });

  describe('POST /auth/logout', () => {
    it('invalidates the current session', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-test@example.com', password: 'Password123!' });
      const accessToken = loginRes.body.accessToken;

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);
    });
  });
});

# SaaS Auth Backend

Multi-tenant SaaS authentication system built with NestJS, TypeORM, and PostgreSQL.

## Features

- Tenant signup — every registration auto-creates an Organization; first user becomes OWNER
- Email-based invitation system — users join only via invite
- JWT access tokens (15 min, HTTP-only cookie) + opaque refresh tokens (7 days, SHA-256 hashed in DB)
- Role-based access control (OWNER, ADMIN, MANAGER, USER, VIEWER) with named permissions
- Multi-device session management — logout specific or all sessions
- Email verification and forgot/reset password flows
- Audit logging of all auth events

## Tech Stack

- **NestJS 11** — framework
- **TypeORM 0.3.20** + **PostgreSQL 16** — database
- **argon2** — password hashing
- **passport-jwt** — JWT strategy
- **nodemailer** + **MailHog** — email (dev)
- **cookie-parser** — HTTP-only cookies

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Docker](https://www.docker.com) + Docker Compose

---

## Quick Start

### 1. Start infrastructure (PostgreSQL + MailHog)

From the **project root** (one level above `back-end/`):

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 on **port 5433** (host) → 5432 (container)
- MailHog SMTP on **port 1025**, web UI on **port 8025**

Verify containers are healthy:

```bash
docker compose ps
```

### 2. Install dependencies

```bash
cd back-end
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set your values. For local development the defaults work out of the box:

```env
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5433
DB_USER=auth
DB_PASSWORD=auth
DB_NAME=saas_auth

JWT_SECRET=change-me-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_DAYS=7

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM="SaaS Auth <no-reply@example.com>"

APP_URL=http://localhost:3000
INVITATION_TTL_DAYS=7
```

> **Important:** Never commit `.env` — it is listed in `.gitignore`.

### 4. Run database migration

```bash
npm run migration:run
```

This creates all 11 tables: `users`, `organizations`, `user_organization_memberships`, `roles`, `permissions`, `role_permissions`, `user_sessions`, `email_verification_tokens`, `password_reset_tokens`, `invitations`, `audit_logs`.

### 5. Seed default roles and permissions

```bash
npm run seed
```

Seeds 5 system roles (OWNER, ADMIN, MANAGER, USER, VIEWER) and 8 permissions. Safe to run multiple times — idempotent.

### 6. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Server listens on `http://localhost:4000`.

---

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Create account + organization, send verify email |
| POST | `/auth/login` | Public | Login, set HTTP-only cookies + return `accessToken` |
| POST | `/auth/logout` | JWT | Invalidate current session |
| POST | `/auth/logout-all` | JWT | Invalidate all sessions |
| POST | `/auth/refresh-token` | Refresh cookie | Rotate refresh token |
| GET | `/auth/verify-email?token=` | Public | Verify email from link |
| POST | `/auth/resend-verification` | Public | Resend verification email |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

### Organizations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/organizations/me` | JWT | Get current tenant info |
| GET | `/organizations/members` | JWT | List all org members with roles |

### Invitations

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/invitations/send` | JWT | `user.invite` |
| GET | `/invitations` | JWT | `invitation.manage` |
| DELETE | `/invitations/:id` | JWT | `invitation.manage` |
| POST | `/invitations/accept` | Public | — |

### Roles

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/roles` | JWT | `role.read` |
| GET | `/roles/permissions` | JWT | `role.read` |

---

## Example: Full Registration Flow

**1. Register a new tenant**

```bash
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "Password123!",
    "organizationName": "Acme Corp"
  }'
```

**2. Check email** — open MailHog at http://localhost:8025, copy the verification token from the link.

**3. Verify email**

```bash
curl "http://localhost:4000/auth/verify-email?token=<token-from-email>"
```

**4. Login**

```bash
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123!"}' \
  -c cookies.txt
```

Response includes `accessToken` in the body. `access_token` and `refresh_token` are also set as HTTP-only cookies.

**5. Access a protected route**

```bash
# Using cookie
curl http://localhost:4000/organizations/me -b cookies.txt

# Using Bearer token
curl http://localhost:4000/organizations/me \
  -H 'Authorization: Bearer <accessToken>'
```

**6. Invite a user** (requires OWNER or ADMIN role)

```bash
# Get the USER role ID first
curl http://localhost:4000/roles -H 'Authorization: Bearer <accessToken>'

curl -X POST http://localhost:4000/invitations/send \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <accessToken>' \
  -d '{"email":"bob@example.com","roleId":"<user-role-id>"}'
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled production build |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:generate -- src/migrations/Name` | Generate migration from entity changes |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed default roles and permissions |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

---

## RBAC — Roles and Permissions

| Permission | OWNER | ADMIN | MANAGER | USER | VIEWER |
|------------|:-----:|:-----:|:-------:|:----:|:------:|
| `user.invite` | ✅ | ✅ | | | |
| `user.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `user.manage` | ✅ | ✅ | | | |
| `invitation.manage` | ✅ | ✅ | ✅ | | |
| `role.read` | ✅ | ✅ | ✅ | | |
| `role.manage` | ✅ | | | | |
| `organization.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `organization.manage` | ✅ | | | | |

---

## Email (MailHog)

In development all emails are captured by MailHog — nothing is sent externally.

- **Web UI:** http://localhost:8025
- **SMTP:** localhost:1025

For production, set real SMTP credentials in `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASSWORD=your-password
MAIL_FROM="Your App <no-reply@example.com>"
```

---

## Project Structure

```
back-end/src/
├── auth/               # Registration, login, refresh, password reset, email verify
│   ├── dto/            # Request validation DTOs
│   ├── entities/       # EmailVerificationToken, PasswordResetToken
│   ├── guards/         # JwtAuthGuard, JwtRefreshGuard
│   └── strategies/     # passport-jwt access + refresh strategies
├── organizations/      # Tenant info and member listing
├── invitations/        # Invite flow (send, accept, list, revoke)
├── roles/              # Roles and permissions
├── sessions/           # Session creation, invalidation, refresh token lookup
├── users/              # User entity and lookups
├── audit-logs/         # Audit log writes
├── mail/               # nodemailer wrapper
├── common/
│   ├── decorators/     # @Public(), @CurrentUser(), @RequirePermissions()
│   └── guards/         # RolesGuard
├── config/             # Typed configuration factory
├── migrations/         # TypeORM migration files
├── app.module.ts       # Root module (global guards wired here)
├── main.ts             # Bootstrap (cookie-parser, ValidationPipe, CORS)
├── data-source.ts      # TypeORM CLI data source
└── seed.ts             # Role + permission seeder
```

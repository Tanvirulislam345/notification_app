# SaaS Auth — Multi-Tenant Authentication System

Full-stack multi-tenant SaaS authentication system.

| Layer | Tech | Port |
|---|---|---|
| **Backend** | NestJS 11 + TypeORM + PostgreSQL | 4000 |
| **Frontend** | Next.js 16 (App Router) + Tailwind | 3000 |
| **Database** | PostgreSQL 16 (Docker) | 5433 |
| **Email** | MailHog (dev) | 1025 / 8025 |

---

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Backend

```bash
cd back-end
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

Backend runs at **http://localhost:4000**

### 3. Frontend

```bash
cd front-end
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Application Flow

1. Open **http://localhost:3000** → redirects to `/login`
2. Click **"Create one"** → `/register` — fill in name, email, password, org name
3. Check **http://localhost:8025** (MailHog) → copy the verification link
4. Click the verify link → email confirmed
5. Login → land on the Dashboard
6. Go to **Invitations** → send an invite to a colleague
7. Colleague receives email (MailHog), clicks accept, creates their account
8. Check **Members** to see them in the org

---

## Detailed Documentation

- [Backend README](back-end/README.md) — API reference, scripts, RBAC table
- [AUTH.md](AUTH.md) — full specification

---

## Project Structure

```
.
├── back-end/           NestJS API server
├── front-end/          Next.js frontend
├── docker-compose.yml  PostgreSQL + MailHog
└── AUTH.md             Feature specification
```

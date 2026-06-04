# 🔔 Notification System

Production-grade, horizontally-scalable multi-channel (Email + In-App) notification system.
Backend: **NestJS + TypeORM + BullMQ**. Frontend: **Next.js (App Router)**. See [`CLAUDE.md`](./CLAUDE.md) for the full architecture spec.

```
back-end/    NestJS API + BullMQ workers + Socket.IO gateway
front-end/   Next.js App Router UI
docker-compose.yml   Postgres + Redis + MailHog (local dev infra)
```

---

## 1. Start infrastructure

```bash
docker compose up -d
```

This brings up:

| Service  | Port | Notes |
|----------|------|-------|
| Postgres | 5432 | user `notif` / pass `notif` / db `notifications` |
| Redis    | 6379 | BullMQ broker + rate limiter + Socket.IO adapter |
| MailHog  | 1025 (SMTP) / **8025 (Web UI)** | catches all dev emails — open http://localhost:8025 |

## 2. Backend

```bash
cd back-end
cp .env.example .env
npm install
npm run migration:run     # create tables
npm run seed              # dev user + default prefs + templates
npm run start:dev         # API + workers + gateway on http://localhost:4000
```

Scale workers horizontally by running additional stateless worker processes:

```bash
npm run worker            # extra consumer process (same code, no HTTP server)
```

## 3. Frontend

```bash
cd front-end
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

---

## End-to-end demo

1. Open **http://localhost:3000/items**, select items, click **Confirm**.
2. A confirmation email appears in **MailHog** (http://localhost:8025); the admin
   **NotificationBell** badge increments live over Socket.IO.
3. Check **/notifications** for delivery history with status badges.
4. **/preferences** — toggle channel opt-in/out and quiet hours.
5. **/admin/dlq** — inspect dead-lettered jobs and retry them.
6. **http://localhost:4000/metrics** — Prometheus-compatible metrics.

## Auth

Auth is **stubbed** for this build: the frontend sends a dev `x-user-id` header and the
backend resolves a dev user. Clerk/JWT integration is on the roadmap (`CLAUDE.md`).

# 🔔 Notification System

A production-grade, scalable notification system with a fully decoupled frontend and backend. Supports multi-channel delivery (Email and In-App Push), enforces user preferences, handles failures gracefully, and is architected for future extensibility.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Core Components](#-core-components)
- [Functional Requirements](#-functional-requirements)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Key Challenges](#-key-challenges)
- [Database Schema](#-database-schema-postgresql--typeorm)
- [API Endpoints](#-api-endpoints-nestjs)
- [Frontend Pages](#-frontend-nextjs)
- [Key Design Decisions](#-key-design-decisions)
- [Project Structure](#-project-structure)
- [Build Order](#-suggested-build-order)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | NestJS |
| Database | PostgreSQL + TypeORM |
| Queue / Broker | BullMQ (Redis-backed) |
| Email Channels | Nodemailer + SendGrid |
| Push Notifications | In-app (WebSocket or SSE) |
| Monitoring | Winston + Prometheus-ready hooks |
| Auth for now simple clerk authentication In future JWT 

---

## 🏗 Architecture Overview

The system is divided into the following core components. Each is a distinct, independently testable module:

```
Client (Next.js)
     │
     ▼
REST API (NestJS Controllers)
     │
     ▼
Producer Service ──► Rate Limiter (Redis)
     │
     ▼
Message Queue (BullMQ)
  ├── email.queue
  └── inapp.queue
     │
     ▼
Workers (Email / InApp)
  ├── Channel Adapter (INotificationChannel)
  │     ├── SendGrid
  │     ├── Nodemailer
  │     └── InApp (WebSocket/SSE)
  └── Retry / Backoff Logic
     │
     ▼
Dead Letter Queue (DLQ)
     │
     ▼
PostgreSQL (Notification Logs, User Preferences, Templates)
```

---

## 🧩 Core Components

### 1. Producer
Accepts notification trigger events (e.g., user clicked items, order confirmed). Validates payload, checks user preferences and rate limits, and enqueues jobs.

### 2. Message Queue / Broker
BullMQ queues per channel (`email.queue`, `inapp.queue`). Supports priority, delay, and concurrency controls backed by Redis.

### 3. Notification Service
Orchestration layer. Resolves which channels to use, applies rate limiting, personalizes message templates, and dispatches to workers.

### 4. Workers
Channel-specific consumers. One worker per channel (`EmailWorker`, `InAppWorker`). Each handles retries with exponential backoff.

### 5. Dead Letter Queue (DLQ)
Failed jobs after max retries are moved here. Logged, alerted, and manually retriable via admin API.

### 6. Channel Integrations
Adapter pattern. Each channel (Nodemailer, SendGrid, WebSocket) implements a shared `INotificationChannel` interface so new channels can be added without touching core logic.

### 7. Database Layer
PostgreSQL via TypeORM. Stores notification logs, delivery status, user preferences, retry history, and DLQ records.

### 8. Rate Limiter
Per-user and per-channel rate limits (e.g., max 5 emails/hour). Enforced at the Producer level using Redis sliding window counters.

### 9. Monitoring & Logging
Structured logs via Winston. Tracks enqueue time, delivery time, failure reasons, retry count, and DLQ hits. Exposes `/metrics` endpoint (Prometheus-compatible).

---

## ✅ Functional Requirements

### Multi-Channel Support
Email and In-App Push now. Architecture must allow SMS, WhatsApp, and browser push to be added with zero changes to core logic.

### Guaranteed Delivery
At-least-once delivery semantics. Every notification attempt is logged with status: `PENDING` → `SENT` / `FAILED` → `DLQ`.

### User Preferences
Each user can configure:
- Opt-in / opt-out per channel
- Quiet hours (e.g., no emails between 10 PM–8 AM in user's timezone)
- Preferred channel priority (e.g., prefer in-app over email)

### Personalization
All notification templates support variable interpolation:
```
"Hi {{firstName}}, your order {{orderId}} has been confirmed."
```

### Retry Mechanism
Failed deliveries retry with exponential backoff:
```
30s → 2 min → 10 min → 30 min → DLQ
```

### Batch Delivery
Support sending a notification to multiple users in a single producer call (e.g., notify all admins when a bulk action is performed).

### Synchronous Path
For time-sensitive notifications (OTPs, alerts), support a direct send path that bypasses the queue. Target delivery within 2–3 seconds.

---

## ⚙️ Non-Functional Requirements

| Requirement | Target |
|---|---|
| Scalability | Horizontal worker scaling; each worker is stateless |
| Low Latency | Sync path < 3s · Async P95 < 30s |
| High Availability | No single point of failure; Redis + PG connection retry |
| Fault Tolerance | Provider fallback (SendGrid → Nodemailer); graceful degradation |
| Observability | Structured logs with correlation ID for every lifecycle event |

---

## 🚧 Key Challenges

### High Concurrency
Millions of notifications may need to be delivered in a very short time. Solved via horizontally scalable, stateless BullMQ workers.

### Multi-Channel Complexity
Each channel has its own quirks and failure modes. Solved via the `INotificationChannel` adapter interface — core logic never changes when adding a channel.

### Delivery Guarantees
Deciding between at-most-once, at-least-once, or exactly-once semantics. This system uses **at-least-once** with idempotency keys planned for future exactly-once support.

### User Preferences at Scale
Enforcing opt-in/out, quiet hours, and per-channel preferences. Solved by checking preferences in the Producer before enqueue, with quiet-hours jobs delayed rather than dropped.

### Failure Handling
External dependencies fail. Solved via retries with exponential backoff, provider-level fallback chains, dead-lettering, and DLQ manual retry via admin API.

---

## 🗄 Database Schema (PostgreSQL + TypeORM)

### `User`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | varchar | Unique |
| name | varchar | |
| timezone | varchar | e.g. `Asia/Dhaka` |
| createdAt | timestamp | |

### `UserPreference`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| channel | enum | `EMAIL`, `IN_APP`, `SMS` |
| optedIn | boolean | |
| quietHoursStart | time | e.g. `22:00` |
| quietHoursEnd | time | e.g. `08:00` |

### `NotificationTemplate`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | varchar | e.g. `order_confirmed` |
| channel | enum | |
| subject | varchar | Email subject line |
| bodyTemplate | text | Supports `{{variable}}` syntax |

### `NotificationLog`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| channel | enum | |
| templateId | UUID | FK → NotificationTemplate |
| status | enum | `PENDING`, `SENT`, `FAILED`, `DLQ` |
| payload | jsonb | Full resolved payload |
| attempts | int | Retry count |
| lastAttemptAt | timestamp | |
| errorMessage | text | Last failure reason |
| correlationId | UUID | End-to-end tracing ID |

### `DeadLetterRecord`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| notificationLogId | UUID | FK → NotificationLog |
| reason | text | Why it was DLQ'd |
| rawPayload | jsonb | Original job payload |
| createdAt | timestamp | |

---

## 🔌 API Endpoints (NestJS)

```
# Notifications
POST   /notifications/send           Trigger a single notification
POST   /notifications/batch          Trigger a batch notification
GET    /notifications/:userId         Get delivery history for a user

# Dead Letter Queue (Admin)
GET    /notifications/dlq             List all DLQ entries
POST   /notifications/dlq/:id/retry   Manually retry a DLQ entry

# User Preferences
GET    /preferences/:userId           Get user preferences
PUT    /preferences/:userId           Update user preferences

# Observability
GET    /metrics                       Prometheus-compatible metrics endpoint
```

---

## 🖥 Frontend (Next.js)

### Pages & Components

| Page / Component | Description |
|---|---|
| `/items` | Item list with multi-select. On **Confirm**: triggers confirmation email to user + push notification to admin |
| `/notifications` | Notification history with status badges (`Sent`, `Failed`, `Retrying`, `DLQ`) |
| `/preferences` | Toggle opt-in/out per channel, set quiet hours |
| `/admin/dlq` | Admin dashboard listing DLQ entries with inspect + manual retry |
| `NotificationBell` | Persistent nav component. Real-time in-app push via WebSocket or SSE |

### Example Flow — Item Confirmation

```
User selects items → clicks Confirm
        │
        ├─► POST /notifications/send  (email to user)
        └─► POST /notifications/send  (in-app push to admin)
                │
                ▼
       Producer enqueues jobs
                │
          ┌─────┴─────┐
          ▼           ▼
    email.queue   inapp.queue
          │           │
    EmailWorker  InAppWorker
          │           │
    SendGrid/    WebSocket/SSE
    Nodemailer   → Admin bell
```

---

## 🔑 Key Design Decisions

| Challenge | Decision |
|---|---|
| Delivery guarantee | At-least-once via BullMQ with job persistence in Redis |
| Channel extensibility | Adapter / Strategy pattern (`INotificationChannel`) |
| Rate limiting | Redis sliding window counter per user per channel |
| Provider fallback | Primary → secondary provider chain per channel |
| Quiet hours | Checked at Producer; job is **delayed**, not dropped |
| Tracing | UUID correlation ID created at Producer, passed through entire lifecycle |
| Exactly-once (future) | Idempotency key per notification event |

---

## 📁 Project Structure

```
/backend (NestJS)
  /src
    /notifications
      notifications.module.ts
      notifications.controller.ts
      notifications.service.ts          # Orchestration layer
      producer.service.ts               # Enqueue + rate limit + quiet hours
      /workers
        email.worker.ts
        inapp.worker.ts
      /channels
        channel.interface.ts            # INotificationChannel
        sendgrid.channel.ts
        nodemailer.channel.ts
        inapp.channel.ts
      /dto
      /entities
        notification-log.entity.ts
        dead-letter.entity.ts
    /preferences
      preferences.module.ts
      preferences.controller.ts
      preferences.service.ts
      /entities
        user-preference.entity.ts
    /templates
      templates.module.ts
      templates.service.ts
      /entities
        notification-template.entity.ts
    /queue
      queue.module.ts                   # BullMQ setup
      dlq.service.ts
    /common
      rate-limiter.service.ts
      logger.service.ts
      correlation.interceptor.ts

/frontend (Next.js)
  /app
    /items                              # Item list + confirm flow
    /notifications                      # Notification history
    /preferences                        # User preference settings
    /admin
      /dlq                              # DLQ admin dashboard
  /components
    NotificationBell.tsx               # Real-time in-app push bell
    NotificationBadge.tsx
  /lib
    api.ts                             # API client (Axios / fetch wrapper)
    socket.ts                          # WebSocket / SSE client
  /types
    notification.types.ts
```

---

## 🚀 Suggested Build Order

Follow this sequence for a clean, dependency-safe implementation:

1. **Database entities + TypeORM migrations** — Foundation for everything else
2. **`INotificationChannel` interface + adapters** — Nodemailer and SendGrid
3. **BullMQ queue setup** — `email.queue` and `inapp.queue`
4. **Producer service** — Rate-limit check, quiet-hours logic, enqueue
5. **Email worker + In-App worker** — Retry with exponential backoff
6. **DLQ service + manual retry endpoint**
7. **REST API controllers** — All endpoints wired up
8. **Next.js item list page + confirm flow** — Triggers email + push
9. **Real-time notification bell** — WebSocket or SSE
10. **Preferences page + admin DLQ dashboard**

---

## 🔮 Future Roadmap

- [ ] Authentication — Login / Signup flow (JWT + OAuth2)
- [ ] Additional channels — SMS, WhatsApp, Browser Push
- [ ] Exactly-once delivery — Idempotency key implementation
- [ ] Notification scheduling — Send at a specific future time
- [ ] A/B testing — Template variant testing
- [ ] Analytics dashboard — Delivery rates, open rates, channel performance
- [ ] Multi-tenancy — Support multiple organizations / apps

---

## 📄 License

MIT
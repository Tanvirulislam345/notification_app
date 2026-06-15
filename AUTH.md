# 🔐 NestJS SaaS Authentication System (Multi-Tenant Architecture)

This document defines a **production-ready authentication and authorization system** for a **multi-tenant SaaS application** built with **NestJS + PostgreSQL**.

It is designed for scalable SaaS products like **ERP, CRM, HRM, Inventory systems**.

---

# 🎯 Objective

Build a secure and scalable authentication system supporting:

- Tenant-based SaaS architecture
- Tenant admin onboarding
- Email-based user invitation system
- Role-based access control (RBAC)
- Session management
- Secure JWT authentication

---

# 🏗️ System Architecture Overview

The system is modular and scalable:
- Auth Module
- User Module
- Organization (Tenant) Module
- Invitation Module
- Role & Permission Module
- Session Module
- Audit Log Module


---

# 🧠 Core SaaS Flow (Important)

## 🏢 Tenant Signup Flow (NEW RULE)
 - User Signup
 - ↓
 - Create Organization (Tenant)
 - ↓
 - User becomes Tenant Admin (Owner)
 - ↓
 - Admin logs in
 - ↓
 - Admin invites users via email
 - ↓
 - Users accept invitation
 - ↓
 - Users join tenant with assigned role


### Key Rules:
- Every signup **automatically creates a new organization**
- First user = **Tenant Admin (Owner)**
- No organization exists before signup
- Tenant isolation starts immediately

---

# 🔑 Core Authentication Features

## 1. Registration (Tenant Creation)
- User provides:
  - Name
  - Email
  - Password
  - Organization Name
- System creates:
  - User account
  - Organization (tenant)
  - Links user as OWNER / ADMIN

---

## 2. Login
- Email/password authentication
- JWT Access Token (short-lived)
- JWT Refresh Token (long-lived)

---

## 3. Logout
- Logout current session
- Logout all sessions
- Refresh token revocation

---

## 4. Password Management
- Forgot password flow
- Reset password via secure token
- One-time token usage

---

# 📩 Invitation System (CORE FEATURE)

## Flow 

Tenant Admin → Sends Invitation Email → User Accepts → Joins Tenant


---

## Rules:
- Invitation is always tied to:
  - organization_id
  - email
  - role
- Only tenant admin can send invitations
- Invitation expires after configurable time
- Invitation can be revoked

---

## invitations Table

- id
- email
- organization_id
- role_id
- token
- status (pending / accepted / expired / revoked)
- expires_at
- created_by

---

# 🛡️ Security Requirements

## Rate Limiting
- Login attempts limitation
- Signup throttling
- Invitation abuse protection

## Password Security
- Argon2 or bcrypt hashing
- Strong password policy enforcement

## Token Security
- JWT access + refresh token strategy
- Refresh token rotation
- Secure token revocation

---

# 👥 Session Management

## Features
- Multi-device login support
- Active session tracking
- Device metadata (IP, user-agent)
- Logout specific session
- Logout all sessions

---

# 🏢 Multi-Tenant Architecture

## Concept

Each organization = isolated tenant.

## Rules:
- Every business table contains `organization_id`
- Strict data isolation per tenant
- Users can only access their own organization data

---

# 🔐 Authorization (RBAC System)

## Roles
- Tenant Admin (Owner)
- Admin
- Manager
- User
- Viewer

## Permissions Example
- `user.invite`
- `user.read`
- `user.manage`
- `invoice.create`
- `invoice.delete`

## Design
- Role → Permission mapping
- User role scoped per organization
- NestJS Guards enforce access control

---

# 🧾 Database Design (PostgreSQL)

## users
- id
- name
- email
- password_hash
- is_email_verified
- created_at

---

## organizations (tenants)
- id
- name
- owner_id (tenant admin user)
- created_at
- status (active / invited / suspended)

---

## invitations
- id
- email
- organization_id
- role_id
- token
- status
- expires_at
- created_by

---

## roles
- id
- name
- organization_id (optional for custom roles)

---

## permissions
- id
- name

---

## role_permissions
- role_id
- permission_id

---

## user_sessions
- id
- user_id
- organization_id
- refresh_token_hash
- device_info
- ip_address
- last_active
- expires_at

---

## email_verification_tokens
- id
- user_id
- token
- expires_at
- verified_at

---

## password_reset_tokens
- id
- user_id
- token
- expires_at
- used_at

---

## audit_logs
- id
- organization_id
- user_id
- action
- entity
- metadata
- created_at

---

# 🧱 NestJS Module Structure
src/
├── auth/
│ ├── register/
│ ├── login/
│ ├── logout/
│ ├── refresh-token/
│ ├── forgot-password/
│ ├── reset-password/
│ └── email-verification/
│
├── users/
├── organizations/
├── invitations/
├── roles/
├── permissions/
├── sessions/
├── audit-logs/
│
├── common/
│ ├── guards/
│ ├── decorators/
│ ├── interceptors/
│ └── filters/
│
└── database/

---

---

# 🌐 API Endpoints

## Auth APIs

POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/logout-all
POST /auth/refresh-token
POST /auth/forgot-password
POST /auth/reset-password


---

## Invitation APIs

POST /invitations/send
POST /invitations/accept
GET /invitations
DELETE /invitations/:id


---

## Organization APIs

POST /organizations
GET /organizations


---

## RBAC APIs

POST /roles
GET /roles
POST /permissions
GET /permissions

---

# 🔐 Security Best Practices

- Hash passwords using Argon2
- Store refresh tokens securely (hashed)
- Use HTTP-only cookies for JWT
- Apply strict CORS policies
- Enable rate limiting on sensitive routes
- Validate all DTO inputs
- Log authentication + invitation events
- Rotate refresh tokens
- Enforce tenant-based data isolation

---

# 📊 Production Considerations

- Use Redis for session caching 
- Index: email, organization_id, user_id
- Centralized logging & monitoring
- Track signup + invitation analytics
- Detect suspicious login activity
- Ensure strict tenant query isolation

---

# 🚀 Final Goal

This system is designed to:

- Support self-service SaaS onboarding
- Automatically create tenant on signup
- Assign first user as Tenant Admin
- Provide secure invitation-based user expansion
- Ensure full multi-tenant isolation
- Scale to enterprise SaaS products

---

# 📌 Summary

✔ Signup = creates organization  
✔ First user = Tenant Admin  
✔ Admin invites users via email  
✔ Users join only via invitation  
✔ Fully isolated multi-tenant system  
✔ Secure JWT + RBAC architecture  
# Pomofocus Pro

> A high-precision, dual-budget focus terminal and daily execution matrix built for deep work, intentional time allocation, and context preservation.

[![Production Status](https://img.shields.io/badge/production-live%20(SSL)-3157f6?style=flat-square)](https://pomofocus.shreyashkakde.in)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite%20%7C%20TypeScript-61dafb?style=flat-square)](https://react.dev/)
[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3%20%7C%20Java%2021-brightgreen?style=flat-square)](https://spring.io/projects/spring-boot)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791?style=flat-square)](https://www.postgresql.org/)
[![Design Language](https://img.shields.io/badge/design-Tercelet%20Warm%20Editorial-c9f45b?style=flat-square&labelColor=111318)](https://pomofocus.shreyashkakde.in)

🌐 **Live Application:** [https://pomofocus.shreyashkakde.in](https://pomofocus.shreyashkakde.in)  
⚡ **Instant Demo:** Click **"⚡ Demo Operator"** on the login screen for instant guest access without signup.

---

## ⚡ System Architecture & Core Modules

Pomofocus Pro unifies long-term time budgeting with rapid, granular daily task execution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            POMOFOCUS PRO HUD                                │
├──────────────────────────────────────┬──────────────────────────────────────┤
│             TARGET DECK              │             TODAY'S PLAN             │
│        (Macro Focus Budgets)         │        (Micro Execution Matrix)      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Hot-Switch Targets [Keys 1–9]      │ • Priority Tiers: P0, P1, P2, P3     │
│ • Daily Time Budgets (e.g. 2h DSA)   │ • Rapid Quick Capture (Press [T])    │
│ • Live Progress Ring & Mini Gauges   │ • HTML5 Drag-and-Drop Prioritization │
│ • Context Checkpoints Bookmark [C]   │ • Instant Optimistic Check-Off       │
│ • Deficit / Surplus Minute Tracking  │ • Incomplete Task Rollover to Today  │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HIGH-PRECISION ENGINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Drift-Free Web Worker Timer        • Procedural Web Audio Synthesizer     │
│ • End-of-Day Reflection Journal      • Spring Boot 3 + PostgreSQL 16 API    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Feature Breakdown

### 1. Target Deck (Daily Focus Budgets & Hot-Switching)
- **Time Allocation:** Define daily focus targets per discipline (e.g., *Algorithms — 2h*, *Frontend Architecture — 3h*, *Writing — 1h*).
- **1-Click Hot-Switching (`1–9` keys):** Switch active focus tasks instantaneously mid-session without stopping the clock or losing accumulated focus seconds.
- **Micro-Slice Telemetry:** Every partial session, pause, or switch is automatically recorded to the active target in PostgreSQL (`focus_sessions` table).
- **Dynamic Categories:** Organize targets by customizable category chips with custom color tags.

### 2. Today's Plan (Execution Matrix & Quick Capture)
- **Actionable Priority Tiers:** Categorize daily tasks into **P0 (Urgent & Important)**, **P1 (High Impact)**, **P2 (Normal)**, **P3 (Low Priority)**, and **Inbox (Unsorted)**.
- **Quick Capture (Press `T`):** Rapid keyboard-first task entry with instant Enter-to-save.
- **Interactive Drag-and-Drop:** Seamlessly drag tasks between priority tiers with instant optimistic UI feedback.
- **Sub-10ms Instant Check-Off:** Check off completed tasks with a satisfying procedural completion chime, green checkmark icon, and instant strikethrough.
- **Past Incomplete Rollover:** 1-click rollover moves uncompleted tasks from past dates into today's plan.
- **Target Linking:** Optionally link any daily task to a Target Deck item for unified tracking.

### 3. Chrono Timer Engine & Procedural Audio
- **Drift-Free Web Worker:** Dedicated background worker combined with `performance.now()` delta calculation ensures timing accuracy even when browser tabs are throttled or minimized.
- **Procedural Synthesizer:** Real-time mechanical clicks, crystalline completion chimes, and hot-switch blips generated purely via the browser's Web Audio API (zero audio file downloads).
- **Volume & Mute Controls:** Press `M` to mute/unmute audio effects with persistent state.

### 4. Context Checkpoints ("Where I Left Off")
- **Hot-Switch Bookmarks:** When switching tasks mid-stream, record a 1-line bookmark note describing what you were doing.
- **Instant Recall:** Whenever you hot-switch back to that target, your previous checkpoint note surfaces immediately so you regain momentum in seconds.

### 5. Daily Reflection Journal & Debriefs
- **Evening Retrospective:** Log end-of-day debriefs capturing energy level (1–5 scale), what went well, and what went wrong.
- **Historical Timeline:** Review past daily debriefs to identify productivity patterns, burnout risks, and focus wins over time.

### 6. Production Security & Email Verification
- **Verified Custom Domain:** Automated 6-digit OTP email dispatch from `notifications@pomofocus.shreyashkakde.in` via Resend SMTP.
- **Sandbox Fallback:** Automatic server-log OTP fallback in development environments for friction-free onboarding.
- **Stateless JWT Security:** Industry-standard BCrypt password hashing, hardened JWT authentication, and strict CORS policies.

---

## ⌨️ Keyboard Shortcuts

Pomofocus Pro is designed for keyboard-driven power users:

| Key | Action |
|---|---|
| `Space` | Play / Pause the active Chrono Timer |
| `1` – `9` | Instant Hot-Switch to focus targets 1 through 9 |
| `T` | Focus into Today's Plan Quick Capture input |
| `C` | Open Context Checkpoint note ("Where I Left Off") |
| `A` | Open / Close Telemetry & Analytics Drawer |
| `M` | Toggle procedural sound effects (Mute / Unmute) |
| `Esc` | Dismiss active modals, triage menus, and checkpoint prompts |

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend HUD** | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Lucide Icons |
| **Timer Engine** | HTML5 Web Workers, Web Audio API, `performance.now()` |
| **Backend API** | Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, Hibernate |
| **Database** | PostgreSQL 16 (Relational schema, B-Tree indexes, Flyway migrations) |
| **Email Service** | Resend SMTP (Verified domain `notifications@pomofocus.shreyashkakde.in`) |
| **DevOps & Infra** | Docker Compose, Nginx Reverse Proxy, Let's Encrypt SSL, GitHub Actions CI/CD |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js:** v20+
- **JDK:** Java 21+
- **Docker & Docker Compose**

### 1. Clone Repository
```bash
git clone https://github.com/Shreyashkakde1/pomofocus-pro.git
cd pomofocus-pro
```

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```
*PostgreSQL will be running on `localhost:5435` (Database: `pomopro`, User: `pomouser`, Password: `pomopass`).*

### 3. Run Backend (Spring Boot 3)
```bash
cd backend
./mvnw spring-boot:run
```
*API will be available at `http://localhost:8085` (Base endpoint: `/api/v1`).*

### 4. Run Frontend HUD (Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will be running at `http://localhost:5173`.*

---

## 🌐 Production Infrastructure & Deployment

Pomofocus Pro is deployed on a Linux VPS alongside existing services with zero port collisions and full SSL encryption:

```
Internet ──► Nginx (Port 80/443 SSL)
              ├── pomofocus.shreyashkakde.in ──► /var/www/pomofocus/dist (SPA)
              │                                └── /api/* ──► 127.0.0.1:8085 (Spring Boot)
              │                                               └── 127.0.0.1:5435 (Postgres 16)
              └── shreyashkakde.in ───────────► Portfolio Services (Untouched)
```

- **CI/CD:** Automated builds and deployments run on every push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) with concurrency protection.
- **Step-by-step VPS Guide:** See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

---

## 📚 Project Documentation

All extended architectural blueprints and technical guides are organized in the [`docs/`](docs/) directory:

- 🚀 [**Production Deployment Guide**](docs/DEPLOYMENT_GUIDE.md): Detailed VPS configuration, Nginx virtual hosts, SSL renewal, and Docker Compose setup.
- 🔒 [**Security Assessment**](docs/SECURITY_ASSESSMENT.md): OWASP audit, CWE mitigation matrix, authentication hardening, and threat model.
- 📊 [**V2 Graphs Module Plan**](docs/V2_GRAPHS_MODULE_PLAN.md): Technical specification for the upcoming multi-horizon Insights & Analytics Hub (**Today, Weekly, Monthly, Quarterly, Yearly**).
- 📋 [**V1 Implementation Plan**](docs/IMPLEMENTATION_PLAN_V1.md): Initial specification and development milestones.

---

## 📄 License

This project is licensed under the MIT License.

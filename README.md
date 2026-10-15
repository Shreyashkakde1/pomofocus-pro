# Pomofocus Pro (v1 - Cyberpunk HUD Edition)

High-precision dual-budget productivity terminal built with **React + Vite + TypeScript** and **Spring Boot 3 (Java 21) + PostgreSQL 16**.

---

## ⚡ Core Features

1. **Daily Target Time Budgets:** Allocate target hours and minutes per task (e.g. 2h DSA Grind, 3h Frontend Development).
2. **One-Click Hot-Switching (`1–9` keys):** Switch active focus tasks instantaneously mid-session without stopping the clock or losing accumulated focus seconds.
3. **Context Checkpoints ("Where I Left Off"):** Non-blocking 1-line bookmark notes saved on hot-switch or `C` key that automatically re-appear when resuming a task.
4. **Persistent Target Analytics & Reports:** PostgreSQL-backed target vs. actual dials, deficit/surplus indicators (`+20m` / `-45m`), hot-switch counters, 7-day consistency scores, and CSV export.
5. **Cyberpunk Procedural Audio Synthesizer:** Real-time sci-fi mechanical clicks, crystalline completion chimes, and deficit alarms generated via the Web Audio API with volume & mute controls.
6. **High-Precision Background Timer:** Dedicated Web Worker + `performance.now()` delta engine immune to browser tab throttling.
7. **Strict Email Verification & Instant Demo:** Resend SMTP with 6-digit OTP passcode dispatch, plus a 1-click **⚡ Demo Operator** bypass.

---

## 🌐 Port & Infrastructure Allocation

- **Frontend HUD:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:8085` (API Base: `/api/v1`)
- **PostgreSQL Database:** `localhost:5435` (Database: `pomopro`, User: `pomouser`, Pass: `pomopass`)

---

## 🚀 Quick Start Guide

### 1. Database (Docker Compose)
```bash
docker compose up -d
```

### 2. Spring Boot 3 Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Cyberpunk Frontend HUD
```bash
cd frontend
npm install
npm run dev
```

---

## ⌨️ HUD Keyboard Hotkeys

| Key | Action |
|---|---|
| `Space` | Play / Pause active Chrono Timer |
| `1` – `9` | Instant Hot-Switch to target task 1 through 9 |
| `C` | Quick Context Checkpoint note ("Where I Left Off") |
| `A` | Open / Close Telemetry & Analytics Drawer |
| `M` | Toggle procedural sound effects (Mute / Unmute) |
| `Esc` | Dismiss modals and prompts |

---

## 📚 Project Documentation

All extended documentation and technical guides are organized in the [`docs/`](docs/) directory:

- 🚀 [**Deployment Guide**](docs/DEPLOYMENT_GUIDE.md): VPS production setup, Nginx reverse proxy, Certbot SSL, and Docker Compose configuration.
- 🔒 [**Security Assessment**](docs/SECURITY_ASSESSMENT.md): Full OWASP/CWE audit, threat model, vulnerability analysis, and hardening patches.
- 📊 [**V2 Graphs Module Plan**](docs/V2_GRAPHS_MODULE_PLAN.md): Technical architecture and implementation plan for the upcoming Insights & Analytics Hub.
- 📋 [**V1 Implementation Plan**](docs/IMPLEMENTATION_PLAN_V1.md): Initial specification and phase-by-phase build history.


# Pomofocus Pro — Production Deployment Guide (VPS)

This guide walks you through deploying **Pomofocus Pro** onto your existing VPS at **`pomofocus.shreyashkakde.in`** alongside your portfolio website with zero port collisions and zero downtime.

---

## Architecture Overview

```
                               Internet
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │    Host Nginx (Port 80 / 443)       │
               │   Let's Encrypt SSL Certificates    │
               └──────────┬──────────────────────────┘
                          │
         ┌────────────────┴────────────────────────┐
         │ (shreyashkakde.in)                      │ (pomofocus.shreyashkakde.in)
         ▼                                         ▼
┌──────────────────┐                     ┌───────────────────────────┐
│ Portfolio (Vite) │                     │ /var/www/pomofocus/dist   │ (Static SPA)
└──────────────────┘                     └─────────────┬─────────────┘
┌──────────────────┐                                   │ /api/*
│ Portfolio (API)  │                                   ▼
│ (systemd)        │                     ┌───────────────────────────┐
└──────────────────┘                     │ Spring Boot Container     │ (127.0.0.1:8085)
                                         └─────────────┬─────────────┘
                                                       │
                                                       ▼
                                         ┌───────────────────────────┐
                                         │ PostgreSQL 16 Container   │ (127.0.0.1:5435)
                                         │ Volume: pomofocus_pgdata  │
                                         └───────────────────────────┘
```

---

## Step 1: Add Free Subdomain in DNS (60 Seconds)

In your DNS provider dashboard (Cloudflare, GoDaddy, Hostinger, Namecheap, etc.):
1. Add a new **A Record**:
   * **Type**: `A`
   * **Name**: `pomofocus`
   * **IPv4 Address**: `<Your VPS IP address>`
   * **TTL**: Auto (or 5 minutes)

---

## Step 2: One-Time VPS Setup

SSH into your VPS:
```bash
ssh user@your-vps-ip
```

### 1. Clone the Repository on your VPS
```bash
sudo mkdir -p /var/www/pomofocus-pro
sudo chown -R $USER:$USER /var/www/pomofocus-pro
git clone https://github.com/Shreyashkakde1/pomofocus-pro.git /var/www/pomofocus-pro
cd /var/www/pomofocus-pro
```

### 2. Create the Production Environment File
```bash
cp .env.production.example .env.production
```
Edit `.env.production`:
```bash
nano .env.production
```
Set a strong database password and generate a secure 64-character JWT secret:
```bash
openssl rand -base64 48
```
Paste it into `JWT_SECRET=` in `.env.production`.

### 3. Start PostgreSQL and Spring Boot Containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Verify containers are running:
```bash
docker ps
# You will see pomofocus-postgres-prod and pomofocus-backend-prod (127.0.0.1:8085)
```

---

## Step 3: Build & Deploy Frontend on VPS

```bash
# Install frontend dependencies and build
cd /var/www/pomofocus-pro/frontend
npm ci
npm run build

# Copy dist to /var/www/pomofocus/dist
sudo mkdir -p /var/www/pomofocus
sudo cp -r dist /var/www/pomofocus/
```

---

## Step 4: Configure Nginx & SSL Certificate

### 1. Copy the Virtual Host Configuration
```bash
cd /var/www/pomofocus-pro
sudo cp pomofocus.nginx.conf /etc/nginx/sites-available/pomofocus
```

### 2. Enable the Virtual Host & Test Nginx
```bash
sudo ln -s /etc/nginx/sites-available/pomofocus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Issue Automatic Free SSL Certificate with Certbot
```bash
sudo certbot --nginx -d pomofocus.shreyashkakde.in
```
Certbot will automatically configure HTTPS redirect and renewal cron.

---

## Step 5: (Optional) Set Up Automated CI/CD via GitHub Actions

Every time you push to `main`, GitHub Actions will build and update Pomofocus Pro automatically.

In your GitHub repository:
1. Navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret** and add:
   * `VPS_HOST`: Your VPS IP address or domain.
   * `VPS_USERNAME`: Your VPS SSH username (e.g. `root` or `ubuntu` or `shreyash`).
   * `VPS_SSH_KEY`: The private SSH key for your VPS.
   * `VPS_PORT`: `22` (or your custom SSH port).

Now every `git push origin main` will automatically build the React bundle and deploy the latest backend.

---

## Verification & Health Check Commands

```bash
# Check Backend Health (from VPS)
curl http://127.0.0.1:8085/api/v1/health

# Check Memory Usage (ensures portfolio has plenty of RAM)
docker stats --no-stream

# View Backend Logs
docker logs -f pomofocus-backend-prod
```

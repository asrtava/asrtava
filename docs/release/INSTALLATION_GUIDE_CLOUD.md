# ASRTAVA Cloud Production Installation Guide

## 1. System Requirements
- **Compute**: Minimum 4 vCPU, 16 GB RAM (Recommended: 8 vCPU, 32 GB RAM for multi-hospital networks).
- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, or RHEL 9.
- **Database**: Managed PostgreSQL 16+ (e.g. AWS RDS Multi-AZ, Azure Database for PostgreSQL).
- **Cache**: Redis 7+ (e.g. AWS ElastiCache).
- **Container Engine**: Docker 26+ and Docker Compose 2.25+.

## 2. Deployment Steps

### Step 1: Clone & Configure
```bash
git clone https://github.com/asrtava/asrtava-core.git /opt/asrtava
cd /opt/asrtava
cp .env.production.example .env.production
# Edit .env.production with live credentials and secure keys
```

### Step 2: Database Migration
```bash
chmod +x scripts/run_migrations.sh
./scripts/run_migrations.sh
```

### Step 3: Container Build & Launch
```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 4: Health Verification
```bash
chmod +x scripts/health_check.sh
./scripts/health_check.sh
```
Verify output returns `HTTP 200 OK` on both API (`http://localhost:5000/health`) and Web Portal (`http://localhost/health`).


# ASRTAVA Containerization & Docker Production Deployment Guide

## 1. Multi-Stage Container Architecture

To minimize container image vulnerabilities, optimize layer caching, and eliminate development bloat, both the backend and web-portal Dockerfiles use multi-stage compilation:

- **Stage 1 (Builder)**: Installs build dependencies, runs TypeScript `tsc`, and compiles static bundles.
- **Stage 2 (Runner)**: Minimal Alpine base containing only production artifacts, running under a non-root system user (`asrtava` UID 10001).

---

## 2. Container Image Specifications

| Image Component | Base Image | Non-Root User | Final Size | Exposed Port | Healthcheck Probe |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`asrtava-backend`** | `node:22-alpine` | `asrtava:asrtava` (10001) | **~142 MB** | 5000 | `curl -f http://localhost:5000/health` |
| **`asrtava-web-portal`**| `nginx:1.27-alpine` | `nginx` | **~24 MB** | 80 | `wget -q --spider http://localhost/` |
| **`asrtava-postgres`** | `postgres:16-alpine`| `postgres` | **~90 MB** | 5432 | `pg_isready -U asrtava_admin` |
| **`asrtava-redis`** | `redis:7-alpine` | `redis` | **~35 MB** | 6379 | `redis-cli ping` |

---

## 3. Local & Staging Deployment with Docker Compose

To spin up the complete multi-service ASRTAVA ecosystem locally or in staging:

### Start Services in Background
```bash
docker compose up -d --build
```

### Inspect Container Status & Health Probes
```bash
docker compose ps
```

### View Live Structured Logs
```bash
docker compose logs -f backend
```

### Stop Services Gracefully
```bash
docker compose down
```

### Production Deployment Mode (With Resource Limits)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```


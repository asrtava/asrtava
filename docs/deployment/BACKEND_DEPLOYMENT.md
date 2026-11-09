# ASRTAVA Centralized Backend API Production Deployment Guide

## 1. Node.js & TypeScript Production Runner

The ASRTAVA API runs under Node.js 22 LTS with an Express centralized modular architecture serving **20 domain API gateways** under `/api/v1/*`.

### Production Startup Command
```bash
node dist/server.js
```

---

## 2. Health, Readiness & Observability Probes

The server implements three specialized operational probe endpoints:

| Endpoint | Purpose | Target Consumer | HTTP Success | Check Criteria |
| :--- | :--- | :--- | :---: | :--- |
| **`/health`** | Liveness Probe | ECS Fargate / ALB | **200 OK** | Process is running and accepting event loop cycles. |
| **`/ready`** | Readiness Probe | Traffic Router / Ingress | **200 OK** | Database connection ping passed; resilient cache ready. |
| **`/metrics`** | Observability Probe | Prometheus Scraper | **200 OK** | V8 heap memory, uptime seconds, RSS, active gateways. |

---

## 3. Graceful Shutdown & Zero-Downtime Signal Handling

Container orchestrators (ECS, Kubernetes, Docker) propagate `SIGTERM` when scaling down or deploying new task revisions.

In [`backend/src/server.ts`](file:///c:/Users/madha/Desktop/Medical_Project/backend/src/server.ts):
```typescript
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown of ASRTAVA API Server...`);
  server.close(() => {
    logger.info('HTTP server closed. In-flight requests drained.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Invariants:
1. When `SIGTERM` is received, ALB stops routing new connections to the container.
2. The server drains all in-flight clinical or financial transactions for up to 10 seconds.
3. Database connection pools close cleanly without hanging locks.


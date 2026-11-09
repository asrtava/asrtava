# ==============================================================================
# ASRTAVA Backend - Multi-Stage Production Dockerfile
# Base: Node.js 22 Alpine (Minimal attack surface, non-root user execution)
# ==============================================================================

# Stage 1: Build & Compilation
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install build tools if native bindings require compilation
RUN apk add --no-cache python3 make g++

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install full dependencies including devDependencies for TypeScript build
RUN npm ci

# Copy source code and database migrations
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# Prune development dependencies to retain lean production node_modules
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Add dumb-init for proper PID 1 signal forwarding and zombie process reaping
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /usr/src/app

# Create dedicated non-root application user and group (Least Privilege)
RUN addgroup -g 10001 -S asrtava && \
    adduser -u 10001 -S asrtava -G asrtava

# Copy compiled artifacts and production dependencies from builder
COPY --from=builder --chown=asrtava:asrtava /usr/src/app/package*.json ./
COPY --from=builder --chown=asrtava:asrtava /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=asrtava:asrtava /usr/src/app/dist ./dist

# Switch to non-root user
USER asrtava

# Expose API gateway port
EXPOSE 5000

# Automated container healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Launch application via dumb-init for graceful SIGTERM/SIGINT propagation
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]


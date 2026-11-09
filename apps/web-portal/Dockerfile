# ==============================================================================
# ASRTAVA Web Portal - Multi-Stage Production Dockerfile
# Stage 1: Build Static Assets via Vite
# Stage 2: Serve via Hardened Nginx Alpine
# ==============================================================================

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./

RUN npm ci

COPY src/ ./src/

# Compile production bundles with chunk splitting
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Nginx Production Server
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default configuration and copy custom hardened configuration
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


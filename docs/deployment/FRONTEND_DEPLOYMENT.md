# ASRTAVA Frontend Production Deployment Guide

## 1. Frontend Build Architecture

The ASRTAVA Web Portal is an enterprise Single-Page Application (SPA) built with React 18, TypeScript, Tailwind CSS, and Vite 6.

### Manual Vendor Chunk Optimization
To avoid monolithic JavaScript bundles, Rollup manual chunking is configured in [`apps/web-portal/vite.config.ts`](file:///c:/Users/madha/Desktop/Medical_Project/apps/web-portal/vite.config.ts):
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        icons: ['lucide-react'],
      },
    },
  },
  chunkSizeWarningLimit: 600,
}
```

### Bundle Size Audit Results
- `dist/assets/icons-DDRjtxiz.js`: **33.58 kB** (gzip: 8.19 kB)
- `dist/assets/vendor-cC_s2oKx.js`: **134.66 kB** (gzip: 43.22 kB)
- `dist/assets/index-C8QfussS.js`: **360.00 kB** (gzip: 81.45 kB)
- `dist/assets/index-DKKZeO_A.css`: **42.04 kB** (gzip: 7.38 kB)
- `dist/index.html`: **0.69 kB** (gzip: 0.40 kB)

Zero chunks exceed 500 kB.

---

## 2. Hardened Nginx Production Configuration

Static assets are served via a hardened Nginx 1.27 Alpine container configured in `apps/web-portal/nginx.conf`:
1. **SPA Fallback Routing**: `try_files $uri $uri/ /index.html;` ensures all client-side portal routes (`/portal/doctor`, `/portal/pharmacy`, `/portal/super-admin`) resolve seamlessly without 404 errors.
2. **Gzip Compression**: Compresses HTML, JS, CSS, and JSON payloads exceeding 1 kB.
3. **Cache Invalidation Policy**:
   - `index.html`: `Cache-Control: no-cache, no-store, must-revalidate` (guarantees instantaneous updates upon new releases).
   - Bundles (`*.js`, `*.css`): `Cache-Control: public, max-age=31536000, immutable` (leverages content-hashed filenames for high CDN hit rates).
4. **Content Security Policy (CSP)**:
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.asrtava.com wss:;" always;
   ```


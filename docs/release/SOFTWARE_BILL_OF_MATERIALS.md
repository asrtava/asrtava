# Software Bill of Materials (SBOM) - ASRTAVA v3.0.0

## 1. Core Frameworks & Runtime
- **Runtime**: Node.js 24 LTS (Iron)
- **Language**: TypeScript 5.7.3
- **Web Server Framework**: Express 4.21.2
- **Frontend Engine**: React 19.0.0 + Vite 6.4.5 + Tailwind CSS 3.4.17
- **Database**: PostgreSQL 16.2
- **In-Memory Cache**: Redis 7.2

## 2. Key Backend Production Dependencies
- `pg` (^8.13.1): PostgreSQL client library
- `knex` (^3.1.0): Query builder and connection pooler
- `jsonwebtoken` (^9.0.2): RFC 7519 JWT implementation
- `bcryptjs` (^2.4.3): Cryptographic password hashing
- `helmet` (^8.0.0): HTTP security header middleware
- `cors` (^2.8.5): Cross-Origin Resource Sharing control
- `compression` (^1.7.5): Gzip payload compression
- `express-rate-limit` (^7.5.0): API throttling and DDoS mitigation
- `winston` (^3.17.0): Enterprise logging framework
- `zod` (^3.24.1): TypeScript-first runtime schema validation

## 3. License Compliance
All embedded third-party dependencies are governed by permissive open-source licenses (MIT, Apache 2.0, BSD-3-Clause). Zero GPL copyleft dependencies in the production runtime bundle.


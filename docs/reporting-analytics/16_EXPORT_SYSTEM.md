# ASRTAVA Export and Download System

## 1. Overview
The ASRTAVA Export Engine processes large report downloads asynchronously to prevent HTTP gateway timeouts and server memory exhaustion.

## 2. Supported Export Formats
- **CSV (RFC-4180)**: High-speed comma-separated values with escaped double quotes and UTF-8 encoding.
- **Excel (XLSX)**: Styled spreadsheets with frozen header rows and auto-fit column formatting.
- **PDF**: Branded vector documents with hospital logos, page numbers, and confidentiality watermarks.
- **JSON**: Machine-readable structured data for external ERP or data warehouse ingestion.

## 3. Asynchronous Export Job Lifecycle
1. User requests export: `POST /api/v1/reports/exports` $\rightarrow$ returns HTTP `202 Accepted` with `jobId`.
2. Background worker processes batches and updates `progress_percentage` (0% $\rightarrow$ 50% $\rightarrow$ 100%).
3. Worker uploads archive to S3 vault and generates a 24-hour cryptographic download token.
4. Client polls `GET /api/v1/reports/exports/:jobId/status` or receives in-app completion notification.
5. Client downloads file: `GET /api/v1/reports/exports/:jobId/download?token=...`.


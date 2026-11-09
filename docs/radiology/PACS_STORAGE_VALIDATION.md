# ASRTAVA PACS Storage & Relational Indexing Architecture

## 1. Architectural Principle: Metadata vs Pixel Data Separation
In compliance with enterprise high-scale storage benchmarks, raw binary medical imaging pixel data (`.dcm` files) is NEVER stored as BLOB columns inside PostgreSQL tables. Doing so would cause severe database bloat, degraded query planning, and unmanageable database backup times.

Instead, ASRTAVA implements a dual-tier storage strategy:
1. **Tier 1 — Relational DICOM Metadata Index (PostgreSQL)**:
   - Tables: `pacs_studies`, `pacs_series`, `pacs_instances`.
   - Indexed fields: StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, Accession Number, Modality, Patient UHID, Slice Thickness, Window Width/Center, Acquisition Time.
   - Protected with PostgreSQL Row-Level Security (RLS) by `hospital_id`.
2. **Tier 2 — Object Storage Blob Repository**:
   - High-throughput encrypted object store (S3 API, Azure Blob, MinIO, or POSIX filesystem archive).
   - URIs recorded in `pacs_studies.storage_archive_uri` and `pacs_instances.storage_instance_uri`.
   - Data stored in lossless DICOM format with content-addressed SHA-256 integrity checksums.

## 2. Storage Lifecycles & Retention
- **Active Hot Tier**: 0 - 365 days (Fast NVMe SSD storage for immediate clinical review).
- **Warm Tier**: 1 - 7 years (Compressed cloud or local nearline storage for historical comparisons).
- **Cold Archive**: Beyond 7 years (Deep archive according to statutory medical record retention laws).


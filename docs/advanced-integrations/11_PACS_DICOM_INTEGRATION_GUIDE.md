# ASRTAVA Radiology PACS & DICOM Integration Guide

## 1. Overview
ASRTAVA interfaces with enterprise Picture Archiving and Communication Systems (PACS) and DICOM modalities (X-Ray, CT, MRI, Ultrasound) using the modern **DICOMweb RESTful standard** (WADO-RS, QIDO-RS, STOW-RS).

## 2. Zero Heavy Database Bloat Policy
> [!IMPORTANT]
> ASRTAVA does **not** store multi-gigabyte raw binary DICOM studies in the primary PostgreSQL transactional database. Instead, ASRTAVA persists standardized `study_instance_uid`, accession numbers, modality codes, and series metadata in `imaging_study_references`, querying the external PACS on-demand via DICOMweb.

## 3. Ephemeral Signed Viewing Links
To protect patient privacy:
- DICOM viewer links are **never permanent public URLs**.
- The backend generates a signed, high-entropy ephemeral token valid for 30 minutes:
  `https://pacs.apexcare.health/viewer?studyUID=1.2.840...&token=a8f9c...&expires=2026-11-09T09:30:00Z`
- Embedded zero-footprint web viewers (e.g. CornerstoneJS / OHIF Viewer) load images over encrypted WADO-RS endpoints.

## 4. Supported PACS Systems
- **Orthanc PACS**: Open-source lightweight DICOM server with native DICOMweb plugin.
- **dcm4chee**: Enterprise archive for multi-facility imaging networks.
- **GE Centricity / Siemens Syngo**: Commercial hospital imaging archives via DICOMweb proxy.


# ASRTAVA Laboratory Information Systems (LIS) Integration Guide

## 1. Overview
ASRTAVA provides a bidirectional integration framework for external laboratory information systems (LIS) and automated diagnostic instruments (e.g. Sysmex XN-series, Roche Cobas, Abbott Alinity, Beckman Coulter).

## 2. Order Transmission & Specimen Barcoding
1. Doctor requests lab test in OPD/IPD encounter.
2. Phlebotomist draws sample and scans pre-printed cryogenic barcode (e.g., `BARCODE-CBC-88192`).
3. ASRTAVA transmits order payload to external LIS via REST API or HL7 MLLP (`ORM^O01`).
4. Analyzer reads specimen barcode, performs analytical run, and posts results.

## 3. Strict Clinical Safety Gate: Pathologist Verification
> [!CRITICAL]
> **Clinical Safety Mandate**: Unvalidated raw laboratory analyzer outputs received from external machines or reference labs are placed in `laboratory_integration_results` with `is_pathologist_approved = false`. They are **strictly hidden from the patient mobile app, patient web portal, and nursing medication charts** until an authorized consulting pathologist verifies bio-reference ranges, checks delta checks, and signs off.

```mermaid
sequenceDiagram
    autonumber
    actor Doc as Attending Doctor
    participant Core as ASRTAVA Core LIMS
    participant ExtLIS as External Analyzer / LIS
    actor Path as Pathologist
    actor Pat as Patient App

    Doc->>Core: Place Laboratory Order (e.g. CBC)
    Core->>ExtLIS: Transmit Order & Barcode (BARCODE-CBC-88192)
    ExtLIS->>ExtLIS: Specimen Centrifugation & Analyzer Run
    ExtLIS->>Core: Post Raw Results (HGB 14.2, WBC 18500)
    Note over Core: Status: STAGING_UNAPPROVED<br/>Blocked from Patient View!
    Core->>Path: Alert: Critical Panic Value (WBC High)
    Path->>Core: Verify Morphology & Digital Sign-off
    Note over Core: Status: APPROVED_FINALIZED
    Core->>Pat: Dispatch Push / WhatsApp Notification
    Pat->>Core: View Signed Lab Report
```


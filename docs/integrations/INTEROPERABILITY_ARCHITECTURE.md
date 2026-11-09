# ASRTAVA Healthcare Interoperability Architecture

**Document Reference:** `docs/integrations/INTEROPERABILITY_ARCHITECTURE.md`  
**Execution Authority:** ASRTAVA Chief Interoperability & Integration Architect  
**Standards Conformance:** HL7 v2.5.1, FHIR R4.0.1, DICOM PS3.0, ASTM 1394-97, ABDM, NHCX  
**Last Verified:** 2026-11-09

---

## 1. Architectural Philosophy

The ASRTAVA Healthcare Interoperability Platform bridges internal clinical workflows (OPD, IPD, OT, Laboratory, Radiology, Pharmacy, Billing) with external healthcare ecosystems. Rather than designing separate, disconnected gateway appliances, ASRTAVA embeds standards-based protocol adapters into its core modular monolith architecture.

```mermaid
graph TD
    subgraph ExternalEcosystem["External Healthcare Ecosystem"]
        LISAnalyzers["Laboratory Analyzers<br/>(Sysmex, Roche Cobas via ASTM 1394 / HL7)"]
        PACSModalities["Radiology Modalities<br/>(CT, MRI, US via DICOM MWL / C-FIND)"]
        ExternalHMS["External Hospital Networks<br/>(FHIR R4 REST APIs)"]
        InsurancePayers["Insurance & TPAs<br/>(NHCX FHIR Claims & Pre-Auth)"]
        ABDMNetwork["Ayushman Bharat Digital Mission<br/>(ABHA, HIP/HIU Gateways)"]
    end

    subgraph InteropGateway["ASRTAVA Interoperability Layer (/api/v1/interop)"]
        HL7Engine["HL7 v2 Message Engine<br/>(ADT, ORM, ORU, SIU, ACK)"]
        FHIRServer["FHIR R4 Server<br/>(Patient, Encounter, Obs, Claim)"]
        DICOMBridge["DICOM & MWL Engine<br/>(WADO-RS, QIDO-RS, Reconciliation)"]
        DeviceAdapter["Device Telemetry Ingest<br/>(ASTM Parser & Panic Detector)"]
        TermMapper["Terminology Concept Mapper<br/>(LOINC, SNOMED-CT, ICD-10)"]
        DLQEngine["Dead-Letter Queue & Recovery<br/>(Quarantine & Replay)"]
    end

    subgraph InternalClinical["ASRTAVA Core Clinical Platform"]
        ClinicalEMR["Electronic Medical Record (EMR)"]
        LabPathology["Laboratory & Pathology"]
        RadDiagnostics["Radiology & PACS Viewer"]
        BillingRCM["Revenue Cycle Management (RCM)"]
    end

    LISAnalyzers --> DeviceAdapter
    PACSModalities --> DICOMBridge
    ExternalHMS --> FHIRServer
    InsurancePayers --> InteropGateway
    ABDMNetwork --> FHIRServer

    HL7Engine --> ClinicalEMR
    FHIRServer --> ClinicalEMR
    DICOMBridge --> RadDiagnostics
    DeviceAdapter --> LabPathology
    InteropGateway --> BillingRCM
    InteropGateway --> DLQEngine
```

---

## 2. Supported Healthcare Standards Matrix

| Standard / Protocol | Version | Subsystem / Role | Directionality | ASRTAVA Implementation |
|---|---|---|---|---|
| **HL7 v2** | 2.5.1 | ADT, ORM, ORU, SIU, MDM, ACK | Bi-directional | Ingest parser, ACK generator, sliding-window deduplication |
| **HL7 FHIR** | R4 (4.0.1) | 20+ Core Clinical & Financial Resources | Server & Client | Full RESTful API, CapabilityStatement, Bundle searchset |
| **DICOM** | PS3.0 | Metadata, MWL (Modality Worklist), PACS | Server & Client | C-FIND MWL, QIDO-RS, WADO-RS viewer tokens, quarantine |
| **ASTM** | 1394-97 / LIS2-A2 | Hematology & Biochemistry Analyzers | Inbound Ingest | Multi-frame parser (`H`, `P`, `O`, `R`), panic value flag |
| **ABDM** | M1, M2, M3 | Ayushman Bharat Health Ecosystem | Bi-directional | ABHA creation, HIP record sharing, HIU viewer simulator |
| **NHCX** | v1.0 | National Health Claims Exchange | Outbound Claims | Pre-auth request, itemized claim filing, IRDAI adjudication |
| **Terminology** | 2026 Editions | LOINC, SNOMED-CT, ICD-10, UCUM, ATC | Internal Translation | Cross-concept mapping, synonym lookup, fallback matching |

---

## 3. Data Flow & Clinical Safety Guardrails

1. **Unapproved Reading Quarantine**: Ingested analyzer telemetry containing abnormal or panic values (`HH`, `LL`, `CRITICAL`) is **strictly quarantined** in `pending_approval` status. It is **never** presented to the patient portal or finalized in clinical charts without verified pathologist or lab technician sign-off.
2. **Ambiguous DICOM Reconciliation Gate**: If a CT or MRI study arrives with ambiguous accession numbers or UHID mismatches, it is quarantined in the Modality Worklist. Linking requires an authorized radiologist or administrator with mandatory clinical justification notes.
3. **Idempotency & Duplicate Defense**: Inbound HL7 messages are tracked in a 15-minute sliding control window (`hospital_id:message_control_id`). Duplicate retransmissions are acknowledged with Application Reject (`AR`) without mutating clinical charts.
4. **Dead-Letter Queue (DLQ)**: Any packet failing schema validation, experiencing network timeouts, or encountering unknown patients is routed to the DLQ for auditing and one-click administrative replay.


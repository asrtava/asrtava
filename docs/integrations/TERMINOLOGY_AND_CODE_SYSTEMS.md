# ASRTAVA Terminology & Clinical Coding Standards

**Document Reference:** `docs/integrations/TERMINOLOGY_AND_CODE_SYSTEMS.md`  
**Standard Systems:** ICD-10, SNOMED-CT, LOINC, UCUM, ATC, RxNorm  
**Last Verified:** 2026-11-09

---

## 1. Supported Clinical Code Systems

| Code System | Authority | Primary Domain | Example ASRTAVA Usage |
|---|---|---|---|
| **ICD-10** | WHO | Diseases & Morbidity | OPD SOAP diagnosis (`I21.9` Acute Myocardial Infarction) |
| **SNOMED-CT** | SNOMED International | Comprehensive Clinical Concepts | Clinical findings, procedures, and anatomical sites |
| **LOINC** | Regenstrief Institute | Laboratory Analytes & Observations | Lab orders (`6690-2` Leukocytes in Blood, `718-7` Hemoglobin) |
| **UCUM** | Regenstrief Institute | Unified Code for Units of Measure | Standard unit symbols (`g/dL`, `10^3/uL`, `mmol/L`, `mg/dL`) |
| **ATC** | WHO Collaborating Centre | Anatomical Therapeutic Chemical | Medication therapeutic classification & drug interactions |
| **RxNorm** | US NLM | Clinical Drug Formulations | Generic ingredient mapping and active pharmaceutical salts |

---

## 2. Concept Mapping Engine & Equivalence

Local hospital charge codes and lab mnemonics are mapped to international standards in `terminology_concept_mappings`:

```sql
SELECT source_code, target_system, target_code, target_display, equivalence
FROM terminology_concept_mappings
WHERE source_system = 'LOCAL_LAB' AND source_code = 'CBC_WBC';
```

- **Equivalence Types**:
  - `equal`: Direct mathematical and semantic identity.
  - `equivalent`: Medically equivalent concepts with identical clinical implications.
  - `wider`: Target concept has broader clinical scope than local definition.
  - `narrower`: Target concept is more specialized than local definition.
  - `inexact`: Approximation used as fallback; flagged for administrative review.

---

## 3. Strict Coding Integrity Rules

- ASRTAVA **never** invents fictional medical codes.
- Local custom lab names are preserved for clinical staff familiarity while mapping to LOINC for external FHIR export.
- Standard terminologies are updated during scheduled platform maintenance with version tracking (`mapping_version: "2026.1"`).


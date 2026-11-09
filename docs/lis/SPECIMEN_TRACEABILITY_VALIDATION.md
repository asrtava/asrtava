# ASRTAVA Specimen Traceability & Chain of Custody Validation

## 1. Specimen Accessioning & Positive Identification

ASRTAVA implements strict chain-of-custody tracking from the point of phlebotomy ordering through testing and biohazard disposal.

### 1.1 Accession Number & Barcode Integrity
- Each collection tube receives an accession identifier formatted as `ACC-YYYY-XXXXX`.
- The 2D DataMatrix/Code 128 barcode encodes the accession ID, patient UHID, container tube type, and required laboratory department.
- Handheld mobile scanners verify the patient wristband prior to affixing the label to the collection tube.

### 1.2 Container Color-Coding & Minimum Volumes
| Container Code | Additive / Gel | Department | Common Tests | Minimum Volume |
| :--- | :--- | :--- | :--- | :--- |
| `EDTA_LAVENDER` | K2-EDTA | Haematology | Complete Blood Count, HbA1c, Blood Group | 2.0 mL |
| `SST_GOLD` | Clot Activator & Gel Separator | Biochemistry / Immuno | LFT, KFT, Lipids, Thyroid, Cardiac Troponin | 3.5 mL |
| `CITRATE_BLUE` | 3.2% Sodium Citrate | Coagulation | PT/INR, aPTT, Fibrinogen, D-Dimer | 2.7 mL (Exact fill) |
| `FLUORIDE_GREY` | Sodium Fluoride & K-Oxalate | Biochemistry | Plasma Glucose, Lactate | 2.0 mL |
| `STERILE_CUP` | None (Preservative Free) | Microbiology / Urinalysis | Routine Urine, Urine Culture, Sputum | 10.0 mL |

---

## 2. Rejection & Recollection Protocol

When a specimen fails quality inspection upon central receiving:
1. The receiving technologist flags the root cause:
   - `HEMOLYZED`: Gross hemolysis (in vitro erythrocyte lysis invalidating potassium, AST, LDH).
   - `CLOTTED`: Fibrin micro-clots in whole blood EDTA tube.
   - `INSUFFICIENT_VOLUME`: Quantity Not Sufficient (QNS) for centrifuge dead-volume.
   - `INCORRECT_CONTAINER`: Wrong anticoagulant additive (e.g. EDTA used for Calcium test).
2. The specimen is quarantined and status set to `REJECTED`.
3. An automated recollection order is dispatched to the phlebotomy worklist and ward nursing station.


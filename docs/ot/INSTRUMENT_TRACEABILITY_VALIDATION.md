# ASRTAVA Surgical Instrument, Sponge & Sharps Traceability Validation

## 1. Prevention of Retained Foreign Objects (RFO)
Retained surgical sponges, needles, and instruments represent a preventable "Never Event" in surgical care. ASRTAVA mandates dual-nurse digital count reconciliation:
- Primary Scrub Nurse + Circulating Nurse.

## 2. Counting Lifecycle
1. **Initial Baseline Count**: Performed immediately prior to skin incision on all sterile packs.
2. **Intraoperative Addition Count**: Any supplemental sponges, sharps, or instrument trays opened mid-procedure are recorded in real time (`intraopAddedCount`).
3. **Closing Count**: Performed at the beginning of wound closure (peritoneum, deep fascia, subcutaneous tissue).
4. **Formula & Assertion**:
   $$\text{Expected Count} = \text{Initial Count} + \text{Added Count}$$
   $$\text{Discrepancy} = \text{Expected Count} - \text{Closing Count}$$
5. **Safety Action on Discrepancy**:
   - If $\text{Discrepancy} \ne 0$, system flags `CRITICAL_SURGICAL_COUNT_MISMATCH` and triggers mandatory intraoperative plain radiograph (X-ray) before wound closure.


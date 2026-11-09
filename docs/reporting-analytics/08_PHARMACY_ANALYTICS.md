# ASRTAVA Pharmacy Analytics

## 1. Overview
The Pharmacy Analytics module provides pharmaceutical inventory intelligence, consumption velocity tracking, and financial valuation based on actual dispensing logs and batch records.

## 2. Key Pharmacy Metrics
- **Stock Valuation**: Total monetary inventory value computed as $\sum (\text{batch remaining quantity} \times \text{unit purchase cost})$.
- **FEFO (First-Expiry-First-Out) Expiry Risk**: Proactively flags batches expiring within 90 days with monetary risk totals, enabling timely return to suppliers or prioritized dispensing.
- **Fast-Moving vs Slow-Moving SKUs**: Identifies high-velocity essential drugs (Paracetamol, Pantoprazole, Azithromycin) to maintain buffer stock and avoid stockouts.
- **Prescription Fulfillment Rate**: Measures the percentage of e-prescriptions written by doctors that are fulfilled by the hospital pharmacy.


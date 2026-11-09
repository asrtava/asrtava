# Incident Management & Whistleblower Validation

## 1. Scope
Validation of clinical and non-clinical incident reporting, classification, anonymous whistleblowing protection, and multi-disciplinary incident committee reviews.

## 2. Classification Standards
- **Near Miss**: Potential harm averted before reaching patient or causing damage (e.g., mislabeled syringe noticed by nurse prior to infusion).
- **No-Harm Event**: Incident reached the patient but caused no demonstrable physical or emotional injury (e.g., non-indicated saline flush).
- **Adverse Event**: Injury or complication caused by medical management rather than underlying disease process.
- **Sentinel Event**: Unanticipated occurrence involving death or serious physical or psychological injury (e.g., wrong-site surgery, maternal death, patient suicide in inpatient ward).

## 3. Whistleblower Protection Guarantee
- System provides `isAnonymous: true` option.
- Reporter user ID and email are completely decoupled and set to `NULL` at the database write boundary.
- Zero tracking of IP address or workstation identifier for anonymous reports.
- Prevents administrative retaliation by design.

## 4. Root Cause Analysis (RCA)
- Structured 5-Whys methodology forcing multi-tier causality identification.
- Ishikawa (Fishbone) diagram support covering: People, Methods, Machines, Materials, Measurements, Environment.
- Automatic link to Corrective and Preventive Action (CAPA) tracking.


# Deep Linking Specification

## 1. Custom Scheme & Universal Links
The app handles `asrtava://` custom scheme URLs and verified universal links:
- `asrtava://appointment/:id` &rarr; Routes directly to `AppointmentDetailsScreen` with live token pass.
- `asrtava://prescriptions` &rarr; Routes to `PrescriptionsScreen`.
- `asrtava://reports` &rarr; Routes to `LabReportsScreen`.
- `asrtava://billing/:invoiceId` &rarr; Routes to `BillingPaymentsScreen`.

## 2. Security Rules for Deep Links
- The app strictly sanitizes and validates incoming URL parameters.
- Protected screens require active authentication. If the patient is not logged in, the deep link destination is remembered and opened only after successful credential or biometric verification.
- Sensitive clinical notes or patient names are NEVER transmitted via URL parameters.


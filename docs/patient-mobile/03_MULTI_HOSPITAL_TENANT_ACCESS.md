# Multi-Hospital Tenant Access & Context Resolution

## 1. Multi-Hospital Linking
A single patient identity can be linked to multiple independent hospital organizations subscribed to ASRTAVA:
- Example: A patient consults at **Apex Care Hospital** in Bangalore for cardiology, and at **Metro City Health** in New Delhi for trauma care.
- `patient_hospital_links`: Connects `patient_id` with `hospital_id` with verification status (`verified`, `pending_otp`).

## 2. Dynamic Tenant Context Injection
When a patient selects a hospital from the top switcher card in `HomeScreen`:
1. The app invokes `setActiveHospitalHeader(hospitalId)` in the API client.
2. Subsequent HTTP requests transmit `x-hospital-id: <hospitalId>`.
3. The backend sets PostgreSQL RLS context:
   ```sql
   SET LOCAL app.current_tenant_id = '<hospitalId>';
   ```
4. Only medical records, doctor rosters, prescriptions, and invoices belonging to the active hospital organization are returned. Cross-tenant leakage is blocked at the database engine level.


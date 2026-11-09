# Patient Mobile App & Backend API Integration Map

| Mobile Screen | Backend REST Endpoint | HTTP Method | Payload / Response |
| :--- | :--- | :--- | :--- |
| **Login** | `/api/v1/auth/patient-login` | `POST` | `{ phone, password, otp }` &rarr; `{ token, patient }` |
| **Register** | `/api/v1/auth/patient-register` | `POST` | `{ firstName, lastName, phone, email, dob, gender }` |
| **Profile** | `/api/v1/patients/me` | `GET` | Consolidated patient 360 profile |
| **Hospital Switch** | `Client Context Injection` | - | Injects `x-hospital-id: <id>` in Axios headers |
| **Find Doctors** | `/api/v1/hospital/doctors` | `GET` | Verified faculty roster with consultation fees |
| **Book Appointment** | `/api/v1/appointments` | `POST` | `{ doctorId, appointmentDate, timeSlot, type, reason }` |
| **Cancel Appointment** | `/api/v1/appointments/:id/cancel`| `POST` | Releases doctor slot back to queue |
| **Prescriptions** | `/api/v1/clinical/my-prescriptions`| `GET` | Finalized e-prescriptions with remaining days |
| **Lab Reports** | `/api/v1/diagnostics/my-lab-reports` | `GET` | Pathology parameters, units, bio-ranges, panic flags |
| **Radiology** | `/api/v1/diagnostics/my-radiology-reports` | `GET` | Findings & radiologist impressions (X-Ray, CT, MRI) |
| **Billing & Payments**| `/api/v1/billing/my-invoices` | `GET` | Itemized patient invoices with payment status |
| **Pay Bill Online** | `/api/v1/billing/payments` | `POST` | `{ invoiceId, amount, paymentMethod, idempotencyKey }` |
| **Admissions (IPD)** | `/api/v1/inpatient/my-admissions` | `GET` | Ward, bed, attending clinician, discharge summary |
| **Document Upload** | `/api/v1/documents/upload` | `POST` | Multipart form-data with file type & size check |
| **Notifications** | `/api/v1/notifications/my-notifications`| `GET` | Centralized notification queue with unread count |


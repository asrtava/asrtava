# ASRTAVA Centralized Notification Event Catalog

**Document Reference:** `docs/project/NOTIFICATION_EVENT_CATALOG.md`  
**Version:** 1.0.0-ENTERPRISE  
**Authority:** ASRTAVA Clinical Informatics & System Lead

---

## 1. Domain Event Taxonomy

| Event Code | Domain | Primary Recipient | Default Channel | Priority | Required Variables |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `patient.registered` | Registration | Patient | SMS / Email | Normal | `patient_name`, `uhid`, `hospital_name` |
| `appointment.confirmed`| Outpatient | Patient | WhatsApp / SMS | High | `patient_name`, `doctor_name`, `appointment_date`, `appointment_time`, `token_number`, `hospital_name` |
| `appointment.rescheduled`| Outpatient | Patient | WhatsApp / SMS | High | `patient_name`, `doctor_name`, `new_date`, `new_time`, `token_number` |
| `appointment.cancelled`| Outpatient | Patient & Doctor | SMS / In-App | Normal | `patient_name`, `doctor_name`, `appointment_date`, `reason` |
| `appointment.reminder_24h`| Outpatient | Patient | WhatsApp | Normal | `patient_name`, `doctor_name`, `appointment_date`, `appointment_time`, `token_number` |
| `appointment.reminder_2h`| Outpatient | Patient | SMS | High | `patient_name`, `doctor_name`, `appointment_time`, `token_number` |
| `patient.checked_in` | Outpatient | Doctor | In-App | Normal | `patient_name`, `uhid`, `token_number` |
| `prescription.published`| Clinical | Patient & Pharmacy| In-App / WhatsApp| Normal | `patient_name`, `doctor_name`, `prescription_number`, `item_count` |
| `lab_report.published` | Diagnostics | Patient & Doctor | WhatsApp / In-App| Normal | `patient_name`, `uhid`, `test_name`, `report_url` |
| `lab.critical_panic_value`| Clinical | Ordering Doctor | In-App / SMS | **Critical** | `patient_name`, `uhid`, `test_name`, `result_value`, `unit`, `flag` |
| `radiology.critical_finding`| Clinical | Ordering Doctor | In-App / SMS | **Critical** | `patient_name`, `uhid`, `procedure_name`, `critical_finding_summary` |
| `invoice.generated` | Billing | Patient | Email / In-App | Normal | `invoice_number`, `patient_name`, `amount`, `status` |
| `payment.received` | Billing | Patient | SMS / Email | High | `receipt_number`, `patient_name`, `amount_paid`, `payment_method` |
| `finance.refund_approval_required`| Billing | Supervisor | In-App | High | `invoice_number`, `refund_amount`, `requested_by`, `reason` |
| `inpatient.admitted` | Inpatient | Patient & Nurse | In-App / SMS | Normal | `patient_name`, `admission_number`, `ward_name`, `bed_number` |
| `inpatient.bed_transferred`| Inpatient | Nurse & Admin | In-App | Normal | `patient_name`, `from_bed`, `to_bed`, `reason` |
| `nursing.medication_due`| Inpatient | Assigned Nurse | In-App | High | `patient_name`, `bed_number`, `medicine_name`, `dosage`, `scheduled_time` |
| `nursing.shift_handover`| Inpatient | Incoming Nurse | In-App | Normal | `ward_name`, `outgoing_nurse`, `incoming_nurse`, `census_occupied` |
| `pharmacy.low_stock_reorder`| Pharmacy | Inventory Officer| In-App | High | `medicine_name`, `current_stock`, `reorder_threshold` |
| `admin.staff_onboarded` | HR | Hospital Admin | Email | Normal | `staff_name`, `role`, `department`, `employee_code` |
| `saas.tenant_provisioned`| Super Admin | Super Admin | Email | High | `hospital_name`, `subdomain`, `plan_tier` |

---

## 2. Event Payload Schema Standard

All events emitted to the Notification Engine must conform to the canonical payload envelope:

```typescript
interface DomainNotificationEvent<T = Record<string, any>> {
  eventId: string;
  hospitalId: string;
  eventCode: string;
  sourceModule: 'appointments' | 'clinical' | 'diagnostics' | 'billing' | 'inpatient' | 'pharmacy';
  recipientUserId: string;
  recipientContact?: {
    phone?: string;
    email?: string;
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  variables: T;
  idempotencyKey?: string;
  emittedAt: string; // ISO 8601
}
```


-- ============================================================
-- ASRTAVA HMS - Performance Indexes & Concurrency Controls
-- ============================================================

-- 1. CONCURRENCY CONTROLS

-- Bed Allocation: Guarantee only 1 patient per physical bed simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_bed_allocation
ON bed_allocations (hospital_id, bed_id)
WHERE (is_current = TRUE);

-- Idempotent Financial Processing: Guarantee no duplicate payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_payment_idempotency
ON payments (hospital_id, idempotency_key)
WHERE (idempotency_key IS NOT NULL);

-- Active Medical Conditions: Single active record per condition code
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_condition
ON patient_medical_histories (hospital_id, patient_id, condition_name)
WHERE (resolution_status = 'active');


-- 2. TENANT LOOKUP & FOREIGN KEY PERFORMANCE INDEXES

-- Tenants & Settings
CREATE INDEX IF NOT EXISTS idx_hospitals_code ON hospitals(code);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON hospitals(is_active, subscription_status);
CREATE INDEX IF NOT EXISTS idx_hospital_branches_tenant ON hospital_branches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(hospital_id, is_active);

-- Users & Authentication
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_tenant_type ON users(hospital_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_token ON user_sessions(user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_user_devices_lookup ON user_devices(user_id, device_id);

-- Hybrid Permissions Lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_lookup ON user_permissions(user_id, hospital_id, is_granted);
CREATE INDEX IF NOT EXISTS idx_permissions_canon ON permissions(module, action, resource);

-- Doctors & Clinical Schedules
CREATE INDEX IF NOT EXISTS idx_doctors_tenant_user ON doctors(hospital_id, user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_dept ON doctors(hospital_id, department_id, is_available);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(doctor_id, day_of_week, is_active);

-- Patients & EMR
CREATE INDEX IF NOT EXISTS idx_patients_tenant_active ON patients(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patients_search_phone ON patients(hospital_id, phone);
CREATE INDEX IF NOT EXISTS idx_patients_search_number ON patients(hospital_id, patient_number);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_history_patient ON patient_medical_histories(patient_id);

-- Appointments & Queue Tokens
CREATE INDEX IF NOT EXISTS idx_appointments_schedule ON appointments(hospital_id, doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_queue ON appointments(hospital_id, doctor_id, appointment_date, queue_token_number)
WHERE (status = 'checked_in');

-- Consultations, Prescriptions & Vitals
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(hospital_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(hospital_id, doctor_id, consultation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(hospital_id, patient_id, status);
CREATE INDEX IF NOT EXISTS idx_prescription_items_presc ON prescription_items(prescription_id, is_dispensed);

-- Admissions & Bed Management
CREATE INDEX IF NOT EXISTS idx_admissions_active ON admissions(hospital_id, status)
WHERE (status IN ('admitted', 'under_treatment'));
CREATE INDEX IF NOT EXISTS idx_beds_ward_status ON beds(hospital_id, ward_id, status);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_admission ON nursing_notes(admission_id, recorded_at DESC);

-- Pharmacy & Batches
CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_lookup ON pharmacy_batches(hospital_id, medicine_id, available_quantity)
WHERE (available_quantity > 0 AND is_active = TRUE);
CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_expiry ON pharmacy_batches(hospital_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_movements_batch ON pharmacy_stock_movements(batch_id, recorded_at DESC);

-- Diagnostics
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(hospital_id, patient_id, order_status);
CREATE INDEX IF NOT EXISTS idx_lab_results_item ON lab_results(lab_order_item_id);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_status ON radiology_orders(hospital_id, status, scheduled_at);

-- Invoicing & Financial Transactions
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(hospital_id, patient_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(hospital_id, payment_status, due_date)
WHERE (payment_status IN ('unpaid', 'partially_paid'));
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(hospital_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(hospital_id, refund_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_ref ON financial_transactions(hospital_id, reference_document_type, reference_document_id);

-- Audit Trails & Notifications
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(hospital_id, actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, is_read, created_at DESC);


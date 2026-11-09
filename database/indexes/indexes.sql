-- ============================================================
-- ASRTAVA - Performance & Integrity Indexes
-- ============================================================

-- Hospital tenant lookup
CREATE INDEX IF NOT EXISTS idx_hospitals_code ON hospitals(code);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(subscription_status, is_active);

-- Users & Sessions
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_hospital ON users(hospital_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON user_sessions(user_id, refresh_token, is_revoked);
CREATE INDEX IF NOT EXISTS idx_user_roles ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions ON user_permissions(user_id, is_granted);

-- Patients & Appointments
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(hospital_id, phone);
CREATE INDEX IF NOT EXISTS idx_patients_number ON patients(hospital_id, patient_number);
CREATE INDEX IF NOT EXISTS idx_appointments_lookup ON appointments(hospital_id, doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(hospital_id, patient_id);

-- Consultations, Prescriptions & Vitals
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(hospital_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(hospital_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(hospital_id, patient_id);

-- Inpatient & Bed Allocation
CREATE INDEX IF NOT EXISTS idx_admissions_active ON admissions(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(hospital_id, ward_id, status);
CREATE INDEX IF NOT EXISTS idx_bed_allocations_current ON bed_allocations(bed_id, is_current);

-- Pharmacy & Inventory
CREATE INDEX IF NOT EXISTS idx_pharmacy_batches_expiry ON pharmacy_batches(hospital_id, expiry_date, quantity_available);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(hospital_id, name);

-- Invoicing & Billing
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(hospital_id, patient_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(hospital_id, invoice_id);

-- Audit Trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(hospital_id, created_at DESC);


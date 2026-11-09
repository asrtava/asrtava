-- ============================================================
-- ASRTAVA HMS - Automated SQL Validation & Test Suite
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_test_hospital_a UUID := 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    v_test_hospital_b UUID := 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
    v_patient_id_a UUID;
    v_patient_id_b UUID;
    v_visible_count INT;
    v_doctor_user_id UUID := 'e1000000-0000-0000-0000-000000000003';
    v_has_perm BOOLEAN;
    v_ward_id UUID;
    v_room_id UUID;
    v_bed_id UUID;
    v_admission_1 UUID;
    v_admission_2 UUID;
    v_error_caught BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RUNNING ASRTAVA DATABASE VERIFICATION TEST SUITE';
    RAISE NOTICE '=====================================================';

    -- --------------------------------------------------------
    -- TEST 1: Tenant B Provisioning
    -- --------------------------------------------------------
    INSERT INTO hospitals (id, code, name, city, subscription_plan, subscription_status)
    VALUES (v_test_hospital_b, 'METRO-DEL', 'Metro Specialty Hospital', 'New Delhi', 'professional', 'active')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO patients (id, hospital_id, patient_number, first_name, last_name, phone)
    VALUES (gen_random_uuid(), v_test_hospital_b, 'PAT-00099', 'Amit', 'Kapoor', '+919988776655')
    RETURNING id INTO v_patient_id_b;

    RAISE NOTICE '[PASS] Test 1: Secondary Hospital Tenant B provisioned successfully.';

    -- --------------------------------------------------------
    -- TEST 2: Row-Level Security Tenant Isolation Enforcement
    -- --------------------------------------------------------
    -- Establish Session Context for Hospital A
    PERFORM set_config('app.is_super_admin', 'false', true);
    PERFORM set_config('app.current_tenant_id', v_test_hospital_a::text, true);

    -- Query patients - Must ONLY return Hospital A patients; Hospital B patient MUST be invisible
    SELECT COUNT(*) INTO v_visible_count FROM patients WHERE id = v_patient_id_b;
    IF v_visible_count > 0 THEN
        RAISE EXCEPTION 'RLS LEAK DETECTED! Hospital A session can see Hospital B patient record!';
    END IF;

    RAISE NOTICE '[PASS] Test 2: RLS strict tenant isolation verified (Hospital B record completely invisible to Hospital A).';

    -- --------------------------------------------------------
    -- TEST 3: Permission Engine - Standard Role Evaluation
    -- --------------------------------------------------------
    -- Doctor Ananya Iyer should have permission to create prescriptions
    v_has_perm := has_permission(v_doctor_user_id, 'clinical', 'create', 'prescription');
    IF v_has_perm IS NOT TRUE THEN
        RAISE EXCEPTION 'RBAC Failure: Doctor user should have clinical:create:prescription permission!';
    END IF;

    RAISE NOTICE '[PASS] Test 3: Standard RBAC role permission granted correctly.';

    -- --------------------------------------------------------
    -- TEST 4: Hybrid Permission - Explicit Deny Precedence
    -- --------------------------------------------------------
    -- Assign explicit DENY override on prescription creation for Doctor Ananya
    INSERT INTO user_permissions (user_id, hospital_id, permission_id, is_granted, justification)
    VALUES (
        v_doctor_user_id,
        v_test_hospital_a,
        'c1000000-0000-0000-0000-000000000032', -- clinical:prescription:create
        FALSE, -- EXPLICIT DENY
        'Temporary clinical audit suspension'
    )
    ON CONFLICT (user_id, permission_id) DO UPDATE SET is_granted = FALSE;

    -- Re-evaluate permission: Explicit Deny MUST defeat the Doctor role grant
    v_has_perm := has_permission(v_doctor_user_id, 'clinical', 'create', 'prescription');
    IF v_has_perm IS TRUE THEN
        RAISE EXCEPTION 'Security Failure: Explicit Deny did NOT take precedence over role grant!';
    END IF;

    RAISE NOTICE '[PASS] Test 4: Explicit Deny precedence verified (Overrides role permission successfully).';

    -- --------------------------------------------------------
    -- TEST 5: Concurrency Control - Bed Allocation Overlap
    -- --------------------------------------------------------
    SELECT id INTO v_patient_id_a FROM patients WHERE hospital_id = v_test_hospital_a LIMIT 1;

    INSERT INTO wards (id, hospital_id, name, ward_type)
    VALUES (gen_random_uuid(), v_test_hospital_a, 'ICU Unit 1', 'icu')
    RETURNING id INTO v_ward_id;

    INSERT INTO rooms (id, hospital_id, ward_id, room_number)
    VALUES (gen_random_uuid(), v_test_hospital_a, v_ward_id, 'ICU-R01')
    RETURNING id INTO v_room_id;

    INSERT INTO beds (id, hospital_id, ward_id, room_id, bed_number, status)
    VALUES (gen_random_uuid(), v_test_hospital_a, v_ward_id, v_room_id, 'BED-01', 'occupied')
    RETURNING id INTO v_bed_id;

    INSERT INTO admissions (id, hospital_id, patient_id, admitting_doctor_id, admission_number)
    VALUES (gen_random_uuid(), v_test_hospital_a, v_patient_id_a, '71000000-0000-0000-0000-000000000001', 'ADM-TEST-01')
    RETURNING id INTO v_admission_1;

    -- Allocate Bed to Patient 1
    INSERT INTO bed_allocations (hospital_id, admission_id, bed_id, is_current)
    VALUES (v_test_hospital_a, v_admission_1, v_bed_id, TRUE);

    -- Attempt to concurrently allocate Bed 1 to a SECOND admission while still current
    INSERT INTO admissions (id, hospital_id, patient_id, admitting_doctor_id, admission_number)
    VALUES (gen_random_uuid(), v_test_hospital_a, v_patient_id_a, '71000000-0000-0000-0000-000000000001', 'ADM-TEST-02')
    RETURNING id INTO v_admission_2;

    BEGIN
        INSERT INTO bed_allocations (hospital_id, admission_id, bed_id, is_current)
        VALUES (v_test_hospital_a, v_admission_2, v_bed_id, TRUE);
    EXCEPTION
        WHEN unique_violation THEN
            v_error_caught := TRUE;
    END;

    IF v_error_caught IS NOT TRUE THEN
        RAISE EXCEPTION 'Concurrency Bug: Dual simultaneous active bed allocation was allowed!';
    END IF;

    RAISE NOTICE '[PASS] Test 5: Bed allocation concurrency conflict successfully blocked by unique constraint.';

    -- --------------------------------------------------------
    -- TEST 6: Financial Concurrency - Idempotency Key
    -- --------------------------------------------------------
    v_error_caught := FALSE;
    BEGIN
        -- Insert Payment 1 with Idempotency Key
        INSERT INTO payments (hospital_id, invoice_id, patient_id, payment_receipt_number, amount_paid, payment_method, cashier_user_id, idempotency_key)
        VALUES (v_test_hospital_a, gen_random_uuid(), v_patient_id_a, 'REC-0001', 500.00, 'upi', v_doctor_user_id, 'IDEMP-TXN-101');

        -- Duplicate API retry with identical Idempotency Key
        INSERT INTO payments (hospital_id, invoice_id, patient_id, payment_receipt_number, amount_paid, payment_method, cashier_user_id, idempotency_key)
        VALUES (v_test_hospital_a, gen_random_uuid(), v_patient_id_a, 'REC-0002', 500.00, 'upi', v_doctor_user_id, 'IDEMP-TXN-101');
    EXCEPTION
        WHEN unique_violation THEN
            v_error_caught := TRUE;
    END;

    IF v_error_caught IS NOT TRUE THEN
        RAISE EXCEPTION 'Financial Bug: Duplicate payment with identical idempotency key was allowed!';
    END IF;

    RAISE NOTICE '[PASS] Test 6: Financial idempotency protection verified (Duplicate transaction attempt blocked).';

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ALL 6 CRITICAL DATABASE INTEGRITY TESTS PASSED!';
    RAISE NOTICE '=====================================================';
END
$$;

ROLLBACK; -- Tests clean up after themselves


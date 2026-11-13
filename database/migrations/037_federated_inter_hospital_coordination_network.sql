-- ============================================================
-- ASRTAVA HMS - Migration 037: Federated Inter-Hospital Coordination Network
-- Strict Tenant Isolation with Controlled Healthcare Interoperability
-- Compliance: India THOA (Transplantation of Human Organs Act) & NOTTO Framework,
-- DPDP Act 2023, NABH Standards, and Clinical Minimum-Data Disclosure
-- ============================================================

-- ------------------------------------------------------------
-- 1. Participating Hospital Network Registry
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS federated_participating_hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    network_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'NET-HOSP-HYD-001'
    facility_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    participation_status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (participation_status IN ('active', 'suspended', 'pending_verification', 'withdrawn')),
    
    -- Clinical capabilities published to authorized network
    capabilities JSONB NOT NULL DEFAULT '{
        "organ_transplant": false,
        "transplant_types": [],
        "level_1_trauma": false,
        "blood_bank": false,
        "icu_capacity": false,
        "tele_radiology_second_opinion": false
    }',
    
    -- Official Regulatory & Accreditation Registrations
    notto_center_id VARCHAR(100), -- National Organ & Tissue Transplant Org Center ID
    sotto_registration_number VARCHAR(100), -- State Organ & Tissue Transplant Org Reg No.
    blood_bank_license_number VARCHAR(100), -- Drug Controller General Blood Bank License
    nabh_accreditation_number VARCHAR(100),
    
    -- Operational Contact Coordinates
    emergency_helpline_phone VARCHAR(50) NOT NULL,
    transplant_coordinator_phone VARCHAR(50),
    blood_bank_desk_phone VARCHAR(50),
    official_contact_email VARCHAR(255) NOT NULL,
    
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_fed_hosp_status ON federated_participating_hospitals(participation_status);
CREATE INDEX IF NOT EXISTS idx_fed_hosp_city ON federated_participating_hospitals(city);

-- ------------------------------------------------------------
-- 2. Inter-Hospital Coordination Requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inter_hospital_coordination_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'REQ-FED-2026-00142'
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'organ_donor_coordination',
        'emergency_patient_transfer',
        'bed_availability_inquiry',
        'blood_component_request',
        'specialist_tele_consult',
        'urgent_diagnostic_opinion'
    )),
    requesting_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    receiving_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL, -- NULL indicates network-wide broadcast enquiry
    
    requesting_user_id UUID NOT NULL REFERENCES users(id),
    requesting_user_role VARCHAR(50) NOT NULL,
    
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'urgent' CHECK (urgency_level IN ('stat_critical', 'urgent', 'routine')),
    purpose_statement VARCHAR(255) NOT NULL,
    clinical_summary TEXT NOT NULL, -- Strictly minimum necessary clinical dataset
    
    -- Workflow Status Lifecycle:
    -- DRAFT -> SUBMITTED -> AUTHORIZATION_CHECK -> ACCEPTED -> IN_PROGRESS -> COMPLETED
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT',
        'SUBMITTED',
        'AUTHORIZATION_CHECK',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED',
        'WITHDRAWN',
        'ESCALATED'
    )),
    rejection_reason TEXT,
    
    -- Legal & Consent Framework
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'patient_written_consent',
        'next_of_kin_authorized',
        'stat_emergency_implied_consent',
        'statutory_legal_order'
    )),
    consent_verified_by UUID REFERENCES users(id),
    consent_document_hash VARCHAR(128),
    
    -- Expiry (Requests automatically close if not accepted within SLA window)
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fed_req_requesting ON inter_hospital_coordination_requests(requesting_hospital_id);
CREATE INDEX IF NOT EXISTS idx_fed_req_receiving ON inter_hospital_coordination_requests(receiving_hospital_id);
CREATE INDEX IF NOT EXISTS idx_fed_req_status ON inter_hospital_coordination_requests(status);
CREATE INDEX IF NOT EXISTS idx_fed_req_type ON inter_hospital_coordination_requests(request_type);

-- ------------------------------------------------------------
-- 3. Organ Donation & Transplant Coordination Cases
-- Compliance: NOTTO / SOTTO National Allocation Protocol
-- INVARIANT: ASRTAVA records clinical readiness and coordination;
-- allocation is strictly determined by official government authorities.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organ_transplant_coordination_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'TX-CASE-2026-0042'
    coordination_request_id UUID NOT NULL REFERENCES inter_hospital_coordination_requests(id) ON DELETE CASCADE,
    donor_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    
    donor_type VARCHAR(30) NOT NULL CHECK (donor_type IN ('deceased_brain_stem_death', 'deceased_cardiac_death', 'living_related')),
    donor_blood_group VARCHAR(10) NOT NULL CHECK (donor_blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    donor_age_approx INT NOT NULL CHECK (donor_age_approx >= 0 AND donor_age_approx <= 120),
    donor_gender VARCHAR(20) NOT NULL,
    
    -- Clinical & Legal Brain-Stem Death Verification (Mandatory in India: 2 Apnea tests 6 hrs apart by 4-doctor board)
    brain_death_first_apnea_test_at TIMESTAMPTZ,
    brain_death_second_apnea_test_at TIMESTAMPTZ,
    brain_death_board_certified BOOLEAN NOT NULL DEFAULT FALSE,
    form_8_legal_declaration_signed BOOLEAN NOT NULL DEFAULT FALSE, -- THOA Form 8 / Form 10
    
    -- Authorized Organs Pledged / Cleared for Retrieval
    organs_authorized JSONB NOT NULL DEFAULT '[]', -- e.g. ["kidney_left", "kidney_right", "liver", "cornea_both"]
    
    -- Government Registry Integration & Traceability
    sotto_notified_at TIMESTAMPTZ,
    sotto_case_reference VARCHAR(100),
    notto_registry_reference VARCHAR(100),
    official_allocation_authority VARCHAR(100) NOT NULL DEFAULT 'NOTTO/SOTTO',
    
    -- Cross-Hospital Retrieval Logistics
    retrieval_team_hospital_id UUID REFERENCES hospitals(id),
    retrieval_team_eta TIMESTAMPTZ,
    green_corridor_status VARCHAR(30) NOT NULL DEFAULT 'not_required' CHECK (green_corridor_status IN (
        'not_required',
        'requested_with_traffic_police',
        'active',
        'completed'
    )),
    cold_ischemia_start_time TIMESTAMPTZ,
    
    -- Commercialization Firewall (Zero-Tolerance Verification)
    commercial_intermediary_check_passed BOOLEAN NOT NULL DEFAULT TRUE,
    non_commercial_affidavit_hash VARCHAR(128) NOT NULL,
    
    status VARCHAR(30) NOT NULL DEFAULT 'donor_identified' CHECK (status IN (
        'donor_identified',
        'consent_verified',
        'sotto_notified',
        'retrieval_in_progress',
        'cross_match_verified',
        'transplant_in_progress',
        'transplant_completed',
        'closed'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Emergency Patient Transfer & Clinical Handover
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_patient_transfer_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'EMERG-TX-2026-0089'
    coordination_request_id UUID NOT NULL REFERENCES inter_hospital_coordination_requests(id) ON DELETE CASCADE,
    origin_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    destination_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    
    -- PII Minimization: Direct identifiable name is never exposed over public bus
    patient_uhid_pseudonym VARCHAR(100) NOT NULL,
    patient_age INT NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    
    triage_level VARCHAR(30) NOT NULL CHECK (triage_level IN ('ESI_1_RESUSCITATION', 'ESI_2_EMERGENT', 'ESI_3_URGENT')),
    provisional_diagnosis VARCHAR(255) NOT NULL,
    
    -- Minimum Necessary Clinical Handover Payload
    minimum_clinical_payload JSONB NOT NULL DEFAULT '{
        "gcs": 15,
        "vitals": {},
        "intubated": false,
        "inotropes_active": false,
        "known_allergies": [],
        "critical_interventions_done": []
    }',
    
    -- Ambulance Transport Fleet Coordination
    ambulance_type VARCHAR(30) NOT NULL DEFAULT 'ALS_ADVANCED_LIFE_SUPPORT' CHECK (ambulance_type IN (
        'ALS_ADVANCED_LIFE_SUPPORT',
        'BLS_BASIC_LIFE_SUPPORT',
        'AIR_AMBULANCE',
        'NEONATAL_TRANSPORT'
    )),
    ambulance_call_sign VARCHAR(50) NOT NULL,
    paramedic_in_charge VARCHAR(100) NOT NULL,
    paramedic_contact_phone VARCHAR(50) NOT NULL,
    departure_time TIMESTAMPTZ,
    estimated_arrival_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    
    -- Dual-Sign-Off Handover Certification
    handover_origin_nurse_id UUID REFERENCES users(id),
    handover_destination_nurse_id UUID REFERENCES users(id),
    handover_signed_at TIMESTAMPTZ,
    handover_clinical_notes TEXT,
    
    transfer_status VARCHAR(30) NOT NULL DEFAULT 'requested' CHECK (transfer_status IN (
        'requested',
        'accepted',
        'ambulance_dispatched',
        'in_transit',
        'arrived_destination',
        'admitted',
        'declined'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Inter-Hospital Bed & Critical-Care Availability Reporting
-- Voluntary, timestamped capacity broadcast (TTL: 60 - 120 mins)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inter_hospital_bed_availability_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    general_ward_vacant INT NOT NULL DEFAULT 0 CHECK (general_ward_vacant >= 0),
    icu_beds_vacant INT NOT NULL DEFAULT 0 CHECK (icu_beds_vacant >= 0),
    ventilator_beds_vacant INT NOT NULL DEFAULT 0 CHECK (ventilator_beds_vacant >= 0),
    emergency_resus_bays_vacant INT NOT NULL DEFAULT 0 CHECK (emergency_resus_bays_vacant >= 0),
    ot_emergency_slots_vacant INT NOT NULL DEFAULT 0 CHECK (ot_emergency_slots_vacant >= 0),
    
    verified_by_user_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL, -- Stale after TTL; prevents obsolete reservation assumptions
    notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_fed_bed_hosp_time ON inter_hospital_bed_availability_reports(hospital_id, reported_at DESC);

-- ------------------------------------------------------------
-- 6. Inter-Hospital Blood Bank & Component Coordination
-- Strict privacy: Donor identities NEVER exposed
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_bank_coordination_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coordination_request_id UUID NOT NULL REFERENCES inter_hospital_coordination_requests(id) ON DELETE CASCADE,
    requesting_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    supplying_hospital_id UUID REFERENCES hospitals(id),
    
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN (
        'packed_red_blood_cells',
        'fresh_frozen_plasma',
        'single_donor_platelets',
        'random_donor_platelets',
        'cryoprecipitate'
    )),
    units_requested INT NOT NULL CHECK (units_requested > 0),
    units_allocated INT NOT NULL DEFAULT 0 CHECK (units_allocated >= 0),
    
    compatibility_cross_match_required BOOLEAN NOT NULL DEFAULT TRUE,
    cold_chain_box_barcode VARCHAR(100),
    dispatch_temperature_celsius NUMERIC(4,1),
    
    status VARCHAR(30) NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested',
        'allocated',
        'dispatched',
        'received_and_verified',
        'cancelled'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. Case-Based Ephemeral Clinical Data Shares
-- Time-limited, purpose-scoped tokens (never full chart)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_based_data_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coordination_request_id UUID NOT NULL REFERENCES inter_hospital_coordination_requests(id) ON DELETE CASCADE,
    origin_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    destination_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
        'imaging_study',
        'lab_specimen_report',
        'discharge_summary',
        'cross_match_report',
        'hla_typing_certificate'
    )),
    resource_id VARCHAR(100) NOT NULL,
    resource_title VARCHAR(255) NOT NULL,
    
    access_token VARCHAR(128) NOT NULL UNIQUE, -- High-entropy cryptographic bearer token
    token_expires_at TIMESTAMPTZ NOT NULL, -- Strict TTL (2 to 24 hours max)
    access_count INT NOT NULL DEFAULT 0,
    max_permitted_accesses INT NOT NULL DEFAULT 10,
    
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_token ON case_based_data_shares(access_token);

-- ------------------------------------------------------------
-- 8. Tamper-Resistant Inter-Hospital Coordination Audit Trail
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inter_hospital_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_number VARCHAR(50) NOT NULL UNIQUE,
    request_id UUID REFERENCES inter_hospital_coordination_requests(id) ON DELETE SET NULL,
    source_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    target_hospital_id UUID REFERENCES hospitals(id),
    
    action VARCHAR(100) NOT NULL, -- e.g. 'ORGAN_DONOR_REGISTERED', 'EMERGENCY_TRANSFER_ACCEPTED'
    performed_by_user_id UUID NOT NULL REFERENCES users(id),
    user_role VARCHAR(50) NOT NULL,
    lawful_basis VARCHAR(100) NOT NULL, -- 'THOA_1994_SECTION_9', 'DPDP_SECTION_7_EMERGENCY'
    
    pii_redaction_applied BOOLEAN NOT NULL DEFAULT TRUE,
    payload_snapshot JSONB NOT NULL DEFAULT '{}',
    sha256_record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fed_audit_req ON inter_hospital_audit_trail(request_id);
CREATE INDEX IF NOT EXISTS idx_fed_audit_source ON inter_hospital_audit_trail(source_hospital_id);

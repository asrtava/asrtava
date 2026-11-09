-- ============================================================================
-- ASRTAVA Hospital Management System
-- 012_wards_beds.sql - Wards, Rooms & Bed Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- wards
-- ---------------------------------------------------------------------------
CREATE TABLE wards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20),
    ward_type       VARCHAR(30)
        CHECK (ward_type IN ('general', 'semi_private', 'private', 'icu', 'nicu',
                             'picu', 'isolation', 'emergency', 'maternity')),
    floor           VARCHAR(20),
    total_beds      INT DEFAULT 0,
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, name)
);

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id         UUID NOT NULL
        REFERENCES wards(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    room_number     VARCHAR(20) NOT NULL,
    room_type       VARCHAR(30)
        CHECK (room_type IN ('single', 'double', 'multi', 'suite', 'icu')),
    total_beds      INT DEFAULT 1,
    has_ac          BOOLEAN DEFAULT false,
    has_bathroom    BOOLEAN DEFAULT false,
    daily_rate      DECIMAL(10,2),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, room_number)
);

-- ---------------------------------------------------------------------------
-- beds
-- ---------------------------------------------------------------------------
CREATE TABLE beds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL
        REFERENCES rooms(id) ON DELETE CASCADE,
    ward_id         UUID NOT NULL
        REFERENCES wards(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_number      VARCHAR(20) NOT NULL,
    bed_type        VARCHAR(20) DEFAULT 'standard',
    status          VARCHAR(20) DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'cleaning')),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, bed_number)
);

-- ---------------------------------------------------------------------------
-- bed_allocations
-- ---------------------------------------------------------------------------
CREATE TABLE bed_allocations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_id          UUID NOT NULL
        REFERENCES beds(id) ON DELETE RESTRICT,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id    UUID NOT NULL
        REFERENCES admissions(id) ON DELETE RESTRICT,
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    allocated_at    TIMESTAMPTZ DEFAULT NOW(),
    released_at     TIMESTAMPTZ,
    allocated_by    UUID
        REFERENCES users(id) ON DELETE SET NULL,
    released_by     UUID
        REFERENCES users(id) ON DELETE SET NULL,
    notes           TEXT,
    is_current      BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

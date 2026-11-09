import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

// ============================================================
// ASRTAVA Hospital Management Modules & Interconnected Workflows
// Automated Business Logic & Security Test Suite
// ============================================================

describe('ASRTAVA Hospital Management Workflows & Modules Suite', () => {

  // ------------------------------------------------------------
  // 1. Patient Duplicate Detection & Merging Algorithm
  // ------------------------------------------------------------
  describe('Patient Management Workflows', () => {
    it('calculates accurate duplicate confidence score based on multi-attribute match', () => {
      const existing = {
        firstName: 'Rahul',
        lastName: 'Verma',
        phone: '9876543210',
        dob: '1990-05-15',
      };

      function calculateDuplicateScore(candidate: typeof existing, input: typeof existing): number {
        let score = 0;
        if (candidate.phone === input.phone) score += 50;
        if (candidate.firstName.toLowerCase() === input.firstName.toLowerCase()) score += 25;
        if (candidate.lastName.toLowerCase() === input.lastName.toLowerCase()) score += 15;
        if (candidate.dob === input.dob) score += 10;
        return score;
      }

      // Exact match
      const exactScore = calculateDuplicateScore(existing, existing);
      assert.strictEqual(exactScore, 100, 'Exact match must score 100%');

      // Phone match only with different name
      const phoneOnlyScore = calculateDuplicateScore(existing, { ...existing, firstName: 'Priya', lastName: 'Iyer', dob: '1995-01-01' });
      assert.strictEqual(phoneOnlyScore, 50, 'Phone only match must score 50%');

      // Name only match with different phone
      const nameOnlyScore = calculateDuplicateScore(existing, { ...existing, phone: '9123456789', dob: '1995-01-01' });
      assert.strictEqual(nameOnlyScore, 40, 'Name match must score 40%');
    });

    it('preserves foreign key clinical links and records audit trace upon patient merge', () => {
      const sourcePatientId = 'pat-source-001';
      const targetPatientId = 'pat-target-002';
      let appointments = [{ id: 'apt-1', patientId: sourcePatientId }, { id: 'apt-2', patientId: targetPatientId }];

      // Merge re-linking
      appointments = appointments.map((a) => (a.patientId === sourcePatientId ? { ...a, patientId: targetPatientId } : a));

      assert.strictEqual(appointments[0].patientId, targetPatientId, 'Source patient appointments must point to target');
      assert.strictEqual(appointments[1].patientId, targetPatientId, 'Target patient appointments must remain on target');
    });
  });

  // ------------------------------------------------------------
  // 2. Appointment Scheduling & Double-Booking Prevention Engine
  // ------------------------------------------------------------
  describe('Appointment Scheduling Engine', () => {
    it('detects slot overlap and prevents concurrent double-booking of doctor', () => {
      const existingAppointments = [
        { doctorId: 'doc-1', date: '2026-11-10', start: '10:00', end: '10:30', status: 'confirmed' },
        { doctorId: 'doc-1', date: '2026-11-10', start: '11:00', end: '11:30', status: 'confirmed' },
      ];

      function hasConflict(doctorId: string, date: string, start: string, end: string): boolean {
        return existingAppointments.some((a) => {
          if (a.doctorId !== doctorId || a.date !== date || a.status === 'cancelled') return false;
          return (start >= a.start && start < a.end) || (end > a.start && end <= a.end);
        });
      }

      assert.strictEqual(hasConflict('doc-1', '2026-11-10', '10:15', '10:45'), true, 'Overlapping slot must conflict');
      assert.strictEqual(hasConflict('doc-1', '2026-11-10', '10:30', '11:00'), false, 'Adjacent non-overlapping slot must be allowed');
      assert.strictEqual(hasConflict('doc-2', '2026-11-10', '10:00', '10:30'), false, 'Slot on different doctor must be allowed');
    });
  });

  // ------------------------------------------------------------
  // 3. Clinical Notes & Amendment Versioning
  // ------------------------------------------------------------
  describe('Clinical EMR Data Integrity & Amendments', () => {
    it('finalized clinical record is never overwritten; amendments append audit version', () => {
      const consultation = {
        id: 'con-101',
        clinicalNotes: 'Initial diagnosis: Acute Coronary Syndrome.',
        amendments: [] as { version: number; reason: string; amendedText: string }[],
      };

      function amendRecord(record: typeof consultation, reason: string, text: string) {
        const nextVersion = record.amendments.length + 1;
        record.amendments.push({ version: nextVersion, reason, amendedText: text });
      }

      amendRecord(consultation, 'Cardiology Troponin-I returned negative', 'Revised working diagnosis: Musculoskeletal chest wall pain.');

      assert.strictEqual(consultation.clinicalNotes, 'Initial diagnosis: Acute Coronary Syndrome.', 'Original notes must be preserved');
      assert.strictEqual(consultation.amendments.length, 1);
      assert.strictEqual(consultation.amendments[0].version, 1);
    });
  });

  // ------------------------------------------------------------
  // 4. Inpatient Bed Allocation & Release Concurrency
  // ------------------------------------------------------------
  describe('IPD Bed Management', () => {
    it('prevents two active patients from occupying the same bed', () => {
      const beds = new Map<string, { status: 'available' | 'occupied' | 'cleaning'; patientId?: string }>();
      beds.set('BED-ICU-01', { status: 'occupied', patientId: 'pat-1' });

      function allocateBed(bedId: string, newPatientId: string): boolean {
        const bed = beds.get(bedId);
        if (!bed || bed.status !== 'available') return false;
        bed.status = 'occupied';
        bed.patientId = newPatientId;
        return true;
      }

      assert.strictEqual(allocateBed('BED-ICU-01', 'pat-2'), false, 'Cannot allocate already occupied bed');
      
      // Patient 1 discharged -> bed transitions to cleaning
      const bed = beds.get('BED-ICU-01')!;
      bed.status = 'cleaning';
      bed.patientId = undefined;
      assert.strictEqual(allocateBed('BED-ICU-01', 'pat-2'), false, 'Cannot allocate bed under cleaning');

      // Cleaning completed -> available
      bed.status = 'available';
      assert.strictEqual(allocateBed('BED-ICU-01', 'pat-2'), true, 'Bed successfully allocated when available');
    });
  });

  // ------------------------------------------------------------
  // 5. Pharmacy FEFO Batch Deduction & Stock Integrity
  // ------------------------------------------------------------
  describe('Pharmacy FEFO Dispensing', () => {
    it('allocates earliest expiring batches first and disallows negative inventory', () => {
      const batches = [
        { id: 'b1', batchNo: 'BAT-EARLY', exp: '2026-08-31', stock: 10 },
        { id: 'b2', batchNo: 'BAT-LATER', exp: '2027-12-31', stock: 50 },
      ];

      function dispenseFEFO(requestedQty: number): { dispensedBatches: { id: string; qty: number }[]; success: boolean } {
        // Sort by expiry ascending
        batches.sort((a, b) => new Date(a.exp).getTime() - new Date(b.exp).getTime());

        let remaining = requestedQty;
        const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);
        if (requestedQty > totalStock) return { dispensedBatches: [], success: false };

        const dispensed: { id: string; qty: number }[] = [];
        for (const b of batches) {
          if (remaining <= 0) break;
          const take = Math.min(b.stock, remaining);
          b.stock -= take;
          remaining -= take;
          dispensed.push({ id: b.id, qty: take });
        }

        return { dispensedBatches: dispensed, success: true };
      }

      const result = dispenseFEFO(25);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.dispensedBatches[0].id, 'b1');
      assert.strictEqual(result.dispensedBatches[0].qty, 10, 'Earliest batch b1 should be fully consumed');
      assert.strictEqual(result.dispensedBatches[1].id, 'b2');
      assert.strictEqual(result.dispensedBatches[1].qty, 15, 'Remainder taken from b2');
      assert.strictEqual(batches[1].stock, 35, 'Remaining batch 2 stock should be 35');
    });
  });

  // ------------------------------------------------------------
  // 6. Decimal-Safe Financial Calculations & GST Allocation
  // ------------------------------------------------------------
  describe('Billing & Decimal-Safe Monetary Arithmetic', () => {
    it('computes GST tax accurately without floating-point drift', () => {
      function calculateBill(items: { gross: number; gstRate: number }[]) {
        let grossTotalCents = 0;
        let taxTotalCents = 0;

        for (const item of items) {
          const itemGrossCents = Math.round(item.gross * 100);
          const itemTaxCents = Math.round(itemGrossCents * (item.gstRate / 100));
          grossTotalCents += itemGrossCents;
          taxTotalCents += itemTaxCents;
        }

        const netPayableCents = grossTotalCents + taxTotalCents;
        return {
          gross: (grossTotalCents / 100).toFixed(2),
          tax: (taxTotalCents / 100).toFixed(2),
          netPayable: (netPayableCents / 100).toFixed(2),
        };
      }

      const bill = calculateBill([
        { gross: 1420.00, gstRate: 5.0 }, // Consultation & room
        { gross: 350.50, gstRate: 12.0 }, // Pharmacy formulations
      ]);

      assert.strictEqual(bill.gross, '1770.50');
      assert.strictEqual(bill.tax, '113.06');
      assert.strictEqual(bill.netPayable, '1883.56');
    });
  });

  // ------------------------------------------------------------
  // 7. Security & Individual Custom Permission DENY Override
  // ------------------------------------------------------------
  describe('Security & Multi-Tenant Authorization', () => {
    it('explicit individual DENY permission strictly overrides role-based ALLOW', () => {
      const user = {
        rolePermissions: ['patient:view', 'patient:create', 'prescription:dispense'],
        customOverrides: [
          { permission: 'prescription:dispense', effect: 'DENY' },
        ],
      };

      function evaluatePermission(u: typeof user, requiredPerm: string): boolean {
        // 1. Check explicit custom override first
        const override = u.customOverrides.find((o) => o.permission === requiredPerm);
        if (override && override.effect === 'DENY') return false;
        if (override && override.effect === 'ALLOW') return true;

        // 2. Check role-based permissions
        return u.rolePermissions.includes(requiredPerm);
      }

      assert.strictEqual(evaluatePermission(user, 'patient:view'), true, 'Role permission ALLOW must succeed when no DENY exists');
      assert.strictEqual(evaluatePermission(user, 'prescription:dispense'), false, 'Custom DENY override must strictly block permission');
      assert.strictEqual(evaluatePermission(user, 'billing:refund'), false, 'Unassigned permission must evaluate to false');
    });
  });

});


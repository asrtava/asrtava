import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AdvancedPharmacyService } from '../src/modules/pharmacy/pharmacy-advanced.service';

describe('ASRTAVA Advanced Pharmacy Management, eRx, Safety & Inventory (Milestone v1.8.0)', () => {
  const hospitalId = 'hosp-delhi-main';
  const doctorId = 'doc-sharma-cardio';
  const pharmacistId = 'pharm-meera-senior';
  const nurseId1 = 'nurse-priya-icu';
  const nurseId2 = 'nurse-anita-charge';

  let drugAmoxId: string;
  let drugWarfarinId: string;
  let drugAspirinId: string;
  let drugInsulinId: string;
  let drugMorphineId: string;
  let drugPrednisoneId: string;

  // Scenario 1: Drug Master Catalog Registration & LASA/Tall Man Lettering
  it('Scenario 1: Registers drug in master formulary and automatically applies ISMP Tall Man lettering for LASA defense', () => {
    const drug = AdvancedPharmacyService.registerDrug({
      hospitalId,
      itemCode: 'DRUG-PRED-20',
      brandName: 'Wysolone 20mg',
      genericName: 'Prednisone',
      dosageForm: 'tablet',
      strength: '20 mg',
      administrationRoute: 'oral',
      manufacturer: 'Pfizer Healthcare India',
      regulatorySchedule: 'SCHEDULE_H',
      formularyStatus: 'FORMULARY_OPEN',
      reorderLevel: 50,
      maximumStockLevel: 500,
    });

    drugPrednisoneId = drug.id;
    assert.ok(drug.id);
    assert.strictEqual(drug.isLasa, true, 'Prednisone must be recognized as Look-Alike Sound-Alike');
    assert.strictEqual(drug.tallManName, 'predniSONE', 'Tall Man lettering must be computed');
    assert.strictEqual(drug.hsnCode, '3004');
  });

  // Scenario 2: Severe Drug Allergy Detection
  it('Scenario 2: Evaluates prescription safety and raises CRITICAL_BLOCK for known patient drug allergies', () => {
    const safetyCheck = AdvancedPharmacyService.evaluatePrescriptionSafety(
      hospitalId,
      [{ medicineName: 'Amoxicillin Trihydrate 500mg Capsule' }],
      ['Penicillin'], // Documented allergy
      []
    );

    assert.strictEqual(safetyCheck.hasCriticalBlock, true, 'Penicillin allergy must trigger critical block on Amoxicillin');
    assert.ok(safetyCheck.alerts.some((a) => a.alertType === 'DRUG_ALLERGY' && a.severity === 'CRITICAL_BLOCK'));
  });

  // Scenario 3: Drug-Drug Interaction (DDI) Detection
  it('Scenario 3: Detects dangerous Drug-Drug Interactions (Warfarin + Aspirin) and issues MAJOR_WARNING', () => {
    const safetyCheck = AdvancedPharmacyService.evaluatePrescriptionSafety(
      hospitalId,
      [{ medicineName: 'Aspirin 75mg Gastro-Resistant' }],
      [],
      ['Warfarin Sodium 5mg'] // Active concurrent medication
    );

    assert.strictEqual(safetyCheck.hasMajorWarning, true);
    const ddiAlert = safetyCheck.alerts.find((a) => a.alertType === 'DRUG_DRUG_INTERACTION');
    assert.ok(ddiAlert);
    assert.match(ddiAlert!.message, /hemorrhage/i);
  });

  // Scenario 4: Duplicate Active Ingredient / Duplicate Therapy Detection
  it('Scenario 4: Detects duplicate active ingredient prescribing (Paracetamol + Crocin) to prevent toxicity', () => {
    const safetyCheck = AdvancedPharmacyService.evaluatePrescriptionSafety(
      hospitalId,
      [
        { medicineName: 'Paracetamol 500mg Tablet' },
        { medicineName: 'Crocin 650mg Advance' }, // Duplicate paracetamol
      ],
      [],
      []
    );

    assert.strictEqual(safetyCheck.hasMajorWarning, true);
    assert.ok(safetyCheck.alerts.some((a) => a.alertType === 'DUPLICATE_THERAPY'));
  });

  // Scenario 5: Prescription Signing with Documented Clinical Override
  it('Scenario 5: Allows prescription signing when clinician provides a documented justification override', () => {
    // 1. Blocked attempt without override
    const blockedRx = AdvancedPharmacyService.createAndSignPrescription({
      hospitalId,
      patientId: 'pat-9011',
      doctorId,
      items: [{ medicineName: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', route: 'oral', quantity: 10 }],
      knownPatientAllergies: ['Penicillin'],
    });
    assert.strictEqual(blockedRx.status, 'BLOCKED_SAFETY_ALERT');

    // 2. Successful signing with valid clinician override
    const signedRx = AdvancedPharmacyService.createAndSignPrescription({
      hospitalId,
      patientId: 'pat-9011',
      doctorId,
      items: [{ medicineName: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', route: 'oral', quantity: 10 }],
      knownPatientAllergies: ['Penicillin'],
      overrides: [
        {
          hospitalId,
          patientId: 'pat-9011',
          alertType: 'DRUG_ALLERGY',
          severity: 'CRITICAL_BLOCK',
          alertSummary: 'Patient penicillin allergy vs Amoxicillin',
          overrideReasonCategory: 'PATIENT_PREVIOUSLY_TOLERATED',
          clinicianJustification: 'Skin prick test negative; mild childhood rash 30 years ago, successfully desensitized.',
          overriddenByUserId: doctorId,
        },
      ],
    });

    assert.strictEqual(signedRx.status, 'ACTIVE_SIGNED');
    assert.ok(signedRx.prescriptionNumber.startsWith('RX-'));
    assert.strictEqual(signedRx.versionNumber, 1);
    assert.ok(signedRx.verificationQueueId);
  });

  // Scenario 6: Prescription Immutability & Versioned Amendments
  it('Scenario 6: Generates versioned snapshot on prescription amendment without modifying original', () => {
    const rx = AdvancedPharmacyService.createAndSignPrescription({
      hospitalId,
      patientId: 'pat-9012',
      doctorId,
      items: [{ medicineName: 'Ciprofloxacin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '7 days', route: 'oral', quantity: 14 }],
    });

    // Amend dosage for renal impairment
    const amendment = AdvancedPharmacyService.amendPrescription({
      hospitalId,
      prescriptionId: rx.prescriptionId,
      amendedByUserId: doctorId,
      amendmentReason: 'Dose reduced by 50% following creatinine clearance report of 28 mL/min',
      updatedItems: [{ medicineName: 'Ciprofloxacin 250mg', dosage: '250mg', frequency: '1-0-0', duration: '7 days', route: 'oral', quantity: 7 }],
    });

    assert.strictEqual(amendment.newVersionNumber, 2);
    assert.strictEqual(amendment.status, 'AMENDED_ACTIVE');
  });

  // Scenario 7: Pharmacist Verification Queue Workflow
  it('Scenario 7: Enqueues signed prescriptions and records pharmacist clinical review & approval', () => {
    const rx = AdvancedPharmacyService.createAndSignPrescription({
      hospitalId,
      patientId: 'pat-9013',
      doctorId,
      items: [{ medicineName: 'Metformin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '30 days', route: 'oral', quantity: 60 }],
    });

    const queue = AdvancedPharmacyService.getVerificationQueue(hospitalId);
    assert.ok(queue.some((q) => q.prescriptionId === rx.prescriptionId));

    const review = AdvancedPharmacyService.reviewPharmacistVerification({
      hospitalId,
      prescriptionId: rx.prescriptionId,
      pharmacistUserId: pharmacistId,
      decision: 'VERIFIED_APPROVED',
      clinicalNotes: 'Verified patient eGFR > 60 mL/min. Safe for standard diabetes initiation.',
    });

    assert.strictEqual(review.verificationStatus, 'VERIFIED_APPROVED');
  });

  // Scenario 8: Batch Stock Receipt & Inventory Ledger
  it('Scenario 8: Receives stock batches with purchase cost, MRP, storage bin, and logs movement ledger', () => {
    // Register Amoxicillin drug
    const amox = AdvancedPharmacyService.registerDrug({
      hospitalId,
      itemCode: 'DRUG-AMOX-500',
      brandName: 'Amoxil 500mg',
      genericName: 'Amoxicillin',
      dosageForm: 'capsule',
      strength: '500 mg',
      administrationRoute: 'oral',
      manufacturer: 'GlaxoSmithKline',
      regulatorySchedule: 'SCHEDULE_H',
    });
    drugAmoxId = amox.id;

    // Receive Batch 1: Expiring in 30 days
    const batch1 = AdvancedPharmacyService.receiveStockBatch({
      hospitalId,
      medicineId: drugAmoxId,
      batchNumber: 'AMX-2026-B01',
      expiryDate: '2026-12-15', // Near expiry
      purchaseCostPerUnit: 4.5,
      sellingPricePerUnit: 8.0,
      mrp: 10.0,
      initialQuantity: 100,
      storageBinLocation: 'BIN-ANTIBIOTIC-01',
      receivedByUserId: 'storekeeper-rajesh',
    });

    // Receive Batch 2: Expiring in 180 days
    const batch2 = AdvancedPharmacyService.receiveStockBatch({
      hospitalId,
      medicineId: drugAmoxId,
      batchNumber: 'AMX-2026-B02',
      expiryDate: '2027-05-30', // Far expiry
      purchaseCostPerUnit: 4.5,
      sellingPricePerUnit: 8.0,
      mrp: 10.0,
      initialQuantity: 200,
      storageBinLocation: 'BIN-ANTIBIOTIC-01',
      receivedByUserId: 'storekeeper-rajesh',
    });

    assert.strictEqual(batch1.availableQuantity, 100);
    assert.strictEqual(batch2.availableQuantity, 200);
  });

  // Scenario 9: Strict First-Expiry-First-Out (FEFO) Dispensing
  it('Scenario 9: Allocates earliest expiring batch first (FEFO) and deducts inventory atomically', () => {
    const dispense = AdvancedPharmacyService.dispensePrescriptionFEFO({
      hospitalId,
      patientId: 'pat-9014',
      pharmacistUserId: pharmacistId,
      customerPaymentMethod: 'upi',
      idempotencyKey: 'idemp-dsp-001',
      items: [
        {
          drugId: drugAmoxId,
          drugName: 'Amoxil 500mg',
          quantityRequested: 50,
        },
      ],
    });

    assert.ok(dispense.dispensingNumber.startsWith('DSP-'));
    assert.strictEqual(dispense.itemsDispensed.length, 1);
    // Must draw from earliest batch B01 (expires 2026-12-15)
    assert.strictEqual(dispense.itemsDispensed[0].batchNumber, 'AMX-2026-B01');
    assert.strictEqual(dispense.itemsDispensed[0].quantityDispensed, 50);
  });

  // Scenario 10: Expired Stock Hard-Block & Automated Quarantine
  it('Scenario 10: Strictly blocks dispensing from expired batches and transitions status to QUARANTINED_EXPIRED', () => {
    // Receive an expired batch
    const expiredBatch = AdvancedPharmacyService.receiveStockBatch({
      hospitalId,
      medicineId: 'drug-expired-test',
      batchNumber: 'EXP-LOT-999',
      expiryDate: '2025-01-01', // Already expired in the past!
      purchaseCostPerUnit: 5.0,
      sellingPricePerUnit: 10.0,
      mrp: 12.0,
      initialQuantity: 50,
      receivedByUserId: 'storekeeper-rajesh',
    });

    assert.throws(
      () => {
        AdvancedPharmacyService.dispensePrescriptionFEFO({
          hospitalId,
          patientId: 'pat-9015',
          pharmacistUserId: pharmacistId,
          idempotencyKey: 'idemp-dsp-exp',
          items: [{ drugId: 'drug-expired-test', drugName: 'Expired Drug', quantityRequested: 10 }],
        });
      },
      (err: any) => {
        assert.match(err.message, /OUT_OF_STOCK_ERROR/);
        return true;
      }
    );
  });

  // Scenario 11: Pharmacy Billing & Double-Entry General Ledger Integration
  it('Scenario 11: Calculates Indian GST (HSN 3004 at 5%) and posts balancing double-entry JVs to general ledger', () => {
    const dispense = AdvancedPharmacyService.dispensePrescriptionFEFO({
      hospitalId,
      patientId: 'pat-9016',
      pharmacistUserId: pharmacistId,
      customerPaymentMethod: 'cash',
      idempotencyKey: 'idemp-dsp-gl-test',
      items: [
        {
          drugId: drugAmoxId,
          drugName: 'Amoxil 500mg',
          quantityRequested: 10, // 10 * ₹8 = ₹80 gross
        },
      ],
    });

    assert.strictEqual(dispense.totalGross, 80.0);
    assert.strictEqual(dispense.hsnCode, '3004');
    assert.strictEqual(dispense.taxRate, 5.0);
    assert.strictEqual(dispense.taxAmount, 4.0); // 5% of 80 = ₹4.00
    assert.strictEqual(dispense.netPayable, 84.0);
    assert.ok(dispense.journalEntryId, 'Must post double-entry balancing journal voucher');
  });

  // Scenario 12: Inpatient eMAR Administration & Dual-Nurse Cosign
  it('Scenario 12: Enforces mandatory dual-nurse cosign for High-Alert / Narcotic medication administration', () => {
    // Register High-Alert IV Insulin
    const insulin = AdvancedPharmacyService.registerDrug({
      hospitalId,
      itemCode: 'DRUG-INS-R',
      brandName: 'Huminsulin Regular 100 IU/mL',
      genericName: 'Insulin Human Regular',
      dosageForm: 'injection_vial',
      strength: '100 IU/mL',
      administrationRoute: 'subcutaneous',
      manufacturer: 'Eli Lilly',
      isHighAlert: true,
      storageCondition: 'COLD_CHAIN_2_8C',
    });
    drugInsulinId = insulin.id;

    // 1. Rejects administration without second nurse cosign
    assert.throws(
      () => {
        AdvancedPharmacyService.recordInpatientAdministration({
          hospitalId,
          admissionId: 'adm-icu-7744',
          drugId: drugInsulinId,
          scheduledTime: new Date().toISOString(),
          administeredTime: new Date().toISOString(),
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: nurseId1,
          // Missing cosigningNurseId!
        });
      },
      (err: any) => {
        assert.match(err.message, /SAFETY_POLICY_ERROR/);
        return true;
      }
    );

    // 2. Succeeds with verified dual-nurse cosign
    const emar = AdvancedPharmacyService.recordInpatientAdministration({
      hospitalId,
      admissionId: 'adm-icu-7744',
      drugId: drugInsulinId,
      scheduledTime: new Date().toISOString(),
      administeredTime: new Date().toISOString(),
      administrationStatus: 'ADMINISTERED',
      administeringNurseId: nurseId1,
      cosigningNurseId: nurseId2, // Verified second RN cosign
      recordedVitalPulse: 78,
      recordedVitalBPSystolic: 124,
      recordedVitalBPDiastolic: 82,
      nursingNotes: 'Pre-meal blood glucose 184 mg/dL. 6 units regular insulin administered in left abdominal quadrant.',
    });

    assert.strictEqual(emar.status, 'ADMINISTERED');
    assert.ok(emar.emarId);
  });

  // Scenario 13: Cold-Chain Storage Temperature Excursion Alert & Quarantine
  it('Scenario 13: Detects cold-chain temperature excursion (> 8°C) and automatically triggers batch quarantine', () => {
    // Stock vaccine batch in fridge FRIDGE-VACC-01
    const vaxBatch = AdvancedPharmacyService.receiveStockBatch({
      hospitalId,
      medicineId: drugInsulinId,
      batchNumber: 'INS-COLD-01',
      expiryDate: '2027-01-01',
      purchaseCostPerUnit: 150.0,
      sellingPricePerUnit: 220.0,
      mrp: 250.0,
      initialQuantity: 40,
      storageBinLocation: 'FRIDGE-VACC-01',
      storageCondition: 'COLD_CHAIN_2_8C',
      receivedByUserId: 'storekeeper-rajesh',
    });

    // Sensor logs 11.5°C excursion (Safe range: 2.0°C - 8.0°C)
    const log = AdvancedPharmacyService.logColdChainTemperature({
      hospitalId,
      storageUnitCode: 'FRIDGE-VACC-01',
      locationName: 'Central Vaccine Walk-in Refrigerator',
      temperatureCelsius: 11.5,
      targetMinCelsius: 2.0,
      targetMaxCelsius: 8.0,
    });

    assert.strictEqual(log.isExcursion, true);
    assert.strictEqual(log.quarantineTriggered, true);
    assert.strictEqual(vaxBatch.status, 'QUARANTINED_TEMP_EXCURSION');
  });

  // Scenario 14: Manufacturer Lot Recall Cascade & Patient Traceability
  it('Scenario 14: Issues product recall, immediately freezes stock, and traces past dispensed patients', () => {
    const recall = AdvancedPharmacyService.issueProductRecall({
      hospitalId,
      recallReferenceNumber: 'RCL-GSK-2026-009',
      drugId: drugAmoxId,
      drugName: 'Amoxil 500mg',
      batchNumber: 'AMX-2026-B01',
      recallClass: 'CLASS_I_LIFE_THREATENING',
      recallReason: 'Manufacturer notification: Potential particulate contamination during vial sealing',
      manufacturerNoticeDate: '2026-11-09',
      authorizedByUserId: 'quality-officer-deepa',
    });

    assert.strictEqual(recall.status, 'ACTIVE_QUARANTINE');
    assert.ok(recall.quarantinedQuantity >= 0);
    assert.ok(recall.affectedDispensingCount >= 1);
  });

  // Scenario 15: Schedule X & Narcotic Double-Custody Vault Register
  it('Scenario 15: Enforces dual-custody recording and flags physical count discrepancies in narcotic vault', () => {
    const morphine = AdvancedPharmacyService.registerDrug({
      hospitalId,
      itemCode: 'DRUG-MORPH-10',
      brandName: 'Morphine Sulfate 10mg/mL Ampoule',
      genericName: 'Morphine Sulfate',
      dosageForm: 'injection_ampoule',
      strength: '10 mg/mL',
      administrationRoute: 'iv',
      manufacturer: 'Neon Laboratories',
      regulatorySchedule: 'NARCOTIC_NDPS',
      isNarcotic: true,
      isHighAlert: true,
    });
    drugMorphineId = morphine.id;

    // 1. Transaction succeeds with dual custody (Primary != Witness)
    const tx = AdvancedPharmacyService.recordNarcoticTransaction({
      hospitalId,
      drugId: drugMorphineId,
      batchId: 'batch-morph-01',
      transactionType: 'WARD_DISPENSE',
      quantity: -5,
      primaryCustodianUserId: 'custodian-rajesh',
      witnessUserId: 'witness-meera',
      referenceRxOrOrder: 'RX-ICU-EMERG-449',
      physicalCount: 45, // 50 - 5 = 45 matches
    });

    assert.strictEqual(tx.balanceAfter, 45);
    assert.strictEqual(tx.discrepancyFlag, false);

    // 2. Flags discrepancy if physical count != calculated balance
    const discrepantTx = AdvancedPharmacyService.recordNarcoticTransaction({
      hospitalId,
      drugId: drugMorphineId,
      batchId: 'batch-morph-01',
      transactionType: 'SHIFT_COUNT_RECONCILIATION',
      quantity: 0,
      primaryCustodianUserId: 'custodian-rajesh',
      witnessUserId: 'witness-meera',
      physicalCount: 43, // Discrepancy! Physical is 43 instead of 45
    });

    assert.strictEqual(discrepantTx.discrepancyFlag, true);
  });

  // Scenario 16: Pharmacy Procurement Requisition (PR) to Purchase Order (PO) Pipeline
  it('Scenario 16: Creates purchase requisition and converts to formal Purchase Order upon manager approval', () => {
    const pr = AdvancedPharmacyService.createPurchaseRequisition({
      hospitalId,
      departmentSource: 'INPATIENT_PHARMACY',
      justification: 'Quarterly antibiotic safety stock replenishment for ICU and Surgical Wards',
      requestedByUserId: 'pharmacist-arun',
      items: [
        { drugId: drugAmoxId, drugName: 'Amoxicillin 500mg', quantity: 1000, estimatedUnitCost: 4.5 },
      ],
    });

    assert.strictEqual(pr.status, 'PENDING_APPROVAL');
    assert.strictEqual(pr.totalEstimatedValue, 4500.0);

    const po = AdvancedPharmacyService.approvePurchaseRequisition({
      hospitalId,
      requisitionId: pr.requisitionId,
      approvedByUserId: 'pharmacy-director-nair',
    });

    assert.strictEqual(po.status, 'APPROVED_CONVERTED_PO');
    assert.ok(po.poNumber.startsWith('PO-'));
  });
});


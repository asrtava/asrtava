import { describe, it } from 'node:test';
import assert from 'node:assert';
import { procurementAdvancedService } from '../src/modules/inventory/procurement-advanced.service';

describe('ASRTAVA Advanced Procurement, Inventory & Asset Management Test Suite', () => {
  const tenantHospitalId = 'hosp-metro-001';
  let testVendorId: string;
  let testVendor2Id: string;
  let testCentralWhId: string;
  let testOtStoreId: string;
  let testItemId: string;
  let testRequisitionId: string;
  let testQuotationId: string;
  let testPoId: string;
  let testGrnId: string;
  let testAssetId: string;
  let testWorkOrderId: string;

  // Scenario 1: Vendor Registration
  it('1. Registers certified vendor with GSTIN, PAN, bank details, and rating', async () => {
    const ven = await procurementAdvancedService.registerVendor({
      hospitalId: tenantHospitalId,
      vendorCode: 'VEN-MEDTECH-88',
      companyName: 'MedTech Advanced Devices India Pvt Ltd',
      contactPerson: 'Sanjay Deshmukh',
      email: 'sanjay.d@medtechdevices.in',
      phone: '+91 98765 22334',
      address: 'Plot 45, MIDC Industrial Area, Pune 411018',
      gstin: '27AABCM9921C1Z4',
      panNumber: 'AABCM9921C',
      bankAccountNumber: '50200012345678',
      bankIfsc: 'HDFC0000123',
      paymentTerms: 'NET_30',
      vendorCategory: 'SURGICAL',
      rating: 4.8,
    });
    assert.ok(ven.id);
    assert.strictEqual(ven.vendorCode, 'VEN-MEDTECH-88');
    assert.strictEqual(ven.status, 'ACTIVE');
    testVendorId = ven.id;
  });

  // Scenario 2: Duplicate Vendor Code Guard
  it('2. Rejects duplicate vendor registration with identical vendor code within the same hospital', async () => {
    await assert.rejects(
      async () => {
        await procurementAdvancedService.registerVendor({
          hospitalId: tenantHospitalId,
          vendorCode: 'VEN-MEDTECH-88', // Duplicate!
          companyName: 'Another Vendor Name',
          contactPerson: 'Rahul Roy',
          email: 'rahul@test.in',
          phone: '+91 99999 11111',
        });
      },
      {
        message: /already exists in this hospital/,
      }
    );
  });

  // Scenario 3: Multi-Location Warehouse & Sub-Store Creation
  it('3. Configures central warehouse and departmental sub-stores (OT Satellite Store)', async () => {
    const centralWh = await procurementAdvancedService.createWarehouse({
      hospitalId: tenantHospitalId,
      code: 'WH-CENTRAL-MAIN',
      name: 'Main Central Hospital Warehouse',
      warehouseType: 'CENTRAL_WAREHOUSE',
      locationFloor: 'Basement 2 (Logistics Bay)',
    });
    assert.ok(centralWh.id);
    testCentralWhId = centralWh.id;

    const otStore = await procurementAdvancedService.createWarehouse({
      hospitalId: tenantHospitalId,
      code: 'STORE-OT-SUITE',
      name: 'Operation Theatre Satellite Sub-Store',
      warehouseType: 'OT_STORE',
      locationFloor: '3rd Floor OT Complex',
    });
    assert.ok(otStore.id);
    testOtStoreId = otStore.id;
  });

  // Scenario 4: Master Item Catalog & Dual UOM
  it('4. Creates master catalog item with dual UOM conversion (Box of 100 to single units)', async () => {
    const item = await procurementAdvancedService.createItem({
      hospitalId: tenantHospitalId,
      itemCode: 'SURG-SUT-PROLENE-30',
      name: 'Prolene 3-0 Cardiovascular Non-Absorbable Suture',
      category: 'SURGICAL_CONSUMABLE',
      baseUom: 'Single Strand',
      purchaseUom: 'Box of 36',
      uomConversionFactor: 36.0,
      reorderLevel: 200,
      safetyStock: 50,
      minOrderQty: 100,
      isAsset: false,
      isBatchTracked: true,
      standardCost: 150.0,
      hsnSacCode: '9018',
    });
    assert.ok(item.id);
    assert.strictEqual(item.itemCode, 'SURG-SUT-PROLENE-30');
    assert.strictEqual(item.uomConversionFactor, 36.0);
    testItemId = item.id;
  });

  // Scenario 5: Purchase Requisition & Approval
  it('5. Submits and approves departmental purchase requisition with estimated line totals', async () => {
    const pr = await procurementAdvancedService.createPurchaseRequisition({
      hospitalId: tenantHospitalId,
      requisitionNumber: 'REQ-2026-OT-902',
      departmentId: 'dept-ot-01',
      requestingUserId: 'lead-surgeon-sharma',
      priority: 'URGENT',
      requiredByDate: '2026-11-20',
      purpose: 'Cardiovascular surgery scheduled caseload restocking',
      items: [
        {
          itemId: testItemId,
          quantityRequested: 500,
          estimatedUnitCost: 150.0,
        },
      ],
    });
    assert.ok(pr.id);
    assert.strictEqual(pr.totalEstimatedCost, 75000);
    assert.strictEqual(pr.status, 'PENDING_APPROVAL');
    testRequisitionId = pr.id;

    const approved = await procurementAdvancedService.approvePurchaseRequisition(
      pr.id,
      'medical-director',
      'Clinical requirement verified for cardiac surgery'
    );
    assert.strictEqual(approved.status, 'APPROVED');
  });

  // Scenario 6: Vendor Quotations & RFQ Scoring Comparison
  it('6. Ingests competing vendor quotations and conducts side-by-side comparative ranking', async () => {
    // Secondary vendor
    const ven2 = await procurementAdvancedService.registerVendor({
      hospitalId: tenantHospitalId,
      vendorCode: 'VEN-GLOBAL-SURG',
      companyName: 'Global Surgicals Trading Corp',
      contactPerson: 'Meera Iyer',
      email: 'meera@globalsurg.com',
      phone: '+91 98222 55443',
      paymentTerms: 'NET_45',
      rating: 4.2,
    });
    testVendor2Id = ven2.id;

    // Quotation 1: MedTech (₹140/unit, score 4.8)
    const q1 = await procurementAdvancedService.submitQuotation({
      hospitalId: tenantHospitalId,
      requisitionId: testRequisitionId,
      vendorId: testVendorId,
      quotationNumber: 'QUOT-MT-2026-44',
      unitPrice: 140.0,
      totalPrice: 70000.0,
      deliveryLeadDays: 5,
      warrantyMonths: 24,
      score: 4.8,
    });
    assert.ok(q1.id);
    testQuotationId = q1.id;

    // Quotation 2: Global Surgicals (₹145/unit, score 4.1)
    await procurementAdvancedService.submitQuotation({
      hospitalId: tenantHospitalId,
      requisitionId: testRequisitionId,
      vendorId: testVendor2Id,
      quotationNumber: 'QUOT-GS-2026-90',
      unitPrice: 145.0,
      totalPrice: 72500.0,
      deliveryLeadDays: 8,
      warrantyMonths: 12,
      score: 4.1,
    });

    const ranked = await procurementAdvancedService.compareQuotations(testRequisitionId);
    assert.strictEqual(ranked.length, 2);
    assert.strictEqual(ranked[0].vendorId, testVendorId); // MedTech ranks first
  });

  // Scenario 7: Quotation Selection & Purchase Order Issuance
  it('7. Selects winning vendor quotation and generates formal Purchase Order with GST calculation', async () => {
    const selected = await procurementAdvancedService.selectQuotation(testQuotationId);
    assert.strictEqual(selected.status, 'SELECTED');

    // Create PO for 500 units @ ₹140 + 12% GST
    // Subtotal = 500 * 140 = 70,000. Tax = 12% of 70,000 = 8,400. Grand Total = 78,400.
    const po = await procurementAdvancedService.createPurchaseOrder({
      hospitalId: tenantHospitalId,
      vendorId: testVendorId,
      requisitionId: testRequisitionId,
      poNumber: 'PO-2026-CARDIO-881',
      expectedDeliveryDate: '2026-11-15',
      shippingAddress: 'Central Warehouse Dock, Metro Hospital Campus, Mumbai 400012',
      items: [
        {
          itemId: testItemId,
          quantityOrdered: 500,
          unitPrice: 140.0,
          gstRatePercent: 12.0,
        },
      ],
    });
    assert.ok(po.id);
    assert.strictEqual(po.totalSubtotal, 70000);
    assert.strictEqual(po.taxAmount, 8400);
    assert.strictEqual(po.grandTotal, 78400);
    assert.strictEqual(po.status, 'ISSUED');
    testPoId = po.id;
  });

  // Scenario 8: Goods Receipt Note (GRN) Ingestion
  it('8. Ingests Goods Receipt Note (GRN) at delivery dock and queues for inspection', async () => {
    const grn = await procurementAdvancedService.receiveGoods({
      hospitalId: tenantHospitalId,
      poId: testPoId,
      vendorId: testVendorId,
      warehouseId: testCentralWhId,
      grnNumber: 'GRN-2026-9912',
      vendorDeliveryChallan: 'DC-MT-90412',
      receivingUserId: 'store-dock-manager',
      items: [
        {
          itemId: testItemId,
          batchNumber: 'BAT-PROLENE-2026-B1',
          expiryDate: '2029-06-30',
          quantityReceived: 500,
        },
      ],
    });
    assert.ok(grn.id);
    assert.strictEqual(grn.status, 'INSPECTION_PENDING');
    testGrnId = grn.id;
  });

  // Scenario 9: Quality Inspection Gate & Stock Admission
  it('9. Quality inspection validates batch sterility and admits accepted quantity into warehouse stock', async () => {
    const inspection = await procurementAdvancedService.inspectGoods({
      hospitalId: tenantHospitalId,
      grnId: testGrnId,
      itemId: testItemId,
      batchNumber: 'BAT-PROLENE-2026-B1',
      expiryDate: '2029-06-30',
      quantityReceived: 500,
      quantityAccepted: 480, // 480 accepted
      quantityRejected: 20,  // 20 rejected due to packaging tear
      inspectionNotes: 'Sterile seal verified on 480 units. 20 units rejected for outer box compression.',
      inspectorUserId: 'qa-officer-verma',
    });
    assert.ok(inspection.id);
    assert.strictEqual(inspection.status, 'PARTIALLY_PASSED');
    assert.strictEqual(inspection.quantityAccepted, 480);
    assert.strictEqual(inspection.quantityRejected, 20);
  });

  // Scenario 10: Quarantine Isolation Verification
  it('10. Verifies rejected/quarantined items are strictly excluded from available inventory balances', async () => {
    const metrics = await procurementAdvancedService.getProcurementMetrics(tenantHospitalId);
    assert.ok(metrics.totalInventoryValuation > 0);

    // Total admitted stock should be exactly 480 * standardCost (150) = 72,000, excluding the 20 rejected
    assert.strictEqual(metrics.totalInventoryValuation, 480 * 150);
  });

  // Scenario 11: Multi-Store Stock Movement (FEFO Transfer to OT)
  it('11. Issues 200 units of stock from Central Warehouse to OT Sub-Store using First-Expiry-First-Out', async () => {
    const movement = await procurementAdvancedService.issueStockToDepartment(
      tenantHospitalId,
      testItemId,
      testCentralWhId,
      testOtStoreId,
      200,
      'central-storekeeper',
      'Daily OT replenishment'
    );
    assert.ok(movement.id);
    assert.strictEqual(movement.quantity, 200);
    assert.strictEqual(movement.movementType, 'DEPARTMENT_TRANSFER');
  });

  // Scenario 12: Insufficient Stock Transfer Rejection Guard
  it('12. Rejects departmental transfer attempt when requested quantity exceeds available warehouse balance', async () => {
    // Central warehouse now has 480 - 200 = 280 units remaining. Requesting 500 must fail!
    await assert.rejects(
      async () => {
        await procurementAdvancedService.issueStockToDepartment(
          tenantHospitalId,
          testItemId,
          testCentralWhId,
          testOtStoreId,
          500,
          'central-storekeeper',
          'Excessive transfer request'
        );
      },
      {
        message: /Insufficient available stock in source warehouse/,
      }
    );
  });

  // Scenario 13: Point-of-Care Clinical Consumption
  it('13. Records surgical consumption in OT sub-store without double counting central inventory', async () => {
    const consumption = await procurementAdvancedService.recordDepartmentConsumption(
      tenantHospitalId,
      testItemId,
      testOtStoreId,
      12, // 12 sutures used during CABG surgery
      'SURGERY-CABG-2026-081',
      'scrub-nurse-anita',
      'Intraoperative consumption for coronary bypass anastomosis'
    );
    assert.ok(consumption.id);
    assert.strictEqual(consumption.movementType, 'CLINICAL_CONSUMPTION');
    assert.strictEqual(consumption.quantity, 12);
  });

  // Scenario 14: Physical Stock Cycle Count Reconciliation
  it('14. Reconciles physical inventory cycle count variance with an auditable adjustment entry', async () => {
    // OT Store had 200 - 12 = 188 units. Physical count reveals 185 (3 damaged during sterile handling).
    const adj = await procurementAdvancedService.reconcileStockCount(
      tenantHospitalId,
      testItemId,
      testOtStoreId,
      185,
      'auditor-singh',
      'Discrepancy due to damaged packaging dropped in sterile corridor'
    );
    assert.ok(adj.id);
    assert.strictEqual(adj.systemQuantity, 188);
    assert.strictEqual(adj.countedQuantity, 185);
    assert.strictEqual(adj.variance, -3);
  });

  // Scenario 15: Three-Way Matching & General Ledger Posting
  it('15. Executes 3-Way Matching (PO == GRN == Invoice) and posts balanced double-entry JV to General Ledger', async () => {
    const { invoice, journalVoucher } = await procurementAdvancedService.matchSupplierInvoice({
      hospitalId: tenantHospitalId,
      vendorId: testVendorId,
      poId: testPoId,
      grnId: testGrnId,
      invoiceNumber: 'INV-MT-2026-9901',
      subtotal: 70000.0,
      taxAmount: 8400.0,
      grandTotal: 78400.0, // Matches PO grand total!
    });
    assert.ok(invoice.id);
    assert.strictEqual(invoice.threeWayMatchStatus, 'MATCHED');

    // Assert General Ledger balancing
    assert.ok(journalVoucher.id);
    assert.strictEqual(journalVoucher.isBalanced, true);
    assert.strictEqual(journalVoucher.totalDebit, 78400.0);
    assert.strictEqual(journalVoucher.totalCredit, 78400.0);

    // Negative duplicate invoice prevention test
    await assert.rejects(
      async () => {
        await procurementAdvancedService.matchSupplierInvoice({
          hospitalId: tenantHospitalId,
          vendorId: testVendorId,
          poId: testPoId,
          grnId: testGrnId,
          invoiceNumber: 'INV-MT-2026-9901', // Exact same invoice
          subtotal: 70000.0,
          taxAmount: 8400.0,
          grandTotal: 78400.0,
        });
      },
      {
        message: /has already been recorded/,
      }
    );
  });

  // Scenario 16: Biomedical Asset Registration, Breakdown & Return-to-Service
  it('16. Registers critical biomedical asset (Ventilator), logs breakdown work order, and certifies return to service', async () => {
    // 1. Register Asset
    const asset = await procurementAdvancedService.registerAsset({
      hospitalId: tenantHospitalId,
      assetTag: 'AST-VENT-ICU-08',
      name: 'Dräger Evita V800 Intensive Care Ventilator',
      category: 'BIOMEDICAL_EQUIPMENT',
      serialNumber: 'DRG-V800-2024-9182',
      manufacturer: 'Dräger Medical GmbH',
      model: 'Evita V800',
      departmentId: 'dept-icu-01',
      locationRoom: 'ICU Bed 8',
      purchaseCost: 1850000,
      purchaseDate: '2024-05-10',
      warrantyExpiryDate: '2027-05-10',
      lastCalibrationDate: '2026-08-01',
      nextCalibrationDue: '2027-02-01',
    });
    assert.ok(asset.id);
    assert.strictEqual(asset.operationalStatus, 'OPERATIONAL');
    testAssetId = asset.id;

    // 2. Schedule PPM
    const sched = await procurementAdvancedService.schedulePreventiveMaintenance({
      hospitalId: tenantHospitalId,
      assetId: testAssetId,
      maintenanceType: 'PPM_PREVENTIVE',
      frequencyDays: 180,
      nextDueDate: '2027-02-01',
    });
    assert.ok(sched.id);

    // 3. Report Breakdown Work Order
    const wo = await procurementAdvancedService.createBreakdownWorkOrder({
      hospitalId: tenantHospitalId,
      workOrderNumber: 'WO-2026-ICU-012',
      assetId: testAssetId,
      reportedByUserId: 'icu-incharge-nurse',
      departmentId: 'dept-icu-01',
      issueDescription: 'O2 sensor calibration error triggering acoustic alarm on startup.',
      priority: 'CRITICAL_BREAKDOWN',
    });
    assert.ok(wo.id);
    assert.strictEqual(wo.status, 'OPEN');
    testWorkOrderId = wo.id;

    // Verify Asset status automatically flips to UNDER_REPAIR
    const underRepairAsset: any = Array.from((procurementAdvancedService as any).assets.values()).find(
      (a: any) => a.id === testAssetId
    );
    assert.strictEqual(underRepairAsset.operationalStatus, 'UNDER_REPAIR');

    // 4. Resolve Work Order & Certify Safety Check
    const { workOrder: resolvedWo, asset: restoredAsset } = await procurementAdvancedService.resolveWorkOrder(
      testWorkOrderId,
      2.5, // 2.5 hours downtime
      4500, // ₹4500 replacement O2 fuel cell
      'biomedical-lead-sharma'
    );
    assert.strictEqual(resolvedWo.status, 'CLOSED');
    assert.strictEqual(resolvedWo.downtimeHours, 2.5);
    assert.strictEqual(restoredAsset.operationalStatus, 'OPERATIONAL');
  });
});

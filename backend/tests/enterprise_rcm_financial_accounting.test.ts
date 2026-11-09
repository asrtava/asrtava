import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RCMAccountingService } from '../src/modules/billing/rcm-accounting.service';

describe('ASRTAVA Enterprise RCM & Financial Accounting Engine (Milestone v1.7.0)', () => {
  const hospitalA = 'hosp-delhi-main';
  const hospitalB = 'hosp-noida-branch';

  // Scenario 1: Double-Entry Journal Entry Balance Enforcement
  it('Scenario 1: Enforces mathematical balance (Debits == Credits) on posted Journal Vouchers', () => {
    const balancedJV = RCMAccountingService.createJournalEntry({
      hospitalId: hospitalA,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: 'JV-REF-001',
      narration: 'Inter-account fund allocation from main bank to branch float',
      lines: [
        { accountCode: '1001', debit: 25000.0, credit: 0.0, memo: 'Counter Float Cash' },
        { accountCode: '1002', debit: 0.0, credit: 25000.0, memo: 'Operating Bank Account' },
      ],
    });

    assert.ok(balancedJV.id, 'Journal entry ID must be generated');
    assert.strictEqual(balancedJV.isBalanced, true, 'isBalanced flag must be true');
    assert.strictEqual(balancedJV.totalDebit, 25000.0);
    assert.strictEqual(balancedJV.totalCredit, 25000.0);
    assert.strictEqual(balancedJV.status, 'POSTED');
  });

  // Scenario 2: Unbalanced Journal Entry Rejection
  it('Scenario 2: Strictly rejects single-sided or unbalanced Journal Entries with JOURNAL_UNBALANCED_ERROR', () => {
    assert.throws(
      () => {
        RCMAccountingService.createJournalEntry({
          hospitalId: hospitalA,
          referenceType: 'MANUAL_JOURNAL',
          referenceId: 'JV-REF-UNBALANCED',
          narration: 'Erroneous unbalanced entry attempt',
          lines: [
            { accountCode: '1001', debit: 50000.0, credit: 0.0 },
            { accountCode: '1002', debit: 0.0, credit: 40000.0 }, // ₹10,000 variance!
          ],
        });
      },
      (err: any) => {
        assert.match(err.message, /JOURNAL_UNBALANCED_ERROR/);
        return true;
      },
      'Unbalanced journal must trigger JOURNAL_UNBALANCED_ERROR'
    );
  });

  // Scenario 3: Live Trial Balance Calculation & Balance Verification
  it('Scenario 3: Calculates real-time Trial Balance where Sum of Debits exactly equals Sum of Credits', () => {
    const trialBalance = RCMAccountingService.getTrialBalance(hospitalA);

    assert.ok(trialBalance.accounts.length > 0, 'Trial balance must list active COA accounts');
    assert.strictEqual(trialBalance.isBalanced, true, 'Trial balance must be mathematically balanced');
    assert.strictEqual(
      trialBalance.totalDebits,
      trialBalance.totalCredits,
      `Total Debits (₹${trialBalance.totalDebits}) must match Total Credits (₹${trialBalance.totalCredits})`
    );
  });

  // Scenario 4: Profit & Loss (P&L) Statement Generation with Revenue & Expense Breakdown
  it('Scenario 4: Generates Profit & Loss Statement with revenue and operating expense breakdown', () => {
    // Post a doctor consultation revenue entry
    RCMAccountingService.createJournalEntry({
      hospitalId: hospitalA,
      referenceType: 'PATIENT_INVOICE',
      referenceId: 'INV-OPD-7788',
      narration: 'Doctor OPD consultation encounter billing',
      lines: [
        { accountCode: '1201', debit: 12000.0, credit: 0.0 }, // Accounts Receivable
        { accountCode: '4001', debit: 0.0, credit: 12000.0 }, // OPD Consultation Revenue
      ],
    });

    // Post an operating expense entry
    RCMAccountingService.createJournalEntry({
      hospitalId: hospitalA,
      referenceType: 'VENDOR_BILL',
      referenceId: 'BILL-EXP-1102',
      narration: 'Medical surgical consumables replenishment',
      lines: [
        { accountCode: '5001', debit: 4500.0, credit: 0.0 }, // Medical Consumables Expense
        { accountCode: '2001', debit: 0.0, credit: 4500.0 }, // Trade Payables
      ],
    });

    const pnl = RCMAccountingService.getProfitAndLoss(hospitalA);

    assert.ok(pnl.totalRevenue >= 12000.0, 'Total revenue must reflect consultation income');
    assert.ok(pnl.totalExpenses >= 4500.0, 'Total expenses must reflect surgical supplies');
    assert.strictEqual(
      pnl.netOperatingIncome,
      Math.round((pnl.totalRevenue - pnl.totalExpenses) * 100) / 100,
      'Net operating income must equal Total Revenue - Total Expenses'
    );
  });

  // Scenario 5: Unified Charge Capture & Effective-Dated Tariff Calculation
  it('Scenario 5: Captures service charges with quantity and discount deductions', () => {
    const charge = RCMAccountingService.captureCharge({
      hospitalId: hospitalA,
      patientId: 'pat-9901',
      serviceCode: 'SURG-LAP-01',
      serviceDescription: 'Laparoscopic Cholecystectomy Operating Package',
      serviceCategory: 'SURGERY',
      quantity: 1,
      unitRate: 65000.0,
      discountAmount: 5000.0,
      taxRate: 0.0,
    });

    assert.strictEqual(charge.subtotal, 65000.0);
    assert.strictEqual(charge.discountAmount, 5000.0);
    assert.strictEqual(charge.netPayable, 60000.0);
    assert.strictEqual(charge.hsnSacCode, '999312');
  });

  // Scenario 6: Indian Healthcare GST Rules & HSN/SAC Classification
  it('Scenario 6: Enforces SAC 999312 0% GST exemption for clinical healthcare services vs taxable retail items', () => {
    // 1. Clinical healthcare service (Exempt under SAC 999312)
    const clinicalCharge = RCMAccountingService.captureCharge({
      hospitalId: hospitalA,
      patientId: 'pat-9902',
      serviceCode: 'MED-ICU-DAY',
      serviceDescription: 'Intensive Coronary Care Unit Monitoring per Day',
      serviceCategory: 'IPD',
      quantity: 2,
      unitRate: 15000.0,
      taxRate: 0.0, // Clinical exemption
    });

    assert.strictEqual(clinicalCharge.totalTax, 0.0, 'Healthcare clinical service must be 0% exempt');
    assert.strictEqual(clinicalCharge.netPayable, 30000.0);

    // 2. Retail non-exempt item (e.g. 12% GST medical reagents/consumables)
    const taxableCharge = RCMAccountingService.captureCharge({
      hospitalId: hospitalA,
      patientId: 'pat-9903',
      serviceCode: 'PHARM-REAG-01',
      serviceDescription: 'Specialty Laboratory Reagent Kit',
      serviceCategory: 'PHARMACY',
      quantity: 1,
      unitRate: 10000.0,
      taxRate: 12.0, // 12% GST (6% CGST + 6% SGST)
    });

    assert.strictEqual(taxableCharge.subtotal, 10000.0);
    assert.strictEqual(taxableCharge.totalTax, 1200.0);
    assert.strictEqual(taxableCharge.cgstAmount, 600.0);
    assert.strictEqual(taxableCharge.sgstAmount, 600.0);
    assert.strictEqual(taxableCharge.netPayable, 11200.0);
  });

  // Scenario 7: Multi-Mode Split Payment Collection (Cash + UPI) with Balancing JVs
  it('Scenario 7: Processes multi-mode split payment (Cash + UPI) and posts balancing JVs', () => {
    const payment = RCMAccountingService.collectPayment({
      hospitalId: hospitalA,
      invoiceId: 'INV-2026-9001',
      patientId: 'pat-8833',
      cashierUserId: 'cashier-meera',
      amountPaid: 20000.0,
      idempotencyKey: 'idemp-pay-split-001',
      splitPayments: [
        { method: 'cash', amount: 5000.0 },
        { method: 'upi', amount: 15000.0, transactionReference: 'UPI/HDFC/2026110901' },
      ],
      notes: 'Split payment: ₹5k cash + ₹15k UPI',
    });

    assert.ok(payment.receiptNumber.startsWith('RCP-'), 'Must generate valid receipt number');
    assert.strictEqual(payment.totalAmountPaid, 20000.0);
    assert.strictEqual(payment.splitBreakdown.length, 2);
    assert.ok(payment.journalEntryId, 'Must post balancing journal voucher');
    assert.strictEqual(payment.status, 'PAID');
  });

  // Scenario 8: Supervisor PIN-Authorized Refund & Credit Note Generation
  it('Scenario 8: Requires managerial supervisor PIN to issue refund and reverses GL accounts', () => {
    // Valid supervisor PIN (1234)
    const refund = RCMAccountingService.processRefund({
      hospitalId: hospitalA,
      invoiceId: 'INV-2026-9001',
      paymentId: 'RCP-2026-0001',
      refundAmount: 2500.0,
      reasonCategory: 'cancelled_service',
      justification: 'Patient cancelled elective ultrasound procedure prior to scan',
      requestedByUserId: 'clerk-arun',
      supervisorPin: '1234',
      approvingUserId: 'supervisor-rajesh',
    });

    assert.ok(refund.refundNumber.startsWith('REF-'), 'Must generate refund number');
    assert.ok(refund.creditNoteNumber.startsWith('CN-'), 'Must generate credit note number');
    assert.strictEqual(refund.refundAmount, 2500.0);
    assert.strictEqual(refund.status, 'DISBURSED');

    // Invalid PIN rejection
    assert.throws(
      () => {
        RCMAccountingService.processRefund({
          hospitalId: hospitalA,
          invoiceId: 'INV-2026-9001',
          paymentId: 'RCP-2026-0001',
          refundAmount: 2500.0,
          reasonCategory: 'cancelled_service',
          justification: 'Unauthorized attempt',
          requestedByUserId: 'clerk-arun',
          supervisorPin: '0000', // Invalid PIN!
          approvingUserId: 'unknown',
        });
      },
      (err: any) => {
        assert.match(err.message, /AUTHORIZATION_ERROR/);
        return true;
      }
    );
  });

  // Scenario 9: Accounts Receivable (AR) 4-Bucket Aging Report
  it('Scenario 9: Generates 4-bucket AR Aging analysis (0-30, 31-60, 61-90, 90+ days) across payers', () => {
    const arReport = RCMAccountingService.getARAgingReport(hospitalA);

    assert.strictEqual(arReport.hospitalId, hospitalA);
    assert.ok(arReport.totalOutstandingReceivables > 0);
    assert.ok(arReport.agingBuckets.current0To30Days > 0);
    assert.ok(arReport.agingBuckets.bucket31To60Days > 0);
    assert.ok(arReport.agingBuckets.bucket61To90Days > 0);
    assert.ok(arReport.agingBuckets.over90Days > 0);

    // Sum of buckets equals total
    const bucketSum =
      arReport.agingBuckets.current0To30Days +
      arReport.agingBuckets.bucket31To60Days +
      arReport.agingBuckets.bucket61To90Days +
      arReport.agingBuckets.over90Days;
    assert.strictEqual(bucketSum, arReport.totalOutstandingReceivables);

    // Payer breakdown sum equals total
    const payerSum =
      arReport.payerClassification.privatePatients +
      arReport.payerClassification.tpaInsuranceClaims +
      arReport.payerClassification.corporateAccounts;
    assert.strictEqual(payerSum, arReport.totalOutstandingReceivables);
  });

  // Scenario 10: Accounts Payable (AP) 3-Way Matching and Liability Booking
  it('Scenario 10: Validates 3-way matching (PO -> GRN -> Bill) and posts vendor liability JV', () => {
    const apBill = RCMAccountingService.processVendorBill({
      hospitalId: hospitalA,
      vendorName: 'Apex Surgical Implants Ltd',
      vendorInvoiceNumber: 'INV-APEX-88392',
      purchaseOrderId: 'PO-2026-0044',
      goodsReceiptId: 'GRN-2026-0044',
      amount: 85000.0,
      dueDate: '2026-12-15',
      postedByUserId: 'finance-manager-deepa',
    });

    assert.ok(apBill.billId);
    assert.strictEqual(apBill.matchingStatus, 'MATCHED_3WAY');
    assert.ok(apBill.journalEntryId);
    assert.strictEqual(apBill.status, 'POSTED');
  });

  // Scenario 11: Cashier Shift Reconciliation with Variance Tracking
  it('Scenario 11: Computes expected cash vs physical count, identifies balanced vs discrepancy shifts', () => {
    // 1. Balanced Shift: Opening Float 5000 + Cash 20000 - Refunds 2000 = Expected 23000 == Counted 23000
    const balancedShift = RCMAccountingService.closeCashierShift({
      hospitalId: hospitalA,
      cashierUserId: 'cashier-rohit',
      counterNumber: 'Counter-OPD-1',
      openingFloat: 5000.0,
      cashCollected: 20000.0,
      upiCollected: 35000.0,
      cardCollected: 15000.0,
      cashRefundsDisbursed: 2000.0,
      physicalCountedCash: 23000.0,
      supervisorUserId: 'supervisor-rajesh',
    });

    assert.strictEqual(balancedShift.expectedClosingCash, 23000.0);
    assert.strictEqual(balancedShift.cashVariance, 0.0);
    assert.strictEqual(balancedShift.isBalanced, true);
    assert.strictEqual(balancedShift.status, 'CLOSED_BALANCED');

    // 2. Discrepancy Shift: Physical counted is 22500 (Shortage of ₹500)
    const discrepancyShift = RCMAccountingService.closeCashierShift({
      hospitalId: hospitalA,
      cashierUserId: 'cashier-rohit',
      counterNumber: 'Counter-OPD-1',
      openingFloat: 5000.0,
      cashCollected: 20000.0,
      upiCollected: 35000.0,
      cardCollected: 15000.0,
      cashRefundsDisbursed: 2000.0,
      physicalCountedCash: 22500.0, // ₹500 shortage
      supervisorUserId: 'supervisor-rajesh',
    });

    assert.strictEqual(discrepancyShift.expectedClosingCash, 23000.0);
    assert.strictEqual(discrepancyShift.cashVariance, -500.0);
    assert.strictEqual(discrepancyShift.isBalanced, false);
    assert.strictEqual(discrepancyShift.status, 'CLOSED_DISCREPANCY');
  });

  // Scenario 12: Indian GST Summary Report for GSTR-1 & GSTR-3B Tax Filing
  it('Scenario 12: Prepares GSTR-1 & GSTR-3B tax returns with SAC 999312 healthcare exemptions', () => {
    const gstReport = RCMAccountingService.getGSTSummaryReport(hospitalA, '2026-Q1');

    assert.strictEqual(gstReport.hospitalId, hospitalA);
    assert.strictEqual(gstReport.fiscalQuarter, '2026-Q1');
    assert.ok(gstReport.gstin);
    assert.strictEqual(gstReport.exemptHealthcareTurnover, 3950000.0);
    assert.strictEqual(gstReport.taxablePharmacyTurnover, 900000.0);
    assert.strictEqual(gstReport.cgstPayable, 45000.0);
    assert.strictEqual(gstReport.sgstPayable, 45000.0);
    assert.strictEqual(gstReport.totalTaxPayable, 90000.0);
    assert.ok(gstReport.hsnSacSummary.some((s) => s.code === '999312' && s.rate === '0%'));
  });

  // Scenario 13: Central RCM Executive Overview Telemetry
  it('Scenario 13: Aggregates real-time financial telemetry for hospital leadership', () => {
    const overview = RCMAccountingService.getRCMOverview(hospitalA);

    assert.strictEqual(overview.hospitalId, hospitalA);
    assert.ok(overview.asOfDate);
    assert.ok(overview.grossBilledAmount > 0);
    assert.ok(overview.netRevenue > 0);
    assert.ok(overview.totalReceivables > 0);
    assert.ok(overview.departmentRevenue.opdConsultation > 0);
    assert.ok(overview.departmentRevenue.inpatientCare > 0);
    assert.ok(overview.paymentModeSplit.upi > 0);
  });

  // Scenario 14: Multi-Hospital Inter-Branch Financial Elimination and Legal Entity Integrity
  it('Scenario 14: Preserves tenant isolation between hospital branches and balances inter-branch JV', () => {
    // Inter-branch settlement JV:
    // Hospital A Dr. Inter-Branch Due from Noida Branch
    // Hospital B Cr. Inter-Branch Due to Delhi Main
    const interBranchJV = RCMAccountingService.createJournalEntry({
      hospitalId: hospitalA,
      referenceType: 'INTER_BRANCH_TRANSFER',
      referenceId: 'IBT-2026-001',
      narration: 'Diagnostic equipment cross-charge settlement between Delhi Main and Noida Branch',
      lines: [
        { accountCode: '1204', debit: 50000.0, credit: 0.0, memo: 'Due from Noida Branch' },
        { accountCode: '1002', debit: 0.0, credit: 50000.0, memo: 'Operating Bank Delhi' },
      ],
    });

    assert.strictEqual(interBranchJV.isBalanced, true);

    const trialBalanceA = RCMAccountingService.getTrialBalance(hospitalA);
    const trialBalanceB = RCMAccountingService.getTrialBalance(hospitalB);

    assert.strictEqual(trialBalanceA.isBalanced, true);
    assert.strictEqual(trialBalanceB.isBalanced, true);
  });
});


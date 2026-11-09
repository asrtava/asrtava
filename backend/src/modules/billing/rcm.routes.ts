import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { RCMAccountingService } from './rcm-accounting.service';
import { logger } from '../../utils/logger';

export const rcmRouter = Router();

// Apply standard auth & multi-tenant isolation
rcmRouter.use(authMiddleware);
rcmRouter.use(tenantMiddleware);

// ============================================================
// 1. CHARGE CAPTURE & UNIFIED TARIFF BILLING
// ============================================================

/**
 * Capture charge for clinical service, diagnostic test, bed, or drug item
 * Evaluates Indian GST & HSN/SAC rules (e.g. SAC 999312 healthcare exemption)
 */
rcmRouter.post('/charges/capture', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const {
      patientId,
      admissionId,
      encounterId,
      serviceCode,
      serviceDescription,
      serviceCategory,
      quantity,
      unitRate,
      discountAmount,
      taxRate,
    } = req.body;

    if (!patientId || !serviceCode || !serviceDescription || unitRate === undefined) {
      res.status(400).json({ error: 'Missing required charge capture parameters' });
      return;
    }

    const chargeResult = RCMAccountingService.captureCharge({
      hospitalId,
      patientId,
      admissionId,
      encounterId,
      serviceCode,
      serviceDescription,
      serviceCategory: serviceCategory || 'CLINICAL',
      quantity: Number(quantity) || 1,
      unitRate: Number(unitRate),
      discountAmount: discountAmount ? Number(discountAmount) : 0,
      taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: chargeResult,
      message: 'Service charge captured and ledgered successfully',
    });
  } catch (error: any) {
    logger.error('Failed to capture charge', { error: error.message });
    res.status(500).json({ error: error.message || 'Internal charge capture failure' });
  }
});

// ============================================================
// 2. MULTI-MODE SPLIT PAYMENT COLLECTION
// ============================================================

/**
 * Collect patient invoice payment across multiple modes (Cash, UPI, Card, Net Banking, TPA)
 * Automatically crafts and posts double-entry balancing journal vouchers
 */
rcmRouter.post('/payments/collect', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const {
      invoiceId,
      patientId,
      amountPaid,
      idempotencyKey,
      splitPayments,
      notes,
    } = req.body;

    if (!invoiceId || !patientId || !amountPaid || !idempotencyKey) {
      res.status(400).json({ error: 'Missing payment collection parameters or idempotencyKey' });
      return;
    }

    const paymentResult = RCMAccountingService.collectPayment({
      hospitalId,
      invoiceId,
      patientId,
      cashierUserId: req.user?.id || 'cashier-system',
      amountPaid: Number(amountPaid),
      idempotencyKey,
      splitPayments,
      notes,
    });

    res.status(200).json({
      success: true,
      data: paymentResult,
      message: 'Payment collected and balancing journal voucher posted',
    });
  } catch (error: any) {
    logger.error('Failed to collect payment', { error: error.message });
    res.status(400).json({ error: error.message || 'Payment collection failed' });
  }
});

// ============================================================
// 3. SUPERVISOR-AUTHORIZED REFUNDS & CREDIT NOTES
// ============================================================

/**
 * Process patient refund or credit note with mandatory supervisor PIN authorization
 * Enforces reversal journal vouchers in double-entry general ledger
 */
rcmRouter.post('/refunds/process', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const {
      invoiceId,
      paymentId,
      refundAmount,
      reasonCategory,
      justification,
      supervisorPin,
      approvingUserId,
    } = req.body;

    if (!invoiceId || !paymentId || !refundAmount || !reasonCategory || !justification || !supervisorPin) {
      res.status(400).json({ error: 'Missing required refund authorization parameters' });
      return;
    }

    const refundResult = RCMAccountingService.processRefund({
      hospitalId,
      invoiceId,
      paymentId,
      refundAmount: Number(refundAmount),
      reasonCategory,
      justification,
      requestedByUserId: req.user?.id || 'billing-clerk-1',
      supervisorPin,
      approvingUserId: approvingUserId || 'supervisor-1',
    });

    res.status(200).json({
      success: true,
      data: refundResult,
      message: 'Refund authorized, credit note created and reversal journal voucher posted',
    });
  } catch (error: any) {
    logger.warn('Refund authorization failure', { error: error.message });
    res.status(403).json({ error: error.message || 'Refund processing unauthorized' });
  }
});

// ============================================================
// 4. DOUBLE-ENTRY GENERAL LEDGER JOURNAL ENTRIES
// ============================================================

/**
 * Post manual or system journal entry with strict mathematical balance constraint (Debits == Credits)
 */
rcmRouter.post('/journals', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const { referenceType, referenceId, narration, lines, postingDate } = req.body;

    if (!referenceType || !referenceId || !narration || !Array.isArray(lines) || lines.length < 2) {
      res.status(400).json({ error: 'Journal entry requires referenceType, referenceId, narration, and at least 2 lines' });
      return;
    }

    const journal = RCMAccountingService.createJournalEntry({
      hospitalId,
      referenceType,
      referenceId,
      narration,
      lines,
      postingDate,
      postedByUserId: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: journal,
      message: 'Double-entry journal voucher verified and posted to general ledger',
    });
  } catch (error: any) {
    logger.error('Journal entry validation failure', { error: error.message });
    res.status(422).json({ error: error.message || 'Journal entry failed balance verification' });
  }
});

// ============================================================
// 5. FINANCIAL STATEMENTS: TRIAL BALANCE & PROFIT AND LOSS
// ============================================================

/**
 * Real-time Trial Balance statement with account debit/credit breakdown and balance verification
 */
rcmRouter.get('/accounting/trial-balance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId || 'hosp-default';
    const trialBalance = RCMAccountingService.getTrialBalance(hospitalId);
    res.status(200).json({
      success: true,
      data: trialBalance,
    });
  } catch (error: any) {
    logger.error('Failed to generate trial balance', { error: error.message });
    res.status(500).json({ error: error.message || 'Trial balance generation error' });
  }
});

/**
 * Real-time Profit and Loss (P&L) statement broken down by department revenues and operating expenses
 */
rcmRouter.get('/accounting/profit-and-loss', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId || 'hosp-default';
    const pnl = RCMAccountingService.getProfitAndLoss(hospitalId);
    res.status(200).json({
      success: true,
      data: pnl,
    });
  } catch (error: any) {
    logger.error('Failed to generate P&L statement', { error: error.message });
    res.status(500).json({ error: error.message || 'Profit and loss calculation error' });
  }
});

// ============================================================
// 6. ACCOUNTS RECEIVABLE (AR) AGING ANALYSIS
// ============================================================

/**
 * 4-bucket AR Aging analysis (0-30, 31-60, 61-90, 90+ days) across Patient, TPA Insurance, and Corporate payers
 */
rcmRouter.get('/ar/aging', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId || 'hosp-default';
    const arReport = RCMAccountingService.getARAgingReport(hospitalId);
    res.status(200).json({
      success: true,
      data: arReport,
    });
  } catch (error: any) {
    logger.error('Failed to generate AR aging report', { error: error.message });
    res.status(500).json({ error: error.message || 'AR aging report error' });
  }
});

// ============================================================
// 7. ACCOUNTS PAYABLE (AP) 3-WAY MATCHING
// ============================================================

/**
 * Process vendor invoice with Purchase Order (PO) and Goods Receipt Note (GRN) 3-way matching
 */
rcmRouter.post('/ap/bills', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const {
      vendorName,
      invoiceNumber,
      poNumber,
      grnNumber,
      invoiceAmount,
      dueDate,
    } = req.body;

    if (!invoiceNumber || !poNumber || !grnNumber || invoiceAmount === undefined) {
      res.status(400).json({ error: 'Missing AP 3-way match parameters' });
      return;
    }

    const billResult = RCMAccountingService.processVendorBill({
      hospitalId,
      vendorName: vendorName || 'MedSupply Vendor Corp',
      vendorInvoiceNumber: invoiceNumber,
      purchaseOrderId: poNumber,
      goodsReceiptId: grnNumber,
      amount: Number(invoiceAmount),
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      postedByUserId: req.user?.id || 'finance-officer',
    });

    res.status(201).json({
      success: true,
      data: billResult,
      message: 'Vendor bill matched 3-way, posted to AP ledger, and liability journal created',
    });
  } catch (error: any) {
    logger.error('Failed to process AP bill', { error: error.message });
    res.status(422).json({ error: error.message || 'AP 3-way match failed' });
  }
});

// ============================================================
// 8. CASHIER SHIFT RECONCILIATION
// ============================================================

/**
 * End-of-shift cashier counter closing with variance tracking and supervisor signoff
 */
rcmRouter.post('/cashier/close-shift', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const {
      cashierUserId,
      counterNumber,
      openingFloat,
      cashCollected,
      upiCollected,
      cardCollected,
      cashRefundsDisbursed,
      physicalCountedCash,
      physicalCashCount,
      supervisorUserId,
      supervisorPin,
    } = req.body;

    const actualCash = physicalCountedCash !== undefined ? physicalCountedCash : physicalCashCount;

    if (!cashierUserId || actualCash === undefined) {
      res.status(400).json({ error: 'Missing cashier reconciliation parameters or physicalCountedCash' });
      return;
    }

    const shiftResult = RCMAccountingService.closeCashierShift({
      hospitalId,
      cashierUserId,
      counterNumber: counterNumber || 'Counter-1',
      openingFloat: Number(openingFloat || 5000),
      cashCollected: Number(cashCollected || 0),
      upiCollected: Number(upiCollected || 0),
      cardCollected: Number(cardCollected || 0),
      cashRefundsDisbursed: Number(cashRefundsDisbursed || 0),
      physicalCountedCash: Number(actualCash),
      supervisorUserId: supervisorUserId || 'supervisor-1',
    });

    res.status(200).json({
      success: true,
      data: shiftResult,
      message: 'Cashier shift closed, variances recorded, and settlement journal posted',
    });
  } catch (error: any) {
    logger.warn('Cashier shift close failed', { error: error.message });
    res.status(400).json({ error: error.message || 'Cashier shift closure failed' });
  }
});

// ============================================================
// 9. INDIAN GST & TAX SUMMARY (GSTR-1 & GSTR-3B)
// ============================================================

/**
 * GSTR-1 and GSTR-3B tax compliance summary by HSN/SAC codes and tax rate slabs
 */
rcmRouter.get('/tax/gst-summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId || 'hosp-default';
    const fiscalQuarter = (req.query.quarter as string) || '2026-Q1';
    const gstReport = RCMAccountingService.getGSTSummaryReport(hospitalId, fiscalQuarter);
    res.status(200).json({
      success: true,
      data: gstReport,
    });
  } catch (error: any) {
    logger.error('Failed to generate GST summary', { error: error.message });
    res.status(500).json({ error: error.message || 'GST report generation error' });
  }
});

// ============================================================
// 10. CENTRAL RCM EXECUTIVE OVERVIEW & TELEMETRY
// ============================================================

/**
 * Real-time RCM dashboard telemetry: Collections, Net Billing, AR, AP, Bad Debt, Claims Aging
 */
rcmRouter.get('/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId || 'hosp-default';
    const overview = RCMAccountingService.getRCMOverview(hospitalId);
    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    logger.error('Failed to retrieve RCM overview', { error: error.message });
    res.status(500).json({ error: error.message || 'RCM overview error' });
  }
});

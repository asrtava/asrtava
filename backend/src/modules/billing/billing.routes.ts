import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { InvoiceCreateSchema, PaymentCreateSchema, RefundRequestSchema } from '../../validators';

export const billingRouter = Router();

billingRouter.use(authMiddleware);
billingRouter.use(tenantMiddleware);

// 1. Generate Consolidated Patient Invoice
billingRouter.post('/invoices', requirePermission('create', 'all'), validateBody(InvoiceCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, admissionId, billingCategory, items } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      // Calculate totals
      let grossAmount = 0;
      let totalTax = 0;

      const processedItems = items.map((it: any) => {
        const itemGross = it.quantity * it.unitRate;
        const taxVal = itemGross * (it.taxRate / 100);
        const lineTotal = itemGross + taxVal;
        grossAmount += itemGross;
        totalTax += taxVal;
        return {
          ...it,
          lineTotal,
        };
      });

      const netPayable = grossAmount + totalTax;

      // Generate invoice number
      const count = await trx('invoices').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const invoiceNumber = `INV-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      const [invoice] = await trx('invoices')
        .insert({
          hospital_id: req.hospitalId,
          patient_id: patientId,
          admission_id: admissionId,
          invoice_number: invoiceNumber,
          billing_category: billingCategory,
          gross_amount: grossAmount,
          tax_amount: totalTax,
          net_payable: netPayable,
          total_paid: 0.00,
          outstanding_balance: netPayable,
          payment_status: 'unpaid',
          created_by_user_id: req.user!.id,
        })
        .returning('*');

      // Insert line items
      const itemRows = processedItems.map((p: any) => ({
        invoice_id: invoice.id,
        hospital_id: req.hospitalId,
        service_type: p.serviceType,
        service_description: p.serviceDescription,
        service_reference_id: p.serviceReferenceId,
        quantity: p.quantity,
        unit_rate: p.unitRate,
        tax_rate: p.taxRate,
        line_total: p.lineTotal,
      }));
      await trx('invoice_items').insert(itemRows);

      // Record double-entry financial transaction
      await trx('financial_transactions').insert({
        hospital_id: req.hospitalId,
        transaction_type: 'invoice_charge',
        reference_document_type: 'invoice',
        reference_document_id: invoice.id,
        amount: netPayable,
        entry_side: 'debit',
        account_code: 'ACCTS_RECEIVABLE',
        description: `Patient Invoice Charge ${invoiceNumber}`,
      });

      return invoice;
    });

    res.status(201).json({ success: true, data: result, message: 'Consolidated invoice generated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Collect Payment (With Idempotency Key Anti-Double-Charge Protection)
billingRouter.post('/payments', requirePermission('create', 'all'), validateBody(PaymentCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { invoiceId, amountPaid, paymentMethod, transactionReferenceId, idempotencyKey, notes } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      // Check idempotency key first
      const existingTxn = await trx('payments')
        .where({ hospital_id: req.hospitalId, idempotency_key: idempotencyKey })
        .first();

      if (existingTxn) {
        return { payment: existingTxn, isIdempotentReplay: true };
      }

      // Fetch invoice with row lock
      const invoice = await trx('invoices')
        .where({ id: invoiceId, hospital_id: req.hospitalId })
        .forUpdate()
        .first();

      if (!invoice) {
        throw new Error('Invoice not found in hospital tenant');
      }

      if (invoice.outstanding_balance <= 0) {
        throw new Error('Invoice is already fully paid');
      }

      const receiptCount = await trx('payments').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const receiptNumber = `REC-${String(Number(receiptCount?.total || 0) + 1).padStart(5, '0')}`;

      // Insert payment
      const [payment] = await trx('payments')
        .insert({
          hospital_id: req.hospitalId,
          invoice_id: invoice.id,
          patient_id: invoice.patient_id,
          payment_receipt_number: receiptNumber,
          amount_paid: amountPaid,
          payment_method: paymentMethod,
          transaction_reference_id: transactionReferenceId,
          idempotency_key: idempotencyKey,
          cashier_user_id: req.user!.id,
          notes,
        })
        .returning('*');

      // Update invoice balances
      const newPaid = Number(invoice.total_paid) + amountPaid;
      const newBalance = Number(invoice.net_payable) - newPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

      await trx('invoices')
        .where({ id: invoice.id })
        .update({
          total_paid: newPaid,
          outstanding_balance: Math.max(0, newBalance),
          payment_status: newStatus,
          updated_at: new Date(),
        });

      // Record financial ledger entry
      await trx('financial_transactions').insert({
        hospital_id: req.hospitalId,
        transaction_type: 'payment_receipt',
        reference_document_type: 'payment',
        reference_document_id: payment.id,
        amount: amountPaid,
        entry_side: 'credit',
        account_code: 'CASH_BANK',
        description: `Payment Receipt ${receiptNumber} against ${invoice.invoice_number}`,
      });

      return { payment, isIdempotentReplay: false };
    });

    res.status(201).json({
      success: true,
      message: result.isIdempotentReplay ? 'Payment already processed (idempotency replay)' : 'Payment collected & formal receipt issued',
      data: result.payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Request Audited Refund
billingRouter.post('/refunds', requirePermission('create', 'all'), validateBody(RefundRequestSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { paymentId, invoiceId, refundAmount, reasonCategory, justification } = req.body;

  try {
    const count = await db('refunds').where({ hospital_id: req.hospitalId }).count('id as total').first();
    const refNumber = `REF-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

    const [refund] = await db('refunds')
      .insert({
        hospital_id: req.hospitalId,
        payment_id: paymentId,
        invoice_id: invoiceId,
        refund_number: refNumber,
        refund_amount: refundAmount,
        reason_category: reasonCategory,
        justification,
        refund_status: 'pending_approval',
        requested_by_user_id: req.user!.id,
      })
      .returning('*');

    res.status(201).json({ success: true, data: refund, message: 'Refund request submitted for administrator authorization' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

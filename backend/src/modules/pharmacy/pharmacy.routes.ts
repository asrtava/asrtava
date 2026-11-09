import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { MedicineCreateSchema, BatchCreateSchema, DispenseCreateSchema } from '../../validators';

export const pharmacyRouter = Router();

pharmacyRouter.use(authMiddleware);
pharmacyRouter.use(tenantMiddleware);

// 1. Medicine Directory & Stock Summary
pharmacyRouter.get('/medicines', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let query = db('medicines as m')
      .leftJoin('medicine_categories as c', 'm.category_id', 'c.id')
      .where({ 'm.hospital_id': req.hospitalId, 'm.is_active': true })
      .select(
        'm.*',
        'c.name as category_name'
      );

    if (search) {
      query = query.andWhere((b) => {
        b.whereILike('m.name', `%${search}%`)
         .orWhereILike('m.generic_name', `%${search}%`)
         .orWhereILike('m.brand_name', `%${search}%`);
      });
    }

    const medicines = await query.orderBy('m.name', 'asc');

    // Aggregate available batch quantities for each
    for (const med of medicines) {
      const stock = await db('pharmacy_batches')
        .where({ medicine_id: med.id, hospital_id: req.hospitalId, is_active: true })
        .where('expiry_date', '>', new Date())
        .sum('available_quantity as total_qty')
        .first();
      med.totalStock = Number(stock?.total_qty || 0);
      med.isLowStock = med.totalStock <= med.reorder_level;
    }

    res.json({ success: true, data: medicines });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Add New Medicine Catalog Entry
pharmacyRouter.post('/medicines', requirePermission('create', 'all'), validateBody(MedicineCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [med] = await db('medicines')
      .insert({
        hospital_id: req.hospitalId,
        ...req.body,
      })
      .returning('*');

    res.status(201).json({ success: true, data: med, message: 'Medicine added to hospital catalog' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Receive / Stock New Batch
pharmacyRouter.post('/batches', requirePermission('create', 'all'), validateBody(BatchCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { medicineId, supplierId, batchNumber, expiryDate, purchaseCostPerUnit, sellingPricePerUnit, mrp, initialQuantity, storageBinLocation } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      const [batch] = await trx('pharmacy_batches')
        .insert({
          hospital_id: req.hospitalId,
          medicine_id: medicineId,
          supplier_id: supplierId,
          batch_number: batchNumber,
          expiry_date: expiryDate,
          purchase_cost_per_unit: purchaseCostPerUnit,
          selling_price_per_unit: sellingPricePerUnit,
          mrp,
          initial_quantity: initialQuantity,
          available_quantity: initialQuantity,
          storage_bin_location: storageBinLocation,
        })
        .returning('*');

      // Audit stock movement (purchase receipt)
      await trx('pharmacy_stock_movements').insert({
        hospital_id: req.hospitalId,
        batch_id: batch.id,
        movement_type: 'purchase_receipt',
        quantity_change: initialQuantity,
        balance_quantity_after: initialQuantity,
        performed_by_user_id: req.user!.id,
      });

      return batch;
    });

    res.status(201).json({ success: true, data: result, message: 'Pharmacy batch received & stock updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Dispense Prescription / Point-of-Sale (With Row-Level Locking & Anti-Race-Condition Protection)
pharmacyRouter.post('/dispense', requirePermission('create', 'all'), validateBody(DispenseCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { prescriptionId, patientId, items } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      let grossAmount = 0;
      const processedItems: any[] = [];

      // Validate & deduct stock atomically for each batch
      for (const item of items) {
        // Lock row pessimistic
        const batch = await trx('pharmacy_batches')
          .where({ id: item.batchId, hospital_id: req.hospitalId })
          .forUpdate()
          .first();

        if (!batch) {
          throw new Error(`Batch ID ${item.batchId} not found in hospital inventory`);
        }

        if (batch.available_quantity < item.quantity) {
          throw new Error(`Insufficient stock for batch ${batch.batch_number}. Available: ${batch.available_quantity}, Requested: ${item.quantity}`);
        }

        const newBalance = batch.available_quantity - item.quantity;
        await trx('pharmacy_batches')
          .where({ id: batch.id })
          .update({ available_quantity: newBalance, updated_at: new Date() });

        // Record stock decrement
        await trx('pharmacy_stock_movements').insert({
          hospital_id: req.hospitalId,
          batch_id: batch.id,
          movement_type: 'dispensing',
          quantity_change: -item.quantity,
          balance_quantity_after: newBalance,
          performed_by_user_id: req.user!.id,
        });

        const lineTotal = Number(batch.selling_price_per_unit) * item.quantity;
        grossAmount += lineTotal;

        processedItems.push({
          batchId: batch.id,
          quantity: item.quantity,
          unitSellingPrice: batch.selling_price_per_unit,
          lineTotal,
        });
      }

      // Generate Dispensing Header
      const count = await trx('pharmacy_dispensings').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const dispNumber = `DSP-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      const [dispensing] = await trx('pharmacy_dispensings')
        .insert({
          hospital_id: req.hospitalId,
          prescription_id: prescriptionId,
          patient_id: patientId,
          dispensing_number: dispNumber,
          gross_amount: grossAmount,
          net_amount: grossAmount,
          payment_status: 'paid',
          dispensed_by_user_id: req.user!.id,
        })
        .returning('*');

      // Insert line items
      const lineRows = processedItems.map((p) => ({
        dispensing_id: dispensing.id,
        hospital_id: req.hospitalId,
        batch_id: p.batchId,
        quantity_dispensed: p.quantity,
        unit_selling_price: p.unitSellingPrice,
        line_total: p.lineTotal,
      }));
      await trx('pharmacy_dispense_items').insert(lineRows);

      // If prescription linked, mark as dispensed
      if (prescriptionId) {
        await trx('prescriptions')
          .where({ id: prescriptionId, hospital_id: req.hospitalId })
          .update({ status: 'dispensed', updated_at: new Date() });
      }

      return dispensing;
    });

    res.status(201).json({
      success: true,
      message: 'Prescription dispensed successfully; inventory decremented atomically',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

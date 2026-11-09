import { Router, Response } from 'express';
import { procurementAdvancedService } from './procurement-advanced.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

export const procurementAdvancedRouter = Router();

procurementAdvancedRouter.use(authMiddleware);
procurementAdvancedRouter.use(tenantMiddleware);

// 1. Dashboard Metrics
procurementAdvancedRouter.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const metrics = await procurementAdvancedService.getProcurementMetrics(hospitalId);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Vendors
procurementAdvancedRouter.post('/vendors', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.registerVendor({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.get('/vendors', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const data = await procurementAdvancedService.listVendors(hospitalId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.get('/vendors/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.getVendor(req.params.id as string);
    if (!data) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Warehouses
procurementAdvancedRouter.post('/warehouses', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.createWarehouse({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.get('/warehouses', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const data = await procurementAdvancedService.listWarehouses(hospitalId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Catalog Items
procurementAdvancedRouter.post('/items', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.createItem({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.get('/items', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const category = req.query.category as string | undefined;
    const data = await procurementAdvancedService.listItems(hospitalId, category);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Purchase Requisitions
procurementAdvancedRouter.post('/requisitions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.createPurchaseRequisition({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      requestingUserId: req.user?.id || 'staff-requester',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.patch('/requisitions/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.approvePurchaseRequisition(
      req.params.id as string,
      req.user?.id || 'admin-approver',
      req.body.notes
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Quotations
procurementAdvancedRouter.post('/quotations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.submitQuotation({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.get('/quotations/compare', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requisitionId = req.query.requisitionId as string;
    const data = await procurementAdvancedService.compareQuotations(requisitionId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.post('/quotations/:id/select', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.selectQuotation(req.params.id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Purchase Orders (PO)
procurementAdvancedRouter.post('/purchase-orders', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.createPurchaseOrder({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Goods Receipt & Quality Inspection
procurementAdvancedRouter.post('/goods-receipt', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.receiveGoods({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      receivingUserId: req.user?.id || 'receiving-dock',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.post('/quality-inspections', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.inspectGoods({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      inspectorUserId: req.user?.id || 'quality-inspector',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Stock Movement & Department Consumption
procurementAdvancedRouter.post('/stock/transfers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.issueStockToDepartment(
      req.body.hospitalId || req.hospitalId!,
      req.body.itemId,
      req.body.fromWarehouseId,
      req.body.toWarehouseId,
      req.body.quantity,
      req.user?.id || 'storekeeper',
      req.body.reason || 'Department replenishment'
    );
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.post('/stock/consumption', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.recordDepartmentConsumption(
      req.body.hospitalId || req.hospitalId!,
      req.body.itemId,
      req.body.warehouseId,
      req.body.quantity,
      req.body.referenceDocId || 'CLINICAL-CONSUMPTION',
      req.user?.id || 'nurse',
      req.body.reason || 'Administered to patient'
    );
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// 10. Physical Inventory Reconciliation
procurementAdvancedRouter.post('/stock/reconciliation', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.reconcileStockCount(
      req.body.hospitalId || req.hospitalId!,
      req.body.itemId,
      req.body.warehouseId,
      req.body.countedQuantity,
      req.user?.id || 'auditor',
      req.body.reason || 'Cycle count audit'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. Three-Way Invoice Matching
procurementAdvancedRouter.post('/invoices/match', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.matchSupplierInvoice({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// 12. Fixed Assets & Biomedical Maintenance
procurementAdvancedRouter.post('/assets', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.registerAsset({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.post('/maintenance/schedules', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.schedulePreventiveMaintenance({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.post('/work-orders', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.createBreakdownWorkOrder({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      reportedByUserId: req.user?.id || 'clinical-nurse',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

procurementAdvancedRouter.patch('/work-orders/:id/resolve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await procurementAdvancedService.resolveWorkOrder(
      req.params.id as string,
      req.body.downtimeHours || 1.5,
      req.body.sparePartsCost || 0,
      req.user?.id || 'biomedical-engineer'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});


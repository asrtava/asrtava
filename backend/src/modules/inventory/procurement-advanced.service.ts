import { logger } from '../../utils/logger';

export interface VendorInput {
  hospitalId: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  paymentTerms?: string;
  vendorCategory?: 'PHARMACEUTICAL' | 'SURGICAL' | 'BIOMEDICAL_EQUIPMENT' | 'DIAGNOSTIC_REAGENTS' | 'FACILITY_SUPPLIES' | 'GENERAL';
  rating?: number;
}

export interface WarehouseInput {
  hospitalId: string;
  branchId?: string;
  code: string;
  name: string;
  warehouseType?: 'CENTRAL_WAREHOUSE' | 'PHARMACY_STORE' | 'LAB_STORE' | 'RADIOLOGY_STORE' | 'OT_STORE' | 'ICU_STORE' | 'WARD_STORE' | 'FACILITY_STORE';
  locationFloor?: string;
}

export interface ItemInput {
  hospitalId: string;
  itemCode: string;
  name: string;
  category: 'MEDICINE' | 'SURGICAL_CONSUMABLE' | 'LAB_REAGENT' | 'RADIOLOGY_CONTRAST' | 'BIOMEDICAL_EQUIPMENT' | 'IT_ASSET' | 'FACILITY_MATERIAL' | 'GENERAL_SUPPLY';
  baseUom: string;
  purchaseUom?: string;
  uomConversionFactor?: number;
  reorderLevel: number;
  safetyStock?: number;
  minOrderQty?: number;
  isAsset?: boolean;
  isBatchTracked?: boolean;
  isSerialTracked?: boolean;
  storageTemperatureCelsius?: string;
  hsnSacCode?: string;
  standardCost: number;
}

export interface PurchaseRequisitionInput {
  hospitalId: string;
  requisitionNumber: string;
  departmentId: string;
  requestingUserId: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  requiredByDate: string;
  purpose: string;
  items: Array<{
    itemId: string;
    quantityRequested: number;
    estimatedUnitCost: number;
  }>;
}

export interface QuotationInput {
  hospitalId: string;
  requisitionId: string;
  vendorId: string;
  quotationNumber: string;
  unitPrice: number;
  totalPrice: number;
  deliveryLeadDays: number;
  warrantyMonths?: number;
  score?: number;
}

export interface PurchaseOrderInput {
  hospitalId: string;
  vendorId: string;
  requisitionId?: string;
  poNumber: string;
  expectedDeliveryDate: string;
  paymentTerms?: string;
  shippingAddress: string;
  items: Array<{
    itemId: string;
    quantityOrdered: number;
    unitPrice: number;
    gstRatePercent?: number;
  }>;
}

export interface GoodsReceiptInput {
  hospitalId: string;
  poId: string;
  vendorId: string;
  warehouseId: string;
  grnNumber: string;
  vendorDeliveryChallan: string;
  receivingUserId: string;
  items: Array<{
    itemId: string;
    batchNumber: string;
    expiryDate: string;
    quantityReceived: number;
  }>;
}

export interface QualityInspectionInput {
  hospitalId: string;
  grnId: string;
  itemId: string;
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected?: number;
  quantityQuarantined?: number;
  inspectionNotes?: string;
  inspectorUserId: string;
}

export interface SupplierInvoiceInput {
  hospitalId: string;
  vendorId: string;
  poId: string;
  grnId: string;
  invoiceNumber: string;
  invoiceDate?: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

export interface AssetInput {
  hospitalId: string;
  assetTag: string;
  name: string;
  category: 'BIOMEDICAL_EQUIPMENT' | 'IT_HARDWARE' | 'HOSPITAL_FURNITURE' | 'FACILITY_INFRASTRUCTURE' | 'VEHICLE';
  itemId?: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  departmentId: string;
  locationRoom: string;
  purchaseCost: number;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  lastCalibrationDate?: string;
  nextCalibrationDue?: string;
}

export interface MaintenanceScheduleInput {
  hospitalId: string;
  assetId: string;
  maintenanceType?: 'PPM_PREVENTIVE' | 'CALIBRATION' | 'ELECTRICAL_SAFETY' | 'STATUTORY_INSPECTION';
  frequencyDays: number;
  nextDueDate: string;
  assignedEngineerId?: string;
}

export interface WorkOrderInput {
  hospitalId: string;
  workOrderNumber: string;
  assetId: string;
  reportedByUserId: string;
  departmentId: string;
  issueDescription: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_BREAKDOWN';
  assignedTechnicianId?: string;
}

export class ProcurementAdvancedService {
  private vendors: Map<string, any> = new Map();
  private warehouses: Map<string, any> = new Map();
  private items: Map<string, any> = new Map();
  private stockBatches: Map<string, any> = new Map();
  private stockBalances: Map<string, any> = new Map();
  private stockMovements: any[] = [];
  private purchaseRequisitions: Map<string, any> = new Map();
  private quotations: Map<string, any> = new Map();
  private purchaseOrders: Map<string, any> = new Map();
  private goodsReceiptNotes: Map<string, any> = new Map();
  private qualityInspections: Map<string, any> = new Map();
  private supplierInvoices: Map<string, any> = new Map();
  private assets: Map<string, any> = new Map();
  private maintenanceSchedules: Map<string, any> = new Map();
  private workOrders: Map<string, any> = new Map();
  private generalLedgerVouchers: any[] = [];

  // 1. Vendor & Supplier Management
  public async registerVendor(input: VendorInput): Promise<any> {
    const id = `ven-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Uniqueness check per hospital
    const exists = Array.from(this.vendors.values()).some(
      v => v.hospitalId === input.hospitalId && v.vendorCode === input.vendorCode
    );
    if (exists) {
      throw new Error(`Conflict: Vendor code ${input.vendorCode} already exists in this hospital`);
    }

    const vendor = {
      id,
      hospitalId: input.hospitalId,
      vendorCode: input.vendorCode.toUpperCase(),
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address || '',
      gstin: input.gstin || '',
      panNumber: input.panNumber || '',
      bankAccountNumber: input.bankAccountNumber || '',
      bankIfsc: input.bankIfsc || '',
      paymentTerms: input.paymentTerms || 'NET_30',
      vendorCategory: input.vendorCategory || 'PHARMACEUTICAL',
      rating: input.rating !== undefined ? input.rating : 4.5,
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.vendors.set(id, vendor);
    logger.info('Vendor registered successfully', { vendorCode: vendor.vendorCode, company: vendor.companyName });
    return vendor;
  }

  public async listVendors(hospitalId: string): Promise<any[]> {
    return Array.from(this.vendors.values()).filter(v => v.hospitalId === hospitalId);
  }

  public async getVendor(id: string): Promise<any | null> {
    return this.vendors.get(id) || null;
  }

  // 2. Warehouses & Stores
  public async createWarehouse(input: WarehouseInput): Promise<any> {
    const id = `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const warehouse = {
      id,
      hospitalId: input.hospitalId,
      branchId: input.branchId || null,
      code: input.code.toUpperCase(),
      name: input.name,
      warehouseType: input.warehouseType || 'CENTRAL_WAREHOUSE',
      locationFloor: input.locationFloor || 'Basement 1',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.warehouses.set(id, warehouse);
    return warehouse;
  }

  public async listWarehouses(hospitalId: string): Promise<any[]> {
    return Array.from(this.warehouses.values()).filter(w => w.hospitalId === hospitalId);
  }

  // 3. Master Item Catalog
  public async createItem(input: ItemInput): Promise<any> {
    const id = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const exists = Array.from(this.items.values()).some(
      i => i.hospitalId === input.hospitalId && i.itemCode === input.itemCode
    );
    if (exists) {
      throw new Error(`Conflict: Item code ${input.itemCode} already exists in catalog`);
    }

    const item = {
      id,
      hospitalId: input.hospitalId,
      itemCode: input.itemCode.toUpperCase(),
      name: input.name,
      category: input.category,
      baseUom: input.baseUom,
      purchaseUom: input.purchaseUom || input.baseUom,
      uomConversionFactor: input.uomConversionFactor || 1.0,
      reorderLevel: input.reorderLevel,
      safetyStock: input.safetyStock || 20,
      minOrderQty: input.minOrderQty || 10,
      isAsset: input.isAsset || false,
      isBatchTracked: input.isBatchTracked !== undefined ? input.isBatchTracked : true,
      isSerialTracked: input.isSerialTracked || false,
      storageTemperatureCelsius: input.storageTemperatureCelsius || 'ROOM_TEMP',
      hsnSacCode: input.hsnSacCode || '3004',
      standardCost: input.standardCost,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.items.set(id, item);
    return item;
  }

  public async listItems(hospitalId: string, category?: string): Promise<any[]> {
    return Array.from(this.items.values()).filter(i => {
      if (i.hospitalId !== hospitalId) return false;
      if (category && i.category !== category) return false;
      return true;
    });
  }

  // 4. Purchase Requisitions
  public async createPurchaseRequisition(input: PurchaseRequisitionInput): Promise<any> {
    const id = `pr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let totalEst = 0;
    for (const itm of input.items) {
      totalEst += itm.quantityRequested * itm.estimatedUnitCost;
    }

    const pr = {
      id,
      hospitalId: input.hospitalId,
      requisitionNumber: input.requisitionNumber,
      departmentId: input.departmentId,
      requestingUserId: input.requestingUserId,
      priority: input.priority || 'ROUTINE',
      requiredByDate: input.requiredByDate,
      purpose: input.purpose,
      items: input.items,
      totalEstimatedCost: Math.round(totalEst * 100) / 100,
      status: 'PENDING_APPROVAL',
      approvedByUserId: null,
      createdAt: new Date().toISOString(),
    };
    this.purchaseRequisitions.set(id, pr);
    logger.info('Purchase requisition created', { requisitionNumber: pr.requisitionNumber, totalEstimatedCost: pr.totalEstimatedCost });
    return pr;
  }

  public async approvePurchaseRequisition(id: string, approverUserId: string, notes?: string): Promise<any> {
    const pr = this.purchaseRequisitions.get(id);
    if (!pr) throw new Error('Purchase requisition not found');

    pr.status = 'APPROVED';
    pr.approvedByUserId = approverUserId;
    pr.approvalNotes = notes || 'Approved for procurement';
    pr.updatedAt = new Date().toISOString();
    this.purchaseRequisitions.set(id, pr);
    return pr;
  }

  // 5. Vendor Quotations & RFQ Comparison
  public async submitQuotation(input: QuotationInput): Promise<any> {
    const pr = this.purchaseRequisitions.get(input.requisitionId);
    if (!pr) throw new Error('Requisition not found');
    const ven = this.vendors.get(input.vendorId);
    if (!ven) throw new Error('Vendor not found');

    const id = `quot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const quot = {
      id,
      hospitalId: input.hospitalId,
      requisitionId: input.requisitionId,
      vendorId: input.vendorId,
      vendorName: ven.companyName,
      quotationNumber: input.quotationNumber,
      unitPrice: input.unitPrice,
      totalPrice: input.totalPrice,
      deliveryLeadDays: input.deliveryLeadDays,
      warrantyMonths: input.warrantyMonths || 12,
      score: input.score !== undefined ? input.score : 4.0,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    this.quotations.set(id, quot);
    return quot;
  }

  public async compareQuotations(requisitionId: string): Promise<any[]> {
    const quots = Array.from(this.quotations.values()).filter(q => q.requisitionId === requisitionId);
    // Sort by best score then lowest price
    return quots.sort((a, b) => b.score - a.score || a.totalPrice - b.totalPrice);
  }

  public async selectQuotation(quotationId: string): Promise<any> {
    const quot = this.quotations.get(quotationId);
    if (!quot) throw new Error('Quotation not found');

    // Reject other quotations for the same requisition
    for (const q of this.quotations.values()) {
      if (q.requisitionId === quot.requisitionId) {
        q.status = q.id === quotationId ? 'SELECTED' : 'REJECTED';
      }
    }
    logger.info('Vendor quotation selected', { quotationId, vendorName: quot.vendorName, totalPrice: quot.totalPrice });
    return quot;
  }

  // 6. Purchase Orders (PO)
  public async createPurchaseOrder(input: PurchaseOrderInput): Promise<any> {
    const ven = this.vendors.get(input.vendorId);
    if (!ven) throw new Error('Vendor not found');

    const id = `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    let taxAmount = 0;

    const items = input.items.map(itm => {
      const lineSubtotal = itm.quantityOrdered * itm.unitPrice;
      const gstRate = itm.gstRatePercent !== undefined ? itm.gstRatePercent : 12.0;
      const lineTax = (lineSubtotal * gstRate) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        id: `poi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: itm.itemId,
        quantityOrdered: itm.quantityOrdered,
        quantityReceived: 0,
        unitPrice: itm.unitPrice,
        gstRatePercent: gstRate,
        lineTotal: Math.round(lineTotal * 100) / 100,
      };
    });

    const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

    const po = {
      id,
      hospitalId: input.hospitalId,
      vendorId: input.vendorId,
      vendorName: ven.companyName,
      requisitionId: input.requisitionId || null,
      poNumber: input.poNumber,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: input.expectedDeliveryDate,
      totalSubtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      grandTotal,
      paymentTerms: input.paymentTerms || ven.paymentTerms,
      shippingAddress: input.shippingAddress,
      items,
      status: 'ISSUED',
      approvedByUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.purchaseOrders.set(id, po);

    // If requisition linked, mark as PO_CREATED
    if (input.requisitionId) {
      const pr = this.purchaseRequisitions.get(input.requisitionId);
      if (pr) pr.status = 'PO_CREATED';
    }

    logger.info('Purchase order created and issued', { poNumber: po.poNumber, vendorName: po.vendorName, grandTotal });
    return po;
  }

  // 7. Goods Receipt Notes (GRN) & Quality Inspection Gate
  public async receiveGoods(input: GoodsReceiptInput): Promise<any> {
    const po = this.purchaseOrders.get(input.poId);
    if (!po) throw new Error('Purchase order not found');

    const id = `grn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const grn = {
      id,
      hospitalId: input.hospitalId,
      poId: input.poId,
      poNumber: po.poNumber,
      vendorId: input.vendorId,
      warehouseId: input.warehouseId,
      grnNumber: input.grnNumber,
      vendorDeliveryChallan: input.vendorDeliveryChallan,
      receivedDate: new Date().toISOString().split('T')[0],
      receivingUserId: input.receivingUserId,
      items: input.items,
      status: 'INSPECTION_PENDING',
      createdAt: new Date().toISOString(),
    };
    this.goodsReceiptNotes.set(id, grn);
    logger.info('Goods received at dock; awaiting quality inspection', { grnNumber: grn.grnNumber, poNumber: po.poNumber });
    return grn;
  }

  public async inspectGoods(input: QualityInspectionInput): Promise<any> {
    const grn = this.goodsReceiptNotes.get(input.grnId);
    if (!grn) throw new Error('Goods receipt note not found');

    const id = `insp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const inspection = {
      id,
      hospitalId: input.hospitalId,
      grnId: input.grnId,
      itemId: input.itemId,
      batchNumber: input.batchNumber,
      expiryDate: input.expiryDate,
      quantityReceived: input.quantityReceived,
      quantityAccepted: input.quantityAccepted,
      quantityRejected: input.quantityRejected || 0,
      quantityQuarantined: input.quantityQuarantined || 0,
      inspectionNotes: input.inspectionNotes || 'Quality inspection completed',
      inspectorUserId: input.inspectorUserId,
      status: input.quantityAccepted === input.quantityReceived ? 'PASSED' : input.quantityAccepted > 0 ? 'PARTIALLY_PASSED' : 'FAILED',
      createdAt: new Date().toISOString(),
    };
    this.qualityInspections.set(id, inspection);

    // CRITICAL INVARIANCE: ONLY accepted quantities are admitted into available stock balances!
    if (input.quantityAccepted > 0) {
      const batchId = `bat-${input.itemId}-${input.batchNumber}`;
      let batch = this.stockBatches.get(batchId);
      if (!batch) {
        batch = {
          id: batchId,
          hospitalId: input.hospitalId,
          itemId: input.itemId,
          warehouseId: grn.warehouseId,
          batchNumber: input.batchNumber,
          expiryDate: input.expiryDate,
          initialQuantity: input.quantityAccepted,
          currentQuantity: input.quantityAccepted,
          allocatedQuantity: 0,
          qualityStatus: 'ACCEPTED',
          createdAt: new Date().toISOString(),
        };
      } else {
        batch.currentQuantity += input.quantityAccepted;
      }
      this.stockBatches.set(batchId, batch);

      // Update Warehouse Stock Balances
      const balanceKey = `${input.hospitalId}-${grn.warehouseId}-${input.itemId}`;
      let balance = this.stockBalances.get(balanceKey);
      if (!balance) {
        balance = {
          id: `bal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          hospitalId: input.hospitalId,
          itemId: input.itemId,
          warehouseId: grn.warehouseId,
          totalQuantity: input.quantityAccepted,
          availableQuantity: input.quantityAccepted,
          reservedQuantity: 0,
          quarantinedQuantity: input.quantityQuarantined || 0,
          updatedAt: new Date().toISOString(),
        };
      } else {
        balance.totalQuantity += input.quantityAccepted;
        balance.availableQuantity += input.quantityAccepted;
        balance.quarantinedQuantity += (input.quantityQuarantined || 0);
        balance.updatedAt = new Date().toISOString();
      }
      this.stockBalances.set(balanceKey, balance);

      // Record in Stock Movement Ledger
      this.stockMovements.push({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        hospitalId: input.hospitalId,
        movementNumber: `MOV-GRN-${input.batchNumber}`,
        movementType: 'PURCHASE_RECEIPT',
        itemId: input.itemId,
        batchId,
        fromWarehouseId: null,
        toWarehouseId: grn.warehouseId,
        quantity: input.quantityAccepted,
        referenceDocType: 'GRN',
        referenceDocId: grn.grnNumber,
        userId: input.inspectorUserId,
        reason: 'Goods received and passed quality inspection',
        createdAt: new Date().toISOString(),
      });
    }

    // Update GRN status
    grn.status = inspection.status === 'PASSED' ? 'ACCEPTED' : inspection.status === 'PARTIALLY_PASSED' ? 'PARTIALLY_ACCEPTED' : 'REJECTED';
    grn.updatedAt = new Date().toISOString();
    this.goodsReceiptNotes.set(input.grnId, grn);

    // Update PO quantity received
    const po = this.purchaseOrders.get(grn.poId);
    if (po) {
      const poItem = po.items.find((i: any) => i.itemId === input.itemId);
      if (poItem) poItem.quantityReceived += input.quantityAccepted;
      po.status = po.items.every((i: any) => i.quantityReceived >= i.quantityOrdered) ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
    }

    logger.info('Quality inspection finalized', { grnId: input.grnId, accepted: input.quantityAccepted, rejected: input.quantityRejected });
    return inspection;
  }

  // 8. Multi-Store Stock Movements & FEFO Issue
  public async issueStockToDepartment(hospitalId: string, itemId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number, userId: string, reason: string): Promise<any> {
    const fromBalanceKey = `${hospitalId}-${fromWarehouseId}-${itemId}`;
    const fromBalance = this.stockBalances.get(fromBalanceKey);

    if (!fromBalance || fromBalance.availableQuantity < quantity) {
      throw new Error(`Conflict: Insufficient available stock in source warehouse. Available: ${fromBalance ? fromBalance.availableQuantity : 0}, Requested: ${quantity}`);
    }

    // FEFO: Sort active batches by earliest expiry date
    const eligibleBatches = Array.from(this.stockBatches.values())
      .filter(b => b.hospitalId === hospitalId && b.itemId === itemId && b.warehouseId === fromWarehouseId && b.currentQuantity > 0 && b.qualityStatus === 'ACCEPTED')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    let qtyRemaining = quantity;
    const allocatedBatches: Array<{ batchId: string; batchNumber: string; qty: number }> = [];

    for (const batch of eligibleBatches) {
      if (qtyRemaining <= 0) break;
      const takeQty = Math.min(batch.currentQuantity, qtyRemaining);
      batch.currentQuantity -= takeQty;
      qtyRemaining -= takeQty;
      allocatedBatches.push({ batchId: batch.id, batchNumber: batch.batchNumber, qty: takeQty });
    }

    // Deduct from Source Balance
    fromBalance.totalQuantity -= quantity;
    fromBalance.availableQuantity -= quantity;
    fromBalance.updatedAt = new Date().toISOString();
    this.stockBalances.set(fromBalanceKey, fromBalance);

    // Add to Destination Balance
    const toBalanceKey = `${hospitalId}-${toWarehouseId}-${itemId}`;
    let toBalance = this.stockBalances.get(toBalanceKey);
    if (!toBalance) {
      toBalance = {
        id: `bal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        hospitalId,
        itemId,
        warehouseId: toWarehouseId,
        totalQuantity: quantity,
        availableQuantity: quantity,
        reservedQuantity: 0,
        quarantinedQuantity: 0,
        updatedAt: new Date().toISOString(),
      };
    } else {
      toBalance.totalQuantity += quantity;
      toBalance.availableQuantity += quantity;
      toBalance.updatedAt = new Date().toISOString();
    }
    this.stockBalances.set(toBalanceKey, toBalance);

    // Record Stock Movement Ledger
    const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const movement = {
      id: movId,
      hospitalId,
      movementNumber: `MOV-TRF-${Date.now()}`,
      movementType: 'DEPARTMENT_TRANSFER',
      itemId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      allocatedBatches,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.stockMovements.push(movement);

    logger.info('Stock successfully issued to department sub-store via FEFO', { itemId, fromWarehouseId, toWarehouseId, quantity });
    return movement;
  }

  public async recordDepartmentConsumption(hospitalId: string, itemId: string, warehouseId: string, quantity: number, referenceDocId: string, userId: string, reason: string): Promise<any> {
    const balanceKey = `${hospitalId}-${warehouseId}-${itemId}`;
    const balance = this.stockBalances.get(balanceKey);

    if (!balance || balance.availableQuantity < quantity) {
      throw new Error(`Conflict: Insufficient departmental stock for consumption. Available: ${balance ? balance.availableQuantity : 0}, Required: ${quantity}`);
    }

    balance.totalQuantity -= quantity;
    balance.availableQuantity -= quantity;
    balance.updatedAt = new Date().toISOString();
    this.stockBalances.set(balanceKey, balance);

    const mov = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      hospitalId,
      movementNumber: `MOV-CONS-${Date.now()}`,
      movementType: 'CLINICAL_CONSUMPTION',
      itemId,
      fromWarehouseId: warehouseId,
      toWarehouseId: null,
      quantity,
      referenceDocType: 'CLINICAL_ORDER',
      referenceDocId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.stockMovements.push(mov);
    return mov;
  }

  // 9. Stock Reconciliation & Physical Inventory Counting
  public async reconcileStockCount(hospitalId: string, itemId: string, warehouseId: string, countedQuantity: number, countedByUserId: string, reason: string): Promise<any> {
    const balanceKey = `${hospitalId}-${warehouseId}-${itemId}`;
    const balance = this.stockBalances.get(balanceKey);

    const systemQuantity = balance ? balance.availableQuantity : 0;
    const variance = countedQuantity - systemQuantity;

    if (!balance) {
      this.stockBalances.set(balanceKey, {
        id: `bal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        hospitalId,
        itemId,
        warehouseId,
        totalQuantity: countedQuantity,
        availableQuantity: countedQuantity,
        reservedQuantity: 0,
        quarantinedQuantity: 0,
        updatedAt: new Date().toISOString(),
      });
    } else {
      balance.totalQuantity = countedQuantity;
      balance.availableQuantity = countedQuantity;
      balance.updatedAt = new Date().toISOString();
      this.stockBalances.set(balanceKey, balance);
    }

    // Log cycle count adjustment in stock movement ledger
    const adj = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      hospitalId,
      movementNumber: `MOV-ADJ-${Date.now()}`,
      movementType: 'CYCLE_COUNT_ADJUSTMENT',
      itemId,
      fromWarehouseId: warehouseId,
      toWarehouseId: null,
      quantity: Math.abs(variance),
      systemQuantity,
      countedQuantity,
      variance,
      userId: countedByUserId,
      reason: `Physical count variance adjustment: ${reason}`,
      createdAt: new Date().toISOString(),
    };
    this.stockMovements.push(adj);

    logger.info('Physical stock count reconciled', { itemId, systemQuantity, countedQuantity, variance });
    return adj;
  }

  // 10. Three-Way Matching & General Ledger Accounting
  public async matchSupplierInvoice(input: SupplierInvoiceInput): Promise<any> {
    const po = this.purchaseOrders.get(input.poId);
    if (!po) throw new Error('Purchase order not found');
    const grn = this.goodsReceiptNotes.get(input.grnId);
    if (!grn) throw new Error('Goods receipt note not found');

    // Prevent duplicate invoice submission for same vendor & invoice number
    const exists = Array.from(this.supplierInvoices.values()).some(
      inv => inv.hospitalId === input.hospitalId && inv.vendorId === input.vendorId && inv.invoiceNumber === input.invoiceNumber
    );
    if (exists) {
      throw new Error(`Conflict: Supplier invoice ${input.invoiceNumber} has already been recorded`);
    }

    // 3-Way Match Validation (PO Grand Total == Invoice Grand Total within ₹0.05 tolerance)
    const isAmountMatched = Math.abs(po.grandTotal - input.grandTotal) < 0.05;
    const matchStatus = isAmountMatched ? 'MATCHED' : 'PRICE_DISCREPANCY';

    if (!isAmountMatched) {
      throw new Error(`3-Way Matching Failure: Invoice grand total ₹${input.grandTotal} does not match PO grand total ₹${po.grandTotal}`);
    }

    const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Generate balanced double-entry Journal Voucher to General Ledger:
    // Debit: Inventory / Medical Supplies Asset = input.subtotal
    // Debit: Input GST Tax Asset = input.taxAmount
    // Credit: Accounts Payable (Vendor Liability) = input.grandTotal
    const jvId = `jv-ap-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const journalVoucher = {
      id: jvId,
      hospitalId: input.hospitalId,
      voucherNumber: `JV-AP-${input.invoiceNumber}`,
      description: `Accounts Payable Invoice Accrual for Vendor ${po.vendorName} (PO: ${po.poNumber})`,
      entries: [
        { account: 'INVENTORY_AND_MEDICAL_SUPPLIES', debit: input.subtotal, credit: 0 },
        { account: 'INPUT_GST_TAX_ASSET', debit: input.taxAmount, credit: 0 },
        { account: 'ACCOUNTS_PAYABLE_VENDORS', debit: 0, credit: input.grandTotal },
      ],
      totalDebit: input.grandTotal,
      totalCredit: input.grandTotal,
      isBalanced: true,
      postedAt: new Date().toISOString(),
    };
    this.generalLedgerVouchers.push(journalVoucher);

    const invoice = {
      id,
      hospitalId: input.hospitalId,
      vendorId: input.vendorId,
      poId: input.poId,
      grnId: input.grnId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate || new Date().toISOString().split('T')[0],
      subtotal: input.subtotal,
      taxAmount: input.taxAmount,
      grandTotal: input.grandTotal,
      threeWayMatchStatus: matchStatus,
      paymentStatus: 'UNPAID',
      glJournalVoucherId: jvId,
      createdAt: new Date().toISOString(),
    };
    this.supplierInvoices.set(id, invoice);

    logger.info('3-Way invoice matched and posted to General Ledger', { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal, jvId });
    return { invoice, journalVoucher };
  }

  // 11. Fixed Assets & Biomedical Equipment Management
  public async registerAsset(input: AssetInput): Promise<any> {
    const id = `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const exists = Array.from(this.assets.values()).some(
      a => a.hospitalId === input.hospitalId && a.assetTag === input.assetTag
    );
    if (exists) {
      throw new Error(`Conflict: Asset tag ${input.assetTag} already exists`);
    }

    const asset = {
      id,
      hospitalId: input.hospitalId,
      assetTag: input.assetTag.toUpperCase(),
      name: input.name,
      category: input.category,
      itemId: input.itemId || null,
      serialNumber: input.serialNumber,
      manufacturer: input.manufacturer,
      model: input.model,
      departmentId: input.departmentId,
      locationRoom: input.locationRoom,
      purchaseCost: input.purchaseCost,
      purchaseDate: input.purchaseDate,
      warrantyExpiryDate: input.warrantyExpiryDate || null,
      operationalStatus: 'OPERATIONAL',
      lastCalibrationDate: input.lastCalibrationDate || input.purchaseDate,
      nextCalibrationDue: input.nextCalibrationDue || '2027-11-09',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.assets.set(id, asset);
    return asset;
  }

  public async schedulePreventiveMaintenance(input: MaintenanceScheduleInput): Promise<any> {
    const asset = this.assets.get(input.assetId);
    if (!asset) throw new Error('Asset not found');

    const id = `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sched = {
      id,
      hospitalId: input.hospitalId,
      assetId: input.assetId,
      assetTag: asset.assetTag,
      maintenanceType: input.maintenanceType || 'PPM_PREVENTIVE',
      frequencyDays: input.frequencyDays,
      nextDueDate: input.nextDueDate,
      assignedEngineerId: input.assignedEngineerId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.maintenanceSchedules.set(id, sched);
    return sched;
  }

  public async createBreakdownWorkOrder(input: WorkOrderInput): Promise<any> {
    const asset = this.assets.get(input.assetId);
    if (!asset) throw new Error('Asset not found');

    const id = `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const wo = {
      id,
      hospitalId: input.hospitalId,
      workOrderNumber: input.workOrderNumber,
      assetId: input.assetId,
      assetTag: asset.assetTag,
      reportedByUserId: input.reportedByUserId,
      departmentId: input.departmentId,
      issueDescription: input.issueDescription,
      priority: input.priority || 'HIGH',
      assignedTechnicianId: input.assignedTechnicianId || null,
      sparePartsCost: 0,
      downtimeHours: 0,
      returnToServiceCertifiedBy: null,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workOrders.set(id, wo);

    // Flip asset operational status to UNDER_REPAIR
    asset.operationalStatus = 'UNDER_REPAIR';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(input.assetId, asset);

    logger.warn('Biomedical equipment breakdown ticket created', { workOrderNumber: wo.workOrderNumber, assetTag: asset.assetTag });
    return wo;
  }

  public async resolveWorkOrder(workOrderId: string, downtimeHours: number, sparePartsCost: number, certifiedByUserId: string): Promise<any> {
    const wo = this.workOrders.get(workOrderId);
    if (!wo) throw new Error('Work order not found');

    const asset = this.assets.get(wo.assetId);
    if (!asset) throw new Error('Asset not found');

    wo.downtimeHours = downtimeHours;
    wo.sparePartsCost = sparePartsCost;
    wo.returnToServiceCertifiedBy = certifiedByUserId;
    wo.status = 'CLOSED';
    wo.updatedAt = new Date().toISOString();
    this.workOrders.set(workOrderId, wo);

    // Return asset to OPERATIONAL status
    asset.operationalStatus = 'OPERATIONAL';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(asset.id, asset);

    logger.info('Biomedical equipment repair certified and returned to service', {
      workOrderId,
      assetTag: asset.assetTag,
      downtimeHours,
      certifiedBy: certifiedByUserId,
    });
    return { workOrder: wo, asset };
  }

  // 12. Procurement & Inventory Analytics
  public async getProcurementMetrics(hospitalId: string): Promise<any> {
    const venCount = Array.from(this.vendors.values()).filter(v => v.hospitalId === hospitalId && v.isActive).length;
    const whCount = Array.from(this.warehouses.values()).filter(w => w.hospitalId === hospitalId).length;
    const itemCount = Array.from(this.items.values()).filter(i => i.hospitalId === hospitalId).length;
    const assetCount = Array.from(this.assets.values()).filter(a => a.hospitalId === hospitalId).length;
    const activeWoCount = Array.from(this.workOrders.values()).filter(wo => wo.hospitalId === hospitalId && wo.status !== 'CLOSED').length;
    const pendingPoCount = Array.from(this.purchaseOrders.values()).filter(po => po.hospitalId === hospitalId && po.status === 'ISSUED').length;

    // Calculate total inventory valuation
    let totalVal = 0;
    for (const b of this.stockBalances.values()) {
      if (b.hospitalId === hospitalId) {
        const itm = this.items.get(b.itemId);
        const cost = itm ? itm.standardCost : 100;
        totalVal += b.availableQuantity * cost;
      }
    }

    return {
      activeVendors: venCount,
      warehouses: whCount,
      catalogItems: itemCount,
      totalAssets: assetCount,
      activeBreakdownWorkOrders: activeWoCount,
      pendingPurchaseOrders: pendingPoCount,
      totalInventoryValuation: Math.round(totalVal * 100) / 100,
    };
  }
}

export const procurementAdvancedService = new ProcurementAdvancedService();


import { db } from '../../../database';
import {
  ReportQueryRequest,
  ReportQueryResult,
  ReportFilterCriteria,
  ReportAggregationCriteria,
} from '../types';

export class ReportBuilderService {
  // Whitelist approved datasets and their queryable fields to prevent arbitrary SQL injection
  private static allowedDatasets: Record<string, { table: string; fields: string[] }> = {
    appointments: {
      table: 'appointments',
      fields: ['id', 'appointment_number', 'patient_id', 'doctor_id', 'department_id', 'appointment_date', 'status', 'appointment_type', 'consultation_fee', 'created_at'],
    },
    invoices: {
      table: 'invoices',
      fields: ['id', 'invoice_number', 'patient_id', 'billing_category', 'gross_amount', 'discount_amount', 'tax_amount', 'net_payable', 'total_paid', 'outstanding_balance', 'payment_status', 'created_at'],
    },
    patients: {
      table: 'patients',
      fields: ['id', 'uhid', 'first_name', 'last_name', 'gender', 'date_of_birth', 'city', 'state', 'blood_group', 'created_at', 'is_active'],
    },
    beds: {
      table: 'beds',
      fields: ['id', 'bed_number', 'ward_id', 'bed_type', 'status', 'daily_rate', 'is_active'],
    },
    lab_orders: {
      table: 'lab_orders',
      fields: ['id', 'order_number', 'patient_id', 'ordering_doctor_id', 'priority', 'order_status', 'created_at'],
    },
    pharmacy_sales: {
      table: 'pharmacy_dispenses',
      fields: ['id', 'dispense_number', 'prescription_id', 'patient_id', 'status', 'total_amount', 'dispensed_at'],
    },
  };

  /**
   * Executes a parameterized, validated report query with tenant isolation
   */
  public static async executeQuery(
    hospitalId: string,
    query: ReportQueryRequest,
    isSuperAdmin: boolean = false
  ): Promise<ReportQueryResult> {
    const datasetConfig = this.allowedDatasets[query.dataset];
    if (!datasetConfig) {
      throw new Error(`Dataset '${query.dataset}' is not approved for custom reporting`);
    }

    // Validate requested fields
    const validFields = query.fields.filter((f) => datasetConfig.fields.includes(f));
    const fieldsToSelect = validFields.length > 0 ? validFields : datasetConfig.fields;

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 1000);
    const offset = (page - 1) * limit;

    let baseQuery = db(datasetConfig.table);

    // Enforce Tenant Isolation
    if (!isSuperAdmin) {
      baseQuery = baseQuery.where({ hospital_id: hospitalId });
    }

    // Apply Date Range filter if present
    if (query.dateRange && query.dateRange.startDate && query.dateRange.endDate) {
      const dateField = query.dateRange.field || 'created_at';
      if (datasetConfig.fields.includes(dateField)) {
        baseQuery = baseQuery.whereBetween(dateField, [
          new Date(query.dateRange.startDate),
          new Date(query.dateRange.endDate),
        ]);
      }
    }

    // Apply Parameterized Filters
    if (query.filters && Array.isArray(query.filters)) {
      for (const filter of query.filters) {
        if (!datasetConfig.fields.includes(filter.field)) continue;
        baseQuery = this.applyFilter(baseQuery, filter);
      }
    }

    // Clone query for total count calculation
    const countQuery = baseQuery.clone();
    const countResult = await countQuery.count('id as total').first();
    const totalRecords = Number(countResult?.total || 0);

    // Apply Grouping or Aggregations if requested
    if (query.aggregations && query.aggregations.length > 0 && query.groupBy && query.groupBy.length > 0) {
      const validGroupFields = query.groupBy.filter((g) => datasetConfig.fields.includes(g));
      baseQuery = baseQuery.select(validGroupFields).groupBy(validGroupFields);

      for (const agg of query.aggregations) {
        if (!datasetConfig.fields.includes(agg.field)) continue;
        const alias = agg.alias || `${agg.function}_${agg.field}`;
        switch (agg.function) {
          case 'sum':
            baseQuery = baseQuery.sum(`${agg.field} as ${alias}`);
            break;
          case 'avg':
            baseQuery = baseQuery.avg(`${agg.field} as ${alias}`);
            break;
          case 'min':
            baseQuery = baseQuery.min(`${agg.field} as ${alias}`);
            break;
          case 'max':
            baseQuery = baseQuery.max(`${agg.field} as ${alias}`);
            break;
          case 'count':
          default:
            baseQuery = baseQuery.count(`${agg.field} as ${alias}`);
            break;
        }
      }
    } else {
      baseQuery = baseQuery.select(fieldsToSelect);
    }

    // Apply Sorting
    if (query.sortBy && query.sortBy.length > 0) {
      for (const sort of query.sortBy) {
        if (datasetConfig.fields.includes(sort.field)) {
          baseQuery = baseQuery.orderBy(sort.field, sort.direction);
        }
      }
    } else {
      baseQuery = baseQuery.orderBy('created_at', 'desc');
    }

    // Apply Pagination
    const rows = await baseQuery.limit(limit).offset(offset);

    return {
      dataset: query.dataset,
      data: rows,
      totalRecords,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      generatedAt: new Date().toISOString(),
    };
  }

  private static applyFilter(query: any, filter: ReportFilterCriteria) {
    switch (filter.operator) {
      case 'eq':
        return query.where(filter.field, filter.value);
      case 'neq':
        return query.whereNot(filter.field, filter.value);
      case 'gt':
        return query.where(filter.field, '>', filter.value);
      case 'gte':
        return query.where(filter.field, '>=', filter.value);
      case 'lt':
        return query.where(filter.field, '<', filter.value);
      case 'lte':
        return query.where(filter.field, '<=', filter.value);
      case 'contains':
        return query.whereILike(filter.field, `%${filter.value}%`);
      case 'in':
        return query.whereIn(filter.field, Array.isArray(filter.value) ? filter.value : [filter.value]);
      case 'between':
        return Array.isArray(filter.value) && filter.value.length === 2
          ? query.whereBetween(filter.field, filter.value)
          : query;
      default:
        return query;
    }
  }

  public static getApprovedDatasets() {
    return Object.keys(this.allowedDatasets).map((key) => ({
      dataset: key,
      table: this.allowedDatasets[key].table,
      fields: this.allowedDatasets[key].fields,
    }));
  }
}


export type MetricCategory =
  | 'clinical'
  | 'operational'
  | 'financial'
  | 'pharmacy'
  | 'laboratory'
  | 'radiology'
  | 'saas_platform'
  | 'hr';

export interface MetricDefinition {
  code: string;
  name: string;
  category: MetricCategory;
  formulaDescription: string;
  mathematicalFormula: string;
  sourceTables: string[];
  unitOfMeasure: 'percentage' | 'currency_inr' | 'days' | 'hours' | 'count';
  isSaasExclusive: boolean;
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'between';

export interface ReportFilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface ReportAggregationCriteria {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias?: string;
}

export interface ReportQueryRequest {
  dataset: string; // e.g. 'appointments', 'invoices', 'beds', 'patients', 'lab_orders', 'pharmacy_sales'
  fields: string[];
  filters?: ReportFilterCriteria[];
  groupBy?: string[];
  aggregations?: ReportAggregationCriteria[];
  sortBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  page?: number;
  limit?: number;
  dateRange?: {
    field?: string;
    startDate: string;
    endDate: string;
  };
}

export interface ReportQueryResult<T = any> {
  dataset: string;
  data: T[];
  totalRecords: number;
  page: number;
  limit: number;
  totalPages: number;
  summaryAggregates?: Record<string, number>;
  generatedAt: string;
}

export interface SavedReportDTO {
  id?: string;
  hospitalId?: string;
  reportDefinitionCode: string;
  name: string;
  description?: string;
  selectedFields: string[];
  appliedFilters: ReportFilterCriteria[];
  groupByFields?: string[];
  chartType?: 'bar' | 'line' | 'donut' | 'table';
  isSharedWithTeam?: boolean;
}

export interface ReportScheduleDTO {
  id?: string;
  hospitalId?: string;
  savedReportId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  exportFormat: 'pdf' | 'xlsx' | 'csv' | 'json';
  deliveryChannels: Array<'email' | 'in_app'>;
  recipientEmails: string[];
  isActive: boolean;
}

export interface ExportJobProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  exportFormat: 'csv' | 'xlsx' | 'pdf' | 'json';
  downloadUrl?: string;
  downloadExpiresAt?: string;
  totalRecords?: number;
  fileByteSize?: number;
  errorMessage?: string;
}

export interface DataQualityIssue {
  id: string;
  checkCategory: 'missing_data' | 'duplicate_records' | 'reconciliation_variance' | 'invalid_timestamps' | 'unmapped_codes';
  entityTable: string;
  recordReferenceId?: string;
  issueDescription: string;
  varianceAmount?: number;
  severity: 'info' | 'warning' | 'critical';
  detectedAt: string;
}


import { MetricDefinition } from '../types';

export class MetricDefinitionsRegistry {
  private static metrics: Map<string, MetricDefinition> = new Map([
    [
      'ALOS',
      {
        code: 'ALOS',
        name: 'Average Length of Stay (ALOS)',
        category: 'clinical',
        formulaDescription: 'Total inpatient bed days of care divided by total discharged inpatients within the reporting interval.',
        mathematicalFormula: 'SUM(discharge_date - admission_date) / COUNT(discharged_admissions)',
        sourceTables: ['admissions'],
        unitOfMeasure: 'days',
        isSaasExclusive: false,
      },
    ],
    [
      'BED_OCCUPANCY_RATE',
      {
        code: 'BED_OCCUPANCY_RATE',
        name: 'Inpatient Bed Occupancy Rate',
        category: 'operational',
        formulaDescription: 'Percentage of currently occupied operational inpatient beds relative to total available hospital capacity.',
        mathematicalFormula: '(COUNT(occupied_beds) / COUNT(operational_beds)) * 100',
        sourceTables: ['beds'],
        unitOfMeasure: 'percentage',
        isSaasExclusive: false,
      },
    ],
    [
      'LAB_TAT',
      {
        code: 'LAB_TAT',
        name: 'Laboratory Turnaround Time (TAT)',
        category: 'laboratory',
        formulaDescription: 'Elapsed time from physical specimen receipt/accessioning to pathologist digital approval and release.',
        mathematicalFormula: 'AVG(approved_at - received_at)',
        sourceTables: ['lab_orders', 'lab_results'],
        unitOfMeasure: 'hours',
        isSaasExclusive: false,
      },
    ],
    [
      'GROSS_REVENUE',
      {
        code: 'GROSS_REVENUE',
        name: 'Gross Recognized Billings',
        category: 'financial',
        formulaDescription: 'Total financial charges generated across OPD, IPD, Diagnostics, and Pharmacy before taxes and discounts.',
        mathematicalFormula: 'SUM(gross_amount)',
        sourceTables: ['invoices'],
        unitOfMeasure: 'currency_inr',
        isSaasExclusive: false,
      },
    ],
    [
      'NET_COLLECTIONS',
      {
        code: 'NET_COLLECTIONS',
        name: 'Net Cash & Digital Collections',
        category: 'financial',
        formulaDescription: 'Actual cash, card, and UPI funds collected and settled, minus approved patient refunds.',
        mathematicalFormula: 'SUM(payments.amount_paid) - SUM(refunds.refund_amount)',
        sourceTables: ['payments', 'refunds'],
        unitOfMeasure: 'currency_inr',
        isSaasExclusive: false,
      },
    ],
    [
      'FEFO_EXPIRY_RISK',
      {
        code: 'FEFO_EXPIRY_RISK',
        name: 'Near-Expiry Stock Valuation',
        category: 'pharmacy',
        formulaDescription: 'Total monetary purchase value of active pharmaceutical batches expiring within 90 days.',
        mathematicalFormula: 'SUM(remaining_quantity * unit_cost_price) WHERE expiry_date <= NOW() + 90 DAYS',
        sourceTables: ['medicine_batches'],
        unitOfMeasure: 'currency_inr',
        isSaasExclusive: false,
      },
    ],
    [
      'MRR',
      {
        code: 'MRR',
        name: 'Monthly Recurring Revenue (MRR)',
        category: 'saas_platform',
        formulaDescription: 'Normalized monthly subscription revenue across all active hospital tenant organizations.',
        mathematicalFormula: 'SUM(subscription_plans.price_monthly)',
        sourceTables: ['hospital_subscriptions', 'subscription_plans'],
        unitOfMeasure: 'currency_inr',
        isSaasExclusive: true,
      },
    ],
    [
      'ARR',
      {
        code: 'ARR',
        name: 'Annual Recurring Revenue (ARR)',
        category: 'saas_platform',
        formulaDescription: 'Annualized recurring revenue based on current active monthly contracted subscription run-rate.',
        mathematicalFormula: 'MRR * 12',
        sourceTables: ['hospital_subscriptions'],
        unitOfMeasure: 'currency_inr',
        isSaasExclusive: true,
      },
    ],
    [
      'CHURN_RATE',
      {
        code: 'CHURN_RATE',
        name: 'Tenant Churn Rate',
        category: 'saas_platform',
        formulaDescription: 'Percentage of hospital subscriptions cancelled or terminated during a monthly period relative to starting cohort.',
        mathematicalFormula: '(cancelled_tenants_period / active_tenants_start) * 100',
        sourceTables: ['hospitals'],
        unitOfMeasure: 'percentage',
        isSaasExclusive: true,
      },
    ],
  ]);

  public static getMetric(code: string): MetricDefinition | undefined {
    return this.metrics.get(code);
  }

  public static listMetrics(category?: string): MetricDefinition[] {
    const all = Array.from(this.metrics.values());
    if (category) {
      return all.filter((m) => m.category === category);
    }
    return all;
  }
}


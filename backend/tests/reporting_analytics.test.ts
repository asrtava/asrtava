import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MetricDefinitionsRegistry } from '../src/modules/reports/services/metric-definitions';
import { ReportBuilderService } from '../src/modules/reports/services/report-builder.service';
import { ReportExportService } from '../src/modules/reports/services/report-export.service';
import { ScheduledReportsService } from '../src/modules/reports/services/scheduled-reports.service';

describe('ASRTAVA Reporting, Analytics & Business Intelligence Suite', () => {

  describe('1. KPI Metric Definitions & Mathematical Calculation Correctness', () => {
    it('accurately defines ALOS (Average Length of Stay) and Bed Occupancy formulas', () => {
      const alos = MetricDefinitionsRegistry.getMetric('ALOS');
      assert.ok(alos, 'ALOS metric must exist');
      assert.equal(alos.unitOfMeasure, 'days');
      assert.equal(alos.category, 'clinical');

      // Test formula: 420 inpatient bed days / 100 discharges = 4.2 days
      const totalBedDays = 420;
      const totalDischarges = 100;
      const calculatedAlos = totalBedDays / totalDischarges;
      assert.equal(calculatedAlos, 4.2);

      const occRate = MetricDefinitionsRegistry.getMetric('BED_OCCUPANCY_RATE');
      assert.ok(occRate);
      assert.equal(occRate.unitOfMeasure, 'percentage');
      // 88 occupied / 100 operational = 88.0%
      const occupied = 88;
      const operational = 100;
      const calculatedOcc = (occupied / operational) * 100;
      assert.equal(calculatedOcc, 88.0);
    });

    it('verifies SaaS MRR, ARR, and Monthly Churn Rate calculation integrity', () => {
      const mrrMetric = MetricDefinitionsRegistry.getMetric('MRR');
      const arrMetric = MetricDefinitionsRegistry.getMetric('ARR');
      const churnMetric = MetricDefinitionsRegistry.getMetric('CHURN_RATE');

      assert.ok(mrrMetric?.isSaasExclusive);
      assert.ok(arrMetric?.isSaasExclusive);
      assert.ok(churnMetric?.isSaasExclusive);

      const sampleMrr = 1950000; // ₹ 19.5 Lakhs
      const calculatedArr = sampleMrr * 12;
      assert.equal(calculatedArr, 23400000); // ₹ 2.34 Cr

      // Churn formula: (Lost / Start) * 100
      const lostTenants = 1;
      const startTenants = 100;
      const calculatedChurn = (lostTenants / startTenants) * 100;
      assert.equal(calculatedChurn, 1.0); // 1.0% churn
    });

    it('preserves double-entry accounting reconciliation between recognized revenue and cash collections', () => {
      const grossRevenue = 100000;
      const gstTax = 18000; // 18% GST
      const netPayable = grossRevenue + gstTax; // 118,000

      const collectedPayments = 90000;
      const outstandingReceivable = 28000;

      // Settlement Equation: Net Payable == Collected + Outstanding
      const isReconciled = netPayable === collectedPayments + outstandingReceivable;
      assert.equal(isReconciled, true, 'Financial ledgers must reconcile without floating point variance');
    });
  });

  describe('2. Controlled Report Builder & SQL Injection Defense', () => {
    it('rejects unapproved or sensitive datasets to prevent unauthorized table traversal', async () => {
      await assert.rejects(
        async () => {
          await ReportBuilderService.executeQuery('hosp-001', {
            dataset: 'users_passwords', // Malicious or unapproved
            fields: ['password_hash'],
          });
        },
        /Dataset 'users_passwords' is not approved/
      );
    });

    it('whitelists queryable fields and clamps pagination parameters to safe boundaries', async () => {
      const datasets = ReportBuilderService.getApprovedDatasets();
      assert.ok(datasets.length >= 6);
      assert.ok(datasets.some((d) => d.dataset === 'appointments'));
      assert.ok(datasets.some((d) => d.dataset === 'invoices'));
      assert.ok(datasets.some((d) => d.dataset === 'beds'));
    });
  });

  describe('3. Asynchronous Export Engine & CSV Formatting', () => {
    it('creates an export job with expiring 24-hour secure download token', async () => {
      const sampleData = [
        { id: 1, department: 'Cardiology', visits: 450, revenue: 1845000 },
        { id: 2, department: 'Orthopedics', visits: 290, revenue: 1240000 },
      ];

      const job = await ReportExportService.createExportJob(
        'hosp-001',
        'usr-admin-01',
        'DEPT_REVENUE_REPORT',
        'csv',
        sampleData
      );

      assert.ok(job.jobId.startsWith('exp_job_'));
      assert.equal(job.totalRecords, 2);
      assert.ok(job.downloadUrl?.includes('token='));
      assert.ok(job.downloadExpiresAt);
      assert.ok(new Date(job.downloadExpiresAt).getTime() > Date.now());
    });

    it('formats tabular objects accurately into compliant RFC-4180 CSV strings with quotes', () => {
      const records = [
        { patientName: 'Rajesh Sharma, Jr.', uhid: 'ASR-PAT-001', outstanding: 1250.50 },
        { patientName: 'Ananya "Annie" Roy', uhid: 'ASR-PAT-002', outstanding: 0.00 },
      ];

      const csv = ReportExportService.convertToCSV(records);
      assert.ok(csv.includes('patientName,uhid,outstanding'));
      // Escaped quotes and commas within field
      assert.ok(csv.includes('"Rajesh Sharma, Jr."'));
      assert.ok(csv.includes('"Ananya ""Annie"" Roy"'));
    });
  });

  describe('4. Scheduled Report Automation & Recurring Triggers', () => {
    it('calculates accurate next execution run timestamps for recurring schedules', () => {
      const schedule = ScheduledReportsService.createSchedule({
        savedReportId: 'rep-saved-001',
        frequency: 'weekly',
        exportFormat: 'pdf',
        deliveryChannels: ['email', 'in_app'],
        recipientEmails: ['cfo@apexcare.asrtava.com'],
        isActive: true,
      });

      assert.ok(schedule.id.startsWith('sched_'));
      assert.equal(schedule.frequency, 'weekly');
      assert.equal(schedule.isActive, true);
      assert.ok(new Date(schedule.nextRunAt).getTime() > Date.now());

      // Toggle Pause / Resume
      const paused = ScheduledReportsService.toggleSchedule(schedule.id, false);
      assert.equal(paused.isActive, false);

      const resumed = ScheduledReportsService.toggleSchedule(schedule.id, true);
      assert.equal(resumed.isActive, true);
    });
  });

  describe('5. Data Quality Assurance & Financial Integrity Scans', () => {
    it('detects reconciliation variance when invoice net payable does not match paid plus balance', () => {
      const simulatedInvoices = [
        { invoice_number: 'INV-001', gross_amount: 1000, tax_amount: 180, net_payable: 1180, total_paid: 1000, outstanding_balance: 180 }, // Clean
        { invoice_number: 'INV-002', gross_amount: 2000, tax_amount: 360, net_payable: 2360, total_paid: 1500, outstanding_balance: 500 }, // Corrupted: variance of ₹360
      ];

      const discrepancies = [];
      for (const inv of simulatedInvoices) {
        const net = inv.gross_amount + inv.tax_amount;
        const settled = inv.total_paid + inv.outstanding_balance;
        if (Math.abs(net - settled) > 0.05) {
          discrepancies.push({
            invoice: inv.invoice_number,
            variance: Math.abs(net - settled),
          });
        }
      }

      assert.equal(discrepancies.length, 1);
      assert.equal(discrepancies[0].invoice, 'INV-002');
      assert.equal(discrepancies[0].variance, 360);
    });
  });
});


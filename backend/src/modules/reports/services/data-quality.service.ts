import { db } from '../../../database';
import { DataQualityIssue } from '../types';

export class DataQualityService {
  /**
   * Runs automated integrity scans against hospital tenant records
   */
  public static async runDataQualityAudit(hospitalId: string): Promise<{
    healthScorePercentage: number;
    issuesFound: DataQualityIssue[];
    scannedEntities: { invoices: number; beds: number; patients: number; appointments: number };
  }> {
    const issues: DataQualityIssue[] = [];

    const [invoices, beds, patients, appts] = await Promise.all([
      db('invoices').where({ hospital_id: hospitalId }).select('id', 'invoice_number', 'gross_amount', 'tax_amount', 'net_payable', 'total_paid', 'outstanding_balance'),
      db('beds').where({ hospital_id: hospitalId, is_active: true }).select('id', 'bed_number', 'status'),
      db('patients').where({ hospital_id: hospitalId, is_active: true }).select('id', 'uhid', 'phone', 'first_name', 'last_name'),
      db('appointments').where({ hospital_id: hospitalId }).select('id', 'appointment_number', 'status', 'appointment_date'),
    ]);

    // 1. Check Invoice Financial Balance Arithmetic
    for (const inv of invoices) {
      const computedNet = Number(inv.gross_amount || 0) + Number(inv.tax_amount || 0);
      const settledBalance = Number(inv.total_paid || 0) + Number(inv.outstanding_balance || 0);
      const variance = Math.abs(computedNet - settledBalance);

      if (variance > 0.05) {
        issues.push({
          id: `dq_inv_${inv.id}`,
          checkCategory: 'reconciliation_variance',
          entityTable: 'invoices',
          recordReferenceId: inv.invoice_number,
          issueDescription: `Invoice ${inv.invoice_number} has an arithmetic discrepancy of ₹${variance.toFixed(2)} between net payable and paid+balance.`,
          varianceAmount: variance,
          severity: 'critical',
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Check for Duplicate Mobile Numbers in Active Patient Directory
    const phoneMap = new Map<string, string[]>();
    for (const pat of patients) {
      if (pat.phone && pat.phone.length >= 10) {
        const list = phoneMap.get(pat.phone) || [];
        list.push(pat.uhid);
        phoneMap.set(pat.phone, list);
      }
    }

    for (const [phone, uhids] of phoneMap.entries()) {
      if (uhids.length > 1) {
        issues.push({
          id: `dq_pat_dup_${phone}`,
          checkCategory: 'duplicate_records',
          entityTable: 'patients',
          recordReferenceId: uhids.join(', '),
          issueDescription: `Multiple patient profiles (${uhids.join(', ')}) share the exact phone number: ${phone.replace(/\d(?=\d{4})/g, '*')}`,
          severity: 'warning',
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Health Score calculation (100 minus weighted penalties for issues)
    let score = 100;
    for (const iss of issues) {
      if (iss.severity === 'critical') score -= 10;
      else if (iss.severity === 'warning') score -= 3;
      else score -= 1;
    }
    score = Math.max(score, 60);

    return {
      healthScorePercentage: score,
      issuesFound: issues,
      scannedEntities: {
        invoices: invoices.length,
        beds: beds.length,
        patients: patients.length,
        appointments: appts.length,
      },
    };
  }
}


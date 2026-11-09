import crypto from 'crypto';
import { ExportJobProgress } from '../types';

export class ReportExportService {
  private static jobs: Map<string, ExportJobProgress> = new Map();

  /**
   * Initializes an asynchronous export job
   */
  public static async createExportJob(
    hospitalId: string,
    userId: string,
    reportDefinitionCode: string,
    exportFormat: 'csv' | 'xlsx' | 'pdf' | 'json',
    dataRows: any[]
  ): Promise<ExportJobProgress> {
    const jobId = `exp_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const downloadToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours TTL

    const job: ExportJobProgress = {
      jobId,
      status: 'processing',
      progressPercentage: 25,
      exportFormat,
      totalRecords: dataRows.length,
      downloadUrl: `/api/v1/reports/exports/${jobId}/download?token=${downloadToken}`,
      downloadExpiresAt: expiresAt,
    };

    this.jobs.set(jobId, job);

    // Simulate async batch formatting (CSV/JSON generation)
    setTimeout(() => {
      const formattedBytes = Buffer.byteLength(JSON.stringify(dataRows), 'utf8');
      job.progressPercentage = 100;
      job.status = 'completed';
      job.fileByteSize = formattedBytes;
    }, 100);

    return job;
  }

  public static getJobStatus(jobId: string): ExportJobProgress | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Converts tabular record objects into CSV string format
   */
  public static convertToCSV(dataRows: Record<string, any>[]): string {
    if (!dataRows || dataRows.length === 0) return '';
    const headers = Object.keys(dataRows[0]);
    const csvLines = [headers.join(',')];

    for (const row of dataRows) {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvLines.push(values.join(','));
    }

    return csvLines.join('\r\n');
  }
}


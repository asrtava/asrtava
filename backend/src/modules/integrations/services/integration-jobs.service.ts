export interface IntegrationJob {
  id: string;
  hospitalId?: string;
  jobType: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dlq';
  maxRetries: number;
  retryCount: number;
  nextRetryAt: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export class IntegrationJobsService {
  private static jobs: Map<string, IntegrationJob> = new Map();

  /**
   * Enqueues a job into the outbox queue
   */
  public static enqueueJob(jobType: string, payload: any, hospitalId?: string): IntegrationJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: IntegrationJob = {
      id,
      hospitalId,
      jobType,
      payload,
      status: 'pending',
      maxRetries: 3,
      retryCount: 0,
      nextRetryAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    return job;
  }

  /**
   * Processes a job with exponential backoff on failure
   */
  public static async executeJob(jobId: string, executor: (payload: any) => Promise<any>): Promise<IntegrationJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();

    try {
      await executor(job.payload);
      job.status = 'completed';
      job.updatedAt = new Date().toISOString();
      return job;
    } catch (err: any) {
      job.retryCount += 1;
      job.lastError = err.message || 'Execution error';

      if (job.retryCount >= job.maxRetries) {
        job.status = 'dlq'; // Move to Dead-Letter Queue
      } else {
        job.status = 'failed';
        // Exponential backoff: 2^retryCount seconds
        const delaySeconds = Math.pow(2, job.retryCount);
        job.nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
      }
      job.updatedAt = new Date().toISOString();
      return job;
    }
  }

  /**
   * Admin replay capability for DLQ jobs
   */
  public static replayDlqJob(jobId: string): IntegrationJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    job.status = 'pending';
    job.retryCount = 0;
    job.nextRetryAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    return job;
  }

  public static listJobs(filterStatus?: string): IntegrationJob[] {
    const all = Array.from(this.jobs.values());
    if (filterStatus) {
      return all.filter((j) => j.status === filterStatus);
    }
    return all;
  }
}


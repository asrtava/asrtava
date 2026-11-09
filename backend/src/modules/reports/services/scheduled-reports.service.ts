import { ReportScheduleDTO } from '../types';

export class ScheduledReportsService {
  private static schedules: Map<string, ReportScheduleDTO & { nextRunAt: string; lastRunAt?: string }> = new Map();

  public static createSchedule(dto: ReportScheduleDTO): ReportScheduleDTO & { id: string; nextRunAt: string } {
    const id = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nextRun = this.calculateNextRun(dto.frequency);

    const record = {
      ...dto,
      id,
      nextRunAt: nextRun.toISOString(),
      isActive: true,
    };

    this.schedules.set(id, record);
    return record;
  }

  public static listSchedules(hospitalId: string) {
    return Array.from(this.schedules.values()).filter(
      (s) => !s.hospitalId || s.hospitalId === hospitalId
    );
  }

  public static toggleSchedule(scheduleId: string, isActive: boolean) {
    const sched = this.schedules.get(scheduleId);
    if (!sched) throw new Error(`Schedule ${scheduleId} not found`);
    sched.isActive = isActive;
    return sched;
  }

  private static calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Date {
    const d = new Date();
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        d.setHours(8, 0, 0, 0); // 8 AM next day
        return d;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        d.setHours(8, 0, 0, 0);
        return d;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
        d.setHours(8, 0, 0, 0);
        return d;
      case 'quarterly':
        d.setMonth(d.getMonth() + 3);
        d.setDate(1);
        d.setHours(8, 0, 0, 0);
        return d;
    }
  }
}


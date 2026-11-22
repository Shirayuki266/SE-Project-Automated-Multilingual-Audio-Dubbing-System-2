import { statsRepository } from '../repositories/statsRepository.js';
import { dailyVisitService } from './dailyVisitService.js';

class StatsService {
  private isValidDate(str: any): boolean {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return false;
    }
    const d = new Date(str + 'T00:00:00Z');
    return !isNaN(d.getTime());
  }

  /**
   * Chuẩn hóa và xác thực khoảng thời gian ngày (from, to)
   */
  public sanitizeDateRange(
    rawFrom?: string,
    rawTo?: string,
    defaultDaysBack: number = 6
  ): { from: string; to: string } {
    const today = dailyVisitService.getVietnamDateString();

    let to = this.isValidDate(rawTo) ? (rawTo as string) : today;
    if (to > today) {
      to = today;
    }

    let from: string;
    if (this.isValidDate(rawFrom)) {
      from = rawFrom as string;
    } else {
      const d = new Date(to + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - defaultDaysBack);
      from = d.toISOString().slice(0, 10);
    }

    // Đảm bảo from <= to
    if (from > to) {
      const temp = from;
      from = to;
      to = temp;
    }

    return { from, to };
  }

  public async getVisitorStats(rawFrom?: string, rawTo?: string, rawGranularity?: string) {
    const granularity: 'day' | 'month' = rawGranularity === 'month' ? 'month' : 'day';
    // Mặc định: ngày thì 7 ngày gần nhất; tháng thì 6 tháng gần nhất
    const defaultDays = granularity === 'month' ? 180 : 6;
    const { from, to } = this.sanitizeDateRange(rawFrom, rawTo, defaultDays);

    return statsRepository.getVisitorStats(from, to, granularity);
  }

  public async getSummary() {
    const today = dailyVisitService.getVietnamDateString();
    return statsRepository.getSummaryStats(today);
  }
}

export const statsService = new StatsService();

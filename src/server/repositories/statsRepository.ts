import { mongoManager } from './mongoClient.js';
import { poiRepository } from './poiRepository.js';
import { db } from './db.js';
import { DailyVisitDocument, POITranslation, POIEntity, POIMedia, Campus } from '../types.js';

export interface SummaryStatsResult {
  todayVisits: number;
  totalPois: number;
  totalCampuses: number;
  totalMedia: number;
  translations: {
    total: number;
    audioReady: number;
    audioMissing: number;
    audioTts: number;
    audioManual: number;
  };
  storageStatus: {
    collectionsCount: number;
    standardCollections: string[];
  };
}

export interface VisitorStatsResult {
  granularity: 'day' | 'month';
  from: string;
  to: string;
  totalVisits: number;
  items: Array<{
    period: string; // 'YYYY-MM-DD' hoặc 'YYYY-MM'
    visits: number;
  }>;
}

export class StatsRepository {
  // In-Memory fallback store cho lượt khách chiêm bái theo ngày khi MongoDB offline
  private inMemoryDailyVisits: Map<string, number> = new Map();

  public recordInMemoryVisit(day: string): void {
    const current = this.inMemoryDailyVisits.get(day) || 0;
    this.inMemoryDailyVisits.set(day, current + 1);
  }

  /**
   * Helper: Tạo danh sách các ngày liên tục từ `from` đến `to` (YYYY-MM-DD)
   */
  public generateDateRange(from: string, to: string): string[] {
    const dates: string[] = [];
    const current = new Date(from + 'T00:00:00Z');
    const endDate = new Date(to + 'T00:00:00Z');

    if (isNaN(current.getTime()) || isNaN(endDate.getTime())) {
      return [from];
    }

    while (current <= endDate) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }

  /**
   * Helper: Tạo danh sách các tháng liên tục từ `from` đến `to` (YYYY-MM)
   */
  public generateMonthRange(from: string, to: string): string[] {
    const months: string[] = [];
    const fromMonth = from.slice(0, 7);
    const toMonth = to.slice(0, 7);

    const [startYear, startM] = fromMonth.split('-').map(Number);
    const [endYear, endM] = toMonth.split('-').map(Number);

    if (!startYear || !startM || !endYear || !endM) {
      return [fromMonth];
    }

    let y = startYear;
    let m = startM;

    while (y < endYear || (y === endYear && m <= endM)) {
      const monthStr = `${y}-${String(m).padStart(2, '0')}`;
      months.push(monthStr);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return months;
  }

  /**
   * Thống kê tổng hợp số liệu trực tiếp bằng countDocuments từ 6 collections chuẩn:
   * 1. campuses, 2. pois, 3. poi_translations, 4. poi_media, 5. admin_users, 6. daily_visits
   */
  public async getSummaryStats(today: string): Promise<SummaryStatsResult> {
    const colVisits = mongoManager.getCollection<DailyVisitDocument>('daily_visits');
    const colPois = mongoManager.getCollection<POIEntity>('pois');
    const colTrans = mongoManager.getCollection<POITranslation>('poi_translations');
    const colMedia = mongoManager.getCollection<POIMedia>('poi_media');
    const colCampuses = mongoManager.getCollection<Campus>('campuses');

    let todayVisits = 0;
    let totalPois = 0;
    let totalCampuses = 0;
    let totalMedia = 0;
    let totalTrans = 0;
    let audioReady = 0;
    let audioTts = 0;
    let audioManual = 0;

    if (colVisits && colPois && colTrans) {
      try {
        [todayVisits, totalPois, totalCampuses, totalMedia, totalTrans] = await Promise.all([
          colVisits.countDocuments({ day: today }),
          colPois.countDocuments(),
          colCampuses ? colCampuses.countDocuments() : 1,
          colMedia ? colMedia.countDocuments() : 0,
          colTrans.countDocuments(),
        ]);

        audioReady = await colTrans.countDocuments({
          audio_url: { $exists: true, $nin: [null, ''] } as any,
        });

        audioManual = await colTrans.countDocuments({
          $or: [
            { audio_source: 'manual' },
            { audio_url: { $regex: '^/audio/manual-' } },
          ],
        });

        audioTts = Math.max(0, audioReady - audioManual);
      } catch (err: any) {
        console.warn('[StatsRepository] MongoDB summary count fallback:', err.message);
      }
    }

    // Fallback qua Embedded Engine nếu MongoDB offline hoặc chưa nạp
    if (totalPois === 0) {
      const allPois = db.getAllPOIs();
      totalPois = allPois.length;
      totalCampuses = db.getAllCampuses().length;

      let transList: POITranslation[] = [];
      let mediaCount = 0;
      allPois.forEach((p) => {
        transList.push(...Object.values(p.translations || {}));
        mediaCount += p.media?.length || 0;
      });

      totalMedia = mediaCount;
      totalTrans = transList.length;
      audioReady = transList.filter((t) => Boolean(t.audio_url)).length;
      audioManual = transList.filter(
        (t) => t.audio_source === 'manual' || (t.audio_url && t.audio_url.startsWith('/audio/manual-'))
      ).length;
      audioTts = Math.max(0, audioReady - audioManual);

      const memVisits = this.inMemoryDailyVisits.get(today) || 0;
      todayVisits = Math.max(todayVisits, memVisits);
    }

    return {
      todayVisits,
      totalPois,
      totalCampuses,
      totalMedia,
      translations: {
        total: totalTrans,
        audioReady,
        audioMissing: Math.max(0, totalTrans - audioReady),
        audioTts,
        audioManual,
      },
      storageStatus: {
        collectionsCount: 6,
        standardCollections: [
          'campuses',
          'pois',
          'poi_translations',
          'poi_media',
          'admin_users',
          'daily_visits',
        ],
      },
    };
  }

  /**
   * Thống kê lượt khách chiêm bái theo khoảng thời gian trực tiếp từ `daily_visits`
   * Bằng câu lệnh MongoDB aggregate `$match` + `$group` trên collection daily_visits
   */
  public async getVisitorStats(
    from: string,
    to: string,
    granularity: 'day' | 'month' = 'day'
  ): Promise<VisitorStatsResult> {
    const colVisits = mongoManager.getCollection<DailyVisitDocument>('daily_visits');
    const countsMap = new Map<string, number>();

    if (colVisits) {
      try {
        const pipeline: any[] = [
          { $match: { day: { $gte: from, $lte: to } } },
          {
            $group: {
              _id: granularity === 'month' ? { $substr: ['$day', 0, 7] } : '$day',
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];

        const aggregated = await colVisits.aggregate(pipeline).toArray();
        aggregated.forEach((item: any) => {
          countsMap.set(String(item._id), Number(item.count) || 0);
        });
      } catch (err: any) {
        console.warn('[StatsRepository] aggregate daily_visits notice:', err.message);
      }
    }

    // Trộn thêm In-Memory visits nếu có
    for (const [day, count] of this.inMemoryDailyVisits.entries()) {
      if (day >= from && day <= to) {
        const key = granularity === 'month' ? day.slice(0, 7) : day;
        countsMap.set(key, (countsMap.get(key) || 0) + count);
      }
    }

    // Đảm bảo zero-filling liên tục cho mọi ngày/tháng trong khoảng
    const periods =
      granularity === 'month'
        ? this.generateMonthRange(from, to)
        : this.generateDateRange(from, to);

    let totalVisits = 0;
    const items = periods.map((period) => {
      const visits = countsMap.get(period) || 0;
      totalVisits += visits;
      return {
        period,
        visits,
      };
    });

    return {
      granularity,
      from,
      to,
      totalVisits,
      items,
    };
  }
}

export const statsRepository = new StatsRepository();

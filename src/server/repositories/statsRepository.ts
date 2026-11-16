import { mongoManager } from './mongoClient.js';
import { poiRepository } from './poiRepository.js';
import {
  DeviceType,
  DailyStatsDocument,
  POIListenStatsDocument,
  POIDailyListenDocument,
} from '../types.js';

export class StatsRepository {
  // In-Memory Fallback stores when MongoDB is offline
  private inMemoryDailyStats: Map<string, DailyStatsDocument> = new Map();
  private inMemoryPoiListenStats: Map<string, POIListenStatsDocument> = new Map();
  private inMemoryPoiDailyListens: Set<string> = new Set();

  /**
   * Helper: Tạo danh sách tất cả các ngày từ `from` đến `to` (YYYY-MM-DD)
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
   * Helper: Tạo danh sách các tháng từ `from` đến `to` (YYYY-MM)
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
   * Ghi nhận lượt truy cập mới của thiết bị trong ngày (chỉ gọi khi visitorHash mới)
   */
  public async recordDailyVisit(date: string, deviceType: DeviceType): Promise<void> {
    const validDevice: DeviceType = ['iphone', 'android', 'pc', 'other'].includes(deviceType)
      ? deviceType
      : 'other';

    // 1. Cập nhật In-Memory
    const existing = this.inMemoryDailyStats.get(date) || {
      date,
      uniqueDevices: 0,
      device: { iphone: 0, android: 0, pc: 0, other: 0 },
    };
    existing.uniqueDevices += 1;
    existing.device[validDevice] = (existing.device[validDevice] || 0) + 1;
    this.inMemoryDailyStats.set(date, existing);

    // 2. Cập nhật MongoDB nếu online
    const col = mongoManager.getCollection<DailyStatsDocument>('daily_stats');
    if (col) {
      try {
        await col.updateOne(
          { date },
          {
            $inc: {
              uniqueDevices: 1,
              [`device.${validDevice}`]: 1,
            },
          },
          { upsert: true }
        );
      } catch (err: any) {
        console.warn('[StatsRepository] recordDailyVisit notice:', err.message);
      }
    }
  }

  /**
   * Kiểm tra thiết bị này đã nghe POI này hôm nay chưa (dùng hash tạm 24h, không lưu định danh lâu dài)
   */
  public async checkAndRecordPoiUnique(
    day: string,
    poiId: string,
    visitorHash: string
  ): Promise<boolean> {
    const memoryKey = `${day}:${poiId}:${visitorHash}`;
    let isNewInMemory = false;
    if (!this.inMemoryPoiDailyListens.has(memoryKey)) {
      this.inMemoryPoiDailyListens.add(memoryKey);
      isNewInMemory = true;
    }

    const col = mongoManager.getCollection<POIDailyListenDocument>('poi_daily_listens');
    if (col) {
      try {
        const result = await col.updateOne(
          { day, poiId, visitorHash },
          {
            $setOnInsert: {
              day,
              poiId,
              visitorHash,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        return (result.upsertedCount ?? 0) > 0;
      } catch (err: any) {
        if (err.code === 11000) return false;
        console.warn('[StatsRepository] checkAndRecordPoiUnique notice:', err.message);
        return isNewInMemory;
      }
    }

    return isNewInMemory;
  }

  /**
   * Ghi nhận lượt nghe POI (tăng tổng lượt nghe và số thiết bị unique)
   */
  public async recordPoiListen(
    date: string,
    poiId: string,
    lang: string,
    isUniqueDevice: boolean,
    durationSeconds: number = 0
  ): Promise<void> {
    const safeDuration = Math.max(0, Math.min(3600, Math.round(durationSeconds)));
    const memoryKey = `${date}:${poiId}:${lang}`;

    // 1. In-Memory
    const existing = this.inMemoryPoiListenStats.get(memoryKey) || {
      date,
      poiId,
      lang,
      listens: 0,
      uniqueDevices: 0,
      totalDurationSeconds: 0,
    };
    existing.listens += 1;
    if (isUniqueDevice) existing.uniqueDevices += 1;
    existing.totalDurationSeconds = (existing.totalDurationSeconds || 0) + safeDuration;
    this.inMemoryPoiListenStats.set(memoryKey, existing);

    // 2. MongoDB
    const col = mongoManager.getCollection<POIListenStatsDocument>('poi_listen_stats');
    if (col) {
      try {
        await col.updateOne(
          { date, poiId, lang },
          {
            $inc: {
              listens: 1,
              uniqueDevices: isUniqueDevice ? 1 : 0,
              totalDurationSeconds: safeDuration,
            },
          },
          { upsert: true }
        );
      } catch (err: any) {
        console.warn('[StatsRepository] recordPoiListen notice:', err.message);
      }
    }
  }

  /**
   * Thống kê lưu lượng du khách theo ngày hoặc tháng, điền 0 cho ngày/tháng trống
   */
  public async getVisitorStats(
    from: string,
    to: string,
    granularity: 'day' | 'month' = 'day'
  ): Promise<{
    granularity: 'day' | 'month';
    from: string;
    to: string;
    totalUniqueDevices: number;
    items: {
      period: string;
      uniqueDevices: number;
      iphone: number;
      android: number;
      pc: number;
      other: number;
    }[];
  }> {
    let rawDocs: DailyStatsDocument[] = [];
    const col = mongoManager.getCollection<DailyStatsDocument>('daily_stats');

    if (col) {
      try {
        rawDocs = await col
          .find({ date: { $gte: from, $lte: to } })
          .sort({ date: 1 })
          .toArray();
      } catch (err: any) {
        console.warn('[StatsRepository] getVisitorStats Mongo fallback to memory:', err.message);
      }
    }

    if (rawDocs.length === 0) {
      // Fallback in-memory
      for (const doc of this.inMemoryDailyStats.values()) {
        if (doc.date >= from && doc.date <= to) {
          rawDocs.push(doc);
        }
      }
    }

    // Map doc theo date
    const docMap = new Map<string, DailyStatsDocument>();
    for (const d of rawDocs) {
      docMap.set(d.date, d);
    }

    if (granularity === 'month') {
      const monthRange = this.generateMonthRange(from, to);
      const monthMap = new Map<
        string,
        { uniqueDevices: number; iphone: number; android: number; pc: number; other: number }
      >();

      for (const m of monthRange) {
        monthMap.set(m, { uniqueDevices: 0, iphone: 0, android: 0, pc: 0, other: 0 });
      }

      for (const d of rawDocs) {
        const m = d.date.slice(0, 7);
        const cur = monthMap.get(m) || { uniqueDevices: 0, iphone: 0, android: 0, pc: 0, other: 0 };
        cur.uniqueDevices += d.uniqueDevices || 0;
        cur.iphone += d.device?.iphone || 0;
        cur.android += d.device?.android || 0;
        cur.pc += d.device?.pc || 0;
        cur.other += d.device?.other || 0;
        monthMap.set(m, cur);
      }

      let totalUniqueDevices = 0;
      const items = monthRange.map((m) => {
        const entry = monthMap.get(m)!;
        totalUniqueDevices += entry.uniqueDevices;
        return {
          period: m,
          uniqueDevices: entry.uniqueDevices,
          iphone: entry.iphone,
          android: entry.android,
          pc: entry.pc,
          other: entry.other,
        };
      });

      return {
        granularity: 'month',
        from,
        to,
        totalUniqueDevices,
        items,
      };
    }

    // Granularity === 'day'
    const dateRange = this.generateDateRange(from, to);
    let totalUniqueDevices = 0;

    const items = dateRange.map((date) => {
      const entry = docMap.get(date);
      const uniqueDevices = entry?.uniqueDevices || 0;
      totalUniqueDevices += uniqueDevices;
      return {
        period: date,
        uniqueDevices,
        iphone: entry?.device?.iphone || 0,
        android: entry?.device?.android || 0,
        pc: entry?.device?.pc || 0,
        other: entry?.device?.other || 0,
      };
    });

    return {
      granularity: 'day',
      from,
      to,
      totalUniqueDevices,
      items,
    };
  }

  /**
   * Thống kê phân loại thiết bị (iPhone, Android, PC, Khác) kèm tỷ lệ phần trăm
   */
  public async getDeviceStats(
    from: string,
    to: string
  ): Promise<{
    from: string;
    to: string;
    total: number;
    breakdown: {
      iphone: number;
      android: number;
      pc: number;
      other: number;
    };
    percentages: {
      iphone: number;
      android: number;
      pc: number;
      other: number;
    };
  }> {
    let rawDocs: DailyStatsDocument[] = [];
    const col = mongoManager.getCollection<DailyStatsDocument>('daily_stats');

    if (col) {
      try {
        rawDocs = await col.find({ date: { $gte: from, $lte: to } }).toArray();
      } catch (err: any) {
        console.warn('[StatsRepository] getDeviceStats fallback to memory:', err.message);
      }
    }

    if (rawDocs.length === 0) {
      for (const doc of this.inMemoryDailyStats.values()) {
        if (doc.date >= from && doc.date <= to) {
          rawDocs.push(doc);
        }
      }
    }

    const breakdown = { iphone: 0, android: 0, pc: 0, other: 0 };
    for (const d of rawDocs) {
      breakdown.iphone += d.device?.iphone || 0;
      breakdown.android += d.device?.android || 0;
      breakdown.pc += d.device?.pc || 0;
      breakdown.other += d.device?.other || 0;
    }

    const total = breakdown.iphone + breakdown.android + breakdown.pc + breakdown.other;

    const percentages = {
      iphone: total > 0 ? Math.round((breakdown.iphone / total) * 1000) / 10 : 0,
      android: total > 0 ? Math.round((breakdown.android / total) * 1000) / 10 : 0,
      pc: total > 0 ? Math.round((breakdown.pc / total) * 1000) / 10 : 0,
      other: total > 0 ? Math.round((breakdown.other / total) * 1000) / 10 : 0,
    };

    return {
      from,
      to,
      total,
      breakdown,
      percentages,
    };
  }

  /**
   * Bảng xếp hạng Top POI được nghe nhiều nhất
   */
  public async getTopPOIs(
    from: string,
    to: string,
    lang?: string,
    limit: number = 10
  ): Promise<{
    from: string;
    to: string;
    lang: string;
    items: {
      poiId: string;
      title: string;
      listens: number;
      uniqueDevices: number;
      avgDurationSeconds: number;
    }[];
  }> {
    const filter: Record<string, any> = {
      date: { $gte: from, $lte: to },
    };
    if (lang && lang !== 'all') {
      filter.lang = lang;
    }

    let rawDocs: POIListenStatsDocument[] = [];
    const col = mongoManager.getCollection<POIListenStatsDocument>('poi_listen_stats');

    if (col) {
      try {
        rawDocs = await col.find(filter).toArray();
      } catch (err: any) {
        console.warn('[StatsRepository] getTopPOIs fallback to memory:', err.message);
      }
    }

    if (rawDocs.length === 0) {
      for (const doc of this.inMemoryPoiListenStats.values()) {
        const matchesDate = doc.date >= from && doc.date <= to;
        const matchesLang = !lang || lang === 'all' || doc.lang === lang;
        if (matchesDate && matchesLang) {
          rawDocs.push(doc);
        }
      }
    }

    // Nhóm theo poiId
    const poiAgg = new Map<
      string,
      { listens: number; uniqueDevices: number; totalDuration: number }
    >();

    for (const d of rawDocs) {
      const cur = poiAgg.get(d.poiId) || { listens: 0, uniqueDevices: 0, totalDuration: 0 };
      cur.listens += d.listens || 0;
      cur.uniqueDevices += d.uniqueDevices || 0;
      cur.totalDuration += d.totalDurationSeconds || 0;
      poiAgg.set(d.poiId, cur);
    }

    // Lấy thông tin POI
    const allPois = await poiRepository.findAll();
    const poiTitleMap = new Map<string, string>();
    for (const p of allPois) {
      const title = p.translations?.['vi']?.title || p.currentTitle || p.code;
      poiTitleMap.set(p.poi_id, title);
      poiTitleMap.set(p.code, title);
    }

    const items = Array.from(poiAgg.entries())
      .map(([poiId, stats]) => {
        const title = poiTitleMap.get(poiId) || poiId;
        const avgDurationSeconds =
          stats.listens > 0 ? Math.round(stats.totalDuration / stats.listens) : 0;
        return {
          poiId,
          title,
          listens: stats.listens,
          uniqueDevices: stats.uniqueDevices,
          avgDurationSeconds,
        };
      })
      .sort((a, b) => b.listens - a.listens)
      .slice(0, Math.max(1, Math.min(100, limit)));

    return {
      from,
      to,
      lang: lang || 'all',
      items,
    };
  }

  /**
   * Thống kê tổng hợp cho thẻ thông tin (Hôm nay, 7 ngày, tháng này, tổng lượt nghe)
   */
  public async getSummaryStats(todayDate: string): Promise<{
    todayDevices: number;
    sevenDaysDevices: number;
    thisMonthDevices: number;
    totalListens: number;
    totalUniqueDevices: number;
  }> {
    const today = todayDate;
    const sevenDaysAgoDate = new Date(today + 'T00:00:00Z');
    sevenDaysAgoDate.setUTCDate(sevenDaysAgoDate.getUTCDate() - 6);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    const dayStats = await this.getVisitorStats('2026-01-01', today, 'day');

    let todayDevices = 0;
    let sevenDaysDevices = 0;
    let thisMonthDevices = 0;
    let totalUniqueDevices = 0;

    for (const item of dayStats.items) {
      if (item.period === today) todayDevices += item.uniqueDevices;
      if (item.period >= sevenDaysAgo && item.period <= today) sevenDaysDevices += item.uniqueDevices;
      if (item.period >= monthStart && item.period <= today) thisMonthDevices += item.uniqueDevices;
      totalUniqueDevices += item.uniqueDevices;
    }

    // Tính tổng lượt nghe POI
    let totalListens = 0;
    const col = mongoManager.getCollection<POIListenStatsDocument>('poi_listen_stats');
    if (col) {
      try {
        const allListens = await col.find({}).toArray();
        for (const l of allListens) {
          totalListens += l.listens || 0;
        }
      } catch {}
    }
    if (totalListens === 0) {
      for (const l of this.inMemoryPoiListenStats.values()) {
        totalListens += l.listens || 0;
      }
    }

    return {
      todayDevices: Math.max(todayDevices, 1),
      sevenDaysDevices: Math.max(sevenDaysDevices, todayDevices),
      thisMonthDevices: Math.max(thisMonthDevices, todayDevices),
      totalListens,
      totalUniqueDevices: Math.max(totalUniqueDevices, 1),
    };
  }
}

export const statsRepository = new StatsRepository();

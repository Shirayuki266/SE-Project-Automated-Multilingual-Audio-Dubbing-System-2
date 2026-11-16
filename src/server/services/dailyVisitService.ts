import crypto from 'crypto';
import { mongoManager } from '../repositories/mongoClient.js';
import { statsRepository } from '../repositories/statsRepository.js';
import { DailyVisitDocument, DailyVisitCheckinResult, classifyDevice } from '../types.js';

class DailyVisitService {
  // In-Memory Fallback Set để kiểm tra deduplication khi MongoDB offline
  private inMemoryVisitedHashes: Set<string> = new Set();
  /**
   * Tạo mã hash ẩn danh của thiết bị bằng HMAC-SHA256
   * Tuyệt đối không lưu IP thô hay deviceId thô vào DB.
   */
  public generateVisitorHash(deviceId: string, userAgent?: string): string {
    const salt = process.env.VISITOR_HASH_SALT || 'vnqt_default_salt_2026';
    const rawSignature = `${deviceId || 'anon'}|||${userAgent || 'generic'}`;
    return crypto.createHmac('sha256', salt).update(rawSignature).digest('hex');
  }

  /**
   * Lấy ngày hiện tại định dạng YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
   */
  public getVietnamDateString(date = new Date()): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  /**
   * Ghi nhận lượt truy cập của thiết bị trong ngày.
   * Dùng Unique Index (day, visitorHash) + upsert.
   * 1 thiết bị = 1 người = tối đa 1 lượt tính trong 1 ngày, dù spam bao nhiêu request.
   */
  public async recordVisit(
    deviceId: string,
    userAgent?: string,
    maxTouchPoints: number = 0
  ): Promise<DailyVisitCheckinResult> {
    const day = this.getVietnamDateString();
    const visitorHash = this.generateVisitorHash(deviceId, userAgent);
    const memoryKey = `${day}:${visitorHash}`;

    let isNewToday = false;
    const col = mongoManager.getCollection<DailyVisitDocument>('daily_visits');

    if (col) {
      try {
        const result = await col.updateOne(
          { day, visitorHash },
          {
            $setOnInsert: {
              day,
              visitorHash,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        isNewToday = (result.upsertedCount ?? 0) > 0;
      } catch (err: any) {
        if (err.code !== 11000) {
          console.warn('[DailyVisitService] updateOne notice:', err.message);
        }
        isNewToday = false;
      }
    } else {
      // In-Memory Fallback
      if (!this.inMemoryVisitedHashes.has(memoryKey)) {
        this.inMemoryVisitedHashes.add(memoryKey);
        isNewToday = true;
      }
    }

    // Nếu là thiết bị mới trong ngày, ghi nhận vào bảng tổng hợp daily_stats (không lưu định danh)
    if (isNewToday) {
      const deviceType = classifyDevice(userAgent, maxTouchPoints);
      await statsRepository.recordDailyVisit(day, deviceType);
    }

    const todayUniqueVisitors = await this.getTodayCount();

    return {
      day,
      isNewToday,
      todayUniqueVisitors,
      message: isNewToday
        ? `Ghi nhận khách hành hương mới thành công cho ngày ${day}.`
        : `Thiết bị đã được ghi nhận trong ngày ${day}. Hệ thống chỉ tính tối đa 1 lượt/người/ngày.`,
    };
  }

  /**
   * Ghi nhận sự kiện nghe POI khi thời lượng phát đạt ngưỡng (≥ 5s)
   */
  public async recordPoiListen(
    deviceId: string,
    userAgent?: string,
    maxTouchPoints: number = 0,
    poiId?: string,
    lang: string = 'vi',
    durationSeconds: number = 0
  ): Promise<{ success: boolean; isUniqueDevice: boolean; message: string }> {
    if (!poiId || typeof poiId !== 'string') {
      return { success: false, isUniqueDevice: false, message: 'Mã POI không hợp lệ.' };
    }

    const day = this.getVietnamDateString();
    const visitorHash = this.generateVisitorHash(deviceId, userAgent);

    // 1. Kiểm tra và ghi nhận thiết bị unique cho POI trong ngày (dùng bảng tạm 24h)
    const isUniqueDevice = await statsRepository.checkAndRecordPoiUnique(day, poiId, visitorHash);

    // 2. Tăng số liệu tổng hợp trong poi_listen_stats
    await statsRepository.recordPoiListen(day, poiId, lang, isUniqueDevice, durationSeconds);

    return {
      success: true,
      isUniqueDevice,
      message: isUniqueDevice
        ? `Đã ghi nhận lượt nghe mới từ thiết bị cho điểm chiêm bái ${poiId}.`
        : `Đã tăng tổng lượt nghe cho điểm chiêm bái ${poiId}.`,
    };
  }

  /**
   * Đếm tổng số khách thực duy nhất trong ngày hôm nay
   */
  public async getTodayCount(): Promise<number> {
    const day = this.getVietnamDateString();
    const col = mongoManager.getCollection<DailyVisitDocument>('daily_visits');
    if (!col) {
      const memoryCount = Array.from(this.inMemoryVisitedHashes).filter((k) => k.startsWith(day + ':')).length;
      return Math.max(memoryCount, 1);
    }

    try {
      const count = await col.countDocuments({ day });
      return Math.max(count, 1);
    } catch {
      const memoryCount = Array.from(this.inMemoryVisitedHashes).filter((k) => k.startsWith(day + ':')).length;
      return Math.max(memoryCount, 1);
    }
  }
}

export const dailyVisitService = new DailyVisitService();

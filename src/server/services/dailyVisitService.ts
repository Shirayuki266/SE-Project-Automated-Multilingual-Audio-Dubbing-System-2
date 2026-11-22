import crypto from 'crypto';
import { mongoManager } from '../repositories/mongoClient.js';
import { DailyVisitDocument, DailyVisitCheckinResult } from '../types.js';

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
   * Chỉ kích hoạt khi du khách bấm nút "Bắt Đầu Chiêm Bái".
   * Sử dụng Compound Unique Index (day, visitorHash) + $setOnInsert (đúng 4 trường: _id, visitorHash, day, createdAt).
   * 1 thiết bị = 1 người = tối đa 1 lượt tính trong 1 ngày, chống trùng lặp tuyệt đối.
   */
  public async recordVisit(
    deviceId: string,
    userAgent?: string
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
   * Đếm tổng số khách thực duy nhất trong ngày hôm nay (trực tiếp countDocuments từ daily_visits)
   */
  public async getTodayCount(): Promise<number> {
    const day = this.getVietnamDateString();
    const col = mongoManager.getCollection<DailyVisitDocument>('daily_visits');
    if (!col) {
      const memoryCount = Array.from(this.inMemoryVisitedHashes).filter((k) => k.startsWith(day + ':')).length;
      return memoryCount;
    }

    try {
      return await col.countDocuments({ day });
    } catch {
      const memoryCount = Array.from(this.inMemoryVisitedHashes).filter((k) => k.startsWith(day + ':')).length;
      return memoryCount;
    }
  }
}

export const dailyVisitService = new DailyVisitService();

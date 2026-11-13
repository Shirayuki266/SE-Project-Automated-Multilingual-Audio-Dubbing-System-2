import crypto from 'crypto';
import { mongoManager } from '../repositories/mongoClient.js';
import { DailyVisitDocument, DailyVisitCheckinResult } from '../types.js';

class DailyVisitService {
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
  public async recordVisit(deviceId: string, userAgent?: string): Promise<DailyVisitCheckinResult> {
    const day = this.getVietnamDateString();
    const visitorHash = this.generateVisitorHash(deviceId, userAgent);
    const col = mongoManager.getCollection<DailyVisitDocument>('daily_visits');

    let isNewToday = false;

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
   * Đếm tổng số khách thực duy nhất trong ngày hôm nay
   */
  public async getTodayCount(): Promise<number> {
    const day = this.getVietnamDateString();
    const col = mongoManager.getCollection<DailyVisitDocument>('daily_visits');
    if (!col) return 1;

    try {
      const count = await col.countDocuments({ day });
      return Math.max(count, 1);
    } catch {
      return 1;
    }
  }
}

export const dailyVisitService = new DailyVisitService();

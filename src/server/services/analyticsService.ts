import { analyticsRepository } from '../repositories/analyticsRepository.js';
import { PilgrimageStats } from '../types.js';

// Recent taps cache for throttling repeated clicks within 30 seconds
const recentTaps = new Map<string, number>();

export class AnalyticsService {
  public registerPilgrimageStart(
    fingerprintHash: string,
    language: string,
    userAgent?: string,
    ipAddress?: string
  ): { success: boolean; isNewToday: boolean; message: string } {
    if (!fingerprintHash || fingerprintHash.length < 8) {
      throw new Error('Dấu vân tay trình duyệt không hợp lệ.');
    }

    const now = Date.now();
    const lastTap = recentTaps.get(fingerprintHash);

    // Throttle spam: if user clicked within the last 15 seconds, acknowledge without duplicating
    if (lastTap && now - lastTap < 15000) {
      return {
        success: true,
        isNewToday: false,
        message: 'Lượt bắt đầu đã được ghi nhận trước đó vài giây.',
      };
    }

    recentTaps.set(fingerprintHash, now);

    // Clean up old cache keys (> 1 hour)
    if (recentTaps.size > 1000) {
      const oneHourAgo = now - 3600000;
      for (const [key, time] of recentTaps.entries()) {
        if (time < oneHourAgo) recentTaps.delete(key);
      }
    }

    const { isNewToday } = analyticsRepository.logPilgrimage(
      fingerprintHash,
      language || 'vi',
      userAgent,
      ipAddress
    );

    return {
      success: true,
      isNewToday,
      message: isNewToday
        ? 'Chào mừng quý Phật tử đã bắt đầu chuyến chiêm bái hôm nay.'
        : 'Chào mừng quý Phật tử quay lại hành trình chiêm bái.',
    };
  }

  public getDashboardStats(): PilgrimageStats {
    return analyticsRepository.getStats();
  }
}

export const analyticsService = new AnalyticsService();

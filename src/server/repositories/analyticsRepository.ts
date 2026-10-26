import { db } from './db.js';
import { PilgrimageStats } from '../types.js';

export class AnalyticsRepository {
  public checkinDevice(
    fingerprintHash: string,
    language: string = 'vi',
    userAgent?: string,
    ipHash?: string
  ) {
    return db.recordDeviceCheckin(fingerprintHash, language, userAgent, ipHash);
  }

  public getDeviceStatusToday(fingerprintHash: string) {
    return db.getDeviceStatusToday(fingerprintHash);
  }

  public logPilgrimage(
    fingerprintHash: string,
    language: string,
    userAgent?: string,
    ipHash?: string
  ): { isNewToday: boolean } {
    return db.recordPilgrimage(fingerprintHash, language, userAgent, ipHash);
  }

  public getVisitorAnalytics(filter: any) {
    return db.getVisitorAnalytics(filter);
  }

  public getStats(): PilgrimageStats {
    return db.getStats();
  }
}

export const analyticsRepository = new AnalyticsRepository();

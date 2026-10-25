import { db } from './db.js';
import { PilgrimageLog, PilgrimageStats } from '../types.js';

export class AnalyticsRepository {
  public logPilgrimage(
    fingerprintHash: string,
    language: string,
    userAgent?: string,
    ipHash?: string
  ): { isNewToday: boolean; log: PilgrimageLog } {
    return db.recordPilgrimage(fingerprintHash, language, userAgent, ipHash);
  }

  public getStats(): PilgrimageStats {
    return db.getStats();
  }
}

export const analyticsRepository = new AnalyticsRepository();

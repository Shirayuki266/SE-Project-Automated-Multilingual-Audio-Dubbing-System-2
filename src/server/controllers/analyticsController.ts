import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  // POST /api/analytics/pilgrimage-start
  public startPilgrimage(req: Request, res: Response) {
    try {
      const { fingerprintHash, language } = req.body;
      const userAgent = req.headers['user-agent'] as string;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = analyticsService.registerPilgrimageStart(
        fingerprintHash,
        language,
        userAgent,
        clientIp
      );

      return res.json({
        success: true,
        isNewToday: result.isNewToday,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // GET /api/analytics/stats
  public getStats(req: Request, res: Response) {
    try {
      const stats = analyticsService.getDashboardStats();
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();

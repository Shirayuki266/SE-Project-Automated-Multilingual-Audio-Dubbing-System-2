import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  // POST /api/analytics/device-checkin
  public checkinDevice(req: Request, res: Response) {
    try {
      const { fingerprintHash, language } = req.body;
      const userAgent = req.headers['user-agent'] as string;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = analyticsService.checkinDevice(
        fingerprintHash,
        language || 'vi',
        userAgent,
        clientIp
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // GET /api/analytics/device-status
  public getDeviceStatus(req: Request, res: Response) {
    try {
      const fingerprint = req.query.fingerprint as string;
      const status = analyticsService.getDeviceStatus(fingerprint);
      return res.json({ success: true, data: status });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

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

  // GET /api/analytics/visitors
  public getVisitors(req: Request, res: Response) {
    try {
      const { preset, startDate, endDate, search } = req.query;
      const data = analyticsService.getVisitorAnalytics({
        preset: preset as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
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

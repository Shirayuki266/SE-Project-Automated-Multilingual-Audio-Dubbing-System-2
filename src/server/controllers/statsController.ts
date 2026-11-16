import { Request, Response } from 'express';
import { statsService } from '../services/statsService.js';
import { dailyVisitService } from '../services/dailyVisitService.js';

class StatsController {
  public async getVisitors(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, granularity } = req.query as {
        from?: string;
        to?: string;
        granularity?: string;
      };
      const result = await statsService.getVisitorStats(from, to, granularity);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi lấy thống kê lưu lượng.' });
    }
  }

  public async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const result = await statsService.getDeviceStats(from, to);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi lấy thống kê thiết bị.' });
    }
  }

  public async getTopPOIs(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, lang, limit } = req.query as {
        from?: string;
        to?: string;
        lang?: string;
        limit?: string;
      };
      const result = await statsService.getTopPOIs(from, to, lang, limit);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi lấy xếp hạng POI.' });
    }
  }

  public async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const result = await statsService.getSummary();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi lấy dữ liệu tổng hợp.' });
    }
  }

  public async recordListen(req: Request, res: Response): Promise<void> {
    try {
      const { poiId, lang, deviceId, maxTouchPoints, duration } = req.body || {};
      const userAgent = (req.headers['user-agent'] as string) || '';
      const touchPoints = Number(maxTouchPoints) || 0;
      const durationSeconds = Number(duration) || 5;

      const result = await dailyVisitService.recordPoiListen(
        deviceId || 'anon-client',
        userAgent,
        touchPoints,
        poiId,
        lang || 'vi',
        durationSeconds
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi ghi nhận lượt nghe.' });
    }
  }
}

export const statsController = new StatsController();

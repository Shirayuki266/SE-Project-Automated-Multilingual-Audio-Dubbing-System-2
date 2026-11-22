import { Request, Response } from 'express';
import { statsService } from '../services/statsService.js';

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

  public async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const result = await statsService.getSummary();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi khi lấy dữ liệu tổng hợp.' });
    }
  }
}

export const statsController = new StatsController();

import { Request, Response } from 'express';
import { db } from '../repositories/db.js';

export class RealDeviceController {
  /**
   * POST /api/real-devices/checkin
   * Ghi nhận thiết bị THỰC TẾ truy cập hệ thống (không tạo ảo).
   */
  public async checkin(req: Request, res: Response) {
    try {
      const { deviceId, screenResolution, language, timezone } = req.body || {};
      const userAgent = (req.headers['user-agent'] as string) || '';
      const ipAddress =
        ((req.headers['x-forwarded-for'] as string) || '').split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      if (!deviceId && !userAgent) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin thiết bị.' });
      }

      const device = await db.recordRealDeviceAccess({
        deviceId: deviceId || `dev_${Math.random().toString(36).slice(2, 10)}`,
        ipAddress,
        userAgent,
        screenResolution,
        language,
        timezone,
      });

      return res.json({
        success: true,
        data: device,
        message: 'Đã ghi nhận thiết bị thực tế vào MongoDB "real_devices".',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/real-devices
   * Lấy danh sách và thống kê các thiết bị thực trong bảng MongoDB "real_devices".
   */
  public async getRealDevices(req: Request, res: Response) {
    try {
      const { search, role, status, deviceType } = req.query;

      const result = await db.getRealDevices({
        search: search as string,
        role: (role as any) || 'all',
        status: (status as any) || 'all',
        deviceType: deviceType as string,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/real-devices/:id/block
   * Khóa hoặc mở khóa thiết bị thực trong MongoDB.
   */
  public async toggleBlock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isBlocked, notes } = req.body;

      const updated = await db.toggleBlockRealDevice(id, Boolean(isBlocked), notes);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy thiết bị thực.' });
      }

      return res.json({
        success: true,
        data: updated,
        message: isBlocked ? 'Đã chặn thiết bị thành công.' : 'Đã mở khóa thiết bị thành công.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/real-devices/:id
   * Xóa thiết bị thực khỏi bảng MongoDB.
   */
  public async deleteDevice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await db.deleteRealDevice(id);
      return res.json({
        success: true,
        deleted,
        message: 'Đã xóa thiết bị thực khỏi bảng MongoDB.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const realDeviceController = new RealDeviceController();

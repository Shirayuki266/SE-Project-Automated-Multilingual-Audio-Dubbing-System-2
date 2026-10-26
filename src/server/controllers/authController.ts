import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { db } from '../repositories/db.js';

export class AuthController {
  // POST /api/auth/login
  public async login(req: Request, res: Response) {
    try {
      const { username, password, deviceId, screenResolution } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
      }

      const result = authService.login(username, password);
      if (!result.success) {
        return res.status(401).json({ success: false, error: result.error });
      }

      // Ghi nhận thiết bị thực tế đăng nhập tài khoản vào MongoDB collection "real_devices" (Không tạo ảo)
      const userAgent = (req.headers['user-agent'] as string) || '';
      const ipAddress =
        ((req.headers['x-forwarded-for'] as string) || '').split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      if (result.user) {
        db.recordRealDeviceLogin({
          deviceId: (deviceId as string) || (req.headers['x-device-id'] as string),
          username: result.user.username,
          role: 'admin',
          ipAddress,
          userAgent,
          screenResolution,
        }).catch((err) => console.warn('[MongoDB real_devices] login sync notice:', err.message));
      }

      return res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/auth/me
  public me(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const validation = authService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({ success: false, error: 'Phiên làm việc hết hạn hoặc không hợp lệ.' });
    }

    return res.json({ success: true, user: validation.user });
  }

  // POST /api/auth/logout
  public logout(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      authService.logout(token);
    }
    return res.json({ success: true, message: 'Đã đăng xuất.' });
  }
}

export const authController = new AuthController();

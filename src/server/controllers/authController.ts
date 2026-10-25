import { Request, Response } from 'express';
import { authService } from '../services/authService.js';

export class AuthController {
  // POST /api/auth/login
  public login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
      }

      const result = authService.login(username, password);
      if (!result.success) {
        return res.status(401).json({ success: false, error: result.error });
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

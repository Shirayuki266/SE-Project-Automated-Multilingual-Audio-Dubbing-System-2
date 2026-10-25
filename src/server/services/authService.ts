import { db } from '../repositories/db.js';
import { AdminUser } from '../types.js';
import { hashPassword, generateSecureToken } from '../../utils/cryptoUtils.js';

// Simple, secure HMAC-SHA256 session token management
const ACTIVE_SESSIONS = new Map<string, { userId: string; username: string; expiresAt: number }>();
const SECRET_KEY = process.env.AUTH_SECRET || 'vnqt_admin_jwt_secret_2026_vietnam_quoc_tu';

export { hashPassword };

export class AuthService {
  public login(username: string, password: string): { success: boolean; token?: string; user?: Omit<AdminUser, 'password_hash'>; error?: string } {
    const admin = db.getAdminByUsername(username);
    if (!admin) {
      return { success: false, error: 'Tài khoản quản trị viên không tồn tại.' };
    }

    const hashedInput = hashPassword(password);
    if (admin.password_hash !== hashedInput) {
      return { success: false, error: 'Mật khẩu quản trị không chính xác.' };
    }

    // Generate secure session token
    const token = generateSecureToken('vnqt_adm_');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    ACTIVE_SESSIONS.set(token, {
      userId: admin.user_id,
      username: admin.username,
      expiresAt,
    });

    // Update last login
    db.updateAdminLastLogin(admin.user_id);

    const { password_hash, ...safeUser } = admin;
    return {
      success: true,
      token,
      user: safeUser,
    };
  }

  public validateToken(token?: string): { valid: boolean; user?: { userId: string; username: string } } {
    if (!token) return { valid: false };
    const session = ACTIVE_SESSIONS.get(token);
    if (!session) return { valid: false };

    if (Date.now() > session.expiresAt) {
      ACTIVE_SESSIONS.delete(token);
      return { valid: false };
    }

    return {
      valid: true,
      user: { userId: session.userId, username: session.username },
    };
  }

  public logout(token: string): boolean {
    return ACTIVE_SESSIONS.delete(token);
  }
}

export const authService = new AuthService();

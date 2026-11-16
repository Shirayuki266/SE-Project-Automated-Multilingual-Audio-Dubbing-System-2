import crypto from 'crypto';
import { db } from '../repositories/db.js';
import { AdminUser } from '../types.js';
import { hashPassword } from '../../utils/cryptoUtils.js';

// In-Memory cache for speed and revoked tokens list
const ACTIVE_SESSIONS = new Map<string, { userId: string; username: string; expiresAt: number }>();
const REVOKED_TOKENS = new Set<string>();
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

    // Stateless cryptographic HMAC token generation (survives server restarts & redeploys on Render)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = JSON.stringify({
      userId: admin.user_id,
      username: admin.username,
      expiresAt,
    });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadB64).digest('base64url');
    const token = `vnqt_adm_${payloadB64}.${signature}`;

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
    if (REVOKED_TOKENS.has(token)) return { valid: false };

    // 1. Fast in-memory cache lookup
    const session = ACTIVE_SESSIONS.get(token);
    if (session) {
      if (Date.now() > session.expiresAt) {
        ACTIVE_SESSIONS.delete(token);
        return { valid: false };
      }
      return {
        valid: true,
        user: { userId: session.userId, username: session.username },
      };
    }

    // 2. Stateless cryptographic HMAC verification (survives container spin-downs & restarts on Render)
    if (token.startsWith('vnqt_adm_') && token.includes('.')) {
      try {
        const rawToken = token.slice('vnqt_adm_'.length);
        const [payloadB64, signature] = rawToken.split('.');
        if (!payloadB64 || !signature) return { valid: false };

        const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payloadB64).digest('base64url');
        if (signature !== expectedSignature) {
          return { valid: false };
        }

        const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);

        if (!payload.userId || !payload.username || !payload.expiresAt) {
          return { valid: false };
        }

        if (Date.now() > payload.expiresAt) {
          return { valid: false };
        }

        // Cache back into memory for fast subsequent requests
        ACTIVE_SESSIONS.set(token, {
          userId: payload.userId,
          username: payload.username,
          expiresAt: payload.expiresAt,
        });

        return {
          valid: true,
          user: { userId: payload.userId, username: payload.username },
        };
      } catch {
        return { valid: false };
      }
    }

    return { valid: false };
  }

  public logout(token: string): boolean {
    REVOKED_TOKENS.add(token);
    ACTIVE_SESSIONS.delete(token);
    return true;
  }
}

export const authService = new AuthService();

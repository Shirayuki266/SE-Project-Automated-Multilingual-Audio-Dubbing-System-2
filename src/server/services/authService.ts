import jwt from 'jsonwebtoken';
import { db } from '../repositories/db.js';
import { AdminUser } from '../types.js';
import { hashPassword, comparePassword } from '../../utils/cryptoUtils.js';

export { hashPassword, comparePassword };

/**
 * Cấu hình tham số bảo mật hệ thống xác thực Admin
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 phút

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
}

/**
 * Lưu bộ đếm đăng nhập sai trong bộ nhớ RAM theo từng username.
 * GHI CHÚ VỀ HẠN CHẾ KIẾN TRÚC:
 * - Dữ liệu bộ đếm được lưu in-memory nên sẽ tự động được reset nếu máy chủ bị restart/redeploy.
 * - Với môi trường production phân tán đa cụm (multi-replica/cluster), cần chuyển bộ đếm này sang
 *   Redis hoặc collection MongoDB có TTL Index để đồng bộ giữa các node máy chủ.
 */
const LOCKOUT_STORE = new Map<string, LockoutRecord>();

/**
 * Danh sách Token đã bị hủy (Blacklist khi người dùng chủ động Logout)
 */
const REVOKED_TOKENS = new Set<string>();

/**
 * Lấy khóa bí mật ký JWT từ biến môi trường.
 * Bắt buộc cấu hình JWT_SECRET, báo lỗi rõ ràng nếu thiếu khi chạy.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      '❌ [Lỗi Xác Thực Nghiêm Trọng] Biến môi trường JWT_SECRET chưa được cấu hình! Vui lòng khai báo JWT_SECRET trong file .env trước khi khởi động phiên làm việc.'
    );
  }
  return secret.trim();
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: Omit<AdminUser, 'password_hash'>;
  error?: string;
  statusCode?: number; // 401 (Sai thông tin), 423 (Bị khóa tài khoản), 400 (Thiếu dữ liệu)
}

export interface TokenValidationResult {
  valid: boolean;
  user?: { userId: string; username: string };
  error?: 'MISSING_TOKEN' | 'REVOKED_TOKEN' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'CONFIG_ERROR';
  message?: string;
}

export class AuthService {
  /**
   * Kiểm tra và xử lý đăng nhập Quản trị viên
   * - Băm và so sánh mật khẩu bằng bcrypt (salt rounds = 10)
   * - Sinh JWT thời hạn 8 giờ với thuật toán HS256
   * - Khóa tài khoản 15 phút nếu đăng nhập sai quá 5 lần liên tiếp
   */
  public login(username: string, password: string): LoginResult {
    const normalizedUser = (username || '').trim().toLowerCase();
    const now = Date.now();

    // 1. Kiểm tra trạng thái khóa tạm thời của tài khoản
    const lockout = LOCKOUT_STORE.get(normalizedUser);
    if (lockout && lockout.lockedUntil) {
      if (now < lockout.lockedUntil) {
        const remainingMinutes = Math.ceil((lockout.lockedUntil - now) / 60000);
        return {
          success: false,
          statusCode: 423,
          error: `Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        };
      }
      // Hết thời gian khóa -> Reset lại bộ đếm để người dùng thử lại
      LOCKOUT_STORE.delete(normalizedUser);
    }

    // 2. Tìm người dùng trong cơ sở dữ liệu
    const admin = db.getAdminByUsername(normalizedUser);
    if (!admin) {
      this.recordFailedAttempt(normalizedUser);
      return {
        success: false,
        statusCode: 401,
        error: 'Tài khoản quản trị viên không tồn tại.',
      };
    }

    // 3. So sánh mật khẩu bằng bcrypt.compare
    const isPasswordValid = comparePassword(password, admin.password_hash);
    if (!isPasswordValid) {
      const lockResult = this.recordFailedAttempt(normalizedUser);
      if (lockResult.isLocked) {
        return {
          success: false,
          statusCode: 423,
          error: `Tài khoản đã bị tạm khóa 15 phút do nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Vui lòng thử lại sau.`,
        };
      }

      const remainingTries = MAX_FAILED_ATTEMPTS - lockResult.attempts;
      return {
        success: false,
        statusCode: 401,
        error: `Mật khẩu quản trị không chính xác. Bạn còn ${remainingTries} lần thử trước khi tài khoản bị tạm khóa 15 phút.`,
      };
    }

    // 4. Đăng nhập thành công -> Reset hoàn toàn bộ đếm khóa tài khoản
    LOCKOUT_STORE.delete(normalizedUser);

    // 5. Sinh JWT Token bằng thư viện jsonwebtoken (HS256, expiresIn: '8h')
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        userId: admin.user_id,
        username: admin.username,
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: '8h',
      }
    );

    // Cập nhật thời điểm đăng nhập cuối cùng
    db.updateAdminLastLogin(admin.user_id);

    const { password_hash, ...safeUser } = admin;
    return {
      success: true,
      token,
      user: safeUser,
    };
  }

  /**
   * Xác thực và giải mã Token JWT bằng jsonwebtoken.verify
   * Xử lý chi tiết các trường hợp hết hạn (TokenExpiredError) và token không hợp lệ (JsonWebTokenError)
   */
  public validateToken(token?: string): TokenValidationResult {
    if (!token || token.trim() === '') {
      return {
        valid: false,
        error: 'MISSING_TOKEN',
        message: 'Yêu cầu mã xác thực JWT trong tiêu đề Authorization.',
      };
    }

    const cleanToken = token.trim();

    // Kiểm tra token đã bị thu hồi do logout
    if (REVOKED_TOKENS.has(cleanToken)) {
      return {
        valid: false,
        error: 'REVOKED_TOKEN',
        message: 'Phiên làm việc đã đăng xuất. Vui lòng đăng nhập lại.',
      };
    }

    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(cleanToken, secret, {
        algorithms: ['HS256'],
      }) as { userId: string; username: string };

      if (!decoded.userId || !decoded.username) {
        return {
          valid: false,
          error: 'INVALID_TOKEN',
          message: 'Mã xác thực JWT không chứa thông tin định danh hợp lệ.',
        };
      }

      return {
        valid: true,
        user: { userId: decoded.userId, username: decoded.username },
      };
    } catch (err: any) {
      if (err instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'TOKEN_EXPIRED',
          message: 'Mã xác thực JWT đã hết hạn sau 8 giờ. Vui lòng đăng nhập lại.',
        };
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'INVALID_TOKEN',
          message: 'Mã xác thực JWT không hợp lệ hoặc chữ ký không khớp.',
        };
      }
      return {
        valid: false,
        error: 'INVALID_TOKEN',
        message: err.message || 'Lỗi xác thực mã JWT.',
      };
    }
  }

  /**
   * Đăng xuất Quản trị viên và đưa JWT vào danh sách thu hồi (Revocation Blacklist)
   */
  public logout(token: string): boolean {
    if (token) {
      REVOKED_TOKENS.add(token.trim());
    }
    return true;
  }

  /**
   * Ghi nhận số lần đăng nhập sai và khóa tài khoản nếu đạt ngưỡng
   */
  private recordFailedAttempt(username: string): { attempts: number; isLocked: boolean } {
    const record = LOCKOUT_STORE.get(username) || { failedAttempts: 0, lockedUntil: null };
    record.failedAttempts += 1;

    if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      LOCKOUT_STORE.set(username, record);
      return { attempts: record.failedAttempts, isLocked: true };
    }

    LOCKOUT_STORE.set(username, record);
    return { attempts: record.failedAttempts, isLocked: false };
  }

  /**
   * Reset thủ công bộ đếm (tiện ích cho unit test / quản trị viên)
   */
  public resetLockout(username: string): void {
    LOCKOUT_STORE.delete(username.trim().toLowerCase());
  }
}

export const authService = new AuthService();

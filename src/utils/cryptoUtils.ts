import bcrypt from 'bcryptjs';

/**
 * Tiện ích mật mã bảo mật cho hệ thống Quản trị viên
 * Sử dụng thuật toán băm mật mã bcrypt tiêu chuẩn công nghiệp với Salt Rounds = 10.
 * Loại bỏ hoàn toàn các thuật toán băm tự chế (SHA-256 thuần nối chuỗi tĩnh).
 */

export const BCRYPT_SALT_ROUNDS = 10;

/**
 * Băm mật khẩu bằng bcrypt với salt rounds = 10
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
}

/**
 * So sánh mật khẩu dạng văn bản thô với chuỗi hash bcrypt trong cơ sở dữ liệu
 */
export function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}

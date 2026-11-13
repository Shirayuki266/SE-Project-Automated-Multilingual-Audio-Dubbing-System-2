import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../public/uploads');

export class FileStorageService {
  constructor() {
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  /**
   * Xóa file ảnh trong thư mục uploads khi đổi ảnh hoặc xóa POI
   */
  public deleteUploadedImage(imageUrl?: string): void {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
    try {
      const filename = path.basename(imageUrl);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[FileStorage] Cleaned old POI image: ${filename}`);
      }
    } catch (err: any) {
      console.warn('[FileStorage] Failed to delete image:', err.message);
    }
  }
}

export const fileStorageService = new FileStorageService();

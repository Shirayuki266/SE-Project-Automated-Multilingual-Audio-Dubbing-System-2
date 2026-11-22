import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../public/uploads');
const AUDIO_DIR = path.resolve(__dirname, '../../../public/audio');

export class FileStorageService {
  constructor() {
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory() {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true, mode: 0o777 });
      }
      if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true, mode: 0o777 });
      }
      try {
        fs.chmodSync(UPLOADS_DIR, 0o777);
        fs.chmodSync(AUDIO_DIR, 0o777);
      } catch {}
    } catch (e) {
      console.warn('[FileStorage] Notice ensuring uploads/audio directory:', e);
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

  /**
   * Xóa file audio MP3 thủ công trong thư mục audio khi đổi audio hoặc xóa bản dịch
   */
  public deleteUploadedAudio(audioUrl?: string): void {
    if (!audioUrl || !audioUrl.startsWith('/audio/manual-')) return;
    try {
      const filename = path.basename(audioUrl);
      const filePath = path.join(AUDIO_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[FileStorage] Cleaned old POI manual audio: ${filename}`);
      }
    } catch (err: any) {
      console.warn('[FileStorage] Failed to delete manual audio:', err.message);
    }
  }
}

export const fileStorageService = new FileStorageService();

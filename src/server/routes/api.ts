import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { poiController } from '../controllers/poiController.js';
import { authController } from '../controllers/authController.js';
import { ttsService } from '../services/ttsService.js';
import { poiService } from '../services/poiService.js';
import { chatbotService } from '../services/chatbotService.js';
import { localizationService } from '../services/localizationService.js';
import { dailyVisitService } from '../services/dailyVisitService.js';
import { mongoManager } from '../repositories/mongoClient.js';
import { authService } from '../services/authService.js';
import { fileStorageService } from '../services/fileStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cấu hình Multer lưu ảnh an toàn vào public/uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const rand = crypto.randomBytes(8).toString('hex');
    const safeName = `poi-${Date.now()}-${rand}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Tối đa 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMime.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận định dạng ảnh JPEG, PNG hoặc WebP.'));
    }
  },
});

// Middleware xác thực Admin JWT
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  const validation = authService.validateToken(token);
  if (!validation.valid) {
    return res.status(403).json({ success: false, error: 'Yêu cầu quyền Quản trị viên (Admin).' });
  }
  next();
};

// In-Memory Rate Limiter cho ghi nhận truy cập (10 request / phút / IP)
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const visitRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }

  if (entry.count >= 10) {
    return res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
    });
  }

  entry.count++;
  next();
};

const router = Router();

// =========================================================================
// 1. HEALTH CHECK: Trả trạng thái thực tế Mongo (connected/disconnected, latency)
// =========================================================================
router.get('/health', async (_req, res) => {
  const ping = await mongoManager.pingLatency();
  const geminiAvailable = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

  res.json({
    status: ping.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'vietnam-quoc-tu-audio-guide',
    version: '2.1.0',
    database: {
      provider: 'MongoDB Atlas',
      connected: ping.connected,
      latencyMs: ping.latencyMs,
      database: process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu',
      geoSpatialIndex: '2dsphere (Active)',
      error: ping.error,
    },
    services: {
      geminiAi: {
        status: geminiAvailable ? 'ready' : 'missing_api_key',
        model: 'gemini-2.5-flash',
      },
      tts: {
        status: 'ready',
        provider: 'Google TTS Audio Engine',
        cachedAudioDir: '/audio',
      },
    },
  });
});

router.get('/mongodb/status', async (_req, res) => {
  const health = await mongoManager.checkHealth();
  res.json({
    success: true,
    data: health,
  });
});

// =========================================================================
// 2. DAILY VISITS & ACCESS (1 thiết bị = 1 người = tối đa 1 lượt/ngày)
// =========================================================================
router.post('/visit/checkin', visitRateLimiter, async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    const userAgent = req.headers['user-agent'] || '';
    const result = await dailyVisitService.recordVisit(deviceId || 'client-anon', userAgent);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/visit/today-count', async (_req, res) => {
  try {
    const count = await dailyVisitService.getTodayCount();
    res.json({
      success: true,
      data: {
        day: dailyVisitService.getVietnamDateString(),
        todayUniqueVisitors: count,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. ADMIN AUTHENTICATION
// =========================================================================
router.post('/auth/login', (req, res) => authController.login(req, res));
router.get('/auth/me', (req, res) => authController.me(req, res));
router.post('/auth/logout', (req, res) => authController.logout(req, res));

// =========================================================================
// 4. CAMPUSES & POIS
// =========================================================================
router.get('/campuses', (req, res) => poiController.getCampuses(req, res));
router.get('/pois', (req, res) => poiController.getAll(req, res));
router.get('/pois/spatial/nearby', (req, res) => poiController.getNearby(req, res));
router.get('/pois/:id', (req, res) => poiController.getOne(req, res));
router.post('/pois', (req, res) => poiController.create(req, res));
router.put('/pois/:id', (req, res) => poiController.update(req, res));
router.delete('/pois/:id', (req, res) => poiController.delete(req, res));
router.post('/pois/:id/ai-translate', (req, res) => poiController.aiTranslate(req, res));
router.put('/pois/:id/translations/:lang', (req, res) => poiController.saveTranslation(req, res));

router.post('/pois/:id/translations/:lang/regenerate-audio', requireAdmin, async (req, res) => {
  try {
    const result = await localizationService.regenerateSingleAudio(req.params.id, req.params.lang);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/pois/:id/media', (req, res) => poiController.addMedia(req, res));
router.delete('/pois/:id/media/:mediaId', (req, res) => poiController.deleteMedia(req, res));

// =========================================================================
// 5. UPLOAD ẢNH POI (Yêu cầu JWT Admin, MIME thật, max 5MB, xóa file cũ)
// =========================================================================
router.post('/admin/upload-image', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Lỗi khi tải ảnh lên' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn một file ảnh hợp lệ.' });
    }

    const oldImageUrl = req.body?.oldImageUrl;
    if (oldImageUrl && typeof oldImageUrl === 'string' && oldImageUrl.startsWith('/uploads/')) {
      fileStorageService.deleteUploadedImage(oldImageUrl);
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      imageUrl: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: 'Tải ảnh lên thành công.',
    });
  });
});

// =========================================================================
// 6. DEFAULT VOICE SETTINGS
// =========================================================================
let defaultVoiceConfig = {
  voiceEngine: 'chi-google',
  rate: 0.95,
  pitch: 1.0,
  updatedAt: new Date().toISOString(),
};

router.get('/settings/default-voice', (_req, res) => {
  res.json({
    success: true,
    data: defaultVoiceConfig,
  });
});

router.post('/settings/default-voice', requireAdmin, (req, res) => {
  try {
    const { voiceEngine, rate, pitch } = req.body || {};
    if (voiceEngine && typeof voiceEngine === 'string') {
      defaultVoiceConfig.voiceEngine = voiceEngine;
    }
    if (typeof rate === 'number' && !isNaN(rate)) {
      defaultVoiceConfig.rate = Math.max(0.7, Math.min(1.5, Math.round(rate * 100) / 100));
    }
    if (typeof pitch === 'number' && !isNaN(pitch)) {
      defaultVoiceConfig.pitch = Math.max(0.7, Math.min(1.4, Math.round(pitch * 100) / 100));
    }
    defaultVoiceConfig.updatedAt = new Date().toISOString();
    res.json({
      success: true,
      data: defaultVoiceConfig,
      message: 'Đã lưu cấu hình giọng đọc mặc định thành công!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 7. TTS & AUDIO SYNTHESIS
// =========================================================================
router.get('/tts/voices', (_req, res) => {
  res.json({
    success: true,
    data: ttsService.getVoices(),
  });
});

router.post('/tts/synthesize', async (req, res) => {
  try {
    const { text, poiId, lang, voiceName, style } = req.body || {};
    const result = await ttsService.synthesizeSpeech({
      text,
      poiId,
      lang,
      voiceName,
      style,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tts/poi/:poiId/:lang', async (req, res) => {
  try {
    const { poiId, lang } = req.params;
    const voiceName = (req.query.voice as string) || 'Kore';
    const poi = poiService.getPOI(poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'POI not found' });
    }
    const trans = poi.translations[lang] || poi.translations['vi'] || Object.values(poi.translations)[0];
    const fullText = [trans.title, trans.introduction, trans.description].filter(Boolean).join('. ');
    const result = await ttsService.synthesizeSpeech({
      text: fullText,
      poiId,
      lang,
      voiceName,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/audio/bell', async (req, res) => {
  try {
    const freq = parseFloat(req.query.freq as string) || 220.0;
    const { generateTempleBellWav } = await import('../../utils/audioSynth.js');
    const buffer = generateTempleBellWav(freq);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 8. AI CHATBOT (Tuệ Đăng)
// =========================================================================
router.post('/chat', async (req, res) => {
  try {
    const result = await chatbotService.chat(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 9. 1-CLICK AI LOCALIZATION (12 Ngôn Ngữ + TTS Audio)
// =========================================================================
router.post('/admin/localize-all', requireAdmin, async (req, res) => {
  try {
    const { poiId, title_vi, intro_vi, description_vi, generateAudio } = req.body || {};
    if (!poiId || !title_vi || !description_vi) {
      return res.status(400).json({
        success: false,
        message: 'poiId, title_vi và description_vi là bắt buộc.',
      });
    }
    const result = await localizationService.localizePOI({
      poiId,
      title_vi,
      intro_vi,
      description_vi,
      generateAudio: generateAudio !== false,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pois/:id/localize-all', requireAdmin, async (req, res) => {
  try {
    const poiId = req.params.id;
    const { title_vi, intro_vi, description_vi, generateAudio } = req.body || {};
    const poi = poiService.getPOI(poiId);
    const resolvedTitle = title_vi || poi?.translations['vi']?.title || poi?.code || '';
    const resolvedIntro = intro_vi || poi?.translations['vi']?.introduction || '';
    const resolvedDesc = description_vi || poi?.translations['vi']?.description || '';

    const result = await localizationService.localizePOI({
      poiId,
      title_vi: resolvedTitle,
      intro_vi: resolvedIntro,
      description_vi: resolvedDesc,
      generateAudio: generateAudio !== false,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

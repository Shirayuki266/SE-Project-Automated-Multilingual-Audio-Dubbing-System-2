import { Router } from 'express';
import { poiController } from '../controllers/poiController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { authController } from '../controllers/authController.js';
import { realDeviceController } from '../controllers/realDeviceController.js';
import { ttsService } from '../services/ttsService.js';
import { poiService } from '../services/poiService.js';
import { chatbotService } from '../services/chatbotService.js';
import { localizationService } from '../services/localizationService.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'vietnam-quoc-tu-audio-guide',
    version: '2.0.0',
    layers: ['presentation-controllers', 'service-domain', 'repository-mongodb-store'],
    database: {
      engine: 'MongoDB (BSON Document Store)',
      collections: ['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'real_devices'],
      geoSpatialIndex: '2dsphere (GeoJSON Point)',
    },
  });
});


// Admin Authentication routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.get('/auth/me', (req, res) => authController.me(req, res));
router.post('/auth/logout', (req, res) => authController.logout(req, res));

// Campuses routes
router.get('/campuses', (req, res) => poiController.getCampuses(req, res));

// POI routes
router.get('/pois', (req, res) => poiController.getAll(req, res));
router.get('/pois/spatial/nearby', (req, res) => poiController.getNearby(req, res));
router.get('/pois/:id', (req, res) => poiController.getOne(req, res));
router.post('/pois', (req, res) => poiController.create(req, res));
router.put('/pois/:id', (req, res) => poiController.update(req, res));
router.delete('/pois/:id', (req, res) => poiController.delete(req, res));
router.post('/pois/:id/ai-translate', (req, res) => poiController.aiTranslate(req, res));
router.put('/pois/:id/translations/:lang', (req, res) => poiController.saveTranslation(req, res));
router.post('/pois/:id/translations/:lang/regenerate-audio', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const { authService } = await import('../services/authService.js');
    if (!authService.validateToken(token).valid) {
      return res.status(403).json({ success: false, error: 'Yêu cầu quyền Admin để tạo lại audio.' });
    }
    const result = await localizationService.regenerateSingleAudio(req.params.id, req.params.lang);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
router.post('/pois/:id/media', (req, res) => poiController.addMedia(req, res));
router.delete('/pois/:id/media/:mediaId', (req, res) => poiController.deleteMedia(req, res));

// Audio Synthesizer endpoint (Native TypeScript WAV Synthesis with Python fallback)
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

// MongoDB Connection & 2dsphere Spatial Status endpoint
router.get('/mongodb/status', async (_req, res) => {
  const { mongoManager } = await import('../repositories/mongoClient.js');
  const health = await mongoManager.checkHealth();
  res.json({
    success: true,
    data: {
      ...health,
      geoSpatialIndex: '2dsphere (GeoJSON Point: [longitude, latitude])',
      collections: ['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'real_devices'],
    },
  });
});

// Default Voice Configuration (Configured by Admin, applied by default to users)
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

router.post('/settings/default-voice', (req, res) => {
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

// Device Fingerprint & Analytics routes (Strict Daily 1-Device Deduplication)
router.post('/analytics/device-checkin', (req, res) => analyticsController.checkinDevice(req, res));
router.get('/analytics/device-status', (req, res) => analyticsController.getDeviceStatus(req, res));
router.get('/analytics/visitors', (req, res) => analyticsController.getVisitors(req, res));
router.post('/analytics/pilgrimage-start', (req, res) => analyticsController.startPilgrimage(req, res));
router.get('/analytics/stats', (req, res) => analyticsController.getStats(req, res));

// =========================================================================
// BẢNG MONGODB: QUẢN LÝ THIẾT BỊ ĐĂNG NHẬP / TRUY CẬP THỰC (KHÔNG TẠO ẢO)
// =========================================================================
router.post('/real-devices/checkin', (req, res) => realDeviceController.checkin(req, res));
router.get('/real-devices', (req, res) => realDeviceController.getRealDevices(req, res));
router.put('/real-devices/:id/block', (req, res) => realDeviceController.toggleBlock(req, res));
// =========================================================================
// REAL TTS SPEECH SYNTHESIS ROUTES (Gemini 3.8 Flash Lite TTS)
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
// AI CHATBOT & SMART ASSISTANT (Tuệ Đăng - Gemini 3.8 Flash)
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
// 1-CLICK AI LOCALIZATION (12 Languages + TTS Audio Batch Pre-generation)
// =========================================================================
router.post('/admin/localize-all', async (req, res) => {
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

router.post('/pois/:id/localize-all', async (req, res) => {
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



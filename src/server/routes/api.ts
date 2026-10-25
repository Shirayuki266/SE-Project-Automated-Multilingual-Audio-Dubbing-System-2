import { Router } from 'express';
import { poiController } from '../controllers/poiController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { authController } from '../controllers/authController.js';

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
      collections: ['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'pilgrimage_logs'],
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
      collections: ['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'pilgrimage_logs'],
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

// Analytics routes
router.post('/analytics/pilgrimage-start', (req, res) => analyticsController.startPilgrimage(req, res));
router.get('/analytics/stats', (req, res) => analyticsController.getStats(req, res));

export default router;


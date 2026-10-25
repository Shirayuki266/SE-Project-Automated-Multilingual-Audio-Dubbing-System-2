import { Request, Response } from 'express';
import { poiService } from '../services/poiService.js';
import { authService } from '../services/authService.js';

function checkAdminAuth(req: Request): boolean {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return authService.validateToken(token).valid;
}

export class POIController {
  // GET /api/campuses
  public getCampuses(_req: Request, res: Response) {
    try {
      const campuses = poiService.getCampuses();
      return res.json({ success: true, count: campuses.length, data: campuses });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/pois
  public getAll(req: Request, res: Response) {
    try {
      const campusId = req.query.campus_id as string | undefined;
      const pois = poiService.getAllPOIs(campusId);
      return res.json({ success: true, count: pois.length, data: pois });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/pois/:id
  public getOne(req: Request, res: Response) {
    try {
      const poi = poiService.getPOI(req.params.id);
      if (!poi) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy điểm tham quan.' });
      }
      return res.json({ success: true, data: poi });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/pois/spatial/nearby?lat=...&lng=...
  public getNearby(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const campusId = req.query.campus_id as string | undefined;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp tọa độ lat và lng hợp lệ.',
        });
      }

      const results = poiService.getNearbyPOIs(lat, lng, campusId);
      return res.json({ success: true, count: results.length, data: results });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/pois (Admin only)
  public create(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Quản trị viên (Admin) để tạo điểm POI.' });
      }
      const created = poiService.createPOI(req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // PUT /api/pois/:id (Admin only)
  public update(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Quản trị viên (Admin) để sửa điểm POI.' });
      }
      const updated = poiService.updatePOI(req.params.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/pois/:id (Admin only)
  public delete(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Quản trị viên (Admin) để xóa điểm POI.' });
      }
      poiService.deletePOI(req.params.id);
      return res.json({ success: true, message: 'Đã xóa điểm POI thành công.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // POST /api/pois/:id/ai-translate
  public async aiTranslate(req: Request, res: Response) {
    try {
      const poiId = req.params.id;
      const { language } = req.body;
      if (!language) {
        return res.status(400).json({ success: false, error: 'Mã ngôn ngữ (language) là bắt buộc.' });
      }

      const poi = poiService.getPOI(poiId);
      if (!poi) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy điểm POI.' });
      }

      const { aiTranslationService } = await import('../services/aiTranslationService.js');
      const translation = await aiTranslationService.getOrGenerateTranslation(poi, language);

      return res.json({
        success: true,
        data: translation,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // PUT /api/pois/:id/translations/:lang (Admin only)
  public saveTranslation(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Admin để chỉnh sửa nội dung bài viết.' });
      }
      const { id, lang } = req.params;
      const { title, description, audio_url, introduction } = req.body;
      if (!title || !description) {
        return res.status(400).json({ success: false, error: 'Tiêu đề và nội dung bài viết không được để trống.' });
      }
      const updated = poiService.saveTranslation(id, lang, title, description, audio_url, introduction);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // POST /api/pois/:id/media (Admin only)
  public addMedia(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Admin để thêm hình ảnh.' });
      }
      const { id } = req.params;
      const { image_url, caption_vi, caption_en } = req.body;
      if (!image_url) {
        return res.status(400).json({ success: false, error: 'Đường dẫn ảnh (image_url) là bắt buộc.' });
      }
      const result = poiService.addMedia(id, image_url, caption_vi, caption_en);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/pois/:id/media/:mediaId (Admin only)
  public deleteMedia(req: Request, res: Response) {
    try {
      if (!checkAdminAuth(req)) {
        return res.status(403).json({ success: false, error: 'Yêu cầu quyền Admin để xóa hình ảnh.' });
      }
      const { id, mediaId } = req.params;
      const updated = poiService.deleteMedia(mediaId, id);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const poiController = new POIController();

import { poiRepository } from '../repositories/poiRepository.js';
import { RichPOI, POIEntity, Campus } from '../types.js';

export class POIService {
  public getAllPOIs(campusId?: string): RichPOI[] {
    return poiRepository.findAll(campusId);
  }

  public getPOI(identifier: string): RichPOI | undefined {
    return poiRepository.findById(identifier);
  }

  public getNearbyPOIs(lat: number, lng: number, campusId?: string) {
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Tọa độ GPS không hợp lệ (lat, lng phải là số).');
    }
    return poiRepository.findNearby(lat, lng, campusId);
  }

  public createPOI(data: any): RichPOI {
    const title = data.title_vi || data.title?.vi || data.title;
    const desc = data.desc_vi || data.description_vi || data.description?.vi || data.description || '';

    if (!title) {
      throw new Error('Tên điểm tham quan (Tiếng Việt) là bắt buộc.');
    }

    const lat = Number(data.latitude || data.lat);
    const lng = Number(data.longitude || data.lng);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Tọa độ latitude và longitude phải là số thực hợp lệ.');
    }

    const radius = Number(data.geofence_radius || data.radiusMeters) || 20;
    if (radius < 5 || radius > 100) {
      throw new Error('Bán kính kích hoạt phải từ 5m đến 100m.');
    }

    const code =
      data.code ||
      'VNQT-' +
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 15)
          .toUpperCase();

    const poiPayload: Omit<POIEntity, 'poi_id' | 'created_at'> = {
      campus_id: data.campus_id || 'vnqt-campus-01',
      code,
      latitude: lat,
      longitude: lng,
      geofence_radius: radius,
      location_type: data.location_type || data.category || 'sanctuary',
      qr_code_url: `/?poi=${code}`,
    };

    return poiRepository.create(
      poiPayload,
      { title, desc, lang: 'vi' },
      data.image_url || data.imageUrl
    );
  }

  public updatePOI(id: string, updates: any): RichPOI {
    const existing = poiRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${id}".`);
    }

    const payload: Partial<POIEntity> = {};
    if (updates.latitude !== undefined) payload.latitude = Number(updates.latitude);
    if (updates.longitude !== undefined) payload.longitude = Number(updates.longitude);
    if (updates.geofence_radius !== undefined) payload.geofence_radius = Number(updates.geofence_radius);
    if (updates.location_type) payload.location_type = updates.location_type;
    if (updates.code) payload.code = updates.code;

    const updated = poiRepository.update(id, payload);
    if (!updated) {
      throw new Error(`Cập nhật điểm POI thất bại.`);
    }
    return updated;
  }

  public deletePOI(id: string): boolean {
    const existing = poiRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${id}".`);
    }
    return poiRepository.delete(id);
  }

  public saveTranslation(poiId: string, lang: string, title: string, desc: string, audioUrl?: string, intro?: string) {
    const existing = poiRepository.findById(poiId);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${poiId}".`);
    }
    const trans = {
      translation_id: `trans-${poiId}-${lang.toLowerCase()}`,
      poi_id: poiId,
      language_code: lang.toLowerCase(),
      title,
      introduction: intro || desc.slice(0, 100),
      description: desc,
      audio_url: audioUrl || undefined,
      is_ai_generated: false,
    };
    poiRepository.saveTranslation(trans);
    return poiRepository.findById(poiId);
  }

  public addMedia(poiId: string, imageUrl: string, captionVi?: string, captionEn?: string) {
    const existing = poiRepository.findById(poiId);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${poiId}".`);
    }
    const newMedia = poiRepository.addMedia({
      poi_id: poiId,
      image_url: imageUrl,
      caption_vi: captionVi || 'Hình ảnh công trình',
      caption_en: captionEn || 'View of point of interest',
      display_order: existing.media.length + 1,
    });
    return { media: newMedia, poi: poiRepository.findById(poiId) };
  }

  public deleteMedia(mediaId: string, poiId: string) {
    poiRepository.deleteMedia(mediaId);
    return poiRepository.findById(poiId);
  }

  public getCampuses(): Campus[] {
    return poiRepository.getAllCampuses();
  }
}

export const poiService = new POIService();

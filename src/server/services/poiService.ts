import { poiRepository } from '../repositories/poiRepository.js';
import { RichPOI, POIEntity, Campus } from '../types.js';
import { fileStorageService } from './fileStorageService.js';

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
    const intro = data.intro_vi || data.introduction_vi || data.intro || data.introduction || '';
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

    const image = data.image || data.imageUrl || data.image_url;

    return poiRepository.create(
      {
        campus_id: data.campus_id || 'vnqt-campus-01',
        code,
        category: data.category || 'hall',
        latitude: lat,
        longitude: lng,
        geofence_radius: radius,
        display_order: Number(data.display_order) || 1,
        image,
        updated_at: new Date().toISOString(),
      },
      { title, intro, desc, lang: 'vi' },
      image
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
    if (updates.category) payload.category = updates.category;
    if (updates.code) payload.code = updates.code;
    if (updates.display_order !== undefined) payload.display_order = Number(updates.display_order);

    const newImage = updates.image || updates.imageUrl || updates.image_url;
    if (newImage && newImage !== existing.image) {
      payload.image = newImage;
      // Dọn file ảnh cũ nếu trước đó là ảnh tự upload
      if (existing.image && existing.image.startsWith('/uploads/')) {
        fileStorageService.deleteUploadedImage(existing.image);
      }
    }

    const updated = poiRepository.update(id, payload);
    if (!updated) {
      throw new Error(`Cập nhật điểm POI thất bại.`);
    }

    // Nếu có cập nhật bài viết tiếng Việt trong payload
    if (updates.title_vi || updates.description_vi) {
      this.saveTranslation(
        id,
        'vi',
        updates.title_vi || existing.translations['vi']?.title || existing.code,
        updates.description_vi || existing.translations['vi']?.description || '',
        existing.translations['vi']?.audio_url,
        updates.intro_vi || existing.translations['vi']?.introduction,
        true
      );
    }

    return poiRepository.findById(id) || updated;
  }

  public deletePOI(id: string): boolean {
    const existing = poiRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${id}".`);
    }

    // Dọn file ảnh upload
    if (existing.image && existing.image.startsWith('/uploads/')) {
      fileStorageService.deleteUploadedImage(existing.image);
    }
    existing.media?.forEach((m) => {
      if (m.image_url && m.image_url.startsWith('/uploads/')) {
        fileStorageService.deleteUploadedImage(m.image_url);
      }
    });

    return poiRepository.delete(id);
  }

  public saveTranslation(
    poiId: string,
    lang: string,
    title: string,
    desc: string,
    audioUrl?: string,
    intro?: string,
    isManuallyEdited: boolean = true
  ) {
    const existing = poiRepository.findById(poiId);
    if (!existing) {
      throw new Error(`Không tìm thấy điểm POI với mã "${poiId}".`);
    }
    const existingTrans = existing.translations[lang.toLowerCase()];
    const trans = {
      translation_id: `trans-${poiId}-${lang.toLowerCase()}`,
      poi_id: poiId,
      language_code: lang.toLowerCase(),
      title,
      introduction: intro || desc.slice(0, 100),
      description: desc,
      audio_url: audioUrl || existingTrans?.audio_url || `/audio/${poiId}-${lang.toLowerCase()}.mp3`,
      is_ai_generated: false,
      is_manually_edited: isManuallyEdited,
      updated_at: new Date().toISOString(),
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
    const existing = poiRepository.findById(poiId);
    const mediaItem = existing?.media?.find((m) => m.media_id === mediaId);
    if (mediaItem?.image_url?.startsWith('/uploads/')) {
      fileStorageService.deleteUploadedImage(mediaItem.image_url);
    }
    poiRepository.deleteMedia(mediaId);
    return poiRepository.findById(poiId);
  }

  public getCampuses(): Campus[] {
    return poiRepository.getAllCampuses();
  }
}

export const poiService = new POIService();

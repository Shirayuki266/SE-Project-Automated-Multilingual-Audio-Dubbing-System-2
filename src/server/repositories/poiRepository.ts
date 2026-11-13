import { db, calculateHaversineDistance } from './db.js';
import { RichPOI, POIEntity, Campus } from '../types.js';

export class POIRepository {
  public findAll(campusId?: string): RichPOI[] {
    const pois = db.getAllPOIs();
    if (!campusId) return pois;
    return pois.filter((p) => p.campus_id === campusId);
  }

  public findById(id: string): RichPOI | undefined {
    return db.getRichPOIById(id) || undefined;
  }

  public findNearby(lat: number, lng: number, campusId?: string) {
    const all = this.findAll(campusId);
    return all
      .map((poi) => {
        const distance = calculateHaversineDistance(lat, lng, poi.latitude, poi.longitude);
        const isInside = distance <= poi.geofence_radius;
        return {
          poi,
          distanceMeters: Math.round(distance),
          isInsideGeofence: isInside,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  public create(
    poiData: Omit<POIEntity, 'poi_id' | 'created_at'>,
    translation?: { title: string; desc: string; lang: string; intro?: string },
    imageUrl?: string
  ): RichPOI {
    return db.createPOI({
      ...poiData,
      initialTranslation: translation,
      imageUrl,
    });
  }

  public update(id: string, updates: Partial<POIEntity>): RichPOI | null {
    return db.updatePOI(id, updates);
  }

  public delete(id: string): boolean {
    return db.deletePOI(id);
  }

  public saveTranslation(trans: any): void {
    db.saveTranslation(trans);
  }

  public addMedia(media: any): any {
    return db.addMedia(media);
  }

  public deleteMedia(mediaId: string): boolean {
    return db.deleteMedia(mediaId);
  }

  public getAllCampuses(): Campus[] {
    return db.getAllCampuses();
  }
}

export const poiRepository = new POIRepository();

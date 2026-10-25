import { db } from './db.js';
import { RichPOI, POIEntity, Campus } from '../types.js';

export class POIRepository {
  public findAll(campusId?: string): RichPOI[] {
    return db.getAllRichPOIs(campusId);
  }

  public findById(id: string): RichPOI | undefined {
    return db.getRichPOIById(id);
  }

  public findNearby(lat: number, lng: number, campusId?: string) {
    return db.findNearbyPOIs(lat, lng, campusId);
  }

  public create(
    poiData: Omit<POIEntity, 'poi_id' | 'created_at'>,
    translation?: { title: string; desc: string; lang: string; intro?: string },
    imageUrl?: string
  ): RichPOI {
    return db.createPOI(poiData, translation, imageUrl);
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

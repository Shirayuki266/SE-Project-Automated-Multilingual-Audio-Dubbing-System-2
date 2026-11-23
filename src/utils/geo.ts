/**
 * Spatial Geographic Utilities & Haversine Distance Calculations
 * Calculates Great-Circle distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// =========================================================================
// THUẬT TOÁN ĐỊNH TUYẾN & CHỌN POI TỰ ĐỘNG PHÁT THUYẾT MINH
// Thứ tự ưu tiên phân giải: distance -> priority -> display_order
// Tích hợp vùng đệm khi rời geofence hiện tại để giảm nhiễu GPS
// =========================================================================

export interface CandidatePOIEvaluation<T> {
  poi: T;
  distance: number;
  radius: number;
  priority: number;
  display_order: number;
}

export interface SelectCandidateOptions {
  currentPoiId?: string | null;
  hysteresisBufferMeters?: number; // Vùng đệm mở rộng trước khi coi là đã ra khỏi POI hiện tại (mặc định 8m)
}

export function selectBestCandidatePOI<
  T extends {
    latitude: number;
    longitude: number;
    geofence_radius?: number;
    priority?: number;
    display_order?: number;
    poi_id?: string;
    code?: string;
    created_at?: string;
  }
>(
  pois: T[],
  userLat: number,
  userLng: number,
  options?: SelectCandidateOptions
): CandidatePOIEvaluation<T> | null {
  if (!pois || pois.length === 0) return null;

  const hysteresisBuffer = options?.hysteresisBufferMeters ?? 8;
  const currentPoiId = options?.currentPoiId;

  const insideCandidates: CandidatePOIEvaluation<T>[] = [];
  let currentPoiEval: CandidatePOIEvaluation<T> | null = null;

  for (const poi of pois) {
    const distance = calculateHaversineDistance(userLat, userLng, poi.latitude, poi.longitude);
    const radius = poi.geofence_radius || 20;
    const priority = poi.priority ?? 0;
    const display_order = poi.display_order ?? 9999;

    const evaluation: CandidatePOIEvaluation<T> = {
      poi,
      distance,
      radius,
      priority,
      display_order,
    };

    if (currentPoiId && poi.poi_id === currentPoiId) {
      currentPoiEval = evaluation;
    }

    // Kiểm tra phạm vi geofence (áp dụng vùng đệm hysteresis cho POI hiện tại)
    const effectiveRadius =
      currentPoiId && poi.poi_id === currentPoiId
        ? radius + hysteresisBuffer
        : radius;

    if (distance <= effectiveRadius) {
      insideCandidates.push(evaluation);
    }
  }

  if (insideCandidates.length === 0) {
    return null;
  }

  // Sắp xếp các ứng viên lọt vào geofence theo đúng thứ bậc phân cấp:
  // 1. distance (tăng dần: gần hơn thắng)
  // 2. priority (giảm dần: điểm ưu tiên cao hơn thắng khi khoảng cách tương đương)
  // 3. display_order (tăng dần: thứ tự nhỏ hơn thắng khi các tiêu chí trước hòa)
  insideCandidates.sort((a, b) => {
    // Treat differences under 1cm as equal to avoid GPS noise overriding tie-breakers.
    const distDiff = a.distance - b.distance;
    if (Math.abs(distDiff) > 1e-2) {
      return distDiff;
    }

    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return a.display_order - b.display_order;
  });

  const bestCandidate = insideCandidates[0];

  return bestCandidate;
}

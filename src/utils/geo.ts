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
// Thứ tự ưu tiên phân giải: priority -> (d / radius) -> distance -> display_order
// Tích hợp: Cơ chế khóa (Locking khi đang phát) & Hysteresis chống nhiễu GPS
// =========================================================================

export interface CandidatePOIEvaluation<T> {
  poi: T;
  distance: number;
  radius: number;
  ratio: number; // Tỷ lệ d / radius (càng nhỏ càng tiến sâu vào tâm tương đối)
  priority: number;
  display_order: number;
}

export interface SelectCandidateOptions {
  currentPoiId?: string | null;
  isPlaying?: boolean;
  hysteresisBufferMeters?: number; // Vùng đệm mở rộng trước khi coi là đã ra khỏi POI hiện tại (mặc định 8m)
  switchRatioMargin?: number; // Ngưỡng vượt trội cần thiết để hoán đổi POI cùng priority (mặc định 0.15 = 15%)
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
  const switchMargin = options?.switchRatioMargin ?? 0.15;
  const currentPoiId = options?.currentPoiId;
  const isPlaying = Boolean(options?.isPlaying);

  const insideCandidates: CandidatePOIEvaluation<T>[] = [];
  let currentPoiEval: CandidatePOIEvaluation<T> | null = null;

  for (const poi of pois) {
    const distance = calculateHaversineDistance(userLat, userLng, poi.latitude, poi.longitude);
    const radius = poi.geofence_radius || 20;
    const priority = poi.priority ?? 0;
    const display_order = poi.display_order ?? 9999;
    const ratio = radius > 0 ? distance / radius : 1;

    const evaluation: CandidatePOIEvaluation<T> = {
      poi,
      distance,
      radius,
      ratio,
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
  // 1. priority (giảm dần: điểm ưu tiên cao hơn luôn thắng)
  // 2. ratio = d / radius (tăng dần: gần tâm tương đối hơn thắng)
  // 3. distance (tăng dần: cự ly mét tuyệt đối gần hơn thắng)
  // 4. display_order (tăng dần: thứ tự tạo / cấu hình nhỏ hơn thắng)
  insideCandidates.sort((a, b) => {
    // 1. So sánh priority
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    // 2. So sánh tỷ lệ d / radius
    const ratioDiff = a.ratio - b.ratio;
    if (Math.abs(ratioDiff) > 1e-4) {
      return ratioDiff;
    }

    // 3. So sánh khoảng cách tuyệt đối
    const distDiff = a.distance - b.distance;
    if (Math.abs(distDiff) > 1e-2) {
      return distDiff;
    }

    // 4. So sánh display_order / thứ tự tạo
    return a.display_order - b.display_order;
  });

  const bestCandidate = insideCandidates[0];

  // Cơ chế Khóa (Locking) và Hysteresis với POI đang hoạt động / đang phát:
  if (currentPoiEval && currentPoiEval.distance <= currentPoiEval.radius + hysteresisBuffer) {
    // Nếu audio đang phát: Khóa chặt POI hiện tại, KHÔNG cho POI khác ngắt
    // trừ khi POI mới có độ ưu tiên (priority) cao hơn hẳn!
    if (isPlaying) {
      if (bestCandidate.poi.poi_id !== currentPoiId) {
        if (bestCandidate.priority <= currentPoiEval.priority) {
          return currentPoiEval; // Giữ nguyên POI đang phát, bỏ qua ứng viên khác
        }
      }
      return bestCandidate;
    }

    // Nếu audio không phát nhưng người dùng vẫn ở trong vùng POI hiện tại:
    // Áp dụng Hysteresis chuyển đổi: POI mới phải có ratio vượt trội ít nhất switchMargin (15%)
    // mới được cướp quyền, tránh hiện tượng GPS nhiễu làm nhảy giật qua lại.
    if (bestCandidate.poi.poi_id !== currentPoiId) {
      if (bestCandidate.priority === currentPoiEval.priority) {
        if (bestCandidate.ratio > currentPoiEval.ratio * (1 - switchMargin)) {
          return currentPoiEval; // Chưa đủ biên độ vượt trội -> tiếp tục giữ POI hiện tại
        }
      }
    }
  }

  return bestCandidate;
}

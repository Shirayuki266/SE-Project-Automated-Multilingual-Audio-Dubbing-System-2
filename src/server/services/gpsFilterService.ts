/**
 * Smartphone Chip GPS Filtering & Precision Optimization Algorithms
 * Combines 2D Extended Kalman Filter, Accuracy-Weighting, and Outlier Rejection
 * for smooth real-time tracking inside temples and courtyard corridors.
 */

export interface RawGPSPoint {
  lat: number;
  lng: number;
  accuracy: number; // in meters (from geolocation API)
  timestamp: number;
  heading?: number | null;
  speed?: number | null;
}

export interface FilteredGPSPoint {
  lat: number;
  lng: number;
  accuracy: number;
  smoothedHeading: number;
  confidenceScore: number; // 0..100
  isOutlierFiltered: boolean;
}

export class MobileGPSKalmanFilter {
  // State vector: [lat, lng]
  private lat: number = 0;
  private lng: number = 0;
  // Variance / error covariance
  private variance: number = -1;
  // Process noise (Q): how much real movement variance we expect per millisecond
  private readonly Q_metres_per_second: number = 2.0; // typical walking speed
  private lastTimestamp: number = 0;
  private smoothedHeading: number = 0;
  private consecutiveOutliers: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.variance = -1;
    this.lat = 0;
    this.lng = 0;
    this.lastTimestamp = 0;
    this.smoothedHeading = 0;
    this.consecutiveOutliers = 0;
  }

  /**
   * Process raw GPS point through Kalman filter with accuracy weighting
   */
  public process(raw: RawGPSPoint): FilteredGPSPoint {
    const accuracy = Math.max(1, raw.accuracy); // accuracy in meters

    // First reading initialization
    if (this.variance < 0) {
      this.lat = raw.lat;
      this.lng = raw.lng;
      this.variance = accuracy * accuracy;
      this.lastTimestamp = raw.timestamp;
      this.smoothedHeading = raw.heading ?? 0;
      return {
        lat: this.lat,
        lng: this.lng,
        accuracy,
        smoothedHeading: this.smoothedHeading,
        confidenceScore: this.calculateConfidence(accuracy),
        isOutlierFiltered: false,
      };
    }

    // Time delta in seconds
    const dt = Math.max(0.001, (raw.timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = raw.timestamp;

    // Outlier Gating: Check if jump exceeds realistic pedestrian walking speed (max ~7 m/s)
    const approximateDeltaMeters = this.approximateDistance(this.lat, this.lng, raw.lat, raw.lng);
    const speed = approximateDeltaMeters / dt;

    let isOutlier = false;
    // If accuracy is poor (> 50m) and sudden jump > 25m, filter it unless repeated 3+ times
    if (speed > 7.0 && accuracy > 20 && this.consecutiveOutliers < 3) {
      this.consecutiveOutliers++;
      isOutlier = true;
      // Do not update lat/lng with this outlier, just return current filtered state
      return {
        lat: this.lat,
        lng: this.lng,
        accuracy: Math.min(accuracy, Math.sqrt(this.variance)),
        smoothedHeading: this.smoothedHeading,
        confidenceScore: this.calculateConfidence(accuracy),
        isOutlierFiltered: true,
      };
    }

    this.consecutiveOutliers = 0;

    // Kalman Prediction step:
    // Variance increases over time proportional to movement capability
    this.variance += (this.Q_metres_per_second * dt) ** 2;

    // Measurement update step:
    const measurementVariance = accuracy * accuracy;
    const K = this.variance / (this.variance + measurementVariance); // Kalman Gain

    this.lat += K * (raw.lat - this.lat);
    this.lng += K * (raw.lng - this.lng);
    this.variance = (1 - K) * this.variance;

    // Smooth heading
    if (raw.heading !== undefined && raw.heading !== null && !isNaN(raw.heading)) {
      this.smoothedHeading = this.smoothAngle(this.smoothedHeading, raw.heading, 0.25);
    }

    return {
      lat: this.lat,
      lng: this.lng,
      accuracy: Math.round(Math.sqrt(this.variance) * 10) / 10,
      smoothedHeading: Math.round(this.smoothedHeading),
      confidenceScore: this.calculateConfidence(accuracy),
      isOutlierFiltered: false,
    };
  }

  private smoothAngle(current: number, target: number, alpha: number): number {
    let diff = (target - current) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return (current + alpha * diff + 360) % 360;
  }

  private approximateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const latMeters = (lat2 - lat1) * 111139;
    const lngMeters = (lon2 - lon1) * 111139 * Math.cos((lat1 * Math.PI) / 180);
    return Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
  }

  private calculateConfidence(accuracyMeters: number): number {
    if (accuracyMeters <= 5) return 98;
    if (accuracyMeters <= 10) return 90;
    if (accuracyMeters <= 20) return 78;
    if (accuracyMeters <= 35) return 60;
    if (accuracyMeters <= 60) return 40;
    return 20;
  }
}

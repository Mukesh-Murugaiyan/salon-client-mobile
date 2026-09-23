/**
 * Distance & Geofencing Utility Class (Mobile Client)
 * Handles high-precision distance calculations, contextual unit formatting (meters, km, miles),
 * and boundary evaluation for attendance geo-fencing.
 */
export class DistanceUtils {
  static EARTH_RADIUS_METERS = 6371000;
  static METERS_PER_MILE = 1609.344;
  static METERS_PER_FOOT = 0.3048;

  /**
   * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
   *
   * @param lat1 - Latitude of point 1 in decimal degrees
   * @param lon1 - Longitude of point 1 in decimal degrees
   * @param lat2 - Latitude of point 2 in decimal degrees
   * @param lon2 - Longitude of point 2 in decimal degrees
   * @returns Distance in meters rounded to 2 decimal places
   */
  static calculateDistance(
    lat1: number | string,
    lon1: number | string,
    lat2: number | string,
    lon2: number | string
  ): number {
    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);

    if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
      return 0;
    }

    if (nLat1 === nLat2 && nLon1 === nLon2) {
      return 0;
    }

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(nLat2 - nLat1);
    const dLon = toRad(nLon2 - nLon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(nLat1)) *
        Math.cos(toRad(nLat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_METERS * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Formats distance contextually into user-friendly units (meters, kilometers, or miles).
   *
   * Rules:
   * - 'metric' or 'auto':
   *   - If distance < 1000 meters -> formatted in meters (e.g. "45 m", "350 m")
   *   - If distance >= 1000 meters -> formatted in kilometers (e.g. "1.25 km", "14.2 km")
   * - 'imperial':
   *   - If distance < 0.1 miles (~160m) -> formatted in feet (e.g. "250 ft")
   *   - If distance >= 0.1 miles -> formatted in miles (e.g. "0.85 mi", "3.2 mi")
   *
   * @param meters - Raw distance in meters
   * @param unit - Unit preference ('auto' | 'metric' | 'imperial')
   * @returns Formatted string with unit
   */
  static formatDistance(
    meters: number | null | undefined,
    unit: 'auto' | 'metric' | 'imperial' = 'auto'
  ): string {
    if (meters === null || meters === undefined || isNaN(Number(meters))) {
      return '0 m';
    }

    const raw = Math.max(0, Number(meters));

    if (unit === 'imperial') {
      const miles = raw / this.METERS_PER_MILE;
      if (miles < 0.1) {
        const feet = Math.round(raw / this.METERS_PER_FOOT);
        return `${feet} ft`;
      }
      const formattedMiles = miles < 10 ? miles.toFixed(2) : miles.toFixed(1);
      return `${formattedMiles} mi`;
    }

    // Default: Metric / Auto
    if (raw < 1000) {
      return `${Math.round(raw)} m`;
    }

    const km = raw / 1000;
    const formattedKm = km < 10 ? km.toFixed(2) : km.toFixed(1);
    return `${formattedKm} km`;
  }

  /**
   * Evaluates geofence status between user coordinates and salon coordinates.
   *
   * @param userLat - User latitude
   * @param userLon - User longitude
   * @param salonLat - Salon latitude
   * @param salonLon - Salon longitude
   * @param allowedRadius - Configured allowed radius in meters (default 100)
   */
  static getGeofenceStatus(
    userLat: number,
    userLon: number,
    salonLat: number,
    salonLon: number,
    allowedRadius: number = 100
  ): {
    distance: number;
    allowedRadius: number;
    isWithinRadius: boolean;
    exceededBy: number;
    formattedDistance: string;
    formattedAllowedRadius: string;
    formattedExceededBy: string;
  } {
    const distance = this.calculateDistance(userLat, userLon, salonLat, salonLon);
    const radius = Math.max(1, Number(allowedRadius) || 100);
    const isWithinRadius = distance <= radius;
    const exceededBy = isWithinRadius ? 0 : Math.round((distance - radius) * 100) / 100;

    return {
      distance,
      allowedRadius: radius,
      isWithinRadius,
      exceededBy,
      formattedDistance: this.formatDistance(distance),
      formattedAllowedRadius: this.formatDistance(radius),
      formattedExceededBy: this.formatDistance(exceededBy),
    };
  }
}

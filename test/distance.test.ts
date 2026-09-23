import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DistanceUtils } from '../src/utils/DistanceUtils.ts';

describe('DistanceUtils Utility Tests', () => {
  describe('formatDistance (contextual units)', () => {
    it('formats distances less than 1000 meters in meters', () => {
      assert.strictEqual(DistanceUtils.formatDistance(0), '0 m');
      assert.strictEqual(DistanceUtils.formatDistance(45), '45 m');
      assert.strictEqual(DistanceUtils.formatDistance(100), '100 m');
      assert.strictEqual(DistanceUtils.formatDistance(350.4), '350 m');
      assert.strictEqual(DistanceUtils.formatDistance(999), '999 m');
    });

    it('formats distances of 1000 meters or more in kilometers', () => {
      assert.strictEqual(DistanceUtils.formatDistance(1000), '1.00 km');
      assert.strictEqual(DistanceUtils.formatDistance(1250), '1.25 km');
      assert.strictEqual(DistanceUtils.formatDistance(5000), '5.00 km');
      assert.strictEqual(DistanceUtils.formatDistance(14200), '14.2 km');
    });

    it('handles null, undefined, or NaN safely', () => {
      assert.strictEqual(DistanceUtils.formatDistance(null), '0 m');
      assert.strictEqual(DistanceUtils.formatDistance(undefined), '0 m');
      assert.strictEqual(DistanceUtils.formatDistance(NaN), '0 m');
    });

    it('formats distances in imperial units (feet and miles) when requested', () => {
      // 50 meters = ~164 feet
      const feet = DistanceUtils.formatDistance(50, 'imperial');
      assert.ok(feet.endsWith('ft'), `Expected feet but got ${feet}`);

      // 2000 meters = ~1.24 miles
      const miles = DistanceUtils.formatDistance(2000, 'imperial');
      assert.strictEqual(miles, '1.24 mi');
    });
  });

  describe('calculateDistance (Haversine Formula)', () => {
    const SALON_LAT = 28.6315;
    const SALON_LON = 77.2167;

    it('returns 0 when coordinates are identical', () => {
      const distance = DistanceUtils.calculateDistance(SALON_LAT, SALON_LON, SALON_LAT, SALON_LON);
      assert.strictEqual(distance, 0);
    });

    it('calculates distance accurately for nearby point (~39m)', () => {
      const userLat = SALON_LAT + 0.00035;
      const userLon = SALON_LON;
      const distance = DistanceUtils.calculateDistance(SALON_LAT, SALON_LON, userLat, userLon);
      assert.ok(distance >= 35 && distance <= 42, `Distance was ${distance}`);
    });

    it('calculates distance accurately for point ~5km away', () => {
      const userLat = SALON_LAT + 0.045;
      const userLon = SALON_LON;
      const distance = DistanceUtils.calculateDistance(SALON_LAT, SALON_LON, userLat, userLon);
      assert.ok(distance >= 4800 && distance <= 5200, `Distance was ${distance}`);
    });

    it('handles numeric string inputs correctly', () => {
      const distance = DistanceUtils.calculateDistance(
        String(SALON_LAT),
        String(SALON_LON),
        String(SALON_LAT + 0.00035),
        String(SALON_LON)
      );
      assert.ok(distance > 0);
    });

    it('returns 0 for invalid coordinate inputs', () => {
      assert.strictEqual(DistanceUtils.calculateDistance('abc', 77.2, 28.6, 77.2), 0);
    });
  });

  describe('getGeofenceStatus (Boundary & Exceeded Evaluation)', () => {
    const SALON_LAT = 28.6315;
    const SALON_LON = 77.2167;
    const RADIUS = 100;

    it('evaluates point inside allowed radius correctly', () => {
      const userLat = SALON_LAT + 0.00035; // ~39m
      const status = DistanceUtils.getGeofenceStatus(userLat, SALON_LON, SALON_LAT, SALON_LON, RADIUS);

      assert.strictEqual(status.isWithinRadius, true);
      assert.strictEqual(status.exceededBy, 0);
      assert.strictEqual(status.formattedExceededBy, '0 m');
      assert.strictEqual(status.allowedRadius, 100);
      assert.strictEqual(status.formattedAllowedRadius, '100 m');
      assert.ok(status.distance < 100);
      assert.ok(status.formattedDistance.endsWith('m'));
    });

    it('evaluates exact center (0m distance) correctly', () => {
      const status = DistanceUtils.getGeofenceStatus(SALON_LAT, SALON_LON, SALON_LAT, SALON_LON, RADIUS);
      assert.strictEqual(status.distance, 0);
      assert.strictEqual(status.isWithinRadius, true);
      assert.strictEqual(status.exceededBy, 0);
      assert.strictEqual(status.formattedDistance, '0 m');
    });

    it('evaluates point slightly outside radius with exact exceeded amount', () => {
      // 0.00105 degrees lat is ~116 meters
      const userLat = SALON_LAT + 0.00105;
      const status = DistanceUtils.getGeofenceStatus(userLat, SALON_LON, SALON_LAT, SALON_LON, RADIUS);

      assert.strictEqual(status.isWithinRadius, false);
      assert.ok(status.distance > 100);
      assert.ok(status.exceededBy > 0);
      assert.strictEqual(status.exceededBy, Math.round((status.distance - RADIUS) * 100) / 100);
      assert.ok(status.formattedExceededBy.endsWith('m'));
    });

    it('evaluates point far outside radius (e.g. 5km) formatting in kilometers', () => {
      const userLat = SALON_LAT + 0.045;
      const status = DistanceUtils.getGeofenceStatus(userLat, SALON_LON, SALON_LAT, SALON_LON, RADIUS);

      assert.strictEqual(status.isWithinRadius, false);
      assert.ok(status.distance > 4000);
      assert.ok(status.formattedDistance.endsWith('km'));
      assert.ok(status.formattedExceededBy.endsWith('km'));
    });
  });
});

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if a point is within a geofence radius
 */
export const isWithinGeofence = (
  pointLat: number,
  pointLon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusKm;
};

/**
 * Find all drivers within a specific radius
 */
export interface DriverLocation {
  id: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const filterDriversByGeofence = (
  pickupLat: number,
  pickupLon: number,
  drivers: DriverLocation[],
  radiusKm: number
): DriverLocation[] => {
  return drivers
    .map((driver) => ({
      ...driver,
      distance: calculateDistance(
        pickupLat,
        pickupLon,
        driver.latitude,
        driver.longitude
      ),
    }))
    .filter((driver) => driver.distance! <= radiusKm)
    .sort((a, b) => a.distance! - b.distance!);
};

/**
 * Get estimated time of arrival based on distance
 * Assumes average speed of 30 km/h in urban areas
 */
export const getEstimatedArrivalTime = (distanceKm: number): number => {
  const averageSpeedKmh = 30;
  const timeInHours = distanceKm / averageSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes;
};

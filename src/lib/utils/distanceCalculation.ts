/**
 * Distance and direction calculation utilities
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @returns Distance in miles
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
    Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate bearing (direction) from one point to another
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

/**
 * Get rotation angle for arrow icon based on bearing
 * @param bearing Bearing in degrees (0-360)
 * @returns CSS rotation angle in degrees
 */
export function getArrowRotation(bearing: number): number {
  // Adjust rotation to align Navigation icon with actual bearing
  // Subtract 45° to rotate anticlockwise and align correctly
  return bearing - 45;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Format distance for display
 * @param distance Distance in miles
 * @returns Formatted string (e.g., "2.3 mi")
 */
export function formatDistance(distance: number): string {
  return `${distance} mi`;
}


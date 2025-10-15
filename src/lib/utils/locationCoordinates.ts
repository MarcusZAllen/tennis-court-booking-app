/**
 * Utility to get location coordinates from location name
 */

import { Coordinates } from './distanceCalculation';

// Import all location configs
import clubsparkLocations from '../../../locations/clubspark.js';
import parksportsLocations from '../../../locations/parksports.js';
import betterLocations from '../../../locations/better.js';
import matchiLocations from '../../../locations/matchi.js';

interface LocationConfig {
  name: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

// Combine all locations into a single map
const allLocations: LocationConfig[] = [
  ...clubsparkLocations,
  ...parksportsLocations,
  ...betterLocations,
  ...matchiLocations,
];

// Create a map for quick lookup
const locationCoordinatesMap = new Map<string, Coordinates>();

allLocations.forEach((location) => {
  if (location.lat && location.lng) {
    locationCoordinatesMap.set(location.name, {
      lat: location.lat,
      lng: location.lng,
    });
  }
});

/**
 * Get coordinates for a location by name
 * @param locationName The name of the location
 * @returns Coordinates or null if not found
 */
export function getLocationCoordinates(locationName: string): Coordinates | null {
  return locationCoordinatesMap.get(locationName) || null;
}

/**
 * Check if a location has coordinates
 * @param locationName The name of the location
 * @returns True if location has coordinates
 */
export function hasLocationCoordinates(locationName: string): boolean {
  return locationCoordinatesMap.has(locationName);
}


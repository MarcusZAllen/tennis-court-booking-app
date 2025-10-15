import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to get all location configurations with tags
 * This allows the frontend to dynamically filter locations
 * without hardcoding a location tag map
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Dynamically import all location configs
    const [clubsparkModule, parksportsModule, betterModule, matchiModule] = await Promise.all([
      import('../../../locations/clubspark.js'),
      import('../../../locations/parksports.js'),
      import('../../../locations/better.js'),
      import('../../../locations/matchi.js')
    ]);

    const clubsparkLocations = clubsparkModule.default;
    const parksportsLocations = parksportsModule.default;
    const betterLocations = betterModule.default;
    const matchiLocations = matchiModule.default;

    // Build location tag map from actual config files
    const locationTagMap: { [key: string]: string[] } = {};

    // Add ClubSpark locations
    clubsparkLocations.forEach((loc: any) => {
      locationTagMap[loc.name] = loc.tags || [];
    });

    // Add ParkSports locations
    parksportsLocations.forEach((loc: any) => {
      locationTagMap[loc.name] = loc.tags || [];
    });

    // Add Better.org.uk locations
    betterLocations.forEach((loc: any) => {
      locationTagMap[loc.name] = loc.tags || [];
    });

    // Add Matchi locations
    matchiLocations.forEach((loc: any) => {
      locationTagMap[loc.name] = loc.tags || [];
    });

    return res.status(200).json({
      success: true,
      locationTagMap,
      totalLocations: Object.keys(locationTagMap).length
    });

  } catch (error: any) {
    console.error('Error loading location configs:', error);
    return res.status(500).json({ 
      error: 'Failed to load location configurations',
      details: error.message 
    });
  }
}


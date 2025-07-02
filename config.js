import clubsparkLocations from './locations/clubspark.js';
import parksportsLocations from './locations/parksports.js';

const config = {
  // Scraping configuration
  scraping: {
    daysAhead: 7,
    concurrency: {
      parkSports: 2,  // Park Sports is strict with rate limiting
      clubSpark: 3,   // ClubSpark is more lenient
      total: 5        // Overall concurrency limit
    },
    delays: {
      parkSports: {
        min: 5000,    // 5 seconds minimum
        max: 8000     // 8 seconds maximum
      }
    },
    timeouts: {
      pageLoad: 30000,    // 30 seconds for page load
      elementWait: 10000  // 10 seconds for element wait
    }
  },

  // Data paths
  paths: {
    data: './data',
    scrapers: './scrapers',
    locations: './locations',
    preserved: ['locations.json', 'multi-date-output.json']
  },

  // Providers
  providers: {
    clubSpark: {
      name: 'ClubSpark',
      locations: clubsparkLocations
    },
    parkSports: {
      name: 'ParkSports',
      locations: parksportsLocations
    }
  },

  // Logging
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    saveDebugHtml: true,
    debugPath: './data/debug'
  }
};

export default config; 
const fs = require('fs');
const path = require('path');
const scrapeParkSports = require('../scrapers/parksports');
const scrapeClubSpark = require('../scrapers/clubspark');
const clubSparkLocations = require('../locations/clubspark');
const parkSportsLocations = require('../locations/parksports');
const DataCleanup = require('../utils/data-cleanup');
const { retryWithBackoff } = require('../utils/retry-helper');
const { getProxyArgs } = require('../utils/proxy-config');

const pLimit = require('p-limit').default;

// Conservative limits for production
const parkLimit = pLimit(1);  // Park Sports: 1 at a time
const clubLimit = pLimit(1);  // ClubSpark: 1 at a time

// Generate a list of future dates in YYYY-MM-DD format
function getFutureDates(daysAhead) {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const iso = date.toISOString().split('T')[0];
    dates.push(iso);
  }
  return dates;
}

// Production scraping with retry logic
async function scrapeWithRetry(scraper, location, date) {
  return retryWithBackoff(async () => {
    console.log(`[${location.name} - ${date}] Starting scrape attempt`);
    return await scraper(location, date);
  }, 3, 2000); // 3 retries, 2 second base delay
}

(async () => {
  const startTime = Date.now();
  const stats = {
    totalTasks: 0,
    successful: 0,
    failed: 0,
    totalSlots: 0,
    errors: []
  };

  try {
    // 🧹 Clean up old data files
    console.log('🧹 Starting data cleanup...');
    const cleanup = new DataCleanup();
    cleanup.runFullCleanup({
      dailyFilesMaxAge: 7,
      debugFilesMaxAge: 3,
      cleanEmpty: true,
      showStats: true
    });

    const dates = getFutureDates(7); // scrape next 7 days
    const scrapeTasks = [];

    // Add delays between different locations to avoid overwhelming servers
    let taskDelay = 0;
    const delayBetweenLocations = 10000; // 10 seconds between different locations

    for (const date of dates) {
      for (const location of clubSparkLocations) {
        stats.totalTasks++;
        const currentDelay = taskDelay;
        taskDelay += delayBetweenLocations;
        
        scrapeTasks.push(clubLimit(async () => {
          // Wait for the scheduled delay
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          
          console.log(`[${location.name} - ${date}] Starting ClubSpark scrape`);
          try {
            const slots = await scrapeWithRetry(scrapeClubSpark, location, date);
            stats.successful++;
            stats.totalSlots += slots.length;
            return { success: true, slots, location: location.name, date };
          } catch (err) {
            stats.failed++;
            const error = `[${location.name} - ${date}] ❌ Error: ${err.message}`;
            stats.errors.push(error);
            console.error(error);
            return { success: false, slots: [], location: location.name, date, error: err.message };
          }
        }));
      }

      for (const location of parkSportsLocations) {
        stats.totalTasks++;
        const currentDelay = taskDelay;
        taskDelay += delayBetweenLocations;
        
        scrapeTasks.push(parkLimit(async () => {
          // Wait for the scheduled delay
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          
          console.log(`[${location.name} - ${date}] Starting Park Sports scrape`);
          try {
            const slots = await scrapeWithRetry(scrapeParkSports, location, date);
            stats.successful++;
            stats.totalSlots += slots.length;
            return { success: true, slots, location: location.name, date };
          } catch (err) {
            stats.failed++;
            const error = `[${location.name} - ${date}] ❌ Error: ${err.message}`;
            stats.errors.push(error);
            console.error(error);
            return { success: false, slots: [], location: location.name, date, error: err.message };
          }
        }));
      }
    }

    console.log(`⏳ Starting ${scrapeTasks.length} scraping tasks with delays...`);
    const results = await Promise.allSettled(scrapeTasks);
    const allSlots = results
      .filter(res => res.status === 'fulfilled')
      .flatMap(res => res.value.slots || []);

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }

    fs.writeFileSync(
      path.join('data', 'multi-date-output.json'),
      JSON.stringify(allSlots, null, 2)
    );
    console.log(`💾 Saved combined output to data/multi-date-output.json`);

    // Run aggregation
    console.log('\n🔗 Running aggregation to per-location files...');
    const { execSync } = require('child_process');
    try {
      execSync('node aggregate-daily-to-location.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    } catch (err) {
      console.error('❌ Failed to run aggregation script:', err.message);
    }

    // 📊 Print summary statistics
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 PRODUCTION SCRAPING SUMMARY');
    console.log('==============================');
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📋 Total tasks: ${stats.totalTasks}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`🎾 Total slots found: ${stats.totalSlots}`);
    console.log(`📅 Dates scraped: ${dates.length}`);
    console.log(`🏟️  Locations: ${clubSparkLocations.length + parkSportsLocations.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log(`\n🎉 Production scraping completed successfully!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})(); 
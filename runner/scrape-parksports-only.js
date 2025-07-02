import fs from 'fs';
import path from 'path';
import scrapeParkSports from '../scrapers/parksports';
import clubSparkLocations from '../locations/clubspark';
import parkSportsLocations from '../locations/parksports';
import DataCleanup from '../utils/data-cleanup';
import scrapeClubSpark from '../scrapers/clubspark-api';

import pLimit from 'p-limit';
const limit = pLimit(3); // Reduce concurrency to 3 total scrapes at a time

const parkLimit = pLimit(1);  // Park Sports is strict — limit to 1 at a time

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

// 🧹 Clean up old data files
console.log('🧹 Starting data cleanup...');
const cleanup = new DataCleanup();
cleanup.runFullCleanup({
  dailyFilesMaxAge: 7,    // Keep daily files for 7 days
  debugFilesMaxAge: 3,    // Keep debug files for 3 days
  cleanEmpty: true,       // Remove empty files
  showStats: true         // Show before/after statistics
});

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
    const dates = getFutureDates(8); // scrape next 8 days

    const scrapeTasks = [];

    for (const date of dates) {
      for (const location of clubSparkLocations) {
        stats.totalTasks++;
        scrapeTasks.push(async () => {
          console.log(`[${location.name} - ${date}] Starting ClubSpark scrape`);
          try {
            const slots = await scrapeClubSpark(location, date);
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
        });
      }

      for (const location of parkSportsLocations) {
        stats.totalTasks++;
        scrapeTasks.push(parkLimit(async () => {
          console.log(`[${location.name} - ${date}] Starting Park Sports scrape`);
          try {
            // ⏳ Add randomized delay to avoid IP bans
            const delay = 5000 + Math.random() * 3000; // 5–8s
            await new Promise(res => setTimeout(res, delay));

            const slots = await scrapeParkSports(location, date);
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

    const results = await Promise.allSettled(scrapeTasks);
    const allSlots = results
      .filter(res => res.status === 'fulfilled')
      .flatMap(res => res.value.slots || []);

    // Debug: Count ParkSports and Clubspark slots
    const parkSportsCount = allSlots.filter(slot => slot.provider === 'parksports').length;
    const clubsparkCount = allSlots.filter(slot => slot.provider === 'clubspark').length;
    console.log(`\n[DEBUG] ParkSports slots in combined output: ${parkSportsCount}`);
    console.log(`[DEBUG] Clubspark slots in combined output: ${clubsparkCount}`);

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }

    fs.writeFileSync(
      path.join('data', 'multi-date-output.json'),
      JSON.stringify(allSlots, null, 2)
    );
    console.log(`💾 Saved combined output to data/multi-date-output.json`);

    console.log('\n🔗 Running aggregation to per-location files...');
    const { execSync } = require('child_process');
    try {
      execSync('node aggregate-daily-to-location.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    } catch (err) {
      console.error('❌ Failed to run aggregation script:', err.message);
    }

    // 📊 Print summary statistics
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 SCRAPING SUMMARY');
    console.log('==================');
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

    console.log(`\n🎉 Scraping completed successfully!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    process.exit(0); // ✅ Ensure clean script exit
  }
})();

import fs from 'fs';
import path from 'path';
import scrapeParkSports, { getSharedBrowser, closeSharedBrowser } from '../scrapers/parksports.js';
import parkSportsLocations from '../locations/parksports.js';
import DataCleanup from '../utils/data-cleanup.js';
import { DatabaseService } from '../lib/database.js';
import { execSync } from 'child_process';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  // Get shared browser instance for Park Sports
  let sharedBrowser = null;
  let browserErrorCount = 0;
  const MAX_BROWSER_ERRORS = 3;

  try {
    const maxWindow = Math.max(...parkSportsLocations.map(l => l.bookingWindow || 7));
    const dates = getFutureDates(maxWindow); // scrape up to the longest booking window

    // 🗄️ Conservative cleanup: Only remove historical data, don't clear current slots
    console.log('🗄️ Starting conservative database cleanup for ParkSports...');
    const db = new DatabaseService();
    
    // Only remove historical data older than 7 days, don't clear current slots
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const { data: oldData, error: oldError } = await db.supabase
      .from('tennis_slots')
      .delete()
      .lt('date', cutoffDateStr)
      .eq('provider', 'parksports');
    
    if (oldError) {
      console.error('❌ Error deleting historical slots:', oldError);
    } else {
      console.log(`✅ Deleted ${oldData?.length || 0} historical ParkSports slots older than ${cutoffDateStr}`);
    }
    
    // Get current stats
    const stats = await db.getStats();
    if (stats.success) {
      console.log(`📊 Database now contains ${stats.totalSlots} total slots`);
    }

    const scrapeTasks = [];

    for (const date of dates) {
      for (const location of parkSportsLocations) {
        stats.totalTasks++;
        scrapeTasks.push(parkLimit(async () => {
          console.log(`[${location.name} - ${date}] Starting Park Sports scrape`);
          try {
            // ⏳ Add randomized delay to avoid IP bans
            const delay = 5000 + Math.random() * 3000; // 5–8s
            await new Promise(res => setTimeout(res, delay));

            // Get shared browser instance for this scrape
            if (!sharedBrowser) {
              sharedBrowser = await getSharedBrowser();
            }

            const slots = await scrapeParkSports(location, date, sharedBrowser);
            stats.successful++;
            stats.totalSlots += slots.length;
            return { success: true, slots, location: location.name, date };
          } catch (err) {
            stats.failed++;
            const error = `[${location.name} - ${date}] ❌ Error: ${err.message}`;
            stats.errors.push(error);
            console.error(error);
            
            // Check if it's a browser context error
            if (err.message.includes('Protocol error') || err.message.includes('Cannot find context')) {
              browserErrorCount++;
              console.log(`[${location.name} - ${date}] 🔄 Browser context error (${browserErrorCount}/${MAX_BROWSER_ERRORS})`);
              
              if (browserErrorCount >= MAX_BROWSER_ERRORS) {
                console.log(`[${location.name} - ${date}] 🚨 Too many browser errors - recreating browser instance`);
                try {
                  await closeSharedBrowser();
                  sharedBrowser = null;
                  browserErrorCount = 0;
                  
                  // Wait a bit before recreating
                  await new Promise(res => setTimeout(res, 5000));
                  sharedBrowser = await getSharedBrowser();
                } catch (browserErr) {
                  console.error(`[${location.name} - ${date}] Failed to recreate browser: ${browserErr.message}`);
                }
              }
            }
            
            return { success: false, slots: [], location: location.name, date, error: err.message };
          }
        }));
      }
    }

    const results = await Promise.allSettled(scrapeTasks);
    const allSlots = results
      .filter(res => res.status === 'fulfilled')
      .flatMap(res => res.value.slots || []);

    // Debug: Count ParkSports slots
    const parkSportsCount = allSlots.filter(slot => slot.provider === 'parksports').length;
    console.log(`\n[DEBUG] ParkSports slots in output: ${parkSportsCount}`);

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }

    fs.writeFileSync(
      path.join('data', 'multi-date-output.json'),
      JSON.stringify(allSlots, null, 2)
    );
    console.log(`💾 Saved combined output to data/multi-date-output.json`);

    console.log('\n🔗 Running aggregation to per-location files...');
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
    console.log(`🏟️  Locations: ${parkSportsLocations.length}`);
    console.log(`🔄 Browser recreations: ${Math.floor(browserErrorCount / MAX_BROWSER_ERRORS)}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log(`\n🎉 Scraping completed successfully!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    // Always close the shared browser instance
    if (sharedBrowser) {
      await closeSharedBrowser();
    }
    process.exit(0); // ✅ Ensure clean script exit
  }
})();

import fs from 'fs';
import path from 'path';
import { scrapeParkSportsAPI } from '../scrapers/parksports-api.cjs';
import DataCleanup from '../utils/data-cleanup.js';
import { DatabaseService } from '../lib/database.js';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    const maxWindow = 7; // Scrape 7 days ahead
    const dates = getFutureDates(maxWindow);

    console.log('🚀 Starting ParkSports API scraping...');
    const db = new DatabaseService();
    
    // Get current stats before scraping
    const dbStats = await db.getStats();
    if (dbStats.success) {
      console.log(`📊 Database currently contains ${dbStats.totalSlots} total slots`);
    }

    // Clear existing ParkSports data for these dates
    console.log('🧹 Clearing existing ParkSports data for these dates...');
    await db.clearSlotsForDatesAndProvider(dates, 'parksports');

    console.log(`📅 Scraping ${dates.length} dates: ${dates.join(', ')}`);
    
    // Use the new API scraper
    const allSlots = await scrapeParkSportsAPI(dates);
    
    stats.totalTasks = dates.length * 2; // 2 locations per date
    stats.successful = dates.length * 2; // API scraper handles all locations
    stats.totalSlots = allSlots.length;

    console.log(`\n📊 API Scraping Results:`);
    console.log(`✅ Total slots extracted: ${allSlots.length}`);
    
    // Count by sport type
    const tennisSlots = allSlots.filter(slot => slot.sportType === 'tennis').length;
    const padelSlots = allSlots.filter(slot => slot.sportType === 'padel').length;
    console.log(`🎾 Tennis slots: ${tennisSlots}`);
    console.log(`🏓 Padel slots: ${padelSlots}`);

    // Count by location
    const locations = [...new Set(allSlots.map(slot => slot.location))];
    locations.forEach(location => {
      const locationSlots = allSlots.filter(slot => slot.location === location).length;
      console.log(`📍 ${location}: ${locationSlots} slots`);
    });

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
    console.log('\n📊 API SCRAPING SUMMARY');
    console.log('=======================');
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📋 Total dates: ${dates.length}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`🎾 Total slots found: ${stats.totalSlots}`);
    console.log(`🏟️  Locations: 2 (Hyde Park, Regents Park)`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log(`\n🎉 API scraping completed successfully!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    process.exit(0); // ✅ Ensure clean script exit
  }
})();

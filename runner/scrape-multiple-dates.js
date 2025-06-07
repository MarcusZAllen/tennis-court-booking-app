const fs = require('fs');
const path = require('path');
const scrapeParkSports = require('../scrapers/parksports');
const scrapeClubSpark = require('../scrapers/clubspark');
const clubSparkLocations = require('../locations/clubspark');
const parkSportsLocations = require('../locations/parksports');

const pLimit = require('p-limit').default;
const limit = pLimit(5); // Limit concurrency to 5 scrapes at a time

const parkLimit = pLimit(2);  // Park Sports is strict — trying limit of 2
const clubLimit = pLimit(3);  // ClubSpark seems less strict — trying limit of 3

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

// 🧹 Clean up old per-day JSON files (preserve aggregate outputs)
const DATA_DIR = path.join(__dirname, '../data');
const preserved = ['locations.json', 'multi-date-output.json'];

for (const file of fs.readdirSync(DATA_DIR)) {
  if (file.endsWith('.json') && !preserved.includes(file)) {
    fs.unlinkSync(path.join(DATA_DIR, file));
  }
}
console.log('🧹 Cleaned up old per-day JSON files');

(async () => {
  try {
    const dates = getFutureDates(7); // scrape next 7 days

    const scrapeTasks = [];

    for (const date of dates) {
      for (const location of clubSparkLocations) {
        scrapeTasks.push(clubLimit(async () => {
          console.log(`[${location.name} - ${date}] Starting ClubSpark scrape`);
          try {
            const slots = await scrapeClubSpark(location, date);
            return slots;
          } catch (err) {
            console.error(`[${location.name} - ${date}] ❌ Error:`, err.message);
            return [];
          }
        }));
      }

      for (const location of parkSportsLocations) {
        scrapeTasks.push(parkLimit(async () => {
          console.log(`[${location.name} - ${date}] Starting Park Sports scrape`);
          try {
            // ⏳ Add randomized delay to avoid IP bans
            const delay = 5000 + Math.random() * 3000; // 5–8s
            await new Promise(res => setTimeout(res, delay));

            const slots = await scrapeParkSports(location, date);
            return slots;
          } catch (err) {
            console.error(`[${location.name} - ${date}] ❌ Error:`, err.message);
            return [];
          }
        }));
      }
    }

    const results = await Promise.allSettled(scrapeTasks);
    const allSlots = results
      .filter(res => res.status === 'fulfilled')
      .flatMap(res => res.value);

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

    console.log(`Scraped ${allSlots.length} slots across ${dates.length} days.`);
  } catch (e) {
    console.error('Unexpected top-level error:', e);

  } finally {
    process.exit(0); // ✅ Ensure clean script exit
  }
})();

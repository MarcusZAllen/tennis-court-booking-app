const fs = require('fs');
const path = require('path');
const scrapeParkSports = require('../scrapers/parksports');
const scrapeClubSpark = require('../scrapers/clubspark');

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

(async () => {
  try {
    const allSlots = [];
    const dates = getFutureDates(7); // scrape next 7 days

    for (const date of dates) {
      // scrape Regents park
      console.log(`Scraping Park Sports for ${date}...`);
      try {
        const slots = await scrapeParkSports(date);
        allSlots.push(...slots);
      } catch (err) {
        console.error(`Error scraping ${date}:`, err.message);
      }
      // scrape Battersea Park
      console.log(`Scraping ClubSpark for ${date}...`);

    try {
      const clubSparkSlots = await scrapeClubSpark(date);
      allSlots.push(...clubSparkSlots);
    } catch (err) {
      console.error(`Error scraping ClubSpark on ${date}:`, err.message);
    }
    }

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

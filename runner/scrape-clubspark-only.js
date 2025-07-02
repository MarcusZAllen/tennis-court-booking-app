const fs = require('fs');
const path = require('path');
const clubSparkLocations = require('../locations/clubspark');
const scrapeClubSpark = require('../scrapers/clubspark-api');

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
    console.log('Clubspark locations:', clubSparkLocations);
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
    }

    const results = await Promise.allSettled(scrapeTasks.map(fn => fn()));
    const allSlots = results
      .filter(res => res.status === 'fulfilled')
      .flatMap(res => res.value.slots || []);

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }

    fs.writeFileSync(
      path.join('data', 'clubspark-only-output.json'),
      JSON.stringify(allSlots, null, 2)
    );
    console.log(`💾 Saved combined output to data/clubspark-only-output.json`);

    // Also save to multi-date-output.json for frontend compatibility
    fs.writeFileSync(
      path.join('data', 'multi-date-output.json'),
      JSON.stringify(allSlots, null, 2)
    );
    console.log(`💾 Saved combined output to data/multi-date-output.json`);

    // 📊 Print summary statistics
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 CLUBSPARK SCRAPING SUMMARY');
    console.log('============================');
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📋 Total tasks: ${stats.totalTasks}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`🎾 Total slots found: ${stats.totalSlots}`);
    console.log(`📅 Dates scraped: ${dates.length}`);
    console.log(`🏟️  Locations: ${clubSparkLocations.length}`);
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      stats.errors.forEach(error => console.log(`  ${error}`));
    }
    console.log(`\n🎉 Clubspark-only scraping completed!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    process.exit(0); // ✅ Ensure clean script exit
  }
})(); 
import fs from 'fs';
import path from 'path';
import clubSparkLocations from '../locations/clubspark.js';
import scrapeClubSpark from '../scrapers/clubspark-api.js';

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

  try {
    console.log('Clubspark locations:', clubSparkLocations);
    
    // Run the scraper once - it handles all locations and dates internally
    const results = await scrapeClubSpark();
    
    // Extract all slots from all results
    const allSlots = results.flatMap(r => r.slots || []);

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
    console.log(`🎾 Total slots found: ${allSlots.length}`);
    console.log(`🏟️  Locations: ${results.length}`);
    console.log(`\n🎉 Clubspark-only scraping completed!`);
  } catch (e) {
    console.error('💥 Unexpected top-level error:', e);
    process.exit(1);
  } finally {
    process.exit(0); // ✅ Ensure clean script exit
  }
})(); 
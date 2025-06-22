// aggregate daily data to location
const fs = require('fs');
const path = require('path');

// Normalize location names to prevent duplicates from inconsistent casing or punctuation
function normalizeLocationName(slug) {
  return slug
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\bs\b/gi, "'s")   // convert isolated s to 's
    .replace(/'+/g, "'")        // collapse multiple apostrophes
    .replace(/\b\w/g, c => c.toUpperCase()) // title case
    .replace(/\s+/g, ' ')       // remove excess spaces
    .trim();
}

const DATA_DIR = path.join(__dirname, 'data');

// Load and flatten all daily JSON files excluding aggregate files
function loadAllSlots() {
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter(f => f.endsWith('.json') && !['clubspark.json', 'parksports.json', 'multi-date-output.json'].includes(f))
    .map(f => {
      const filePath = path.join(DATA_DIR, f);
      try {
        return JSON.parse(fs.readFileSync(filePath));
      } catch (err) {
        console.error(`❌ Failed to parse ${f}:`, err.message);
        return [];
      }
    })
    .flat();
}

// Extract all unique location names from filenames
function getAllScrapedLocations() {
  const files = fs.readdirSync(DATA_DIR);
  const names = new Set();
  files.forEach(f => {
    if (f.endsWith('.json') && !['clubspark.json', 'parksports.json', 'multi-date-output.json'].includes(f)) {
      const match = f.match(/-(.*?)-\d{4}-\d{2}-\d{2}\.json$/);
      if (match && match[1]) {
        const name = normalizeLocationName(match[1]);
        names.add(name);
      }
    }
  });
  return Array.from(names);
}

// Group slot data by location and sort each location's slots by date/time
function groupByLocation(slots, allLocations) {
  const map = {};
  for (const name of allLocations) {
    map[name] = {
      location: name,
      provider: null,
      slots: []
    };
  }
  for (const slot of slots) {
    const key = normalizeLocationName(slot.location);
    if (!map[key]) {
      map[key] = { location: key, provider: slot.provider, slots: [] };
    }
    if (slot && slot.date && typeof slot.startMinutes === 'number') {
      map[key].slots.push(slot);
      if (!map[key].provider) map[key].provider = slot.provider;
    }
  }
  return Object.values(map).map(loc => {
    loc.slots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMinutes - b.startMinutes;
    });
    return loc;
  });
}

// Write grouped data to a file and log a summary
function saveAggregatedData(provider, grouped) {
  const outputPath = path.join(DATA_DIR, `locations.json`);
  fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2));
  console.log(`✅ Saved ${grouped.length} locations to ${outputPath}`);
  for (const loc of grouped) {
    const uniqueDates = new Set(loc.slots.map(s => s.date));
    console.log(`  - ${loc.location}: ${uniqueDates.size} dates, ${loc.slots.length} slots`);
  }
}

console.log('🔄 Aggregating slots across all locations...');
const slots = loadAllSlots();
const allLocations = getAllScrapedLocations();
const grouped = groupByLocation(slots, allLocations);
saveAggregatedData('by-location', grouped);
console.log('🎉 Aggregation complete.');
// aggregate daily data to location

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function loadJsonFiles(provider) {
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter(f => f.startsWith(`${provider}-`) && f.endsWith('.json'))
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

function groupByLocation(slots) {
  const map = {};
  for (const slot of slots) {
    const key = slot.location;
    if (!map[key]) {
      map[key] = {
        location: key,
        provider: slot.provider,
        slots: []
      };
    }
    map[key].slots.push(slot);
  }
  return Object.values(map).map(loc => {
    loc.slots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMinutes - b.startMinutes;
    });
    return loc;
  });
}

function saveAggregatedData(provider, grouped) {
  const outputPath = path.join(DATA_DIR, `${provider}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2));
  console.log(`✅ Saved ${grouped.length} locations to ${outputPath}`);
  for (const loc of grouped) {
    console.log(`  - ${loc.location}: ${loc.slots.length} slots`);
  }
}

const providers = ['parksports', 'clubspark'];

for (const provider of providers) {
  console.log(`🔄 Aggregating slots for ${provider}...`);
  const slots = loadJsonFiles(provider);
  const grouped = groupByLocation(slots);
  saveAggregatedData(provider, grouped);
}

console.log('🎉 Aggregation complete.');
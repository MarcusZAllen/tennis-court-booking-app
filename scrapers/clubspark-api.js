import fs from 'fs';
import path from 'path';

// Helper to extract venue slug from Clubspark URL
function getVenueSlug(url) {
  // Example: https://clubspark.lta.org.uk/BatterseaParkTennisCourts/Booking/BookByDate#?role=guest
  const match = url.match(/clubspark\.lta\.org\.uk\/([^/]+)/i);
  return match ? match[1] : null;
}

async function fetchVenueSessions(venueSlug, startDate, endDate) {
  const url = `https://clubspark.lta.org.uk/v0/VenueBooking/${venueSlug}/GetVenueSessions?resourceID=&startDate=${startDate}&endDate=${endDate}&roleId=`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

async function scrapeClubsparkAPI({ name, url, bookingWindow }) {
  // Get today's date and bookingWindow-1 days ahead
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDateObj = new Date(today);
  endDateObj.setDate(today.getDate() + ((bookingWindow || 7) - 1));
  const endDate = endDateObj.toISOString().split('T')[0];

  const venueSlug = getVenueSlug(url);
  if (!venueSlug) throw new Error(`Could not extract venue slug from URL: ${url}`);

  const data = await fetchVenueSessions(venueSlug, startDate, endDate);
  const slots = [];
  let debugSessions = [];

  for (const resource of data.Resources || []) {
    for (const day of resource.Days || []) {
      for (const session of day.Sessions || []) {
        debugSessions.push(session);
      }
    }
  }

  // Save debug session data to file (for the first date)
  const debugPath = path.join('data', `clubspark-debug-${name.toLowerCase().replace(/\s+/g, '-')}-${startDate}-to-${endDate}.json`);
  fs.writeFileSync(debugPath, JSON.stringify(debugSessions, null, 2));
  if (debugSessions.length > 0) {
    console.log(`🔍 First session for ${name} in range ${startDate} to ${endDate}:`, debugSessions[0]);
  } else {
    console.log(`🔍 No sessions found for ${name} in range ${startDate} to ${endDate}`);
  }

  // Save and log the first resource object for inspection
  if (data.Resources && data.Resources.length > 0) {
    const resourceDebugPath = path.join('data', `clubspark-resource-debug-${name.toLowerCase().replace(/\s+/g, '-')}-${startDate}-to-${endDate}.json`);
    fs.writeFileSync(resourceDebugPath, JSON.stringify(data.Resources[0], null, 2));
    console.log(`🔬 First resource for ${name} in range ${startDate} to ${endDate}:`, data.Resources[0]);
  }

  for (const resource of data.Resources || []) {
    if (!resource.Name) {
      console.warn(`[${name}] Resource missing Name, skipping.`);
      continue;
    }
    for (const day of resource.Days || []) {
      let slotDate = day.Date;
      if (slotDate && slotDate.includes('T')) slotDate = slotDate.split('T')[0];
      for (const session of day.Sessions || []) {
        // Only include available slots
        if (session.Capacity !== 1) continue;
        const startMinutes = session.StartTime;
        const endMinutes = session.EndTime;
        const duration = endMinutes - startMinutes;
        let cost = session.CourtCost;
        if (typeof cost === 'number') cost = `£${cost.toFixed(2)}`;
        if (typeof cost === 'string' && !cost.startsWith('£')) cost = `£${cost}`;
        // Split multi-hour sessions into 1-hour slots
        if (duration > 60) {
          for (let start = startMinutes; start < endMinutes; start += 60) {
            const end = Math.min(start + 60, endMinutes);
            const readableTime = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')} - ${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
            const slotKey = `${name.replace(/\s+/g, '-')}_${resource.Name.replace(/\s+/g, '-')}_${slotDate}_${start}_${end}`;
            const sessionId = slotKey;
            let bookingUrl = url;
            if (!bookingUrl.includes('date=')) {
              bookingUrl = bookingUrl.replace(/(#\?role=guest)/, `$1&date=${slotDate}`);
            }
            slots.push({
              provider: "clubspark",
              location: name,
              court: resource.Name,
              bookingUrl,
              date: slotDate,
              readableTime,
              cost,
              startMinutes: start,
              endMinutes: end,
              sessionId,
              slotKey
            });
          }
        } else {
          // 1-hour or less, keep as is
          const readableTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')} - ${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
          const slotKey = `${name.replace(/\s+/g, '-')}_${resource.Name.replace(/\s+/g, '-')}_${slotDate}_${startMinutes}_${endMinutes}`;
          const sessionId = slotKey;
          let bookingUrl = url;
          if (!bookingUrl.includes('date=')) {
            bookingUrl = bookingUrl.replace(/(#\?role=guest)/, `$1&date=${slotDate}`);
          }
          slots.push({
            provider: "clubspark",
            location: name,
            court: resource.Name,
            bookingUrl,
            date: slotDate,
            readableTime,
            cost,
            startMinutes,
            endMinutes,
            sessionId,
            slotKey
          });
        }
      }
    }
  }

  // Save to file (for compatibility with your runner)
  const outputPath = path.join('data', `clubspark-${name.toLowerCase().replace(/\s+/g, '-')}-${startDate}-to-${endDate}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
  console.log(`💾 [${name} - ${startDate} to ${endDate}] Saved ${slots.length} slots to ${outputPath}`);
  return slots;
}

export default scrapeClubsparkAPI; 
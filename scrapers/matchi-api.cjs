// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Matchi.com API-based scraper
 * Uses the /facilities/resources/{id}/availabilities endpoint
 */

// Load locations dynamically
async function getLocations() {
  const { default: matchiLocations } = await import('../locations/matchi.js');
  return matchiLocations;
}

/**
 * Convert ISO datetime to HH:MM format
 */
function isoToTime(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Extract date from ISO datetime
 */
function isoToDate(isoString) {
  return isoString.split('T')[0];
}

/**
 * Scrape a single resource using API
 */
async function scrapeResourceAPI(location, resourceId, date) {
  console.log(`\n🏟️  Scraping ${location.name} (Resource ${resourceId}) for ${date} via API...`);
  
  try {
    // Build datetime range for the full day (7am to 11pm)
    const startDateTime = `${date}T07:00:00.000+00:00`;
    const endDateTime = `${date}T23:00:00.000+00:00`;
    
    // Build the API URL
    const apiUrl = `https://api.matchi.com/facilities/resources/${resourceId}/availabilities`;
    const params = new URLSearchParams({
      startDateTime: startDateTime,
      endDateTime: endDateTime
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    // Add a random delay before each request (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Make the API request with proper headers
    const headers = {
      'Accept': 'application/json',
      'x-api-key': location.apiKey, // Try lowercase
      'Origin': location.origin || 'https://www.londonsportsfestival.com',
      'Referer': (location.origin || 'https://www.londonsportsfestival.com') + '/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    };
    
    console.log(`🔑 Using API key: ${location.apiKey.substring(0, 20)}...`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`✅ API response received: ${response.status}`);
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error (${response.status}):`, errorText.substring(0, 200));
      return [];
    }
    
    // Parse JSON response
    const data = await response.json();
    
    console.log(`🔍 Availabilities found:`, Array.isArray(data) ? data.length : 0);
    
    const slots = [];
    
    // Extract slot data from response
    if (Array.isArray(data)) {
      data.forEach(slot => {
        const startTime = isoToTime(slot.startDateTime);
        const endTime = isoToTime(slot.endDateTime);
        const slotDate = isoToDate(slot.startDateTime);
        
        // Build booking URL
        const bookingUrl = location.bookingUrl || `https://www.matchi.se/facilities/${location.facilitySlug}`;
        
        // Extract price
        const price = slot.price?.amount || 'N/A';
        
        // Create slot key
        const slotKey = `${location.name.toLowerCase().replace(/\s+/g, '-')}-${slotDate}-${startTime.replace(':', '')}`;
        
        slots.push({
          provider: "matchi",
          location: location.name,
          court: location.courtName || `${location.name} Court`,
          date: slotDate,
          startTime: startTime,
          endTime: endTime,
          startMinutes: timeToMinutes(startTime),
          endMinutes: timeToMinutes(endTime),
          isAvailable: true,
          price: price,
          bookingUrl: bookingUrl,
          slotKey: slotKey,
          sportType: location.sportType || "padel"
        });
      });
    }
    
    console.log(`📊 Extracted ${slots.length} slots for ${location.name}`);
    
    // Log some sample data
    if (slots.length > 0) {
      console.log(`📝 Sample slot:`, {
        court: slots[0].court,
        time: `${slots[0].startTime}-${slots[0].endTime}`,
        available: slots[0].isAvailable,
        price: slots[0].price
      });
    }
    
    return slots;
    
  } catch (error) {
    console.error(`❌ Error scraping ${location.name}:`, error.message);
    return [];
  }
}

/**
 * Main scraper function
 */
async function scrapeMatchiAPI(dates = []) {
  console.log('🚀 Starting Matchi API scraper...');
  console.log(`📅 Dates to scrape: ${dates.join(', ')}`);
  
  // Load locations from config
  const locations = await getLocations();
  console.log(`📍 Loaded ${locations.length} location(s)`);
  
  const allSlots = [];
  
  for (const date of dates) {
    console.log(`\n📅 Processing date: ${date}`);
    
    for (const location of locations) {
      // Scrape each resource ID for this location
      for (const resourceId of location.resourceIds) {
        const slots = await scrapeResourceAPI(location, resourceId, date);
        allSlots.push(...slots);
        
        // Delay between resources
        const delay = 2000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log(`\n📊 Total slots collected: ${allSlots.length}`);
  
  if (allSlots.length > 0) {
    console.log('\n💾 Saving slots to database...');
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Transform slots to match database schema
      const transformedSlots = allSlots.map(slot => ({
        provider: slot.provider,
        location: slot.location,
        court: slot.court || null,
        booking_url: slot.bookingUrl || 'https://matchi.com',
        date: slot.date,
        readable_time: `${slot.startTime}-${slot.endTime}`,
        cost: slot.price || 'N/A',
        start_minutes: slot.startMinutes,
        end_minutes: slot.endMinutes,
        session_id: null,
        slot_key: slot.slotKey,
        sport_type: slot.sportType || 'padel'
      }));

      const { data, error } = await supabase
        .from('tennis_slots')
        .upsert(transformedSlots, {
          onConflict: 'slot_key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('❌ Error saving slots to database:', error);
      } else {
        console.log(`✅ Saved ${transformedSlots.length} slots to database`);
      }
    } catch (error) {
      console.error('❌ Failed to save slots:', error.message);
    }
  }
  
  return allSlots;
}

module.exports = { scrapeMatchiAPI };

// CLI usage
if (require.main === module) {
  const dates = process.argv.slice(2);
  if (dates.length === 0) {
    // Default to next 8 days if no dates provided
    const today = new Date();
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  scrapeMatchiAPI(dates)
    .then(() => {
      console.log('\n🎉 Matchi scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Scraping failed:', error);
      process.exit(1);
    });
}


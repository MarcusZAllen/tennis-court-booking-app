// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Better.org.uk API-based scraper
 * Uses the /times endpoint to get availability
 */

// Load locations dynamically
async function getLocations() {
  const { default: betterLocations } = await import('../locations/better.js');
  return betterLocations;
}

/**
 * Extract slot data from API response
 */
function extractSlotData(apiResponse, locationName, locationUrl, date) {
  const slots = [];
  
  try {
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      apiResponse.data.forEach(timeSlot => {
        // Only include slots that are bookable
        if (timeSlot.action_to_show && timeSlot.action_to_show.status === 'BOOK' && timeSlot.spaces > 0) {
          const startTime = timeSlot.starts_at.format_24_hour;
          const endTime = timeSlot.ends_at.format_24_hour;
          
          // Build booking URL
          const bookingUrl = `${locationUrl}/location/${timeSlot.venue_slug}/${timeSlot.category_slug}/${date}/by-time/slot/${startTime}-${endTime}/${timeSlot.composite_key}`;
          
          // Extract price (remove £ symbol for consistency)
          const priceFormatted = timeSlot.price.formatted_amount;
          const price = priceFormatted.replace('£', '');
          
          // Create separate slots for each available court/space
          // This ensures the calendar shows the correct count
          for (let i = 1; i <= timeSlot.spaces; i++) {
            // Create unique slot key for each court
            const slotKey = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${date}-court${i}-${startTime.replace(':', '')}`;
            
            slots.push({
              provider: "better",
              location: locationName,
              court: `${timeSlot.name} - Court ${i}`,
              date: date,
              startTime: startTime,
              endTime: endTime,
              startMinutes: timeToMinutes(startTime),
              endMinutes: timeToMinutes(endTime),
              isAvailable: true,
              price: price,
              bookingUrl: bookingUrl,
              slotKey: slotKey,
              sportType: "tennis", // Better.org.uk - assuming tennis for now
              spacesAvailable: timeSlot.spaces
            });
          }
        }
      });
    }
  } catch (error) {
    console.error(`Error extracting slot data for ${locationName}:`, error);
  }
  
  return slots;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Scrape a single location using API
 */
async function scrapeLocationAPI(location, date) {
  console.log(`\n🏟️  Scraping ${location.name} for ${date} via API...`);
  
  try {
    // Build the API URL
    const apiUrl = `https://better-admin.org.uk/api/activities/venue/${location.venue}/activity/${location.activity}/times`;
    
    // Build query parameters
    const params = new URLSearchParams({
      date: date
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    // Make the API request with proper headers
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://bookings.better.org.uk',
        'Referer': 'https://bookings.better.org.uk/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }
    });
    
    console.log(`✅ API response received: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}`);
      return [];
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Debug: Log basic response info
    console.log(`🔍 Time slots found:`, data.data ? data.data.length : 0);
    
    // Extract slot data from response (use location.url which contains the base booking URL)
    const slots = extractSlotData(data, location.name, 'https://bookings.better.org.uk', date);
    
    console.log(`📊 Extracted ${slots.length} available slots for ${location.name}`);
    
    // Log some sample data
    if (slots.length > 0) {
      console.log(`📝 Sample slot:`, {
        court: slots[0].court,
        time: `${slots[0].startTime}-${slots[0].endTime}`,
        available: slots[0].isAvailable,
        spaces: slots[0].spacesAvailable,
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
async function scrapeBetterAPI(dates = []) {
  console.log('🚀 Starting Better.org.uk API scraper...');
  console.log(`📅 Dates to scrape: ${dates.join(', ')}`);
  
  // Load locations from config
  const locations = await getLocations();
  console.log(`📍 Loaded ${locations.length} location(s)`);
  
  const allSlots = [];
  
  for (const date of dates) {
    console.log(`\n📅 Processing date: ${date}`);
    
    for (const location of locations) {
      const slots = await scrapeLocationAPI(location, date);
      allSlots.push(...slots);
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        booking_url: slot.bookingUrl || 'https://better.org.uk',
        date: slot.date,
        readable_time: `${slot.startTime}-${slot.endTime}`,
        cost: slot.price || 'N/A',
        start_minutes: slot.startMinutes,
        end_minutes: slot.endMinutes,
        session_id: null,
        slot_key: slot.slotKey,
        sport_type: slot.sportType || 'tennis'
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

module.exports = { scrapeBetterAPI };

// CLI usage
if (require.main === module) {
  const dates = process.argv.slice(2);
  if (dates.length === 0) {
    // Default to next 7 days if no dates provided
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  scrapeBetterAPI(dates)
    .then(() => {
      console.log('\n🎉 Better.org.uk scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Scraping failed:', error);
      process.exit(1);
    });
}


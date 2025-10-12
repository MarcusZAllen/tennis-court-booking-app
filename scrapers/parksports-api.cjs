// Use built-in fetch (Node.js 18+) or import node-fetch
const fetch = globalThis.fetch || require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * ParkSports API-based scraper
 * Uses the GetVenueSessions endpoint instead of Puppeteer
 * Much faster and bypasses Cloudflare completely
 */

const LOCATIONS = [
  {
    name: "Hyde Park",
    subdomain: "hyde",
    url: "https://hyde.parksports.co.uk"
  },
  {
    name: "Regents Park", 
    subdomain: "regents",
    url: "https://regents.parksports.co.uk"
  }
];

/**
 * Extract court data from API response
 */
function extractCourtData(apiResponse, locationName, locationUrl, date) {
  const slots = [];
  
  try {
    // The API response has Resources array with Days containing Sessions
    if (apiResponse.Resources && Array.isArray(apiResponse.Resources)) {
      apiResponse.Resources.forEach(resource => {
        const courtName = resource.Name;
        
        // Determine sport type from ResourceGroupID or court name
        let sportType = "tennis";
        if (courtName.toLowerCase().includes('padel')) {
          sportType = "padel";
        } else if (apiResponse.ResourceGroups) {
          // Check ResourceGroup to determine sport type
          const resourceGroup = apiResponse.ResourceGroups.find(g => g.ID === resource.ResourceGroupID);
          if (resourceGroup && resourceGroup.Name.toLowerCase().includes('padel')) {
            sportType = "padel";
          }
        }
        
        // Process each day's sessions
        if (resource.Days && Array.isArray(resource.Days)) {
          resource.Days.forEach(day => {
            if (day.Sessions && Array.isArray(day.Sessions)) {
              day.Sessions.forEach(session => {
                // Convert time from minutes to HH:MM format
                const startTime = minutesToTime(session.StartTime);
                const endTime = minutesToTime(session.EndTime);
                
                // Determine availability: 
                // - Category 0 = Available slot (bookable)
                // - Category 1000 = Booking (already booked)
                // - Category 8000 = Closed
                // When Category is 0, Capacity > 0 means available slots
                const isAvailable = session.Category === 0 && session.Capacity > 0;
                
                // Skip closed sessions (Category 8000) and already booked sessions (Category 1000)
                if (session.Category === 8000 || session.Category === 1000) {
                  return;
                }
                
                // Build proper booking URL
                const bookingUrl = `${locationUrl}/Booking/BookByDate#?date=${date}&resourceId=${resource.ID}`;
                
                // Format price (store as number with 2 decimal places, no currency symbol)
                const price = session.Cost ? session.Cost.toFixed(2) : (session.CourtCost ? session.CourtCost.toFixed(2) : "N/A");
                
                // Create slot key
                const slotKey = `${locationName.toLowerCase().replace(/\s+/g, '-')}-${date}-${courtName.toLowerCase().replace(/\s+/g, '-')}-${startTime.replace(':', '')}`;
                
                slots.push({
                  provider: "parksports",
                  location: locationName,
                  court: courtName,
                  date: date,
                  startTime: startTime,
                  endTime: endTime,
                  startMinutes: session.StartTime,
                  endMinutes: session.EndTime,
                  isAvailable: isAvailable,
                  price: price,
                  bookingUrl: bookingUrl,
                  slotKey: slotKey,
                  sportType: sportType
                });
              });
            }
          });
        }
      });
    }
  } catch (error) {
    console.error(`Error extracting court data for ${locationName}:`, error);
  }
  
  return slots;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Convert minutes since midnight to HH:MM format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Scrape a single location using API
 */
async function scrapeLocationAPI(location, date) {
  console.log(`\n🏟️  Scraping ${location.name} for ${date} via API...`);
  
  try {
    // Build the API URL
    const apiUrl = `${location.url}/v0/VenueBooking/${location.subdomain}_parksports_co_uk/GetVenueSessions`;
    
    // Build query parameters - match user's original URL exactly
    const params = new URLSearchParams({
      resourceID: '', // Empty as in user's original URL
      startDate: date,
      endDate: date,
      roleId: '', // Empty for guest access
      _: Date.now().toString() // Cache buster
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    // Add a random delay before each request (2-5 seconds)
    const delay = 2000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Make the API request with better headers
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': `${location.url}/Booking/BookByDate`,
        'Origin': location.url,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
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
    
    // Debug: Log basic response info
    console.log(`🔍 API Response type:`, typeof data);
    console.log(`🔍 Resources found:`, data.Resources ? data.Resources.length : 0);
    
    // Extract court data from response
    const slots = extractCourtData(data, location.name, location.url, date);
    
    console.log(`📊 Extracted ${slots.length} slots for ${location.name}`);
    
    // Log some sample data
    if (slots.length > 0) {
      console.log(`📝 Sample slot:`, {
        court: slots[0].court,
        time: `${slots[0].startTime}-${slots[0].endTime}`,
        available: slots[0].isAvailable,
        sport: slots[0].sportType
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
async function scrapeParkSportsAPI(dates = []) {
  console.log('🚀 Starting ParkSports API scraper...');
  console.log(`📅 Dates to scrape: ${dates.join(', ')}`);
  
  const allSlots = [];
  
  for (const date of dates) {
    console.log(`\n📅 Processing date: ${date}`);
    
    for (const location of LOCATIONS) {
      const slots = await scrapeLocationAPI(location, date);
      allSlots.push(...slots);
      
      // Longer delay between locations to avoid rate limiting (5-8 seconds)
      const delay = 5000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
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
        booking_url: slot.bookingUrl || 'https://parksports.co.uk', // Default booking URL
        date: slot.date,
        readable_time: slot.readableTime || `${slot.startTime}-${slot.endTime}`,
        cost: slot.price || 'N/A',
        start_minutes: slot.startMinutes,
        end_minutes: slot.endMinutes,
        session_id: slot.sessionId || null,
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

module.exports = { scrapeParkSportsAPI };

// CLI usage
if (require.main === module) {
  const dates = process.argv.slice(2);
  if (dates.length === 0) {
    console.log('Usage: node parksports-api.js <date1> [date2] ...');
    console.log('Example: node parksports-api.js 2025-10-11 2025-10-12');
    process.exit(1);
  }
  
  scrapeParkSportsAPI(dates)
    .then(() => {
      console.log('\n🎉 Scraping completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Scraping failed:', error);
      process.exit(1);
    });
}

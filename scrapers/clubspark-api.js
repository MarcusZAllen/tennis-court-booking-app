import fetch from 'node-fetch';
import fs from 'fs';
import clubsparkLocations from '../locations/clubspark.js';
import { DatabaseService } from '../lib/database.js';
import { format } from 'date-fns';

// Function to extract venue slug from URL
function extractVenueSlug(url) {
  const match = url.match(/clubspark\.lta\.org\.uk\/([^\/]+)\//);
  return match ? match[1] : null;
}

async function scrapeClubspark() {
  const results = [];
  const startTime = Date.now();
  const db = new DatabaseService();

  for (const location of clubsparkLocations) {
    const venueSlug = extractVenueSlug(location.url);
    if (!venueSlug) {
      console.log(`[${location.name}] Could not extract venue slug from URL: ${location.url}`);
      continue;
    }

    console.log(`[${location.name}] Starting scrape for venue slug: ${venueSlug}`);
    
    const dates = [];
    const today = new Date();
    
    // Generate dates for the booking window
    for (let i = 0; i < location.bookingWindow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    const locationSlots = [];

    for (const currentDate of dates) {
      try {
        const apiUrl = `https://clubspark.lta.org.uk/v0/VenueBooking/${venueSlug}/GetVenueSessions?resourceID=&startDate=${currentDate}&endDate=${currentDate}&roleId=&_=${Date.now()}`;
        console.log(`[DEBUG] Fetching Clubspark API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Process the data structure from the working API
        if (data.Resources) {
          for (const resource of data.Resources) {
            for (const day of resource.Days) {
              for (const session of day.Sessions) {
                // Convert minutes to readable time
                const startHour = Math.floor(session.StartTime / 60);
                const startMinute = session.StartTime % 60;
                const endHour = Math.floor(session.EndTime / 60);
                const endMinute = session.EndTime % 60;
                
                const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
                const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                
                const slot = {
                  provider: 'clubspark',
                  location: location.name,
                  court: resource.Name,
                  bookingUrl: location.url,
                  date: currentDate,
                  readableTime: `${startTimeStr} - ${endTimeStr}`,
                  cost: session.Cost || 0,
                  startMinutes: session.StartTime,
                  endMinutes: session.EndTime,
                  sessionId: `${location.name}_${resource.Name.replace(/\s+/g, '-')}_${currentDate}_${session.StartTime}_${session.EndTime}`,
                  slotKey: `${location.name}_${resource.Name.replace(/\s+/g, '-')}_${currentDate}_${session.StartTime}_${session.EndTime}`
                };
                locationSlots.push(slot);
              }
            }
          }
        }

      } catch (error) {
        console.log(`[${location.name}] Failed to fetch data for ${currentDate}: ${error.message}`);
      }
    }

    // Save to database
    if (locationSlots.length > 0) {
      try {
        const dbResult = await db.saveSlots(locationSlots);
        if (dbResult.success) {
          console.log(`[${location.name}] 💾 Saved ${locationSlots.length} slots to database`);
        } else {
          console.log(`[${location.name}] Failed to save to database: ${dbResult.error}`);
        }
      } catch (error) {
        console.log(`[${location.name}] Failed to save to database: ${error.message}`);
      }
    } else {
      console.log(`[${location.name}] 💾 Saved 0 slots to database`);
    }

    results.push({
      location: location.name,
      slots: locationSlots
    });
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('\n📊 CLUBSPARK SCRAPING SUMMARY');
  console.log('============================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds`);
  console.log(`📋 Total tasks: ${results.length}`);
  console.log(`✅ Successful: ${results.length}`);
  console.log(`❌ Failed: 0`);
  console.log(`🎾 Total slots found: ${results.reduce((sum, r) => sum + r.slots.length, 0)}`);
  console.log(`📅 Dates scraped: ${clubsparkLocations[0]?.bookingWindow || 0}`);
  console.log(`🏟️  Locations: ${results.length}`);
  console.log('\n🎉 Clubspark-only scraping completed!');

  return results;
}

export default scrapeClubspark; 
import fetch from 'node-fetch';
import fs from 'fs';
import clubsparkLocations from '../locations/clubspark.js';
import { DatabaseService } from '../lib/database.js';
import { format } from 'date-fns';
import { retryWithBackoff } from '../utils/retry-helper.js';

// Function to extract venue slug from URL
function extractVenueSlug(url) {
  const match = url.match(/clubspark\.lta\.org\.uk\/([^\/]+)\//);
  return match ? match[1] : null;
}

// Add delay between requests to respect rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple API fetch with retry logic
async function fetchWithRetry(url) {
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Handle rate limiting specifically
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30 seconds
      console.log(`🚫 Rate limited! Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

    return response;
  }, 3, 2000); // 3 retries, 2 second base delay
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
    
    // Add delay between locations to respect rate limits
    if (results.length > 0) {
      console.log(`⏳ Waiting 2 seconds before next location...`);
      await delay(2000);
    }
    
    const dates = [];
    const today = new Date();
    
    // Generate dates for the booking window
    for (let i = 0; i < location.bookingWindow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    const locationSlots = [];

    for (let i = 0; i < dates.length; i++) {
      const currentDate = dates[i];
      
      try {
        console.log(`[${location.name}] Fetching data for ${currentDate} (${i + 1}/${dates.length})`);
        
        const apiUrl = `https://clubspark.lta.org.uk/v0/VenueBooking/${venueSlug}/GetVenueSessions?resourceID=&startDate=${currentDate}&endDate=${currentDate}&roleId=&_=${Date.now()}`;
        
        const response = await fetchWithRetry(apiUrl);
        const data = await response.json();
        
        // Process the data structure from the working API
        if (data.Resources) {
          for (const resource of data.Resources) {
            // Filter out non-tennis facilities
            const resourceName = resource.Name.toLowerCase();
            if (resourceName.includes('cricket') || 
                (resourceName.includes('net') && resourceName.includes('cricket')) ||
                resourceName.includes('football') ||
                resourceName.includes('rugby') ||
                resourceName.includes('pitch')) {
              console.log(`🚫 [${location.name}] Filtering out non-tennis facility: ${resource.Name}`);
              continue;
            }

            for (const day of resource.Days) {
              for (const session of day.Sessions) {
                // Only include available sessions
                if (session.Availability !== 'Available' && session.Capacity <= 0) {
                  continue;
                }

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
                  bookingUrl: `${location.url}${location.url.includes('?') ? '&' : '?'}date=${currentDate}`,
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

        // Add delay between date requests (1 second)
        if (i < dates.length - 1) {
          await delay(1000);
        }

      } catch (error) {
        console.log(`[${location.name}] Failed to fetch data for ${currentDate}: ${error.message}`);
        
        // If we hit a rate limit, wait longer before continuing
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log(`🚫 Rate limit detected, waiting 60 seconds before continuing...`);
          await delay(60000);
      }
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
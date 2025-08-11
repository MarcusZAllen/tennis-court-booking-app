import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { DatabaseService } from '../lib/database.js';
import { retryWithBackoff, RateLimiter } from '../utils/retry-helper.js';

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let sharedBrowser = null;
const rateLimiter = new RateLimiter(3, 60000); // 3 requests per minute

const scrapeParkSports = async function ({ name, url, bookingWindow = 7 }, date, browserInstance = null) {
  const startTime = Date.now();
  let browser = browserInstance;
  let page = null;
  let shouldCloseBrowser = false;

  try {
    // Check if date is within booking window
    const today = new Date();
    const targetDate = new Date(date);
    const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      console.log(`[${name} - ${date}] ⏰ Date ${date} is in the past, skipping`);
      return [];
    }
    
    if (daysDiff > bookingWindow) {
      console.log(`[${name} - ${date}] ⏰ Date ${date} is outside booking window (${bookingWindow} days), skipping`);
      return [];
    }

    console.log(`[${name} - ${date}] Starting Park Sports scrape (${daysDiff} days ahead)`);

    // Initialize browser if not provided
    if (!browser) {
      console.log(`[${name} - ${date}] 🚀 Launching Puppeteer browser...`);
      browser = await puppeteer.launch({
        headless: true,
        slowMo: 1000, // Increased slowMo for better reliability
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      console.log(`[${name} - ${date}] ✅ Puppeteer browser launched successfully`);
      shouldCloseBrowser = true;
    }

    // Create new page
    console.log(`[${name} - ${date}] 📄 Creating new page...`);
    page = await browser.newPage();
    console.log(`[${name} - ${date}] ✅ Page created successfully`);
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set timezone to London
    await page.emulateTimezone('Europe/London');
    console.log(`[${name} - ${date}] ✅ Page configured successfully`);

    const location = name;
    const baseURL = url;

    const loadPage = async () => {
      // Check if page is still valid before navigation
      if (!page || page.isClosed()) {
        throw new Error('Page is closed or invalid');
      }
      
      await page.goto(`${baseURL}&date=${date}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
    };

    try {
      await retryWithBackoff(loadPage, 5, 5000);
    } catch (error) {
      console.log(`[${location} - ${date}] Failed to load page after retries: ${error.message}`);
      return [];
    }

    console.log(`[${location} - ${date}] Loaded court availability for ${date}`);
    
    // Quick check: Are there any actually bookable slots at all?
    const slotCounts = await page.evaluate(() => {
      const bookableAnchors = document.querySelectorAll('a.book-interval.not-booked').length;
      const bookingSlots = document.querySelectorAll('a.book-interval.not-booked .available-booking-slot').length;
      const allAnchors = document.querySelectorAll('a').length;
      const allBookIntervals = document.querySelectorAll('a.book-interval').length;
      const allResourceIntervals = document.querySelectorAll('.resource-interval').length;
      
      return { bookableAnchors, bookingSlots, allAnchors, allBookIntervals, allResourceIntervals };
    });
    
    console.log(`[${location} - ${date}] 🔍 Page evaluation: bookable anchors=${slotCounts.bookableAnchors}, booking slots=${slotCounts.bookingSlots}, all anchors=${slotCounts.allAnchors}, all book intervals=${slotCounts.allBookIntervals}, all resource intervals=${slotCounts.allResourceIntervals}`);
    
    if (slotCounts.bookingSlots === 0) {
      console.log(`[${location} - ${date}] ✅ No actually bookable slots detected`);
      
      // Save debug HTML to understand what's on the page
      if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
      }
      try {
        const pageContent = await page.content();
        fs.writeFileSync(`data/debug-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.html`, pageContent);
        console.log(`[${location} - ${date}] 💾 Saved debug file to data/debug-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.html`);
      } catch (error) {
        console.log(`[${location} - ${date}] Failed to save debug file: ${error.message}`);
      }
      
      return [];
    }
    
    // Wait for page to load (longer wait for production environment)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Validate page is still valid before DOM operations
    if (!page || page.isClosed()) {
      throw new Error('Page became invalid during scraping');
    }

    // Use the already calculated slot counts
    const availableSlotsCount = slotCounts.bookingSlots;
    console.log(`[${location} - ${date}] Found ${availableSlotsCount} actually bookable slots`);

    if (availableSlotsCount === 0) {
      console.log(`[${location} - ${date}] 🟡 No available sessions found on ${date} — saving debug to investigate.`);
      if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
      }
      
      try {
        const pageContent = await page.content();
        fs.writeFileSync(`data/debug-${date}.html`, pageContent);
        console.log(`[${location} - ${date}] 💾 Saved debug file to data/debug-${date}.html`);
      } catch (error) {
        console.log(`[${location} - ${date}] Failed to save debug file: ${error.message}`);
      }
      return [];
    }

    console.log(`[${location} - ${date}] ✅ Found ${availableSlotsCount} available slots, extracting...`);



    // Validate page before DOM evaluation
    if (!page || page.isClosed()) {
      throw new Error('Page became invalid before slot extraction');
    }

    const slots = await page.$$eval('.resource-interval', (intervals, meta) => {
      const { location, baseURL, date } = meta;
      const convertToTime = (minutes) => {
        const h = String(Math.floor(minutes / 60)).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        return `${h}:${m}`;
      };

      return intervals
        .map(interval => {
          const session = interval.closest('.resource-session');
          if (!session) return null;

          // Look for actual bookable anchors - this is the only reliable way to detect available slots
          let bookAnchor = interval.querySelector('a.book-interval.not-booked');
          let bookingSlot = null;
          
          if (bookAnchor) {
            bookingSlot = bookAnchor.querySelector('.available-booking-slot');
          }
          
          // Fallback: try different selectors if the primary ones don't work
          if (!bookAnchor || !bookingSlot) {
            bookAnchor = interval.querySelector('a.book-interval');
            if (bookAnchor) {
              bookingSlot = bookAnchor.querySelector('.available-booking-slot') || bookAnchor.querySelector('.cost');
            }
          }
          
          // Another fallback: look for any anchor with booking-related text
          if (!bookAnchor || !bookingSlot) {
            const allAnchors = interval.querySelectorAll('a');
            for (const anchor of allAnchors) {
              const text = anchor.textContent.toLowerCase();
              if (text.includes('book') || text.includes('available') || text.includes('£')) {
                bookAnchor = anchor;
                bookingSlot = anchor;
                break;
              }
            }
          }
          
          if (!bookAnchor || !bookingSlot) {
            return null; // No bookable anchor found
          }

          // Extract slot information from session data attributes
          const sessionCost = session.getAttribute('data-session-cost');
          const startTime = parseInt(session.getAttribute('data-start-time'));
          const endTime = parseInt(session.getAttribute('data-end-time'));
          
          if (sessionCost && startTime !== null && endTime !== null) {
            const start = parseInt(interval.getAttribute('data-system-start-time'));
            const end = parseInt(interval.getAttribute('data-system-end-time'));
            
            // Find the court name by looking up the resource hierarchy
            let courtName = "Tennis Court";
            let resourceElement = interval.closest('.resource');
            if (resourceElement) {
              const resourceName = resourceElement.getAttribute('data-resource-name');
              if (resourceName) {
                courtName = resourceName;
              }
            }
            
            return {
              provider: "parksports",
              location,
              court: courtName,
              bookingUrl: `${baseURL}&date=${date}`,
              date,
              readableTime: `Book at ${convertToTime(start)} - ${convertToTime(end)}`,
              cost: `£${parseFloat(sessionCost).toFixed(2)}`,
              startMinutes: start,
              endMinutes: end,
              sessionId: `${location}_${courtName}_${convertToTime(start)}-${convertToTime(end)}`,
              slotKey: `${location}_${date}_${start}_${courtName}`,
            };
          }
          
          return null;
        })
        .filter(Boolean);
    }, { location, baseURL, date });

    console.log(`[${location} - ${date}] ✅ Extracted ${slots.length} bookable slots`);

    // Deduplicate slots by slotKey to prevent database conflicts
    const uniqueSlots = slots.filter((slot, index, self) => 
      index === self.findIndex(s => s.slotKey === slot.slotKey)
    );
    
    if (uniqueSlots.length !== slots.length) {
      console.log(`[${location} - ${date}] 🔄 Removed ${slots.length - uniqueSlots.length} duplicate slots`);
    }

    const db = new DatabaseService();
    if (uniqueSlots.length > 0) {
      try {
        const dbResult = await db.saveSlots(uniqueSlots);
        if (!dbResult.success) {
          console.error(`[${location} - ${date}] ❌ Failed to save to database:`, dbResult.error);
        } else {
          console.log(`[${location} - ${date}] 💾 DATABASE SAVE: ${uniqueSlots.length} slots saved to Supabase`);
          console.log(`[${location} - ${date}] 📊 Slots saved: ${uniqueSlots.map(s => `${s.readableTime} (£${s.cost.replace('£', '')})`).join(', ')}`);
        }
      } catch (error) {
        console.error(`[${location} - ${date}] ❌ Database error:`, error.message);
      }
    } else {
      console.log(`[${location} - ${date}] 📭 No slots to save to database`);
    }

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }
    const outputPath = `data/parksports-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
    console.log(`[${location} - ${date}] 💾 Saved ${slots.length} slots to ${outputPath}`);

    // Clear old ParkSports slots created around an hour ago (only if we successfully saved new slots)
    if (uniqueSlots.length > 0) {
      try {
        console.log(`[${location} - ${date}] 🧹 Clearing old ParkSports slots...`);
        
        // Calculate timestamp for 1 hour ago
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        const oneHourAgoStr = oneHourAgo.toISOString();
        
        const { data: deletedSlots, error: deleteError } = await db.supabase
          .from('tennis_slots')
          .delete()
          .eq('provider', 'parksports')
          .lt('created_at', oneHourAgoStr);
        
        if (deleteError) {
          console.error(`[${location} - ${date}] ❌ Error clearing old slots:`, deleteError);
        } else {
          console.log(`[${location} - ${date}] ✅ Cleared ${deletedSlots?.length || 0} old ParkSports slots (older than 1 hour)`);
        }
      } catch (error) {
        console.error(`[${location} - ${date}] ❌ Error during slot cleanup:`, error.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${location} - ${date}] ⏱️ Scraping for ${date} completed in ${duration} seconds`);
    console.log(`[${location} - ${date}] 📈 SUMMARY: ${slots.length} slots extracted, ${uniqueSlots.length} unique slots, ${uniqueSlots.length > 0 ? uniqueSlots.length : 0} saved to Supabase`);
    return slots;

  } catch (error) {
    console.error(`[${name} - ${date}] ❌ Error: ${error.message}`);
    
    // If it's a context error, we should recreate the shared browser
    if (error.message.includes('Protocol error') || error.message.includes('Cannot find context')) {
      console.log(`[${name} - ${date}] 🔄 Context error detected - browser may need recreation`);
      if (sharedBrowser && browserInstance === sharedBrowser) {
        console.log(`[${name} - ${date}] 🚨 Shared browser context corrupted - will be recreated`);
        sharedBrowser = null;
      }
    }
    
    return [];
  } finally {
    // Always close the page if it exists and is valid
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (error) {
        console.log(`[${name} - ${date}] Warning: Failed to close page: ${error.message}`);
      }
    }
    
    // Only close browser if we created it (not if it was passed in)
    if (shouldCloseBrowser && browser && browser.isConnected()) {
      try {
        await browser.close();
      } catch (error) {
        console.log(`[${name} - ${date}] Warning: Failed to close browser: ${error.message}`);
      }
    }
  }
};

// Function to get or create shared browser instance
const getSharedBrowser = async () => {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    if (sharedBrowser) {
      console.log('🔄 Shared browser disconnected - creating new instance...');
      try {
        await sharedBrowser.close();
      } catch (error) {
        console.log('Warning: Failed to close disconnected browser:', error.message);
      }
    } else {
      console.log('🚀 Launching shared browser instance for Park Sports...');
    }
    
    sharedBrowser = await puppeteer.launch({
      headless: true,
      slowMo: 500,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }
  return sharedBrowser;
};

const closeSharedBrowser = async () => {
  if (sharedBrowser) {
    console.log('🔒 Closing shared browser instance...');
    try {
      if (sharedBrowser.isConnected()) {
        await sharedBrowser.close();
      }
    } catch (error) {
      console.log('Warning: Failed to close shared browser:', error.message);
    }
    sharedBrowser = null;
  }
};

export default scrapeParkSports;
export { getSharedBrowser, closeSharedBrowser };

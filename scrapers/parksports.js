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
    
    // Quick check: Are there any available slots at all?
    const hasAnyAvailableSlots = await page.evaluate(() => {
      return document.querySelectorAll('[data-availability="true"][data-category="0"]').length > 0;
    });
    
    if (!hasAnyAvailableSlots) {
      console.log(`[${location} - ${date}] ✅ No available slots detected by data attributes`);
      return [];
    }
    
    // Wait longer for the page to fully load and render availability data
    // First a fixed delay, then wait for either available sessions or an empty-state marker
    await new Promise(resolve => setTimeout(resolve, 4000));
    try {
      await page.waitForFunction(() => {
        const empty = document.querySelector('.court-grid.no-slots');
        const anyBook = document.querySelector('a.book-interval.not-booked .available-booking-slot');
        const anySession = document.querySelector('.resource-session');
        return !!empty || !!anyBook || !!anySession;
      }, { timeout: 15000 });
    } catch {}

    // Validate page is still valid before DOM operations
    if (!page || page.isClosed()) {
      throw new Error('Page became invalid during scraping');
    }

    // Check for empty state first
    const isEmpty = await page.$('.court-grid.no-slots');
    if (isEmpty) {
      console.log(`[${location} - ${date}] ✅ No slots available on ${date} (confirmed by site)`);
      return [];
    }

    // Check for available bookable anchors directly
    const bookAnchors = await page.$$('a.book-interval.not-booked .available-booking-slot');
    console.log(`[${location} - ${date}] Found ${bookAnchors.length} book anchors`);

    // Also check for any slots with correct data attributes, even if they don't have book anchors
    const availableSlotsByData = await page.evaluate(() => {
      return document.querySelectorAll('[data-availability="true"][data-category="0"][data-capacity]:not([data-capacity="0"])').length;
    });
    console.log(`[${location} - ${date}] Found ${availableSlotsByData} slots with available data attributes`);

    if (bookAnchors.length === 0 && availableSlotsByData === 0) {
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

    console.log(`[${location} - ${date}] ✅ Found ${bookAnchors.length} potential bookable anchors, extracting slots...`);

    // Debug: Log the data attribute counts
    const dataAttributeCounts = await page.evaluate(() => {
      const available = document.querySelectorAll('[data-availability="true"]').length;
      const category0 = document.querySelectorAll('[data-category="0"]').length;
      const capacity1 = document.querySelectorAll('[data-capacity="1"]').length;
      return { available, category0, capacity1 };
    });
    console.log(`[${location} - ${date}] 🔍 Data attributes: available=${dataAttributeCounts.available}, category0=${dataAttributeCounts.category0}, capacity1=${dataAttributeCounts.capacity1}`);

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

          // Check data attributes first
          const availability = session.getAttribute('data-availability');
          const category = session.getAttribute('data-category');
          const capacity = parseInt(session.getAttribute('data-capacity') || '0');
          
          // Slot is bookable if: availability is true, category is 0 (available), capacity > 0
          if (availability !== 'true' || category !== '0' || capacity <= 0) {
            return null;
          }

          // Look for bookable anchor, but also check for cost and time information
          const anchor = interval.querySelector('a.book-interval.not-booked');
          const costSpan = anchor ? anchor.querySelector('.cost') : null;
          const timeSpan = anchor ? anchor.querySelector('.available-booking-slot') : null;
          
          // If we have an anchor with cost and time, use that
          if (anchor && costSpan && timeSpan) {
            const dataTestId = anchor.getAttribute('data-test-id');
            if (!dataTestId || !dataTestId.includes('|')) return null;

            const [_, dateFromTestId, startMinutes] = dataTestId.split('|');
            const start = parseInt(interval.getAttribute('data-system-start-time'));
            const end = parseInt(interval.getAttribute('data-system-end-time'));

            return {
              provider: "parksports",
              location,
              court: "Tennis Court",
              bookingUrl: `${baseURL}&date=${date}`,
              date,
              readableTime: timeSpan.innerText.trim(),
              cost: costSpan.innerText.trim(),
              startMinutes: start,
              endMinutes: end,
              sessionId: session.getAttribute('data-session-id'),
              slotKey: `${location}_${date}_${start}_${session.getAttribute('data-session-id')}`,
            };
          }
          
          // If no anchor but we have the right data attributes, try to construct from session data
          const sessionCost = session.getAttribute('data-session-cost');
          const startTime = parseInt(session.getAttribute('data-start-time'));
          const endTime = parseInt(session.getAttribute('data-end-time'));
          
          if (sessionCost && startTime !== null && endTime !== null) {
            const start = parseInt(interval.getAttribute('data-system-start-time'));
            const end = parseInt(interval.getAttribute('data-system-end-time'));
            
            return {
              provider: "parksports",
              location,
              court: "Tennis Court",
              bookingUrl: `${baseURL}&date=${date}`,
              date,
              readableTime: `Book at ${convertToTime(start)} - ${convertToTime(end)}`,
              cost: `£${parseFloat(sessionCost).toFixed(2)}`,
              startMinutes: start,
              endMinutes: end,
              sessionId: session.getAttribute('data-session-id'),
              slotKey: `${location}_${date}_${start}_${session.getAttribute('data-session-id')}`,
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
          console.error(`[${location} - ${date}] Failed to save to database:`, dbResult.error);
        } else {
          console.log(`[${location} - ${date}] ✅ Saved ${uniqueSlots.length} slots to database`);
        }
      } catch (error) {
        console.error(`[${location} - ${date}] Database error:`, error.message);
      }
    }

    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }
    const outputPath = `data/parksports-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
    console.log(`[${location} - ${date}] 💾 Saved ${slots.length} slots to ${outputPath}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${location} - ${date}] ⏱️ Scraping for ${date} completed in ${duration} seconds`);
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

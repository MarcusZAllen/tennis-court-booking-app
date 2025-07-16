import { chromium } from 'playwright';
import fs from 'fs';
import { DatabaseService } from '../lib/database.js';
import { retryWithBackoff, RateLimiter } from '../utils/retry-helper.js';

// Add randomized delay function
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Shared browser instance for pooling
let sharedBrowser = null;

// Create a rate limiter for ParkSports (more conservative)
const rateLimiter = new RateLimiter(3, 60000); // 3 requests per minute (reduced from 5)

const scrapeParkSports = async function ({ name, url }, date, browserInstance = null) {
  const startTime = Date.now();
  
  // Wait for rate limiter slot
  await rateLimiter.waitForSlot();
  
  // Add randomized delay before scraping to avoid rate limiting
  const randomDelay = 8000 + Math.random() * 12000; // 8-20 seconds (more conservative)
  console.log(`⏳ Waiting ${Math.round(randomDelay)}ms before scraping ${name}...`);
  await delay(randomDelay);
  
  // Use provided browser instance or create new one
  const browser = browserInstance || await chromium.launch({
    headless: true,
    slowMo: 300      // increased slowMo for more human-like behavior
  });
  
  // Set a realistic user agent
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  const context = await browser.newContext({ 
    userAgent: randomUserAgent,
    viewport: { width: 1920, height: 1080 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    // Add additional options for better reliability
    ignoreHTTPSErrors: true,
    bypassCSP: true
  });
  
  const page = await context.newPage();

  const location = name;
  const baseURL = url;
  
  // Use retry logic for page navigation with more lenient settings
  const loadPage = async () => {
    await page.goto(`${baseURL}&date=${date}`, { 
      waitUntil: 'domcontentloaded', // Changed from networkidle to domcontentloaded
      timeout: 60000 // Increased timeout to 60 seconds
    });
  };
  
  try {
    await retryWithBackoff(loadPage, 5, 5000); // Increased retries and delay
  } catch (error) {
    console.log(`[${location} - ${date}] Failed to load page after retries: ${error.message}`);
    await context.close();
    return [];
  }

  console.log(`[${location} - ${date}] Loaded court availability for ${date}`);

  // Add random wait times to simulate human behavior
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000 + Math.random() * 2000); // 3-5 seconds

  const hasSlots = await page.$('.resource-session[data-availability="true"]');
  const isEmpty = await page.$('.court-grid.no-slots');

  if (isEmpty) {
    console.log(`[${location} - ${date}] ✅ No slots available on ${date} (confirmed by site)`);
    await context.close();
    return [];
  }

  if (!hasSlots) {
    console.log(`[${location} - ${date}] 🟡 No slots found and no empty-state marker on ${date} — saving debug to investigate.`);
    fs.writeFileSync(`data/debug-${date}.html`, await page.content());
    await context.close();
    return [];
  }

  console.log(`[${location} - ${date}] ✅ Booking slots loaded`);

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
        if (!session || session.getAttribute('data-availability') !== 'true') return null;

        const anchor = interval.querySelector('a.book-interval');
        if (!anchor) return null;

        const timeSpan = anchor.querySelector('.available-booking-slot');
        const costSpan = anchor.querySelector('.cost');
        const dataTestId = anchor.getAttribute('data-test-id');

        if (!timeSpan || !costSpan || !dataTestId || !dataTestId.includes('|')) return null;

        const [_, dateFromTestId, startMinutes] = dataTestId.split('|');
        const start = parseInt(interval.getAttribute('data-system-start-time'));
        const end = parseInt(interval.getAttribute('data-system-end-time'));

        return {
          provider: "parksports",
          location,
          court: "Tennis Court", // ParkSports doesn't provide court names, so use generic
          bookingUrl: `${baseURL}&date=${date}`,
          date,
          readableTime: timeSpan.innerText.trim(),
          cost: costSpan.innerText.trim(),
          startMinutes: start,
          endMinutes: end,
          sessionId: session.getAttribute('data-session-id'),
          slotKey: session.getAttribute('data-slot-key'),
        };
      })
      .filter(Boolean);
  },
  { location, baseURL, date }
  );

  // Initialize database service and save slots
  const db = new DatabaseService();
  if (slots.length > 0) {
    try {
      const dbResult = await db.saveSlots(slots);
      if (!dbResult.success) {
        console.error(`[${location} - ${date}] Failed to save to database:`, dbResult.error);
      } else {
        console.log(`[${location} - ${date}] ✅ Saved ${slots.length} slots to database`);
      }
    } catch (error) {
      console.error(`[${location} - ${date}] Database error:`, error.message);
    }
  }

  const outputPath = `data/parksports-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
  console.log(`[${location} - ${date}] 💾 Saved ${slots.length} slots to ${outputPath}`);
  
  // Close context but keep browser alive for reuse
  await context.close();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[${location} - ${date}] ⏱️ Scraping for ${date} completed in ${duration} seconds`);
  return slots;
};

// Function to get or create shared browser instance
const getSharedBrowser = async () => {
  if (!sharedBrowser) {
    console.log('🚀 Launching shared browser instance for Park Sports...');
    sharedBrowser = await chromium.launch({
      headless: true,
      slowMo: 500, // Increased slowMo
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

// Function to close shared browser
const closeSharedBrowser = async () => {
  if (sharedBrowser) {
    console.log('🔒 Closing shared browser instance...');
    await sharedBrowser.close();
    sharedBrowser = null;
  }
};

export default scrapeParkSports;
export { getSharedBrowser, closeSharedBrowser };

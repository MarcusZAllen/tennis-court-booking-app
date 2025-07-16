import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { DatabaseService } from '../lib/database.js';
import { retryWithBackoff, RateLimiter } from '../utils/retry-helper.js';

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let sharedBrowser = null;
const rateLimiter = new RateLimiter(3, 60000); // 3 requests per minute

const scrapeParkSports = async function ({ name, url }, date, browserInstance = null) {
  const startTime = Date.now();
  await rateLimiter.waitForSlot();
  const randomDelay = 8000 + Math.random() * 12000;
  console.log(`⏳ Waiting ${Math.round(randomDelay)}ms before scraping ${name}...`);
  await delay(randomDelay);

  // Use provided browser instance or create new one
  const browser = browserInstance || await puppeteer.launch({
    headless: true,
    slowMo: 300,
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

  // Set a realistic user agent
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);
  await page.setViewport({ width: 1920, height: 1080 });

  // Set locale and timezone via emulation
  await page.emulateTimezone('Europe/London');
  await page.emulateVisionDeficiency(null); // No vision deficiency

  const location = name;
  const baseURL = url;

  const loadPage = async () => {
    await page.goto(`${baseURL}&date=${date}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
  };

  try {
    await retryWithBackoff(loadPage, 5, 5000);
  } catch (error) {
    console.log(`[${location} - ${date}] Failed to load page after retries: ${error.message}`);
    await page.close();
    // Only close browser if we created it (not if it was passed in)
    if (!browserInstance) {
      await browser.close();
    }
    return [];
  }

  console.log(`[${location} - ${date}] Loaded court availability for ${date}`);
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

  const hasSlots = await page.$('.resource-session[data-availability="true"]');
  const isEmpty = await page.$('.court-grid.no-slots');

  if (isEmpty) {
    console.log(`[${location} - ${date}] ✅ No slots available on ${date} (confirmed by site)`);
    await page.close();
    // Only close browser if we created it (not if it was passed in)
    if (!browserInstance) {
      await browser.close();
    }
    return [];
  }

  if (!hasSlots) {
    console.log(`[${location} - ${date}] 🟡 No slots found and no empty-state marker on ${date} — saving debug to investigate.`);
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }
    fs.writeFileSync(`data/debug-${date}.html`, await page.content());
    await page.close();
    // Only close browser if we created it (not if it was passed in)
    if (!browserInstance) {
      await browser.close();
    }
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
          court: "Tennis Court",
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
  }, { location, baseURL, date });

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

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }
  const outputPath = `data/parksports-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
  console.log(`[${location} - ${date}] 💾 Saved ${slots.length} slots to ${outputPath}`);

  // Always close the page, but only close browser if we created it
  await page.close();
  if (!browserInstance) {
    await browser.close();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[${location} - ${date}] ⏱️ Scraping for ${date} completed in ${duration} seconds`);
  return slots;
};

// Function to get or create shared browser instance
const getSharedBrowser = async () => {
  if (!sharedBrowser) {
    console.log('🚀 Launching shared browser instance for Park Sports...');
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
    await sharedBrowser.close();
    sharedBrowser = null;
  }
};

export default scrapeParkSports;
export { getSharedBrowser, closeSharedBrowser };

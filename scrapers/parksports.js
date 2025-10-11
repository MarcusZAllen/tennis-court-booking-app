import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { DatabaseService } from '../lib/database.js';
import { retryWithBackoff, RateLimiter } from '../utils/retry-helper.js';
import { getWorkingProxy, getProxyArgs, healthCheckProxies, recordProxyResult } from '../utils/proxy-config.js';

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Enhanced user agent rotation for better Cloudflare bypass
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
];

// Random viewport sizes to avoid detection
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1280, height: 720 }
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomViewport() {
  return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}

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
      
      // Run proxy health check before starting
      console.log(`[${name} - ${date}] 🔍 Running proxy health check...`);
      await healthCheckProxies();
      
      // Get proxy configuration
      const proxyArgs = getProxyArgs();
      const proxyInfo = proxyArgs.proxy ? `via ${proxyArgs.proxy.server}` : 'direct connection';
      console.log(`[${name} - ${date}] 🌐 Using ${proxyInfo}`);
      
      if (!proxyArgs.proxy) {
        console.log(`[${name} - ${date}] ⚠️ WARNING: No proxy available - using direct connection (may be blocked by Cloudflare)`);
      }
      
      browser = await puppeteer.launch({
    headless: true,
        slowMo: Math.floor(Math.random() * 2000) + 1000, // Random slowMo between 1-3 seconds
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          // Enhanced Cloudflare bypass args
          '--disable-blink-features=AutomationControlled',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--disable-default-apps',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-domain-reliability',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-ipc-flooding-protection',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-component-update',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        ...proxyArgs
      });
      console.log(`[${name} - ${date}] ✅ Puppeteer browser launched successfully`);
      shouldCloseBrowser = true;
    }

    // Create new page
    console.log(`[${name} - ${date}] 📄 Creating new page...`);
    page = await browser.newPage();
    console.log(`[${name} - ${date}] ✅ Page created successfully`);
    
    // Set random user agent and viewport for better Cloudflare bypass
    const userAgent = getRandomUserAgent();
    const viewport = getRandomViewport();
    await page.setUserAgent(userAgent);
    await page.setViewport(viewport);
    console.log(`[${name} - ${date}] 🎭 Using user agent: ${userAgent.substring(0, 50)}...`);
    console.log(`[${name} - ${date}] 📱 Using viewport: ${viewport.width}x${viewport.height}`);
    
    // Set additional headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Set timezone to London
    await page.emulateTimezone('Europe/London');
    
    // Enhanced stealth measures for Cloudflare bypass
    await page.evaluateOnNewDocument(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins with realistic data
      Object.defineProperty(navigator, 'plugins', {
        get: () => ({
          length: 3,
          0: { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
          1: { name: 'Chrome PDF Viewer', description: '' },
          2: { name: 'Native Client', description: '' }
        }),
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' })
        }),
      });
      
      // Randomize hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => Math.floor(Math.random() * 8) + 4, // 4-12 cores
      });
      
      // Randomize device memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => [4, 8, 16][Math.floor(Math.random() * 3)],
      });
      
      // Randomize connection
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: ['4g', '3g'][Math.floor(Math.random() * 2)],
          rtt: Math.floor(Math.random() * 100) + 20,
          downlink: Math.floor(Math.random() * 10) + 1,
          saveData: false
        }),
      });
      
      // Override screen properties
      Object.defineProperty(screen, 'width', {
        get: () => Math.floor(Math.random() * 500) + 1200,
      });
      Object.defineProperty(screen, 'height', {
        get: () => Math.floor(Math.random() * 500) + 800,
      });
      
      // Override timezone
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        get: () => () => ({ timeZone: 'Europe/London' }),
      });
      
      // Remove automation indicators
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_JSON;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Object;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Proxy;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Reflect;
      
      // Override chrome runtime
      if (window.chrome) {
        Object.defineProperty(window.chrome, 'runtime', {
          get: () => ({
            onConnect: undefined,
            onMessage: undefined
          }),
        });
      }
      
      // Override notification permission
      Object.defineProperty(Notification, 'permission', {
        get: () => 'default',
      });
    });
    
    console.log(`[${name} - ${date}] ✅ Page configured successfully`);

  const location = name;
  const baseURL = url;

    const loadPage = async () => {
      // Check if page is still valid before navigation
      if (!page || page.isClosed()) {
        throw new Error('Page is closed or invalid');
      }
      
      // Add random delay to simulate human behavior
      const randomDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
      console.log(`[${location} - ${date}] ⏳ Adding random delay of ${randomDelay}ms to simulate human behavior...`);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      // Try multiple navigation strategies
      const strategies = [
        { waitUntil: 'networkidle2', timeout: 60000 },
        { waitUntil: 'domcontentloaded', timeout: 45000 },
        { waitUntil: 'load', timeout: 30000 }
      ];
      
      let lastError = null;
      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`[${location} - ${date}] 🚀 Attempting navigation strategy ${i + 1}/${strategies.length}...`);
          await page.goto(`${baseURL}&date=${date}`, strategies[i]);
          console.log(`[${location} - ${date}] ✅ Navigation successful with strategy ${i + 1}`);
          break;
        } catch (error) {
          lastError = error;
          console.log(`[${location} - ${date}] ⚠️ Strategy ${i + 1} failed: ${error.message}`);
          if (i < strategies.length - 1) {
            console.log(`[${location} - ${date}] 🔄 Trying next strategy...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (lastError && lastError.message.includes('Navigation timeout')) {
        throw lastError;
      }
    };

    try {
      await retryWithBackoff(loadPage, 5, 5000);
    } catch (error) {
      console.log(`[${location} - ${date}] Failed to load page after retries: ${error.message}`);
      return [];
    }

  console.log(`[${location} - ${date}] Loaded court availability for ${date}`);

    // Enhanced Cloudflare verification with multiple bypass strategies
    console.log(`[${location} - ${date}] 🔒 Waiting for Cloudflare verification to complete...`);
    let cloudflareBypassed = false;
    
    try {
      await page.waitForFunction(() => {
        const title = document.title;
        const bodyText = document.body.textContent;
        
        // Check if we're still on Cloudflare verification page
        if (title.includes('Just a moment') || 
            bodyText.includes('Verifying you are human') ||
            bodyText.includes('Please wait') ||
            bodyText.includes('Checking your browser') ||
            bodyText.includes('DDoS protection')) {
          return false; // Still on verification page
        }
        
        // Check if we've reached the actual booking page
        if (title.includes('Clubspark') || 
            title.includes('Booking') || 
            bodyText.includes('resource-session') ||
            bodyText.includes('book-interval') ||
            document.querySelector('.resource-session')) {
          return true; // Verification complete
        }
        
        return false; // Still waiting
      }, { timeout: 45000 }); // Increased timeout to 45 seconds
      
      console.log(`[${location} - ${date}] ✅ Cloudflare verification completed`);
      cloudflareBypassed = true;
    } catch (error) {
      console.log(`[${location} - ${date}] ⚠️  Cloudflare verification timeout: ${error.message}`);
      
      // Try multiple bypass strategies
      const bypassStrategies = [
        async () => {
          console.log(`[${location} - ${date}] 🔄 Strategy 1: Page refresh...`);
          await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 5000));
        },
        async () => {
          console.log(`[${location} - ${date}] 🔄 Strategy 2: Navigate to homepage first...`);
          await page.goto(baseURL, { waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
          await page.goto(`${baseURL}&date=${date}`, { waitUntil: 'networkidle2', timeout: 30000 });
        },
        async () => {
          console.log(`[${location} - ${date}] 🔄 Strategy 3: Simulate mouse movement...`);
          await page.mouse.move(100, 100);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.mouse.move(200, 200);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      ];
      
      for (let i = 0; i < bypassStrategies.length; i++) {
        try {
          await bypassStrategies[i]();
          
          // Check if any strategy worked
          const title = await page.title();
          const bodyText = await page.evaluate(() => document.body.textContent);
          
          if (!title.includes('Just a moment') && 
              !bodyText.includes('Verifying you are human') &&
              (bodyText.includes('resource-session') || bodyText.includes('book-interval'))) {
            console.log(`[${location} - ${date}] ✅ Strategy ${i + 1} successful - Cloudflare bypassed`);
            cloudflareBypassed = true;
            break;
          }
        } catch (strategyError) {
          console.log(`[${location} - ${date}] ❌ Strategy ${i + 1} failed: ${strategyError.message}`);
        }
      }
      
      if (!cloudflareBypassed) {
        console.log(`[${location} - ${date}] ⚠️  All Cloudflare bypass strategies failed, continuing anyway...`);
      }
    }
    
    // Quick check: Are there any actually bookable slots at all?
    const slotCounts = await page.evaluate(() => {
      const bookableAnchors = document.querySelectorAll('a.book-interval.not-booked').length;
      const bookingSlots = document.querySelectorAll('a.book-interval.not-booked .available-booking-slot').length;
      const allAnchors = document.querySelectorAll('a').length;
      const allBookIntervals = document.querySelectorAll('a.book-interval').length;
      const allResourceIntervals = document.querySelectorAll('.resource-interval').length;
      const allResourceSessions = document.querySelectorAll('.resource-session').length;
      const pageTitle = document.title;
      const bodyText = document.body.textContent.substring(0, 200); // First 200 chars
      
      return { 
        bookableAnchors, 
        bookingSlots, 
        allAnchors, 
        allBookIntervals, 
        allResourceIntervals,
        allResourceSessions,
        pageTitle,
        bodyText
      };
    });
    
    console.log(`[${location} - ${date}] 🔍 Page evaluation: bookable anchors=${slotCounts.bookableAnchors}, booking slots=${slotCounts.bookingSlots}, all anchors=${slotCounts.allAnchors}, all book intervals=${slotCounts.allBookIntervals}, all resource intervals=${slotCounts.allResourceIntervals}, all resource sessions=${slotCounts.allResourceSessions} [PRODUCTION READY]`);
    console.log(`[${location} - ${date}] 📄 Page info: title="${slotCounts.pageTitle}", body preview="${slotCounts.bodyText}..."`);
    
    if (slotCounts.bookingSlots === 0) {
      console.log(`[${location} - ${date}] ✅ No actually bookable slots detected`);
      
      // Check if page loaded correctly
      if (slotCounts.allResourceSessions === 0) {
        console.log(`[${location} - ${date}] ⚠️  WARNING: No resource sessions found - page may not have loaded correctly`);
      }
      
      if (slotCounts.allAnchors < 10) {
        console.log(`[${location} - ${date}] ⚠️  WARNING: Very few anchors found (${slotCounts.allAnchors}) - page may not have loaded correctly`);
      }
      
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

    // Wait for page to load (much longer wait for production environment)
    console.log(`[${location} - ${date}] ⏳ Waiting for page to fully load (production environment)...`);
    await new Promise(resolve => setTimeout(resolve, 10000));

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

            // Detect sport type based on court name
            const sportType = courtName.toLowerCase().includes('padel') ? 'padel' : 'tennis';

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
              sportType: sportType,
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

    // Record successful proxy usage
    const currentProxy = getWorkingProxy();
    if (currentProxy) {
      recordProxyResult(currentProxy, true);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${location} - ${date}] ⏱️ Scraping for ${date} completed in ${duration} seconds`);
    console.log(`[${location} - ${date}] 📈 SUMMARY: ${slots.length} slots extracted, ${uniqueSlots.length} unique slots, ${uniqueSlots.length > 0 ? uniqueSlots.length : 0} saved to Supabase`);
    return slots;

  } catch (error) {
    console.error(`[${name} - ${date}] ❌ Error: ${error.message}`);
    
    // Handle proxy-related errors
    if (error.message.includes('proxy') || error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      const currentProxy = getWorkingProxy();
      if (currentProxy) {
        console.log(`[${name} - ${date}] 🚫 Proxy ${currentProxy} failed - marking as failed`);
        recordProxyResult(currentProxy, false);
      }
    }
    
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

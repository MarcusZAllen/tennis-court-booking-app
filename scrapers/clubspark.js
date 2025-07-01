const { chromium } = require('playwright');
const fs = require('fs');

// Add randomized delay function
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = async function scrapeClubSpark({ name, url }, date) {
  const startTime = Date.now();
  
  // Add randomized delay before scraping to avoid rate limiting
  const randomDelay = 3000 + Math.random() * 4000; // 3-7 seconds
  await delay(randomDelay);
  
  // Launch browser with slowMo to appear more human-like
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 150 // slows operations to reduce server suspicion
  });
  // Set a realistic user agent
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const context = await browser.newContext({ userAgent: randomUserAgent });
  const page = await context.newPage();

  const location = name;
  const baseURL = url;  
  await page.goto(`${baseURL}&date=${date}`, { waitUntil: 'networkidle' });

  console.log(`[${location} - ${date}] Loaded court availability for ${date}`);

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(4000);

  const hasSlots = await page.$('.resource-session[data-availability="true"]');
  const isEmpty = await page.$('.court-grid.no-slots');

  if (isEmpty) {
    console.log(`✅ [${location} - ${date}] No slots available on ${date} (confirmed by site)`);
    await browser.close();
    return [];
  }

  if (!hasSlots) {
    console.log(`🟡 [${location} - ${date}] No slots found and no empty-state marker on ${date} — saving debug to investigate.`);
    fs.writeFileSync(`data/debug-${date}-clubspark.html`, await page.content());
    await browser.close();
    return [];
  }

  console.log(`✅ [${location} - ${date}] Booking slots loaded`);

  // Use a single metadata object to pass multiple arguments to the page context
  const slots = await page.$$eval(
    '.resource-interval',
    (intervals, meta) => {
      // Destructure the metadata object for use inside the page context
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
            provider: "clubspark",
            location,
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
    { location, baseURL, date } // pass metadata as a single object
  );

  if (slots.length === 0) {
    console.log(`[${location} - ${date}] ⚠️ No available slots — writing empty file`);
  }

  const outputPath = `data/clubspark-${location.toLowerCase().replace(/\s+/g, '-')}-${date}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(slots, null, 2));
  console.log(`💾 [${location} - ${date}] Saved ${slots.length} slots to ${outputPath}`);
  await browser.close();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ [${location} - ${date}] Scraping completed in ${duration} seconds`);
  return slots;
};

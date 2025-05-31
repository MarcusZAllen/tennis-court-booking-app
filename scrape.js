const { chromium } = require('playwright');
const fs = require('fs');

// Ensure data directory exists
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

(async () => {
  // Launch browser visibly for debugging - to be changed in invisible when complete
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate directly to a date with known court availability
  await page.goto('https://regents.parksports.co.uk/Booking/BookByDate#?date=2025-06-07&role=guest&resource-group-id=4b9d73dd-ca02-4e95-09fe-9a92d6d323d4', {
    waitUntil: 'networkidle'
  });
  console.log('Loaded specific date with tennis courts');

  // Scroll to trigger any lazy-loaded content
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 500));

  // Wait for available sessions to load
  await page.waitForSelector('.resource-session[data-availability="true"]', { timeout: 15000 });
  console.log('Booking slots loaded');

  // Save full page content for debugging (optional)
  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  // Scrape each resource-interval (each separately bookable time slot)
  const slots = await page.$$eval('.resource-interval', (intervals) => {
    const convertToTime = (minutes) => {
      const h = String(Math.floor(minutes / 60)).padStart(2, '0');
      const m = String(minutes % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    return intervals
      .map(interval => {
        // Locate the parent session element
        const session = interval.closest('.resource-session');
        if (!session || session.getAttribute('data-availability') !== 'true') return null;

        // Extract data from anchor tag
        const anchor = interval.querySelector('a.book-interval');
        if (!anchor) return null;

        const timeSpan = anchor.querySelector('.available-booking-slot');
        const costSpan = anchor.querySelector('.cost');
        const dataTestId = anchor.getAttribute('data-test-id');

        if (!timeSpan || !costSpan || !dataTestId || !dataTestId.includes('|')) return null;

        // Parse slot metadata
        const [_, date, startMinutes] = dataTestId.split('|');

        const start = parseInt(interval.getAttribute('data-system-start-time'));
        const end = parseInt(interval.getAttribute('data-system-end-time'));

        return {
          date,
          readableTime: timeSpan.innerText.trim(),
          cost: costSpan.innerText.trim(),
          startMinutes: start,
          endMinutes: end,
          sessionId: session.getAttribute('data-session-id'),
          slotKey: session.getAttribute('data-slot-key'),
        };
      })
      .filter(Boolean); // remove nulls
  });

  // Log and save output to file
  if (slots.length === 0) {
    console.log('No available slots.');
  } else {
    console.log('Available slots:', slots);
  }

  fs.writeFileSync('data/output.json', JSON.stringify(slots, null, 2));

  await browser.close();
})();
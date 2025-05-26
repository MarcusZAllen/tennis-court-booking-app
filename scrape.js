const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://regents.parksports.co.uk/Booking/');
  await page.waitForSelector('.book-button');

  const slots = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.book-button'));
    return buttons.map(btn => btn.textContent.trim());
  });

  console.log('Available Slots:', slots);

  await browser.close();
})();

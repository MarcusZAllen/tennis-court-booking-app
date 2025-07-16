import { chromium } from 'playwright';
import stealthPkg from 'playwright-stealth';
const { addStealth } = stealthPkg;

async function quickTest() {
  console.log('🔍 Quick test for July 21st with playwright-stealth...');
  
  const browser = await chromium.launch({
    headless: false, // Non-headless to observe
    slowMo: 500
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  });

  // Add stealth features
  await addStealth(context);
  
  const page = await context.newPage();
  
  try {
    const testUrl = 'https://regents.parksports.co.uk/Booking/BookByDate#?role=guest&date=2025-07-21';
    console.log(`🌐 Loading: ${testUrl}`);
    
    await page.goto(testUrl, { 
      waitUntil: 'load',
      timeout: 60000
    });
    
    console.log('✅ Page loaded');
    await page.waitForTimeout(5000);
    
    // Check the same selectors the scraper uses
    const hasSlots = await page.$('.resource-session[data-availability="true"]');
    const isEmpty = await page.$('.court-grid.no-slots');
    const resourceIntervals = await page.$$('.resource-interval');
    const bookIntervals = await page.$$('.book-interval');
    
    console.log('\n🔍 Selector results:');
    console.log(`  .resource-session[data-availability="true"]: ${hasSlots ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  .court-grid.no-slots: ${isEmpty ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  .resource-interval: ${resourceIntervals.length} elements`);
    console.log(`  .book-interval: ${bookIntervals.length} elements`);
    
    if (hasSlots) {
      console.log('✅ Available slots found!');
    } else if (isEmpty) {
      console.log('✅ No slots available (confirmed by site)');
    } else {
      console.log('🟡 No slots found and no empty-state marker');
    }
    
    // Check page title
    const title = await page.title();
    console.log(`\n📄 Page title: ${title}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error); 
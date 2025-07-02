import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  // Only allow POST requests (cron jobs)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting manual scrape for all providers...');

    // Run Clubspark scraper
    await execAsync('node runner/scrape-clubspark-only.js', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutes
    });

    // Run ParkSports scraper
    await execAsync('node runner/scrape-parksports-only.js', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutes
    });

    // Run aggregation
    await execAsync('node aggregate-daily-to-location.js', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutes
    });

    res.status(200).json({ 
      success: true, 
      message: 'Scraping completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  // Only allow POST requests (cron jobs)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting scheduled scraping job...');
    
    // Run the production scraper
    const { stdout, stderr } = await execAsync('npm run scrape:prod', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutes timeout
    });

    console.log('✅ Scraping completed successfully');
    console.log('STDOUT:', stdout);
    
    if (stderr) {
      console.log('STDERR:', stderr);
    }

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
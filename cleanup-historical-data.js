import { DatabaseService } from './lib/database.js';

async function cleanupHistoricalData() {
  console.log('🧹 Starting historical data cleanup...');
  
  try {
    const db = new DatabaseService();
    
    // Get current stats
    const beforeStats = await db.getStats();
    if (beforeStats.success) {
      console.log(`📊 Before cleanup: ${beforeStats.totalSlots} total slots`);
    }
    
    // Remove data older than 7 days
    const cleanupResult = await db.deleteOldSlots(7);
    
    if (cleanupResult.success) {
      console.log(`✅ Deleted ${cleanupResult.count} historical slots`);
      
      // Get stats after cleanup
      const afterStats = await db.getStats();
      if (afterStats.success) {
        console.log(`📊 After cleanup: ${afterStats.totalSlots} total slots`);
        console.log(`📉 Removed ${beforeStats.totalSlots - afterStats.totalSlots} slots`);
      }
    } else {
      console.error('❌ Cleanup failed:', cleanupResult.error);
    }
    
  } catch (error) {
    console.error('💥 Error during cleanup:', error);
  }
}

cleanupHistoricalData(); 
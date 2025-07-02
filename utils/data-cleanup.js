import fs from 'fs';
import path from 'path';

/**
 * Comprehensive data cleanup utility
 * Removes old files based on age and type
 */
class DataCleanup {
  constructor(dataDir = './data') {
    this.dataDir = path.resolve(dataDir);
    this.preservedFiles = [
      'locations.json',
      'multi-date-output.json'
    ];
  }

  /**
   * Get file age in days
   */
  getFileAge(filePath) {
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileDate = new Date(stats.mtime);
    const diffTime = Math.abs(now - fileDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if file should be preserved
   */
  shouldPreserveFile(filename) {
    return this.preservedFiles.includes(filename);
  }

  /**
   * Clean up old daily JSON files (older than specified days)
   */
  cleanDailyFiles(maxAgeDays = 7) {
    console.log(`🧹 Cleaning daily JSON files older than ${maxAgeDays} days...`);
    
    if (!fs.existsSync(this.dataDir)) {
      console.log('📁 Data directory does not exist, skipping cleanup');
      return;
    }

    const files = fs.readdirSync(this.dataDir);
    let cleanedCount = 0;

    files.forEach(filename => {
      if (!filename.endsWith('.json') || this.shouldPreserveFile(filename)) {
        return;
      }

      const filePath = path.join(this.dataDir, filename);
      const age = this.getFileAge(filePath);

      if (age > maxAgeDays) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed old file: ${filename} (${age} days old)`);
          cleanedCount++;
        } catch (err) {
          console.error(`❌ Failed to remove ${filename}:`, err.message);
        }
      }
    });

    console.log(`✅ Cleaned ${cleanedCount} old daily files`);
  }

  /**
   * Clean up debug HTML files (older than specified days)
   */
  cleanDebugFiles(maxAgeDays = 3) {
    console.log(`🧹 Cleaning debug HTML files older than ${maxAgeDays} days...`);
    
    if (!fs.existsSync(this.dataDir)) {
      return;
    }

    const files = fs.readdirSync(this.dataDir);
    let cleanedCount = 0;

    files.forEach(filename => {
      if (!filename.startsWith('debug-') || !filename.endsWith('.html')) {
        return;
      }

      const filePath = path.join(this.dataDir, filename);
      const age = this.getFileAge(filePath);

      if (age > maxAgeDays) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed old debug file: ${filename} (${age} days old)`);
          cleanedCount++;
        } catch (err) {
          console.error(`❌ Failed to remove ${filename}:`, err.message);
        }
      }
    });

    console.log(`✅ Cleaned ${cleanedCount} old debug files`);
  }

  /**
   * Clean up empty JSON files
   */
  cleanEmptyFiles() {
    console.log('🧹 Cleaning empty JSON files...');
    
    if (!fs.existsSync(this.dataDir)) {
      return;
    }

    const files = fs.readdirSync(this.dataDir);
    let cleanedCount = 0;

    files.forEach(filename => {
      if (!filename.endsWith('.json') || this.shouldPreserveFile(filename)) {
        return;
      }

      const filePath = path.join(this.dataDir, filename);
      const stats = fs.statSync(filePath);

      if (stats.size === 0 || stats.size === 2) { // 2 bytes = "[]" or "{}"
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed empty file: ${filename}`);
          cleanedCount++;
        } catch (err) {
          console.error(`❌ Failed to remove ${filename}:`, err.message);
        }
      }
    });

    console.log(`✅ Cleaned ${cleanedCount} empty files`);
  }

  /**
   * Get data directory statistics
   */
  getStats() {
    if (!fs.existsSync(this.dataDir)) {
      return { error: 'Data directory does not exist' };
    }

    const files = fs.readdirSync(this.dataDir);
    const stats = {
      totalFiles: files.length,
      jsonFiles: 0,
      debugFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null
    };

    let oldestAge = Infinity;
    let newestAge = -Infinity;

    files.forEach(filename => {
      const filePath = path.join(this.dataDir, filename);
      const fileStats = fs.statSync(filePath);
      
      stats.totalSize += fileStats.size;

      if (filename.endsWith('.json')) {
        stats.jsonFiles++;
      } else if (filename.startsWith('debug-') && filename.endsWith('.html')) {
        stats.debugFiles++;
      }

      const age = this.getFileAge(filePath);
      if (age < oldestAge) {
        oldestAge = age;
        stats.oldestFile = { filename, age };
      }
      if (age > newestAge) {
        newestAge = age;
        stats.newestFile = { filename, age };
      }
    });

    return stats;
  }

  /**
   * Run full cleanup
   */
  runFullCleanup(options = {}) {
    const {
      dailyFilesMaxAge = 7,
      debugFilesMaxAge = 3,
      cleanEmpty = true,
      showStats = true
    } = options;

    console.log('🚀 Starting comprehensive data cleanup...\n');

    if (showStats) {
      const beforeStats = this.getStats();
      console.log('📊 Before cleanup:', beforeStats);
      console.log('');
    }

    this.cleanDailyFiles(dailyFilesMaxAge);
    this.cleanDebugFiles(debugFilesMaxAge);
    
    if (cleanEmpty) {
      this.cleanEmptyFiles();
    }

    if (showStats) {
      console.log('');
      const afterStats = this.getStats();
      console.log('📊 After cleanup:', afterStats);
    }

    console.log('\n✅ Data cleanup completed!');
  }
}

export default DataCleanup; 
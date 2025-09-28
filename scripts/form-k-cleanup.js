#!/usr/bin/env node

/**
 * Form K Cleanup Script
 * 
 * This script can be run manually or via cron to automatically clean up
 * expired Form K submissions (older than 6 months).
 * 
 * Usage:
 *   node scripts/form-k-cleanup.js [--dry-run] [--stats-only]
 * 
 * Options:
 *   --dry-run     Show what would be deleted without actually deleting
 *   --stats-only  Only show statistics, don't perform cleanup
 * 
 * Cron example (run daily at 2 AM):
 *   0 2 * * * cd /app && node scripts/form-k-cleanup.js >> /var/log/form-k-cleanup.log 2>&1
 */

import { scheduleFormKCleanup, getFormKStatistics, purgeExpiredFormKSubmissions } from '../server/utils/formKCleanupService.js';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isStatsOnly = args.includes('--stats-only');

async function main() {
  console.log('🚀 Form K Cleanup Script Started');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('─'.repeat(50));
  
  try {
    // Always show statistics first
    console.log('📊 Getting Form K statistics...');
    const stats = await getFormKStatistics();
    
    console.log('\n📈 Form K Statistics:');
    console.log(`  Total submissions: ${stats.total}`);
    console.log(`  Active submissions: ${stats.active}`);
    console.log(`  Expired submissions: ${stats.expired}`);
    console.log(`  Expiration cutoff: ${new Date(stats.expirationCutoffDate).toLocaleDateString()}`);
    console.log(`  Retention period: ${stats.expirationMonths} months`);
    
    if (isStatsOnly) {
      console.log('\n✅ Statistics only mode - no cleanup performed');
      process.exit(0);
    }
    
    if (stats.expired === 0) {
      console.log('\n✅ No expired submissions found - nothing to clean up');
      process.exit(0);
    }
    
    console.log('\n🧹 Starting cleanup process...');
    
    if (isDryRun) {
      console.log('🧪 DRY RUN MODE - No actual deletion will be performed');
    }
    
    const result = await purgeExpiredFormKSubmissions(isDryRun);
    
    console.log('\n📋 Cleanup Results:');
    console.log(`  Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`  Submissions processed: ${result.expiredSubmissions.length}`);
    console.log(`  Submissions purged: ${result.purgedCount}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`    • ${error}`);
      });
    }
    
    if (isDryRun) {
      console.log('\n🧪 DRY RUN COMPLETED - No actual changes made');
    } else {
      console.log(`\n✅ Cleanup completed successfully! Purged ${result.purgedCount} expired submissions.`);
    }
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Form K cleanup script failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle script termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Script interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Script terminated');
  process.exit(1);
});

// Run the main function
main();

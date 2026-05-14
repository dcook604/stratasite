import { getPrisma } from './prisma.js';
import fs from 'fs';
import path from 'path';

// Lazy initialization of Prisma client
let prisma = null;
const getPrismaClient = () => {
  if (!prisma) {
    prisma = getPrisma();
  }
  return prisma;
};

/**
 * Form K Cleanup Service
 * Handles automatic expiration and purging of Form K submissions after 6 months
 */

const EXPIRATION_MONTHS = 6;

/**
 * Calculate the cutoff date for expiration (6 months ago)
 */
const getExpirationCutoffDate = () => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - EXPIRATION_MONTHS);
  return cutoffDate;
};

/**
 * Find expired Form K submissions
 */
const findExpiredFormKSubmissions = async () => {
  const db = getPrismaClient();
  const cutoffDate = getExpirationCutoffDate();
  
  console.log(`🔍 Looking for Form K submissions older than ${cutoffDate.toISOString()}`);
  
  const expiredSubmissions = await db.formKSubmission.findMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    },
    select: {
      id: true,
      unitNumber: true,
      tenant1Name: true,
      tenant2Name: true,
      landlordName: true,
      createdAt: true,
      submissionDate: true
    }
  });
  
  return expiredSubmissions;
};

/**
 * Clean up any associated files or data for a Form K submission
 */
const cleanupAssociatedFiles = async (submissionId) => {
  // Check for any generated PDFs in uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const formKDir = path.join(uploadsDir, 'form-k');
  
  if (fs.existsSync(formKDir)) {
    const files = fs.readdirSync(formKDir);
    const submissionFiles = files.filter(file => file.includes(submissionId));
    
    for (const file of submissionFiles) {
      const filePath = path.join(formKDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted file: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to delete file ${file}:`, error.message);
      }
    }
  }
};

/**
 * Purge expired Form K submissions from the database
 */
const purgeExpiredFormKSubmissions = async (dryRun = false) => {
  const db = getPrismaClient();
  const expiredSubmissions = await findExpiredFormKSubmissions();
  
  if (expiredSubmissions.length === 0) {
    console.log('✅ No expired Form K submissions found');
    return {
      success: true,
      purgedCount: 0,
      expiredSubmissions: []
    };
  }
  
  console.log(`📋 Found ${expiredSubmissions.length} expired Form K submissions:`);
  expiredSubmissions.forEach(submission => {
    const age = Math.floor((new Date() - new Date(submission.createdAt)) / (1000 * 60 * 60 * 24));
    console.log(`  • Unit ${submission.unitNumber} - ${submission.tenant1Name} (${age} days old)`);
  });
  
  if (dryRun) {
    console.log('🧪 DRY RUN: Would purge the above submissions (no actual deletion performed)');
    return {
      success: true,
      purgedCount: 0,
      expiredSubmissions,
      dryRun: true
    };
  }
  
  // Perform actual deletion
  let purgedCount = 0;
  const errors = [];
  
  for (const submission of expiredSubmissions) {
    try {
      // Clean up associated files first
      await cleanupAssociatedFiles(submission.id);
      
      // Delete from database
      await db.formKSubmission.delete({
        where: { id: submission.id }
      });
      
      purgedCount++;
      console.log(`✅ Purged Form K submission for Unit ${submission.unitNumber} (${submission.tenant1Name})`);
      
    } catch (error) {
      const errorMsg = `Failed to purge submission ${submission.id}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }
  
  console.log(`🎉 Successfully purged ${purgedCount} expired Form K submissions`);
  
  if (errors.length > 0) {
    console.error(`⚠️  ${errors.length} errors occurred during purging:`);
    errors.forEach(error => console.error(`  • ${error}`));
  }
  
  return {
    success: errors.length === 0,
    purgedCount,
    expiredSubmissions,
    errors
  };
};

/**
 * Get statistics about Form K submissions and expiration
 */
const getFormKStatistics = async () => {
  const db = getPrismaClient();
  const cutoffDate = getExpirationCutoffDate();
  
  const [totalCount, expiredCount, activeCount] = await Promise.all([
    db.formKSubmission.count(),
    db.formKSubmission.count({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    }),
    db.formKSubmission.count({
      where: {
        createdAt: {
          gte: cutoffDate
        }
      }
    })
  ]);
  
  return {
    total: totalCount,
    expired: expiredCount,
    active: activeCount,
    expirationCutoffDate: cutoffDate.toISOString(),
    expirationMonths: EXPIRATION_MONTHS
  };
};

/**
 * Schedule automatic cleanup (to be called by cron job or scheduler)
 */
const scheduleFormKCleanup = async () => {
  console.log('🕐 Starting scheduled Form K cleanup...');
  
  try {
    const stats = await getFormKStatistics();
    console.log('📊 Form K Statistics:', stats);
    
    if (stats.expired > 0) {
      const result = await purgeExpiredFormKSubmissions(false);
      
      if (result.success) {
        console.log(`✅ Scheduled cleanup completed successfully. Purged ${result.purgedCount} submissions.`);
      } else {
        console.error(`⚠️  Scheduled cleanup completed with errors. Purged ${result.purgedCount} submissions.`);
      }
      
      return result;
    } else {
      console.log('✅ No expired submissions to clean up');
      return { success: true, purgedCount: 0 };
    }
    
  } catch (error) {
    console.error('❌ Scheduled Form K cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

export {
  findExpiredFormKSubmissions,
  purgeExpiredFormKSubmissions,
  getFormKStatistics,
  scheduleFormKCleanup,
  getExpirationCutoffDate,
  EXPIRATION_MONTHS
};

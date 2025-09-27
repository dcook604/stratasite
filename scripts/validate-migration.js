#!/usr/bin/env node

/**
 * Migration Validation Script for Spectrum 4
 * 
 * Validates migrations before deployment to catch potential production issues.
 * Run this script before deploying to production.
 * 
 * Usage: node scripts/validate-migration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'prisma', 'migrations');

// Dangerous patterns that should be avoided in production migrations
const DANGEROUS_PATTERNS = [
  {
    pattern: /ALTER TABLE .* ADD COLUMN .* NOT NULL(?!\s+DEFAULT)/i,
    message: 'Adding NOT NULL column without DEFAULT to existing table - will fail with existing data',
    severity: 'ERROR'
  },
  {
    pattern: /DROP TABLE/i,
    message: 'Dropping table - ensure this is intentional and data is backed up',
    severity: 'WARNING'
  },
  {
    pattern: /DROP COLUMN/i,
    message: 'Dropping column - ensure multi-step migration process is followed',
    severity: 'WARNING'
  },
  {
    pattern: /ALTER TABLE .* RENAME TO/i,
    message: 'Renaming table - ensure application code is updated',
    severity: 'WARNING'
  },
  {
    pattern: /CREATE TABLE.*\n.*PRIMARY KEY.*\n.*NOT NULL.*\n.*NOT NULL/s,
    message: 'Creating table with multiple NOT NULL constraints - verify this is needed',
    severity: 'INFO'
  }
];

// Safe patterns that are generally OK
const SAFE_PATTERNS = [
  /ALTER TABLE .* ADD COLUMN .* TEXT DEFAULT/i,
  /CREATE TABLE IF NOT EXISTS/i,
  /CREATE INDEX IF NOT EXISTS/i,
  /INSERT INTO.*ON CONFLICT.*DO NOTHING/i
];

/**
 * Get all migration files sorted by creation date
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('❌ Migrations directory not found');
    return [];
  }

  const migrationDirs = fs.readdirSync(MIGRATIONS_DIR)
    .filter(dir => fs.statSync(path.join(MIGRATIONS_DIR, dir)).isDirectory())
    .sort();

  const migrations = [];
  for (const dir of migrationDirs) {
    const migrationFile = path.join(MIGRATIONS_DIR, dir, 'migration.sql');
    if (fs.existsSync(migrationFile)) {
      migrations.push({
        name: dir,
        path: migrationFile,
        content: fs.readFileSync(migrationFile, 'utf8')
      });
    }
  }

  return migrations;
}

/**
 * Validate a single migration file
 */
function validateMigration(migration) {
  console.log(`\n🔍 Validating migration: ${migration.name}`);
  
  const issues = [];
  
  // Check for dangerous patterns
  for (const check of DANGEROUS_PATTERNS) {
    if (check.pattern.test(migration.content)) {
      issues.push({
        type: check.severity,
        message: check.message,
        pattern: check.pattern.toString()
      });
    }
  }
  
  // Check if migration has any safe patterns
  const hasSafePatterns = SAFE_PATTERNS.some(pattern => 
    pattern.test(migration.content)
  );
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ No issues found');
  } else {
    for (const issue of issues) {
      const icon = issue.type === 'ERROR' ? '❌' : 
                   issue.type === 'WARNING' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${issue.type}: ${issue.message}`);
    }
  }
  
  return issues;
}

/**
 * Get the latest migration(s) that haven't been deployed
 */
function getLatestMigrations(migrations) {
  // For this validation, we'll check the last 3 migrations
  // In a more sophisticated setup, you'd check which ones are pending
  return migrations.slice(-3);
}

/**
 * Main validation function
 */
function main() {
  console.log('🧪 Spectrum 4 Migration Validator');
  console.log('=================================');
  
  const migrations = getMigrationFiles();
  
  if (migrations.length === 0) {
    console.log('ℹ️ No migrations found');
    return;
  }
  
  console.log(`📋 Found ${migrations.length} total migrations`);
  
  // Validate latest migrations
  const latestMigrations = getLatestMigrations(migrations);
  console.log(`🔍 Validating ${latestMigrations.length} recent migrations`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const migration of latestMigrations) {
    const issues = validateMigration(migration);
    
    const errors = issues.filter(i => i.type === 'ERROR').length;
    const warnings = issues.filter(i => i.type === 'WARNING').length;
    
    totalErrors += errors;
    totalWarnings += warnings;
  }
  
  // Summary
  console.log('\n📊 Validation Summary');
  console.log('====================');
  
  if (totalErrors > 0) {
    console.log(`❌ ${totalErrors} error(s) found - deployment may fail`);
    console.log('\n💡 Recommended actions:');
    console.log('   - Review migrations for NOT NULL columns without defaults');
    console.log('   - Consider multi-step migration approach');
    console.log('   - Test with production-like data');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`⚠️ ${totalWarnings} warning(s) found - review recommended`);
    console.log('\n💡 Please verify:');
    console.log('   - Destructive operations are intentional');
    console.log('   - Application code is updated for schema changes');
    console.log('   - Rollback plan is prepared');
    process.exit(0);
  } else {
    console.log('✅ All validations passed - migrations look safe');
    process.exit(0);
  }
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

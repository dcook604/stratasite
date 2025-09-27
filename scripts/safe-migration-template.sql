-- Production-Safe Migration Template
-- Use this template for creating migrations that won't break production

-- =====================================================
-- SAFE MIGRATION CHECKLIST:
-- [ ] No NOT NULL columns added to existing tables with data
-- [ ] No columns dropped without multi-step process
-- [ ] No table renames without migration path
-- [ ] Default values provided for new required fields
-- [ ] Indexes created with IF NOT EXISTS where possible
-- =====================================================

-- Example 1: Adding optional column (SAFE)
-- ALTER TABLE table_name ADD COLUMN new_optional_field TEXT;

-- Example 2: Adding required column with default (SAFE)
-- ALTER TABLE table_name ADD COLUMN new_required_field TEXT DEFAULT 'default_value';

-- Example 3: Adding required column to table with existing data (MULTI-STEP)
-- Step 1: Add as nullable with default
-- ALTER TABLE table_name ADD COLUMN new_field TEXT DEFAULT 'migration_default';
-- 
-- Step 2: Populate existing records (can be done in same migration if safe)
-- UPDATE table_name 
-- SET new_field = CASE 
--   WHEN condition THEN 'value1'
--   ELSE 'default_value'
-- END 
-- WHERE new_field = 'migration_default';
--
-- Step 3: Make NOT NULL in future migration after verifying all records populated
-- (This step requires Prisma schema update and new migration)

-- Example 4: Creating new table (ALWAYS SAFE)
-- CREATE TABLE IF NOT EXISTS new_table (
--   id TEXT PRIMARY KEY,
--   field1 TEXT NOT NULL,
--   field2 TEXT,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- Example 5: Adding index (SAFE with IF NOT EXISTS)
-- CREATE INDEX IF NOT EXISTS idx_table_field ON table_name(field_name);

-- Example 6: Dropping column (MULTI-STEP PROCESS)
-- Step 1: Stop using column in application code
-- Step 2: Deploy application without column usage
-- Step 3: Drop column in subsequent migration
-- ALTER TABLE table_name DROP COLUMN deprecated_column;

-- =====================================================
-- DATA VALIDATION QUERIES (Run after migration)
-- =====================================================

-- Check for NULL values in required fields
-- SELECT COUNT(*) as null_count FROM table_name WHERE required_field IS NULL;

-- Verify data integrity
-- SELECT COUNT(*) as total_records FROM table_name;

-- Check for expected default values
-- SELECT new_field, COUNT(*) as count 
-- FROM table_name 
-- GROUP BY new_field 
-- ORDER BY count DESC;

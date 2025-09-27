# Database Migration Best Practices for Spectrum 4 Strata Council Website

## 🎯 Overview

This document outlines best practices for database migrations in the Spectrum 4 project to prevent production deployment issues and ensure smooth schema changes.

## 🔧 Migration Strategy

### 1. **Safe Migration Patterns**

#### ✅ **DO: Additive Changes**
```sql
-- Add new optional columns
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Add new tables
CREATE TABLE new_feature (...);

-- Add indexes
CREATE INDEX idx_user_email ON users(email);
```

#### ❌ **AVOID: Breaking Changes**
```sql
-- Don't add NOT NULL columns to existing tables with data
ALTER TABLE users ADD COLUMN required_field TEXT NOT NULL;

-- Don't drop columns immediately
DROP COLUMN old_field;

-- Don't rename columns without migration path
ALTER TABLE users RENAME COLUMN old_name TO new_name;
```

### 2. **Multi-Step Migration Process**

For breaking changes, use a multi-step approach:

**Step 1: Add (Deploy 1)**
```sql
-- Add new column as nullable
ALTER TABLE users ADD COLUMN new_field TEXT;
```

**Step 2: Populate (Deploy 2)**
```sql
-- Populate existing records with default values
UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL;
```

**Step 3: Enforce (Deploy 3)**
```sql
-- Make field NOT NULL after population
-- (This requires manual migration in Prisma)
```

### 3. **Production-Safe Column Additions**

When adding required fields to existing tables:

```typescript
// In Prisma schema - initially nullable
model FormKSubmission {
  // ... existing fields
  landlordSignatureName String? // Start nullable
}
```

Then create migration with default values:
```sql
-- Add column with default value
ALTER TABLE form_k_submissions 
ADD COLUMN landlord_signature_name TEXT DEFAULT 'PENDING';

-- Update existing records
UPDATE form_k_submissions 
SET landlord_signature_name = 'MIGRATED_RECORD' 
WHERE landlord_signature_name IS NULL;
```

## 🛠️ Migration Development Workflow

### 1. **Development Environment**
```bash
# Create new migration
npx prisma migrate dev --name descriptive_migration_name

# Test migration rollback capability
npx prisma migrate reset --force
npx prisma migrate dev
```

### 2. **Testing Migrations**
- Always test migrations with existing production-like data
- Test both forward and rollback scenarios
- Verify data integrity after migration

### 3. **Production Deployment**
```bash
# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# If migrations fail, resolve issues
npx prisma migrate resolve --applied|--rolled-back migration_name
```

## 🔒 Data Safety Guidelines

### 1. **Backup Strategy**
- Production database is automatically backed up via Coolify
- Test migrations on copy of production data first
- Keep migration rollback plan ready

### 2. **Large Table Migrations**
For tables with significant data:
- Test migration performance
- Consider maintenance windows
- Use background index creation when possible

### 3. **Data Validation**
After each migration:
```sql
-- Verify data integrity
SELECT COUNT(*) FROM critical_table;
SELECT * FROM table WHERE new_field IS NULL LIMIT 10;
```

## 🚨 Production Issue Recovery

### 1. **Failed Migration Recovery**
Our startup script handles common scenarios:

```bash
# For partially applied migrations
npx prisma migrate resolve --rolled-back migration_name

# For successfully applied but not recorded
npx prisma migrate resolve --applied migration_name

# Clean up temporary tables if needed
sqlite3 database.db "DROP TABLE IF EXISTS new_table_name;"
```

### 2. **Migration Conflict Resolution**
1. **Check current status**: `npx prisma migrate status`
2. **Identify failed migration**: Look for error details
3. **Clean up partial changes**: Remove temporary tables
4. **Resolve migration state**: Mark as applied or rolled back
5. **Re-run deployment**: `npx prisma migrate deploy`

## 📋 Pre-Migration Checklist

Before creating a migration:

- [ ] Will this affect existing data?
- [ ] Are new required fields being added?
- [ ] Is there a rollback plan?
- [ ] Has this been tested with production-like data?
- [ ] Are indexes needed for performance?
- [ ] Will this cause downtime?

## 🔧 Startup Script Features

Our enhanced `startup.sh` provides:

### 1. **Automatic Failed Migration Recovery**
- Detects failed migrations
- Cleans up temporary tables
- Resolves migration state appropriately

### 2. **Smart Migration Strategy**
- Checks migration status before applying
- Uses baseline for existing databases
- Falls back to schema push if needed

### 3. **Error Handling**
- Exits cleanly on unrecoverable errors
- Provides detailed logging
- Implements retry logic where appropriate

## 🎯 Specific Scenarios

### 1. **Adding Required Fields**
❌ **Wrong:**
```prisma
model FormK {
  requiredField String // This will fail on existing data
}
```

✅ **Correct:**
```prisma
model FormK {
  requiredField String? // Start nullable
}
```

Then manually update migration:
```sql
ALTER TABLE form_k ADD COLUMN required_field TEXT;
UPDATE form_k SET required_field = 'DEFAULT' WHERE required_field IS NULL;
-- In future migration: make NOT NULL
```

### 2. **Renaming Fields**
❌ **Wrong:**
Direct rename will lose data

✅ **Correct:**
1. Add new field
2. Copy data from old to new
3. Update application code
4. Remove old field in next deployment

### 3. **Dropping Tables/Columns**
❌ **Wrong:**
Immediate drop

✅ **Correct:**
1. Mark as deprecated in code
2. Stop writing to field/table
3. Wait for deployment cycle
4. Drop in next migration

## 🚀 Deployment Integration

### Coolify Integration
Our migrations integrate with Coolify deployment:

1. **Build Phase**: Migrations are prepared
2. **Deploy Phase**: `startup.sh` handles migration application
3. **Rollback**: Manual intervention with documented steps

### Environment Variables
Critical for migration safety:
- `DATABASE_URL`: Points to correct database
- `NODE_ENV`: Determines migration behavior

## 📞 Emergency Procedures

### If Production Migration Fails:

1. **Immediate Response**
   ```bash
   # Check logs
   docker logs container_id --tail 50
   
   # Access container
   docker exec -it container_id /bin/sh
   
   # Check migration status
   npx prisma migrate status
   ```

2. **Recovery Steps**
   - Use startup script's built-in recovery
   - Manually resolve if needed
   - Apply schema push as last resort

3. **Prevention for Next Time**
   - Review migration in staging environment
   - Update this guide with lessons learned
   - Enhance startup script if needed

## 🔄 Continuous Improvement

This guide should be updated when:
- New migration patterns are discovered
- Production issues teach us new lessons
- Prisma updates change best practices
- Team feedback suggests improvements

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Contact**: Development Team for questions/updates

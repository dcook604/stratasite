#!/bin/sh

echo "🚀 Starting Spectrum 4 Application..."

# Enhanced error handling for production
set +e  # Don't exit on errors, handle them gracefully
trap 'echo "⚠️ Error occurred at line $LINENO, continuing with fallback strategy..."' ERR

# Function to check if database exists and has tables
check_database() {
  if [ -f "/app/data/database.db" ]; then
    # Check if database has tables
    TABLE_COUNT=$(sqlite3 /app/data/database.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "0")
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "📊 Existing database found with $TABLE_COUNT tables"
      return 0  # Database exists with tables
    else
      echo "📊 Empty database found"
      return 1  # Database exists but is empty
    fi
  else
    echo "📊 No database found"
    return 1  # No database
  fi
}

# Function to check migration status
check_migration_status() {
  echo "🔍 Checking migration status..."
  
  # Check for failed migrations
  if npx prisma migrate status 2>&1 | grep -q "following migration.*failed\|Migration.*failed"; then
    echo "⚠️ Found failed migrations"
    return 1
  fi
  
  # Check for pending migrations
  if npx prisma migrate status 2>&1 | grep -q "following migration.*not yet been applied"; then
    echo "📋 Found pending migrations"
    return 2
  fi
  
  echo "✅ All migrations are up to date"
  return 0
}

# Function to resolve failed migrations safely
resolve_failed_migrations() {
  echo "🔧 Resolving failed migrations..."
  
  # Get list of failed migrations
  FAILED_MIGRATIONS=$(npx prisma migrate status 2>&1 | grep -A 10 "following migration.*failed" | grep "^[0-9]" | cut -d' ' -f1 || true)
  
  if [ -n "$FAILED_MIGRATIONS" ]; then
    for migration in $FAILED_MIGRATIONS; do
      echo "🔄 Resolving failed migration: $migration"
      
      # Try to determine if migration was partially applied
      if sqlite3 /app/data/database.db ".tables" | grep -q "new_.*"; then
        echo "⚠️ Found temporary tables, cleaning up..."
        sqlite3 /app/data/database.db "DROP TABLE IF EXISTS new_form_k_submissions;"
        sqlite3 /app/data/database.db "DROP TABLE IF EXISTS new_scooter_registrations;"
        npx prisma migrate resolve --rolled-back "$migration"
      else
        echo "✅ Migration appears to have succeeded, marking as applied"
        npx prisma migrate resolve --applied "$migration"
      fi
    done
  fi
}

# Function to run migrations with safety checks
run_migrations() {
  echo "🔄 Attempting to run Prisma migrations..."
  
  # First check migration status
  case $(check_migration_status; echo $?) in
    0)
      echo "✅ All migrations already applied"
      ;;
    1)
      echo "🔧 Resolving failed migrations first..."
      resolve_failed_migrations
      ;;
    2)
      echo "📋 Pending migrations found, will apply..."
      ;;
  esac
  
  # Now try to apply migrations
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
  else
    echo "❌ Migration deployment failed"
    # Try to resolve any new failures
    resolve_failed_migrations
    return 1
  fi
  
  # Always generate Prisma client after migrations
  echo "🔄 Generating Prisma client..."
  if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
    return 0
  else
    echo "❌ Prisma client generation failed"
    return 1
  fi
}

# Function to push schema
push_schema() {
  echo "🔄 Pushing schema to database..."
  if npx prisma db push; then
    echo "✅ Schema push completed successfully"
  else
    echo "❌ Schema push failed"
    return 1
  fi
  
  # Always generate Prisma client after schema push
  echo "🔄 Generating Prisma client..."
  if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
    return 0
  else
    echo "❌ Prisma client generation failed"
    return 1
  fi
}

# Function to baseline existing database
baseline_database() {
  echo "🔄 Attempting to baseline existing database..."
  
  # Try to resolve migration baseline for existing migrations
  if npx prisma migrate resolve --applied "20250610204132_initial" && \
     npx prisma migrate resolve --applied "20250613235527_add_missing_tables" && \
     npx prisma migrate resolve --applied "20250721141413_add_emergency_contact_model" && \
     npx prisma migrate resolve --applied "20250722161244_add_email_sent_to_pet_registration"; then
    echo "✅ Existing migrations baseline completed"
    
    # Now try to apply the new Form K migration
    if npx prisma migrate deploy; then
      echo "✅ New migrations applied successfully"
      return 0
    else
      echo "⚠️ New migration failed, falling back to schema push"
      return 1
    fi
  else
    echo "⚠️ Baseline failed, falling back to schema push"
    return 1
  fi
}

# Main database setup logic
setup_database() {
  echo "🗄️ Setting up database..."
  
  # Check current database state
  if check_database; then
    # Database exists with tables - try to baseline and migrate
    echo "🔧 Existing database detected, attempting baseline and migration..."
    
    if baseline_database; then
      echo "✅ Database baseline and migration successful"
    elif run_migrations; then
      echo "✅ Direct migration successful"
    elif push_schema; then
      echo "✅ Schema push successful (fallback)"
    else
      echo "❌ All database setup methods failed"
      exit 1
    fi
  else
    # Database is empty or doesn't exist - use migrations
    echo "🆕 Setting up new database..."
    
    if run_migrations; then
      echo "✅ New database migration successful"
    elif push_schema; then
      echo "✅ New database schema push successful (fallback)"
    else
      echo "❌ Database setup failed"
      exit 1
    fi
  fi
}

# Run database setup
setup_database

# Generate Prisma client after database setup
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
  echo "✅ Prisma client generated successfully"
else
  echo "❌ Failed to generate Prisma client"
  exit 1
fi

# Run post-deploy setup
echo "⚙️ Running post-deploy setup..."
if npm run postdeploy; then
  echo "✅ Post-deploy setup completed"
else
  echo "⚠️ Post-deploy setup had issues (continuing anyway)"
fi

# Start the application
echo "🌟 Starting the application server..."
exec node server.js

#!/bin/sh

echo "🚀 Starting Spectrum 4 Application..."

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

# Function to run migrations
run_migrations() {
  echo "🔄 Attempting to run Prisma migrations..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
    return 0
  else
    echo "❌ Migration failed"
    return 1
  fi
}

# Function to push schema
push_schema() {
  echo "🔄 Pushing schema to database..."
  if npx prisma db push; then
    echo "✅ Schema push completed successfully"
    return 0
  else
    echo "❌ Schema push failed"
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

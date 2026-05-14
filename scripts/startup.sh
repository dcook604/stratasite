#!/bin/sh

echo "🚀 Starting Spectrum 4 Application..."

# Don't exit on errors at the shell level — we handle them explicitly
set +e

# Ensure DATABASE_URL is always set before any Prisma command or node process
export DATABASE_URL="${DATABASE_URL:-file:/app/data/database.db}"
echo "📦 DATABASE_URL=${DATABASE_URL}"

# ----------------------------------------------------------------
# Step 1: Generate Prisma client (always safe, no DB needed)
# ----------------------------------------------------------------
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# ----------------------------------------------------------------
# Step 2: Apply database migrations with retry logic
# ----------------------------------------------------------------
echo "🗄️ Applying database migrations..."

MAX_ATTEMPTS=5
ATTEMPT=1
MIGRATION_OK=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "🔄 Migration attempt $ATTEMPT of $MAX_ATTEMPTS..."

  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations applied successfully"
    MIGRATION_OK=true
    break
  else
    echo "⚠️ Migration attempt $ATTEMPT failed"
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
      SLEEP_SEC=$((ATTEMPT * 3))
      echo "   Waiting ${SLEEP_SEC}s before retry (database may be locked by old container)..."
      sleep $SLEEP_SEC
    fi
    ATTEMPT=$((ATTEMPT + 1))
  fi
done

# ----------------------------------------------------------------
# Step 3: If migrate deploy failed, try db push as fallback
# ----------------------------------------------------------------
if [ "$MIGRATION_OK" = "false" ]; then
  echo "⚠️ All migrate deploy attempts failed. Trying db push fallback..."
  if npx prisma db push 2>&1; then
    echo "✅ Schema push successful (fallback)"
    MIGRATION_OK=true
  else
    echo "⚠️ db push also failed. Server will start but some features may be unavailable."
    echo "   This is usually a temporary SQLite lock issue — the server will recover on restart."
  fi
fi

# ----------------------------------------------------------------
# Step 4: Run post-deploy setup (seed form configurations etc.)
# ----------------------------------------------------------------
echo "⚙️ Running post-deploy setup..."
if npm run postdeploy 2>&1; then
  echo "✅ Post-deploy setup completed"
else
  echo "⚠️ Post-deploy setup had issues (continuing anyway)"
fi

# ----------------------------------------------------------------
# Step 5: Start the application server
# ----------------------------------------------------------------
echo "🌟 Starting the application server..."
exec node server.js

#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run database migrations
echo "Running database migrations..."
npx prisma db push

# Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts
fi

# Start the application with tsx (TypeScript directly)
echo "Starting backend..."
exec npx tsx src/index.ts

#!/bin/bash
# Build static export for Capacitor (excludes API routes and server-only files)
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== Capacitor Static Build ==="

# Temporarily move API routes and server-only files out of the way
echo "Moving API routes aside..."
mv src/app/api src/app/_api_backup
mv src/app/auth src/app/_auth_backup 2>/dev/null || true

# Remove proxy.ts if it exists (middleware not supported in static export)
[ -f src/proxy.ts ] && mv src/proxy.ts src/_proxy_backup.ts

echo "Building static export..."
CAPACITOR_BUILD=1 npx next build

echo "Restoring API routes..."
mv src/app/_api_backup src/app/api
mv src/app/_auth_backup src/app/auth 2>/dev/null || true
[ -f src/_proxy_backup.ts ] && mv src/_proxy_backup.ts src/proxy.ts

echo "Syncing to Capacitor..."
npx cap sync

echo "=== Done! ==="

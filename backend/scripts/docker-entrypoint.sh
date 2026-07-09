#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/config/database/data-source.js
fi

echo "Starting Surakshya API..."
exec node dist/main.js

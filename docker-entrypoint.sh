#!/bin/sh
set -e

echo "Running database migrations..."
npx sequelize-cli db:migrate

if [ "$RUN_SEEDS" = "true" ]; then
  echo "Running database seeds..."
  npx sequelize-cli db:seed:all
fi

echo "Starting application..."
exec node server.js

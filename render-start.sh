#!/bin/bash
set -e

echo "🚀 Starting Laravel on Render..."

# Create storage directories if they don't exist
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p storage/app/public

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Create storage symlink
php artisan storage:link --force 2>/dev/null || true

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Run Seeders (to add Admin and initial data)
php artisan db:seed --force

echo "✅ Laravel is ready!"

# Start Apache
apache2-foreground

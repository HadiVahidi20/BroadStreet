#!/bin/bash

# Broadstreet RFC - Logo Update Script
# Updates all logo references across all HTML pages

echo "🔄 Updating logos across all pages..."

# Define the pages directory
PAGES_DIR="pages"

# Counter for updated files
count=0

# Update all HTML files in pages directory
for file in "$PAGES_DIR"/*.html; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Replace old SVG logos with new PNG logo
    sed -i 's|../assets/logos/broadstreet-logo\.svg|https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698eff58008498127b2713d8.png|g' "$file"

    # Replace old favicon
    sed -i 's|<link rel="icon" type="image/svg+xml" href="../assets/logos/favicon\.svg">|<link rel="icon" type="image/png" href="https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698eff58008498127b2713d8.png">|g' "$file"

    # Add site-config.js if not already included (before closing body tag)
    if ! grep -q "site-config.js" "$file"; then
      sed -i 's|</body>|  <script src="../js/site-config.js"></script>\n</body>|' "$file"
    fi

    count=$((count + 1))
  fi
done

echo "✅ Updated $count HTML files"
echo "🎉 All logos have been updated to logo-light.png"

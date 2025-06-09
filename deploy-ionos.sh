#!/bin/bash

# QuotingFast SMS Control Center - IONOS Deployment Script
# This script prepares your application for deployment to IONOS hosting

echo "===== QuotingFast SMS Control Center - IONOS Deployment Preparation ====="

# Step 1: Build the React frontend
echo "Building React frontend..."

# Ensure client directory exists
mkdir -p client/public

# Check if index.html exists, create if not
if [ ! -f "client/public/index.html" ]; then
  echo "Creating missing index.html..."
  cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="QuotingFast SMS Control Center - TCPA-Compliant SMS Platform"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>QuotingFast SMS Control Center</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
fi

# Check if manifest.json exists, create if not
if [ ! -f "client/public/manifest.json" ]; then
  echo "Creating missing manifest.json..."
  cat > client/public/manifest.json << 'EOF'
{
  "short_name": "SMS Control Center",
  "name": "QuotingFast SMS Control Center",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF
fi

# Create empty favicon and logo files if they don't exist
touch client/public/favicon.ico
touch client/public/logo192.png
touch client/public/logo512.png

# Copy .env.ionos to .env if .env doesn't exist
if [ ! -f ".env" ]; then
  echo "Copying .env.ionos to .env..."
  cp .env.ionos .env
fi

# Build the frontend
cd client
npm install
npm run build
cd ..
echo "Frontend build complete."

# Step 2: Create deployment directory
echo "Creating deployment directory..."
mkdir -p deploy

# Step 3: Copy necessary files
echo "Copying files to deployment directory..."

# Copy source files
cp -r src deploy/

# Copy prisma directory if it exists
if [ -d "prisma" ]; then
  cp -r prisma deploy/
fi

# Create public directory for frontend
mkdir -p deploy/public

# Copy client build if it exists
if [ -d "client/build" ]; then
  cp -r client/build/* deploy/public/
else
  echo "Warning: client/build directory not found. Frontend may not be properly built."
fi

# Copy package files
cp package.json deploy/
if [ -f "package-lock.json" ]; then
  cp package-lock.json deploy/
fi

# Copy environment file
if [ -f ".env" ]; then
  cp .env deploy/
else
  cp .env.ionos deploy/.env
fi

# Create cron directory
mkdir -p deploy/cron
cp -r src/cron/* deploy/cron/

# Step 4: Make cron scripts executable
echo "Making cron scripts executable..."
chmod +x deploy/cron/processMessages.js
chmod +x deploy/cron/scheduleFollowups.js

# Step 5: Create IONOS startup script
echo "Creating IONOS startup script..."
cat > deploy/start.js << 'EOF'
// IONOS Node.js startup script
const { spawn } = require('child_process');
const path = require('path');

// Start the main application
const app = spawn('node', [path.join(__dirname, 'src/app.js')]);

app.stdout.on('data', (data) => {
  console.log(`[APP] ${data}`);
});

app.stderr.on('data', (data) => {
  console.error(`[APP ERROR] ${data}`);
});

app.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
});
EOF

# Step 6: Create .htaccess for Apache
echo "Creating .htaccess file..."
cat > deploy/.htaccess << 'EOF'
# Enable URL rewriting
RewriteEngine On

# If the request is for an existing file or directory, serve it directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# For API requests, proxy to Node.js
RewriteRule ^api/(.*)$ http://localhost:8080/api/$1 [P,L]

# For all other requests, serve the React app
RewriteRule ^ index.html [L]

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Set caching headers for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/x-javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType application/x-shockwave-flash "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>
EOF

# Step 7: Create deployment instructions
echo "Creating deployment instructions..."
cat > deploy/IONOS_DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# IONOS Deployment Instructions

## 1. Upload Files

Upload all files from this deployment directory to your IONOS web space using FTP.

## 2. Set Up Node.js Application

1. Log in to your IONOS Control Panel
2. Go to "Hosting" → "Your Package" → "Node.js"
3. Click "Create Application"
4. Set the following parameters:
   - Entry point: `start.js`
   - Node.js version: Select the latest available version
   - Port: 8080 (or as assigned by IONOS)
5. Click "Create"

## 3. Set Up Database

1. Run the following command on the IONOS server to set up the database:
   ```
   npx prisma migrate deploy
   ```

2. Seed the database with templates:
   ```
   node scripts/seedTemplates.js
   ```

## 4. Set Up Cron Jobs

1. In the IONOS Control Panel, go to "Scheduled Tasks" or "Cron Jobs"
2. Create the following cron jobs:

   a. Process Scheduled Messages (runs every minute):
      - Command: `node /path/to/your/app/cron/processMessages.js`
      - Schedule: `* * * * *`

   b. Schedule Follow-up Messages (runs once daily at 1 AM):
      - Command: `node /path/to/your/app/cron/scheduleFollowups.js`
      - Schedule: `0 1 * * *`

## 5. Verify Deployment

1. Visit your website URL
2. You should see the QuotingFast SMS Control Center login page
3. Test logging in with a user account
EOF

echo "===== Deployment preparation complete! ====="
echo "Your deployment files are ready in the 'deploy' directory."
echo "Follow the instructions in deploy/IONOS_DEPLOYMENT_INSTRUCTIONS.md to complete the deployment."

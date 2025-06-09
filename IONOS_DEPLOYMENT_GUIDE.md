# QuotingFast SMS Control Center - IONOS Deployment Guide

This guide provides step-by-step instructions for deploying the QuotingFast SMS Control Center to IONOS unlimited hosting using your existing database credentials.

## Prerequisites

- IONOS unlimited hosting account with Node.js support
- FTP client (like FileZilla)
- Your existing database credentials
- Twilio account with API credentials

## Step 1: Prepare Your Application

1. Run the deployment preparation script:
   ```bash
   ./deploy-ionos.sh
   ```

   This script will:
   - Build the React frontend
   - Organize all necessary files in a `deploy` directory
   - Create IONOS-specific configuration files
   - Make cron scripts executable

## Step 2: Upload Files to IONOS

1. Connect to your IONOS web space using FTP:
   - Host: Your IONOS FTP host (usually ftp.your-domain.com)
   - Username: Your IONOS FTP username
   - Password: Your IONOS FTP password
   - Port: 21 (default FTP port)

2. Upload all files from the `deploy` directory to your web space root directory.

## Step 3: Configure Node.js Application

1. Log in to your IONOS Control Panel at https://login.ionos.com
2. Navigate to "Hosting" → "Your Package" → "Node.js"
3. Click "Create Application"
4. Set the following parameters:
   - Entry point: `start.js`
   - Node.js version: Select the latest available version (ideally 16+)
   - Port: 8080 (or as assigned by IONOS)
5. Click "Create" to start your Node.js application

## Step 4: Initialize the Database

1. Connect to your IONOS hosting via SSH (if available) or use the IONOS terminal
2. Navigate to your application directory
3. Run the database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Seed the database with templates:
   ```bash
   node scripts/seedTemplates.js
   ```

## Step 5: Set Up Cron Jobs

1. In the IONOS Control Panel, go to "Scheduled Tasks" or "Cron Jobs"
2. Create the following cron jobs:

   a. Process Scheduled Messages (runs every minute):
      - Command: `node /path/to/your/app/cron/processMessages.js`
      - Schedule: `* * * * *`

   b. Schedule Follow-up Messages (runs once daily at 1 AM):
      - Command: `node /path/to/your/app/cron/scheduleFollowups.js`
      - Schedule: `0 1 * * *`

   Replace `/path/to/your/app` with the actual path to your application on the IONOS server.

## Step 6: Verify Your Environment Variables

Ensure your `.env` file on the IONOS server contains the correct values:

```
# Application
NODE_ENV=production
PORT=8080  # Or the port IONOS assigns to Node.js applications

# Database - Using your existing credentials
DATABASE_URL=postgresql://username:password@host:port/database_name

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d

# TCPA Hours
TCPA_START_HOUR=8
TCPA_END_HOUR=21

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Application URLs
APP_URL=https://your-domain.com
REDIRECT_URL=https://your-domain.com/quote
```

## Step 7: Install Dependencies

1. Connect to your IONOS hosting via SSH (if available) or use the IONOS terminal
2. Navigate to your application directory
3. Run:
   ```bash
   npm install --production
   ```

## Step 8: Configure Domain and SSL

1. In the IONOS Control Panel, go to "Domains & SSL"
2. Ensure your domain is correctly pointed to your hosting package
3. Activate the SSL certificate for your domain

## Step 9: Test Your Deployment

1. Visit your domain in a web browser
2. You should see the QuotingFast SMS Control Center login page
3. Log in with your credentials
4. Test the following functionality:
   - Lead management
   - SMS template creation
   - Scheduled message sending
   - Inbound message handling

## Troubleshooting

### Application Not Starting

1. Check the Node.js application logs in the IONOS Control Panel
2. Verify that all dependencies are installed correctly
3. Ensure the start.js file is in the correct location

### Database Connection Issues

1. Verify your database credentials in the .env file
2. Check if the database server is accessible from your hosting
3. Run `npx prisma db pull` to verify the connection

### Cron Jobs Not Running

1. Check the cron job logs in the IONOS Control Panel
2. Ensure the paths to the cron scripts are correct
3. Verify that the scripts have execute permissions

### SMS Not Being Sent

1. Check your Twilio credentials
2. Verify that the TCPA hours are set correctly
3. Check for any errors in the application logs

## Monitoring and Maintenance

1. Regularly check the application logs for errors
2. Monitor your Twilio usage and costs
3. Back up your database periodically
4. Update your application when new features or security patches are available

## Support

If you encounter any issues with your deployment, please contact:
- IONOS Support: https://www.ionos.com/help
- QuotingFast Support: [Your support contact information]

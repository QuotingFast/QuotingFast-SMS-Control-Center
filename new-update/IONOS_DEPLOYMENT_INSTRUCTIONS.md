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

# QuotingFast SMS Control Center - IONOS Deployment Checklist

## Pre-Deployment Tasks
- [ ] Update `.env.ionos` with your database credentials and Twilio API keys
- [ ] Build the React frontend with `npm run build` in the client directory
- [ ] Run the deployment script: `./deploy-ionos.sh`
- [ ] Verify all files are prepared in the `deploy` directory

## IONOS Server Setup
- [ ] Log in to your IONOS Control Panel
- [ ] Verify Node.js support is enabled
- [ ] Set up PostgreSQL database (if not already done)
- [ ] Upload all files from the `deploy` directory to your web space via FTP

## Database Configuration
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Seed the database with templates: `node scripts/seedTemplates.js`
- [ ] Verify database connection with `npx prisma db pull`

## Node.js Application Setup
- [ ] Create Node.js application in IONOS Control Panel
- [ ] Set entry point to `start.js`
- [ ] Configure port (typically 8080)
- [ ] Start the application
- [ ] Check application logs for any startup errors

## Cron Job Configuration
- [ ] Set up cron job for processing messages (every minute):
  ```
  * * * * * node /path/to/your/app/cron/processMessages.js
  ```
- [ ] Set up cron job for scheduling follow-ups (daily at 1 AM):
  ```
  0 1 * * * node /path/to/your/app/cron/scheduleFollowups.js
  ```
- [ ] Verify cron jobs are running by checking logs

## Domain and SSL Setup
- [ ] Configure your domain to point to the hosting package
- [ ] Enable SSL certificate
- [ ] Verify HTTPS is working correctly

## Final Testing
- [ ] Test application login
- [ ] Test lead management functionality
- [ ] Test template creation and management
- [ ] Test SMS sending (both immediate and scheduled)
- [ ] Test inbound SMS handling
- [ ] Verify TCPA compliance (no messages sent outside allowed hours)
- [ ] Test opt-out functionality

## Post-Deployment
- [ ] Set up regular database backups
- [ ] Configure monitoring for application uptime
- [ ] Document any IONOS-specific configurations for future reference

## Important Notes
- Make sure your database credentials are correct in the `.env` file
- The cron-based scheduling system replaces Redis/BullMQ for IONOS compatibility
- All scheduled messages are stored in the PostgreSQL database
- TCPA compliance is still enforced by the cron scripts

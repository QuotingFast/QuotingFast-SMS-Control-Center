# QuotingFast SMS Control Center - IONOS Deployment Checklist

Use this checklist to ensure all steps are completed for a successful deployment to IONOS hosting.

## Pre-Deployment

- [ ] Update `.env` file with correct database credentials
- [ ] Update `.env` file with Twilio API credentials
- [ ] Update `.env` file with OpenAI API key (if using AI features)
- [ ] Update `.env` file with Elevenlabs API key (if using voice features)
- [ ] Verify database connection string format is correct for IONOS MySQL
- [ ] Check that all required environment variables are set

## Database Setup

- [ ] Create MySQL database in IONOS Control Panel
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed initial SMS templates: `node scripts/seedTemplates.js`
- [ ] Create admin user account

## Node.js Application Setup

- [ ] Configure Node.js application in IONOS Control Panel
  - [ ] Entry point: `start.js`
  - [ ] Node.js version: Latest available
  - [ ] Port: 8080 (or as assigned by IONOS)
- [ ] Verify application starts without errors

## Cron Jobs Setup

- [ ] Configure process messages cron job (every minute)
  - Command: `node /path/to/your/app/cron/processMessages.js`
  - Schedule: `* * * * *`
- [ ] Configure follow-up scheduler cron job (daily at 1 AM)
  - Command: `node /path/to/your/app/cron/scheduleFollowups.js`
  - Schedule: `0 1 * * *`

## Verification

- [ ] Access application URL and verify login page loads
- [ ] Test user login functionality
- [ ] Test lead ingestion webhook
- [ ] Test SMS sending functionality
- [ ] Verify TCPA compliance (time restrictions)
- [ ] Test opt-out handling
- [ ] Verify reporting dashboard displays correctly

## Post-Deployment

- [ ] Monitor application logs for any errors
- [ ] Verify cron jobs are running as scheduled
- [ ] Test complete lead follow-up sequence
- [ ] Backup database and configuration

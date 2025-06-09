# QuotingFast SMS Control Center - IONOS Deployment Update

This folder contains all the necessary files for deploying the QuotingFast SMS Control Center to IONOS hosting.

## What's Included

1. **Application Code**
   - Complete Node.js backend in the `src` directory
   - React frontend in the `public` directory
   - Cron job scripts in the `cron` directory

2. **Database Migration**
   - Latest migration (`20250609_ionos_migration`) for updating the database schema
   - Migration includes changes for scheduled messages and job tracking

3. **Configuration Files**
   - `.env` file with environment variables (update with your credentials)
   - `.htaccess` for Apache configuration
   - `start.js` for IONOS Node.js application startup

4. **Deployment Instructions**
   - See `IONOS_DEPLOYMENT_INSTRUCTIONS.md` for step-by-step deployment guide

## Deployment Steps

1. Upload all files in this folder to your IONOS web space using FTP
2. Configure your Node.js application in the IONOS Control Panel
3. Run database migrations using `npx prisma migrate deploy`
4. Set up cron jobs for message processing and scheduling
5. Verify the deployment by accessing your website URL

## Important Notes

- Update the `.env` file with your actual database credentials and API keys
- Ensure the Node.js version is set to the latest available in the IONOS Control Panel
- Set up cron jobs as specified in the deployment instructions
- The application uses MySQL database (as configured in the Prisma schema)

For detailed instructions, refer to `IONOS_DEPLOYMENT_INSTRUCTIONS.md` in this folder.

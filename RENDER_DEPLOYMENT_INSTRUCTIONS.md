# QuotingFast SMS Control Center - Render Deployment Guide

This guide will help you deploy the QuotingFast SMS Control Center application on Render.com.

## Prerequisites

1. A Render.com account
2. Your application code pushed to a Git repository (GitHub, GitLab, etc.)
3. Your Twilio API credentials

## Deployment Steps

### 1. Connect Your Repository to Render

1. Log in to your Render dashboard at https://dashboard.render.com/
2. Click on "New" and select "Blueprint" from the dropdown menu
3. Connect your Git repository where the QuotingFast SMS Control Center code is hosted
4. Select the repository and branch you want to deploy

### 2. Configure Environment Variables

Render will automatically detect the `render.yaml` file in your repository and create the necessary services. You'll need to configure the following environment variables:

1. In the Render dashboard, navigate to your newly created web service
2. Go to the "Environment" tab
3. Add the following environment variables:
   - `TWILIO_ACCOUNT_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number
   - Any other API keys required by your application

### 3. Deploy Your Application

1. After configuring the environment variables, click on "Manual Deploy" and select "Deploy latest commit"
2. Render will build and deploy your application
3. Once the deployment is complete, you can access your application at the URL provided by Render

## Important Notes

### Redis Configuration

This deployment has been modified to work without Redis, as Render's free tier doesn't include Redis. The application will now:

1. Process immediate (day 0) messages directly without using a queue
2. Use a cron job to process scheduled messages every 5 minutes
3. Schedule follow-up messages using a daily cron job

### Database

The application is configured to use a MySQL database on Render. Make sure your Prisma schema is set to use MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Cron Jobs

The application uses two cron jobs:

1. `process-scheduled-messages`: Runs every 5 minutes to check for and send scheduled messages
2. `schedule-followups`: Runs once daily at 1 AM to schedule follow-up messages for leads

## Troubleshooting

If you encounter any issues during deployment:

1. Check the logs in the Render dashboard
2. Verify that all environment variables are correctly set
3. Ensure your database is properly configured
4. Check that your Prisma schema matches your database provider

## Monitoring

Monitor your application's performance and logs through the Render dashboard. You can set up alerts for any issues that may arise during operation.

## Scaling

If you need to scale your application:

1. Upgrade to a paid Render plan for better performance
2. Consider adding a dedicated Redis instance for more robust job processing
3. Optimize your database queries for better performance

## Support

If you need further assistance, contact the QuotingFast support team or refer to the Render documentation at https://render.com/docs

# QuotingFast SMS Control Center - IONOS Deployment Steps

Follow these steps to deploy your application to IONOS:

## 1. Upload Files to IONOS

Upload all files from this `deploy` directory to your IONOS web space using FTP.

## 2. Set Up Node.js Application in IONOS Control Panel

1. Log in to your IONOS Control Panel
2. Go to "Hosting" → "Your Package" → "Node.js"
3. Click "Create Application"
4. Set the following parameters:
   - Entry point: `start.js`
   - Node.js version: Select the latest available version (Node.js 20 recommended)
   - Port: 8080 (or as assigned by IONOS)
5. Click "Create"

## 3. Install Dependencies

Connect to your IONOS server via SSH and run:

```
cd /path/to/your/app
npm install
```

## 4. Set Up Database

1. Run the following command on the IONOS server to set up the database:
   ```
   npx prisma migrate deploy
   ```

2. Seed the database with templates:
   ```
   node scripts/seedTemplates.js
   ```

## 5. Set Up Cron Jobs

1. In the IONOS Control Panel, go to "Scheduled Tasks" or "Cron Jobs"
2. Create the following cron jobs:

   a. Process Scheduled Messages (runs every minute):
      - Command: `node /path/to/your/app/cron/processMessages.js`
      - Schedule: `* * * * *`

   b. Schedule Follow-up Messages (runs once daily at 1 AM):
      - Command: `node /path/to/your/app/cron/scheduleFollowups.js`
      - Schedule: `0 1 * * *`

## 6. Verify Deployment

1. Visit your website URL (https://quotingfast.io)
2. You should see the QuotingFast SMS Control Center login page
3. Test logging in with a user account

## Troubleshooting

If you encounter any issues:

1. Check the Node.js application logs in the IONOS Control Panel
2. Verify that all environment variables are correctly set
3. Ensure the database connection is working properly
4. Check that the Prisma migrations have been applied successfully

For database connection issues, you can create a simple test file:

```php
<?php
$host = 'db5017900795.hosting-data.io';
$db   = 'dbs14255734';
$user = 'dbu5548463';
$pass = 'Qf9544201788';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connected successfully to the database!";
} catch (\PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
```

Save this as `test-db.php` and run it to verify your database connection.

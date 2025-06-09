# QuotingFast SMS Control Center

A TCPA-compliant inbound-lead texting and follow-up platform for auto insurance leads.

## Features

- **Webhook Lead Ingestion**: Automatically process incoming leads from various sources
- **SMS Templating System**: Create and manage templates with 160-character limit
- **30-Day Follow-up Sequence**: Automated SMS sequence on days 0, 1, 3, 5, 7, 10, 14, 21, 28
- **TCPA Compliance**: Respect 8 AM - 9 PM local time restrictions based on lead's timezone
- **Opt-out Handling**: Automatic detection and processing of opt-out requests
- **Contact Management**: View and manage all leads and their communication history
- **Reporting Dashboard**: Track performance metrics, conversions, and opt-out rates
- **Job Scheduling**: Reliable message scheduling with BullMQ and Redis
- **Click-through Tracking**: Monitor link clicks and conversions

## Tech Stack

- **Backend**: Node.js 20 + Express
- **Database**: PostgreSQL with Prisma ORM
- **Job Scheduling**: Redis + BullMQ
- **SMS/Voice**: Twilio REST API
- **Frontend**: React with Tailwind CSS
- **Environment**: Docker containerization

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/QuotingFast-SMS-Control-Center.git
   cd QuotingFast-SMS-Control-Center
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.sample`:
   ```
   cp .env.sample .env
   ```

4. Update the `.env` file with your credentials:
   - Database connection string
   - Twilio API credentials
   - JWT secret
   - Redis URL
   - Application URLs

### Database Setup

1. Run Prisma migrations to set up your database:
   ```
   npx prisma migrate dev
   ```

2. Seed the database with initial SMS templates:
   ```
   node scripts/seedTemplates.js
   ```

### Running the Application

#### Development Mode

```
npm run dev
```

#### Production Mode

```
npm start
```

#### Using Docker

```
docker-compose up -d
```

## API Documentation

### Webhook Endpoints

- `POST /webhook/lead`: Receive new leads
- `POST /webhook/conversion`: Track conversions

### SMS Management

- `POST /api/sms/send`: Send manual SMS
- `POST /api/sms/inbound`: Handle inbound SMS (Twilio webhook)
- `GET /api/sms/history/:leadId`: Get message history
- `GET /api/sms/scheduled/:leadId`: Get scheduled messages

### Lead Management

- `GET /api/leads`: Get all leads with pagination
- `GET /api/leads/:id`: Get a single lead
- `PUT /api/leads/:id/status`: Update lead status
- `GET /api/leads/stats`: Get lead statistics

### Template Management

- `GET /api/templates`: Get all SMS templates
- `GET /api/templates/day/:day`: Get templates for specific day
- `POST /api/templates`: Create a new template
- `PUT /api/templates/:id`: Update an existing template
- `DELETE /api/templates/:id`: Delete a template

### Dashboard

- `GET /api/dashboard/overview`: Get dashboard overview data
- `GET /api/dashboard/activity`: Get message activity data
- `GET /api/dashboard/conversions`: Get conversion data
- `GET /api/dashboard/export/:dataType`: Export data as CSV

## TCPA Compliance

This system enforces TCPA compliance by:

1. Only sending SMS messages between 8 AM and 9 PM in the recipient's local timezone
2. Determining timezone based on ZIP code with fallback to state mapping
3. Automatically processing opt-out requests
4. Maintaining records of all communication

## License

[MIT](LICENSE)

## Author

QuotingFast Team

/**
 * Seed Templates Script
 * 
 * This script populates the database with SMS templates for the 30-day follow-up sequence.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SMS template data organized by day
const templates = {
  0: [ // Day 0 - instant send
    "Hi {FirstName}! Your {VehicleMake} quote's ready 👉 quotingfast.io/{LeadID}. See savings up to ${Savings}/yr. –Quoting Fast STOP",
    "{FirstName}, compare {VehicleYear} {VehicleMake} rates for {ZIP}: quotingfast.io/{LeadID}. Unlock new discounts. –Quoting Fast STOP",
    "Ready, {FirstName}? Your custom auto quote: quotingfast.io/{LeadID}. Quick view → call inside to lock price. –Quoting Fast STOP",
    "{FirstName} in {City}: we found ${Savings}/yr cuts on car insurance. Check quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Your quote lives here 🚗💨 quotingfast.io/{LeadID}. Savings waiting, {FirstName}! –Quoting Fast STOP",
    "Slash auto costs on your {VehicleMake}. Tap quotingfast.io/{LeadID}. extras pending call verify. –Quoting Fast STOP"
  ],
  1: [ // Day 1
    "Morning {FirstName}! Re-open your quote: quotingfast.io/{LeadID}. Extra driver discounts still pending. –Quoting Fast STOP",
    "{FirstName}, City {City} rates dropped. See update 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "30-sec refresher for your {VehicleMake}: quotingfast.io/{LeadID}. Save ${Savings}/yr. –Quoting Fast STOP",
    "Missed it? Your quote's holding $$$: quotingfast.io/{LeadID}. Call inside when ready. –Quoting Fast STOP",
    "Just added safe-driver boost for {ZIP}. View now 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, verify mileage to finalize savings. quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  3: [ // Day 3
    "Quick nudge 🚗 quotingfast.io/{LeadID} shows new multi-car credit. –Quoting Fast STOP",
    "{FirstName}, still paying more than ${Savings}? Compare here: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Your {VehicleYear} {VehicleMake} qualifies for new discount tier. Tap quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Rates shift fast in {State}. Lock yours: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, review quote + call agent in 1 tap. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Final-price check pending your call. See details 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  5: [ // Day 5
    "Hey {FirstName}! Good drivers in {City} now average ${Savings}/yr less. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "New bundling incentive active. View/update 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Your quote expires soon—secure it: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{VehicleMake} loyalty credit unlocked. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Got 30 secs? Check savings & tap \"Call\" inside. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Reminder: unfinished quote for {ZIP}. Finish here 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  7: [ // Day 7
    "Week-check ✅ quotingfast.io/{LeadID} still showing ${Savings}/yr cut. –Quoting Fast STOP",
    "{FirstName}, insurance review takes 20 secs: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Rates in {State} dipped again—see the drop: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Add roadside + save more. Customize 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{VehicleYear} safety features = extra % off. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Close to the finish! Verify details + call inside. quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  10: [ // Day 10
    "10-day follow-up: quotingfast.io/{LeadID}. Savings still unclaimed, {FirstName}. –Quoting Fast STOP",
    "Multi-policy discount ends soon. View quote 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{City} average premium fell—yours can too: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Quick peek? {VehicleMake} rate update live. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Lock coverage before renewal hits. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, see revised payment options: quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  14: [ // Day 14
    "Half-month check: quotingfast.io/{LeadID}. Still seeing ${Savings}/yr savings. –Quoting Fast STOP",
    "Add teen driver? Pre-price here first 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Break up with high premiums—your quote: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Snapshot discount pre-approved. View: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{VehicleMake} low-mileage credit waiting. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, spend 20 secs, save ${Savings}. quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  21: [ // Day 21
    "Three-week ping 🚗 quotingfast.io/{LeadID} holds custom rate. –Quoting Fast STOP",
    "Drive safe? Claim reward now: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{City} ZIP {ZIP}: fresh auto quote live. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "New agent assigned—see contact card inside. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Compare before next bill hits: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, free accident-forgiveness add-on inside. quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ],
  28: [ // Day 28
    "Final reminder! Quote archive in 48 hrs: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Last call for ${Savings}/yr savings. Tap 👉 quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "{FirstName}, keep your {VehicleMake} protected for less. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Bundle auto+home later? Start here now: quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Renewal season = big cuts. quotingfast.io/{LeadID}. –Quoting Fast STOP",
    "Your custom rate ends tomorrow—review: quotingfast.io/{LeadID}. –Quoting Fast STOP"
  ]
};

/**
 * Seed the database with SMS templates
 */
async function seedTemplates() {
  try {
    console.log('Starting to seed SMS templates...');
    
    // Clear existing templates first (optional)
    await prisma.smsTemplate.deleteMany({});
    console.log('Cleared existing templates');
    
    // Create all templates
    for (const [day, messages] of Object.entries(templates)) {
      console.log(`Creating templates for day ${day}...`);
      
      for (let variant = 0; variant < messages.length; variant++) {
        await prisma.smsTemplate.create({
          data: {
            day: parseInt(day, 10),
            variant,
            body: messages[variant],
            active: true
          }
        });
      }
    }
    
    const count = await prisma.smsTemplate.count();
    console.log(`Successfully seeded ${count} SMS templates`);
    
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTemplates()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

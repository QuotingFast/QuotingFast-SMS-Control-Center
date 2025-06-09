-- Migration for IONOS deployment (removing Redis dependencies and adding scheduled_message table)

-- Create scheduled_message table if it doesn't exist
CREATE TABLE IF NOT EXISTS "scheduled_message" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "template_id" TEXT,
  "content" TEXT NOT NULL,
  "scheduled_time" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "twilio_message_id" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "scheduled_message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scheduled_message_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "scheduled_message_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "scheduled_message_status_scheduled_time_idx" ON "scheduled_message"("status", "scheduled_time");
CREATE INDEX IF NOT EXISTS "scheduled_message_lead_id_idx" ON "scheduled_message"("lead_id");

-- Add job_id column to message table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message' AND column_name = 'job_id'
    ) THEN
        ALTER TABLE "message" ADD COLUMN "job_id" TEXT;
    END IF;
END
$$;

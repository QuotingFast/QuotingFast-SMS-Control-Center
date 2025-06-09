-- Migration for IONOS deployment (removing Redis dependencies and adding scheduled_message table)

-- Create scheduled_message table if it doesn't exist
CREATE TABLE IF NOT EXISTS `scheduled_message` (
  `id` VARCHAR(191) NOT NULL,
  `lead_id` VARCHAR(191) NOT NULL,
  `template_id` VARCHAR(191),
  `content` TEXT NOT NULL,
  `scheduled_time` DATETIME(3) NOT NULL,
  `sent_at` DATETIME(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `twilio_message_id` VARCHAR(191),
  `error` TEXT,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lead_id`) REFERENCES `lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`template_id`) REFERENCES `template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create index for faster queries
CREATE INDEX `scheduled_message_status_scheduled_time_idx` ON `scheduled_message`(`status`, `scheduled_time`);
CREATE INDEX `scheduled_message_lead_id_idx` ON `scheduled_message`(`lead_id`);

-- Add job_id column to message table if it doesn't exist
-- MariaDB version
-- Check if job_id column exists in message table
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'message' AND column_name = 'job_id' AND table_schema = DATABASE());

-- Add job_id column if it doesn't exist
SET @query = IF(@column_exists = 0, 'ALTER TABLE `message` ADD COLUMN `job_id` VARCHAR(191);', 'SELECT "Column already exists" AS message;');

-- Execute the query
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

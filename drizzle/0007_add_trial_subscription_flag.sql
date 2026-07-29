-- Add a flag to indicate whether the user has already subscribed to the trial plan
-- Safe for existing data: NOT NULL with DEFAULT false will backfill existing rows as false
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "hasTrialSubscription" boolean NOT NULL DEFAULT false;


-- Add a flag to indicate whether the user has already changed referral code once
-- Safe for existing data: NOT NULL with DEFAULT false will backfill existing rows as false
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "referralCodeChanged" boolean NOT NULL DEFAULT false;



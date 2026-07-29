-- Add referral fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCode" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredBy" text;

-- Create unique index on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_unique" ON "users"("referralCode");

-- Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" text PRIMARY KEY NOT NULL,
  "referrerId" text NOT NULL,
  "referredId" text NOT NULL,
  "referralCode" text NOT NULL,
  "hasSubscribed" boolean DEFAULT false,
  "subscriptionRewarded" boolean DEFAULT false,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Add foreign key constraints for referrals table
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_users_id_fk" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_users_id_fk" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

-- Create referralHistory table
CREATE TABLE IF NOT EXISTS "referralHistory" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "referralId" text,
  "action" text NOT NULL,
  "description" text,
  "pointsAwarded" integer,
  "subscriptionDaysExtended" integer,
  "createdAt" timestamp DEFAULT now()
);

-- Add foreign key constraints for referralHistory table
ALTER TABLE "referralHistory" ADD CONSTRAINT "referralHistory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "referralHistory" ADD CONSTRAINT "referralHistory_referralId_referrals_id_fk" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE cascade ON UPDATE no action;






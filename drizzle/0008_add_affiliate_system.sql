-- Add Affiliate System Tables
-- This migration adds the complete affiliate system with 4 new tables:
-- 1. affiliate_profiles: Stores affiliate profile information
-- 2. affiliate_relations: Tracks referral relationships (30-day validity)
-- 3. affiliate_earnings: Records commission earnings (30% on first order)
-- 4. affiliate_withdrawals: Tracks withdrawal requests
-- 
-- This migration is safe to run on existing databases and will not affect existing data.

-- Create affiliate_profiles table
CREATE TABLE IF NOT EXISTS "affiliate_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"code" text NOT NULL,
	"codeChanged" boolean DEFAULT false NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"frozenBalance" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_profiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "affiliate_profiles_code_unique" UNIQUE("code")
);

-- Create affiliate_relations table
CREATE TABLE IF NOT EXISTS "affiliate_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"referrerId" text NOT NULL,
	"inviteeId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"hasConverted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_relations_inviteeId_unique" UNIQUE("inviteeId"),
	CONSTRAINT "affiliate_relation_invitee_unique" UNIQUE("inviteeId")
);

-- Create affiliate_earnings table
CREATE TABLE IF NOT EXISTS "affiliate_earnings" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliateId" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'FROZEN' NOT NULL,
	"releaseDate" timestamp NOT NULL,
	"stripeOrderId" text,
	"relationId" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);

-- Create affiliate_withdrawals table
CREATE TABLE IF NOT EXISTS "affiliate_withdrawals" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliateId" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"paymentMethod" text NOT NULL,
	"accountName" text NOT NULL,
	"accountInfo" text NOT NULL,
	"transactionId" text,
	"failureReason" text,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);

-- Add foreign key constraints (using DO block to handle existing constraints)
DO $$ 
BEGIN
	-- affiliate_profiles foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_profiles_userId_users_id_fk'
	) THEN
		ALTER TABLE "affiliate_profiles" ADD CONSTRAINT "affiliate_profiles_userId_users_id_fk" 
			FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	-- affiliate_relations foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_relations_referrerId_affiliate_profiles_id_fk'
	) THEN
		ALTER TABLE "affiliate_relations" ADD CONSTRAINT "affiliate_relations_referrerId_affiliate_profiles_id_fk" 
			FOREIGN KEY ("referrerId") REFERENCES "public"."affiliate_profiles"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_relations_inviteeId_users_id_fk'
	) THEN
		ALTER TABLE "affiliate_relations" ADD CONSTRAINT "affiliate_relations_inviteeId_users_id_fk" 
			FOREIGN KEY ("inviteeId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	-- affiliate_earnings foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_earnings_affiliateId_affiliate_profiles_id_fk'
	) THEN
		ALTER TABLE "affiliate_earnings" ADD CONSTRAINT "affiliate_earnings_affiliateId_affiliate_profiles_id_fk" 
			FOREIGN KEY ("affiliateId") REFERENCES "public"."affiliate_profiles"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_earnings_relationId_affiliate_relations_id_fk'
	) THEN
		ALTER TABLE "affiliate_earnings" ADD CONSTRAINT "affiliate_earnings_relationId_affiliate_relations_id_fk" 
			FOREIGN KEY ("relationId") REFERENCES "public"."affiliate_relations"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	-- affiliate_withdrawals foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_withdrawals_affiliateId_affiliate_profiles_id_fk'
	) THEN
		ALTER TABLE "affiliate_withdrawals" ADD CONSTRAINT "affiliate_withdrawals_affiliateId_affiliate_profiles_id_fk" 
			FOREIGN KEY ("affiliateId") REFERENCES "public"."affiliate_profiles"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;

-- Create indexes for performance (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "affiliate_code_idx" ON "affiliate_profiles" USING btree ("code");
CREATE INDEX IF NOT EXISTS "affiliate_user_id_idx" ON "affiliate_profiles" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "affiliate_relation_referrer_idx" ON "affiliate_relations" USING btree ("referrerId");
CREATE INDEX IF NOT EXISTS "affiliate_relation_invitee_idx" ON "affiliate_relations" USING btree ("inviteeId");
CREATE INDEX IF NOT EXISTS "affiliate_earning_affiliate_idx" ON "affiliate_earnings" USING btree ("affiliateId");
CREATE INDEX IF NOT EXISTS "affiliate_earning_status_idx" ON "affiliate_earnings" USING btree ("status");
CREATE INDEX IF NOT EXISTS "affiliate_earning_release_date_idx" ON "affiliate_earnings" USING btree ("releaseDate");
CREATE INDEX IF NOT EXISTS "affiliate_earning_stripe_order_idx" ON "affiliate_earnings" USING btree ("stripeOrderId");
CREATE INDEX IF NOT EXISTS "affiliate_withdrawal_affiliate_idx" ON "affiliate_withdrawals" USING btree ("affiliateId");
CREATE INDEX IF NOT EXISTS "affiliate_withdrawal_status_idx" ON "affiliate_withdrawals" USING btree ("status");
CREATE INDEX IF NOT EXISTS "affiliate_withdrawal_created_at_idx" ON "affiliate_withdrawals" USING btree ("createdAt");


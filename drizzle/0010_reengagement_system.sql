-- =========================================================================
-- 沉睡用户召回系统
-- - 新建 reengagement_campaigns 表: 召回活动配置(jsonb content 存 5 语言模板)
-- - 新建 reengagement_logs 表:     每封邮件的发送结果
-- =========================================================================

CREATE TABLE IF NOT EXISTS "reengagement_campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "bucket" text NOT NULL,
  "content" jsonb,
  "target_count" integer DEFAULT 0 NOT NULL,
  "sent_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "scheduled_at" timestamp,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "reengagement_campaigns_status_check"
    CHECK ("status" IN ('draft','ready','sending','completed','cancelled'))
);

CREATE INDEX IF NOT EXISTS "idx_campaign_bucket" ON "reengagement_campaigns" ("bucket");
CREATE INDEX IF NOT EXISTS "idx_campaign_status" ON "reengagement_campaigns" ("status");
CREATE INDEX IF NOT EXISTS "idx_campaign_scheduled_at" ON "reengagement_campaigns" ("scheduled_at");

CREATE TABLE IF NOT EXISTS "reengagement_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL REFERENCES "reengagement_campaigns"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "subject" text NOT NULL,
  "locale" text NOT NULL,
  "bucket" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "message_id" text,
  "error_message" text,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "reengagement_logs_status_check"
    CHECK ("status" IN ('pending','sent','failed','bounced','unsubscribed'))
);

CREATE INDEX IF NOT EXISTS "idx_relog_campaign_id" ON "reengagement_logs" ("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_relog_user_id" ON "reengagement_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_relog_status" ON "reengagement_logs" ("status");
CREATE INDEX IF NOT EXISTS "idx_relog_sent_at" ON "reengagement_logs" ("sent_at");

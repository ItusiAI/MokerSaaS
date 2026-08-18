-- =========================================================================
-- 订阅到期提醒系统
-- - users 加 3 个字段：token（退订链接用）、disabled（退订开关）、preferred_language（邮件语言偏好）
-- - 新建 subscription_reminders 表：cron 邮件发送日志（幂等保证）
-- =========================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_unsubscribe_token TEXT,
  ADD COLUMN IF NOT EXISTS subscription_reminder_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

CREATE TABLE IF NOT EXISTS subscription_reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_end TIMESTAMP NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('7d', '3d', 'today')),
  sent_at TIMESTAMP NOT NULL,
  email_message_id TEXT
);

-- 同一用户、同一到期周期、同一类型邮件只发一次
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_period_type
  ON subscription_reminders(user_id, period_end, reminder_type);

-- 按时间排序，方便管理后台查询
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at
  ON subscription_reminders(sent_at);
-- =========================================================================
-- 语言标识 BCP47 标准化: zh -> zh-CN, tw -> zh-TW
-- 影响列:
--   - users.preferred_language (订阅到期提醒邮件偏好)
--   - newsletter_subscriptions.locale (Newsletter 订阅语言)
--   - subscription_reminders.locale (提醒邮件发送日志记录的语言)
-- 历史数据全部以 UPDATE 一次性归一化;后续代码只写新值
-- =========================================================================

UPDATE users
   SET preferred_language = 'zh-CN'
 WHERE preferred_language = 'zh';

UPDATE users
   SET preferred_language = 'zh-TW'
 WHERE preferred_language = 'tw';

UPDATE newsletter_subscriptions
   SET locale = 'zh-CN'
 WHERE locale = 'zh';

UPDATE newsletter_subscriptions
   SET locale = 'zh-TW'
 WHERE locale = 'tw';

UPDATE subscription_reminders
   SET locale = 'zh-CN'
 WHERE locale = 'zh';

UPDATE subscription_reminders
   SET locale = 'zh-TW'
 WHERE locale = 'tw';

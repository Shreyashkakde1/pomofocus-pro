-- Alter default priority_tier to 'INBOX'
ALTER TABLE daily_tasks ALTER COLUMN priority_tier SET DEFAULT 'INBOX';


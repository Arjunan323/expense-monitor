-- Add generation tracking columns to spending_alert_settings
ALTER TABLE spending_alert_settings
    ADD COLUMN last_generated_at TIMESTAMP NULL,
    ADD COLUMN last_generated_count BIGINT NULL;

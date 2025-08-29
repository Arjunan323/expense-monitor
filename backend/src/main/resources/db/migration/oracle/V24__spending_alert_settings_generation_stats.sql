-- Oracle: add generation tracking columns (nullable)
ALTER TABLE spending_alert_settings ADD (last_generated_at TIMESTAMP NULL);
ALTER TABLE spending_alert_settings ADD (last_generated_count NUMBER(19,0) NULL);

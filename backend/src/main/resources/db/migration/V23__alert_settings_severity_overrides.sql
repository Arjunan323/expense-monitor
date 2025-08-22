ALTER TABLE spending_alert_settings ADD COLUMN critical_large_absolute NUMERIC(19,4);
ALTER TABLE spending_alert_settings ADD COLUMN critical_category_spike_multiplier NUMERIC(10,2);
ALTER TABLE spending_alert_settings ADD COLUMN critical_frequency_count INT;
ALTER TABLE spending_alert_settings ADD COLUMN critical_new_merchant_absolute NUMERIC(19,4);
ALTER TABLE spending_alert_settings ADD (critical_large_absolute NUMBER(19,4));
ALTER TABLE spending_alert_settings ADD (critical_category_spike_multiplier NUMBER(10,2));
ALTER TABLE spending_alert_settings ADD (critical_frequency_count NUMBER(10));
ALTER TABLE spending_alert_settings ADD (critical_new_merchant_absolute NUMBER(19,4));
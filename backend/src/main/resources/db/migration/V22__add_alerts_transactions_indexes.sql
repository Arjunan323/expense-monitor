-- Performance indexes for alert generation & querying
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_merchant ON transactions(user_id, merchant);
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user_created ON spending_alerts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user_ack_dismiss ON spending_alerts(user_id, acknowledged, dismissed);
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user_type_created ON spending_alerts(user_id, type, created_at);
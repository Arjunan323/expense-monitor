-- V26: Add recurring flag and flow_type classification to upcoming_transactions (PostgreSQL)
ALTER TABLE upcoming_transactions ADD COLUMN IF NOT EXISTS recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE upcoming_transactions ADD COLUMN IF NOT EXISTS flow_type VARCHAR(10);
-- Backfill flow_type based on amount sign if null
UPDATE upcoming_transactions SET flow_type = CASE WHEN amount >= 0 THEN 'INCOME' ELSE 'EXPENSE' END WHERE flow_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_upcoming_flow_type ON upcoming_transactions(flow_type);
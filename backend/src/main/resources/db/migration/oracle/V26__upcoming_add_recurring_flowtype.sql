-- V26: Add recurring flag and flow_type to upcoming_transactions (Oracle)
ALTER TABLE upcoming_transactions ADD (recurring NUMBER(1) DEFAULT 0 NOT NULL);
ALTER TABLE upcoming_transactions ADD (flow_type VARCHAR2(10));
UPDATE upcoming_transactions SET flow_type = CASE WHEN amount >= 0 THEN 'INCOME' ELSE 'EXPENSE' END WHERE flow_type IS NULL;
CREATE INDEX idx_upcoming_flow_type ON upcoming_transactions(flow_type);
CREATE TABLE IF NOT EXISTS spending_alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    amount NUMERIC(19,4),
    merchant VARCHAR(255),
    category VARCHAR(150),
    txn_date DATE,
    reason VARCHAR(400),
    acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    acknowledged_at TIMESTAMP,
    dismissed BOOLEAN DEFAULT FALSE NOT NULL,
    dismissed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user_created ON spending_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user_type ON spending_alerts(user_id, type);

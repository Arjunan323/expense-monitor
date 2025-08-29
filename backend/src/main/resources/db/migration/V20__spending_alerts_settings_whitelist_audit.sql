CREATE TABLE IF NOT EXISTS spending_alert_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    large_multiplier NUMERIC(10,4) DEFAULT 1.50 NOT NULL,
    large_min_amount NUMERIC(19,4) DEFAULT 0 NOT NULL,
    freq_window_hours INT DEFAULT 48 NOT NULL,
    freq_max_txn INT DEFAULT 4 NOT NULL,
    freq_min_amount NUMERIC(19,4) DEFAULT 0 NOT NULL,
    cat_spike_multiplier NUMERIC(10,4) DEFAULT 2.0 NOT NULL,
    cat_spike_lookback_months INT DEFAULT 3 NOT NULL,
    cat_spike_min_amount NUMERIC(19,4) DEFAULT 0 NOT NULL,
    new_merchant_min_amount NUMERIC(19,4) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS spending_alert_whitelist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, merchant)
);

CREATE TABLE IF NOT EXISTS spending_alert_muted_category (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(150) NOT NULL,
    mute_until DATE,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS spending_alert_audit (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES spending_alerts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(40) NOT NULL,
    at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sa_audit_alert ON spending_alert_audit(alert_id, at DESC);

CREATE TABLE IF NOT EXISTS spending_alert_recommendation (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    type VARCHAR(30) NOT NULL, -- tip or suggested_limit
    priority INT DEFAULT 0 NOT NULL,
    title VARCHAR(255),
    message VARCHAR(1000),
    icon VARCHAR(40),
    category VARCHAR(150),
    current_monthly_avg NUMERIC(19,4),
    suggested_cap NUMERIC(19,4),
    rationale VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sa_reco_user_month ON spending_alert_recommendation(user_id, month);

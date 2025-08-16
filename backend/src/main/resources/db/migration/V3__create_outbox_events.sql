-- Outbox table for domain events
CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(96) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_attempt_at TIMESTAMP NULL,
    attempt_count INT NULL
);
CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox_events(status, created_at);

-- Statement jobs table for async processing tracking
CREATE TABLE IF NOT EXISTS statement_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    original_filename VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    page_count INT NULL
    ,progress_percent INT NULL
);
CREATE INDEX IF NOT EXISTS idx_statement_jobs_user_created ON statement_jobs(user_id, created_at DESC);

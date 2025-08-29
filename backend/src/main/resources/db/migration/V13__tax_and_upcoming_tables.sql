-- V13: Create tax_transactions, tax_categories, upcoming_transactions tables
-- PostgreSQL migration

CREATE TABLE IF NOT EXISTS tax_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tax_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_year INT,
    amount NUMERIC(19,4) NOT NULL,
    paid_date DATE,
    category VARCHAR(64),
    note VARCHAR(1000)
);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_user_year ON tax_transactions(user_id, tax_year);

CREATE TABLE IF NOT EXISTS upcoming_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount NUMERIC(19,4) NOT NULL,
    category VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_upcoming_user_due ON upcoming_transactions(user_id, due_date);

-- Trigger to auto-update updated_at (Postgres)
CREATE OR REPLACE FUNCTION trg_upcoming_set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upcoming_set_updated
BEFORE UPDATE ON upcoming_transactions
FOR EACH ROW EXECUTE FUNCTION trg_upcoming_set_updated_at();

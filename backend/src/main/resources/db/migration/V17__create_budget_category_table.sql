-- Create budget_category table (PostgreSQL / generic dialect)
CREATE TABLE IF NOT EXISTS budget_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    monthly_budget NUMERIC(19,4) NOT NULL,
    spent NUMERIC(19,4) DEFAULT 0 NOT NULL,
    icon VARCHAR(16),
    color VARCHAR(16),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_budget_category_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_budget_category_user ON budget_category(user_id);

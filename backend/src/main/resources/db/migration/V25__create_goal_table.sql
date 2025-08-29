-- V25: Create goal table (PostgreSQL / general)
-- Creates savings / debt / investment goals linked to users.

CREATE TABLE IF NOT EXISTS goal (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    target_amount NUMERIC(19,4) NOT NULL,
    current_amount NUMERIC(19,4) NOT NULL DEFAULT 0,
    target_date DATE,
    category VARCHAR(50),
    icon VARCHAR(64),
    color VARCHAR(32),
    monthly_contribution NUMERIC(19,4) DEFAULT 0,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_user ON goal(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_user_target_date ON goal(user_id, target_date);

-- Trigger to keep updated_at current on row updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_goal_set_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION trg_goal_set_updated_at() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;$$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_goal_set_updated_at
        BEFORE UPDATE ON goal
        FOR EACH ROW EXECUTE FUNCTION trg_goal_set_updated_at();
    END IF;
END$$;

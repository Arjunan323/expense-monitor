-- Newsletter subscription table
CREATE TABLE IF NOT EXISTS newsletter_subscription (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    subscribed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(40),
    CONSTRAINT ux_newsletter_subscription_email UNIQUE (email)
);

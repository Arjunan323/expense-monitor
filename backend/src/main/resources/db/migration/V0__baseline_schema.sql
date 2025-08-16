-- V0: Baseline schema creation for all core entities
-- This script creates tables idempotently so it can be applied to an existing database
-- before Flyway starts versioned migrations (use with baselineOnMigrate=true).

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    locale VARCHAR(20) DEFAULT 'en-US',
    subscribed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    plan_type VARCHAR(30),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(30),
    razorpay_payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    user_id BIGINT UNIQUE,
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS raw_statements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    upload_date TIMESTAMP,
    filename VARCHAR(500),
    raw_json TEXT,
    bank_name VARCHAR(100),
    page_count INT,
    CONSTRAINT fk_raw_statements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    date DATE,
    description TEXT,
    amount NUMERIC(18,2),
    balance NUMERIC(18,2),
    category VARCHAR(150),
    bank_name VARCHAR(100),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plans (
    id BIGSERIAL PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL,
    region VARCHAR(10) NOT NULL DEFAULT 'GLOBAL',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    amount INT NOT NULL DEFAULT 0,
    statements_per_month INT NOT NULL DEFAULT 0,
    pages_per_statement INT NOT NULL DEFAULT 0,
    features TEXT,
    combined_bank INT,
    CONSTRAINT uq_plan_type_region UNIQUE (plan_type, region)
);

CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    message TEXT NOT NULL,
    type VARCHAR(50),
    meta VARCHAR(2000),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_count BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_banks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_banks_user_name UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_count BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_categories_user_name UNIQUE (user_id, name)
);

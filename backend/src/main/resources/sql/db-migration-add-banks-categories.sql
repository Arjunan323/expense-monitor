-- Migration: create banks and categories tables
CREATE TABLE IF NOT EXISTS banks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_count BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_banks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_banks_user_name UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_count BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_categories_user_name UNIQUE (user_id, name)
);

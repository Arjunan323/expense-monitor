-- Migration: Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

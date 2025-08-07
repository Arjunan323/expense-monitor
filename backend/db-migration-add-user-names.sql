-- Migration: Add firstName and lastName columns to users table
ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_name VARCHAR(255);

-- Migration: add password_hash and role columns to existing users table.
-- Safe to run on a live database — uses IF NOT EXISTS / does not drop any data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT crypt('Password123!', gen_salt('bf')),
  ADD COLUMN IF NOT EXISTS role          text NOT NULL DEFAULT 'user';

-- Insert admin user if they don't exist yet, or update their credentials if they do.
INSERT INTO users (user_id, username, email, password_hash, role, created_at, count_lent, count_borrowed, favors_given, favors_taken)
VALUES (gen_random_uuid(), 'admin', 'admin@coffeeandkudos.com', crypt('Admin123!', gen_salt('bf')), 'admin', NOW(), 0, 0, 0, 0)
ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('Admin123!', gen_salt('bf')),
  role = 'admin';

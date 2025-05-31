-- Initialize database with essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Set up auth schema
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) UNIQUE,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create test user (for development only)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  'f47ac10b-58cc-0001-b1d5-00001c7e6fd5',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  'authenticated'
) ON CONFLICT (email) DO NOTHING; 
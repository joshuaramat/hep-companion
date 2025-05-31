-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE hep_companion_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hep_companion_test');

-- Connect to test database
\c hep_companion_test;

-- Create test-specific extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up test-specific roles and permissions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
    END IF;
END
$$;

-- Grant all privileges on test database to postgres role
GRANT ALL PRIVILEGES ON DATABASE hep_companion_test TO postgres; 
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Also load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocalConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
  for (const k in envLocalConfig) {
    process.env[k] = envLocalConfig[k];
  }
}

async function sqlFixOrganizationConstraint() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Supabase URL or service role key is missing');
    console.error('Make sure you have a .env or .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('Current environment variables found:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    process.exit(1);
  }

  // Create admin client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('Fixing organization foreign key constraint issues using direct SQL...');
    
    // Execute SQL to temporarily disable the constraint, fix the data, and then re-enable it
    const sql = `
-- 1. Temporarily drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_organization;

-- 2. Create an explicit primary key on clinic_id if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_pkey' AND conrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE organizations ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 3. Ensure clinic_id is unique in organizations table
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_clinic_id_key;
ALTER TABLE organizations ADD CONSTRAINT organizations_clinic_id_key UNIQUE (clinic_id);

-- 4. Create missing organizations for existing profiles
INSERT INTO organizations (name, clinic_id)
SELECT 
  COALESCE(p.organization, 'Organization ' || p.clinic_id) as name,
  p.clinic_id
FROM profiles p
WHERE p.clinic_id IS NOT NULL 
  AND p.clinic_id != ''
  AND NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.clinic_id = p.clinic_id
  )
ON CONFLICT (clinic_id) DO NOTHING;

-- 5. Update profiles without clinic_id but with organization name
-- First find matching organizations by name
WITH profile_updates AS (
  SELECT 
    p.id as profile_id,
    p.organization as org_name,
    o.clinic_id as clinic_id
  FROM profiles p
  LEFT JOIN organizations o ON LOWER(o.name) = LOWER(p.organization)
  WHERE (p.clinic_id IS NULL OR p.clinic_id = '')
    AND p.organization IS NOT NULL
    AND p.organization != ''
    AND o.clinic_id IS NOT NULL
)
UPDATE profiles p
SET clinic_id = pu.clinic_id
FROM profile_updates pu
WHERE p.id = pu.profile_id;

-- 6. For any remaining profiles without clinic_id but with organization name,
-- create new organizations and update profiles
DO $$
DECLARE
  profile_rec RECORD;
  new_clinic_id TEXT;
BEGIN
  FOR profile_rec IN 
    SELECT id, organization 
    FROM profiles 
    WHERE (clinic_id IS NULL OR clinic_id = '')
      AND organization IS NOT NULL
      AND organization != ''
  LOOP
    -- Generate a unique clinic ID
    new_clinic_id := 'CLINIC-' || SUBSTR(MD5(random()::text), 1, 6);
    
    -- Insert new organization
    INSERT INTO organizations (name, clinic_id)
    VALUES (profile_rec.organization, new_clinic_id)
    ON CONFLICT (clinic_id) DO NOTHING;
    
    -- Update profile with new clinic_id
    UPDATE profiles
    SET clinic_id = new_clinic_id
    WHERE id = profile_rec.id;
  END LOOP;
END $$;

-- 7. Re-add the foreign key constraint
ALTER TABLE profiles
  ADD CONSTRAINT fk_organization
  FOREIGN KEY (clinic_id)
  REFERENCES organizations(clinic_id)
  ON DELETE SET NULL;

-- 8. Return info about what was done
SELECT 
  (SELECT COUNT(*) FROM organizations) as organization_count,
  (SELECT COUNT(*) FROM profiles WHERE clinic_id IS NOT NULL) as profiles_with_clinic_id,
  (SELECT COUNT(*) FROM profiles WHERE clinic_id IS NULL) as profiles_without_clinic_id;
    `;
    
    console.log('Executing SQL fix...');
    
    // Try direct SQL execution
    const { data, error } = await supabase.rpc('pgx_query', { query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error.message);
      console.log('\nYou may need to run this SQL directly in the Supabase SQL Editor:');
      console.log(sql);
      process.exit(1);
    }
    
    console.log('SQL executed successfully!');
    console.log('Summary:');
    
    if (data && data[0]) {
      console.log(`- Total organizations: ${data[0].organization_count}`);
      console.log(`- Profiles with clinic ID: ${data[0].profiles_with_clinic_id}`);
      console.log(`- Profiles without clinic ID: ${data[0].profiles_without_clinic_id}`);
    }
    
    console.log('\nOrganization constraint issues have been fixed!');
    console.log('You should no longer see foreign key constraint errors.');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    console.log('\nYou may need to run this SQL directly in the Supabase SQL Editor:');
    
    const sql = `
-- 1. Temporarily drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_organization;

-- 2. Create an explicit primary key on clinic_id if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_pkey' AND conrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE organizations ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 3. Ensure clinic_id is unique in organizations table
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_clinic_id_key;
ALTER TABLE organizations ADD CONSTRAINT organizations_clinic_id_key UNIQUE (clinic_id);

-- 4. Create missing organizations for existing profiles
INSERT INTO organizations (name, clinic_id)
SELECT 
  COALESCE(p.organization, 'Organization ' || p.clinic_id) as name,
  p.clinic_id
FROM profiles p
WHERE p.clinic_id IS NOT NULL 
  AND p.clinic_id != ''
  AND NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.clinic_id = p.clinic_id
  )
ON CONFLICT (clinic_id) DO NOTHING;

-- 5. Update profiles without clinic_id but with organization name
-- First find matching organizations by name
WITH profile_updates AS (
  SELECT 
    p.id as profile_id,
    p.organization as org_name,
    o.clinic_id as clinic_id
  FROM profiles p
  LEFT JOIN organizations o ON LOWER(o.name) = LOWER(p.organization)
  WHERE (p.clinic_id IS NULL OR p.clinic_id = '')
    AND p.organization IS NOT NULL
    AND p.organization != ''
    AND o.clinic_id IS NOT NULL
)
UPDATE profiles p
SET clinic_id = pu.clinic_id
FROM profile_updates pu
WHERE p.id = pu.profile_id;

-- 6. For any remaining profiles without clinic_id but with organization name,
-- create new organizations and update profiles
DO $$
DECLARE
  profile_rec RECORD;
  new_clinic_id TEXT;
BEGIN
  FOR profile_rec IN 
    SELECT id, organization 
    FROM profiles 
    WHERE (clinic_id IS NULL OR clinic_id = '')
      AND organization IS NOT NULL
      AND organization != ''
  LOOP
    -- Generate a unique clinic ID
    new_clinic_id := 'CLINIC-' || SUBSTR(MD5(random()::text), 1, 6);
    
    -- Insert new organization
    INSERT INTO organizations (name, clinic_id)
    VALUES (profile_rec.organization, new_clinic_id)
    ON CONFLICT (clinic_id) DO NOTHING;
    
    -- Update profile with new clinic_id
    UPDATE profiles
    SET clinic_id = new_clinic_id
    WHERE id = profile_rec.id;
  END LOOP;
END $$;

-- 7. Re-add the foreign key constraint
ALTER TABLE profiles
  ADD CONSTRAINT fk_organization
  FOREIGN KEY (clinic_id)
  REFERENCES organizations(clinic_id)
  ON DELETE SET NULL;
    `;
    
    console.log(sql);
    process.exit(1);
  }
}

// Run the function
sqlFixOrganizationConstraint(); 
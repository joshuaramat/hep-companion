-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  clinic_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Generate a unique clinic ID for new organizations
CREATE OR REPLACE FUNCTION generate_unique_clinic_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  prefix TEXT := 'CLINIC';
  found BOOLEAN;
BEGIN
  -- Loop until we find a unique ID
  LOOP
    -- Generate a random alphanumeric ID combining prefix and random characters
    new_id := prefix || '-' || SUBSTRING(MD5(random()::text), 1, 6);
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM organizations WHERE clinic_id = new_id) INTO found;
    
    -- Exit the loop if we found a unique ID
    EXIT WHEN NOT found;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate clinic_id if not provided
CREATE OR REPLACE FUNCTION set_default_clinic_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    NEW.clinic_id := generate_unique_clinic_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to organizations table
CREATE TRIGGER set_clinic_id_before_insert
  BEFORE INSERT ON organizations
  FOR EACH ROW
  WHEN (NEW.clinic_id IS NULL)
  EXECUTE FUNCTION set_default_clinic_id();

-- Row Level Security for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create a view to see which organizations have members
CREATE VIEW organization_members AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.clinic_id,
  COUNT(p.id) as member_count
FROM organizations o
LEFT JOIN profiles p ON p.clinic_id = o.clinic_id
GROUP BY o.id, o.name, o.clinic_id;

-- Policy for selecting organizations (users can see organizations they're part of)
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy for selecting all organizations in search
CREATE POLICY "Users can search all organizations" ON organizations
  FOR SELECT USING (true);

-- Policy for inserting organizations (authenticated users can create)
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Migrate existing clinic IDs from profiles to organizations table
DO $$
DECLARE
  existing_clinic_id TEXT;
  org_name TEXT;
BEGIN
  -- Create organizations for any existing clinic_ids in profiles
  FOR existing_clinic_id IN 
    SELECT DISTINCT clinic_id FROM profiles 
    WHERE clinic_id IS NOT NULL 
    AND clinic_id != ''
  LOOP
    -- Check if this clinic_id already exists in organizations
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE clinic_id = existing_clinic_id) THEN
      -- Generate a name based on the clinic_id
      org_name := 'Organization ' || existing_clinic_id;
      
      -- Insert the organization
      INSERT INTO organizations (name, clinic_id)
      VALUES (org_name, existing_clinic_id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Only add the foreign key constraint after migrating existing data
ALTER TABLE profiles
  ADD CONSTRAINT fk_organization
  FOREIGN KEY (clinic_id)
  REFERENCES organizations(clinic_id)
  ON DELETE SET NULL;

-- Create function to search for organizations by name
CREATE OR REPLACE FUNCTION search_organizations(search_term TEXT)
RETURNS SETOF organizations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM organizations
  WHERE LOWER(name) LIKE LOWER('%' || search_term || '%')
  ORDER BY name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get or create an organization
CREATE OR REPLACE FUNCTION get_or_create_organization(org_name TEXT, org_clinic_id TEXT DEFAULT NULL)
RETURNS TABLE(id UUID, name TEXT, clinic_id TEXT, created BOOLEAN) AS $$
DECLARE
  existing_org_id UUID;
  new_org_id UUID;
  generated_clinic_id TEXT;
  was_created BOOLEAN;
BEGIN
  -- Check if organization already exists by clinic_id
  IF org_clinic_id IS NOT NULL AND LENGTH(org_clinic_id) > 0 THEN
    SELECT o.id INTO existing_org_id
    FROM organizations o
    WHERE o.clinic_id = org_clinic_id;
    
    IF existing_org_id IS NOT NULL THEN
      -- Return existing organization
      RETURN QUERY
      SELECT o.id, o.name, o.clinic_id, FALSE
      FROM organizations o
      WHERE o.id = existing_org_id;
      RETURN;
    END IF;
  END IF;
  
  -- Check if organization exists by name (exact match)
  SELECT o.id INTO existing_org_id
  FROM organizations o
  WHERE LOWER(o.name) = LOWER(org_name);
  
  IF existing_org_id IS NOT NULL THEN
    -- Return existing organization
    RETURN QUERY
    SELECT o.id, o.name, o.clinic_id, FALSE
    FROM organizations o
    WHERE o.id = existing_org_id;
    RETURN;
  END IF;
  
  -- Create new organization with specified or generated clinic_id
  IF org_clinic_id IS NULL OR LENGTH(org_clinic_id) = 0 THEN
    generated_clinic_id := generate_unique_clinic_id();
  ELSE
    generated_clinic_id := org_clinic_id;
  END IF;
  
  INSERT INTO organizations (name, clinic_id)
  VALUES (org_name, generated_clinic_id)
  RETURNING id INTO new_org_id;
  
  -- Return the newly created organization
  RETURN QUERY
  SELECT o.id, o.name, o.clinic_id, TRUE
  FROM organizations o
  WHERE o.id = new_org_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
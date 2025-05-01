#!/bin/bash

# ANSI color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HEP Companion Security Migration Tool ===${NC}"
echo -e "${YELLOW}This script will apply migrations to your Supabase database.${NC}"
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Create migration directories if they don't exist
mkdir -p src/services/supabase/migrations

# Check if we can access the Supabase CLI via npx
echo -e "${YELLOW}Checking Supabase CLI access...${NC}"
if ! npx supabase --version &> /dev/null; then
    echo -e "${RED}Supabase CLI not accessible via npx. Try running: npm install --save-dev supabase${NC}"
    exit 1
else
    SUPABASE_VERSION=$(npx supabase --version)
    echo -e "${GREEN}Supabase CLI version ${SUPABASE_VERSION} is available.${NC}"
fi

# Check if we need to login to Supabase
echo -e "${YELLOW}Checking Supabase login status...${NC}"
if ! npx supabase projects list &> /dev/null; then
    echo -e "${YELLOW}You need to login to Supabase.${NC}"
    echo -e "${YELLOW}After clicking the login link, return to this terminal.${NC}"
    npx supabase login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to login to Supabase. Please try again later.${NC}"
        exit 1
    fi
fi

# List Supabase projects
echo -e "${YELLOW}Fetching your Supabase projects...${NC}"
npx supabase projects list

# Prompt for project reference
echo
echo -e "${YELLOW}Enter your Supabase project reference ID:${NC}"
read project_ref

if [ -z "$project_ref" ]; then
    echo -e "${RED}No project reference provided. Exiting.${NC}"
    exit 1
fi

# Check if we need to apply schema changes
echo
echo -e "${YELLOW}Do you want to apply schema changes (security tables, audit logs, etc.)? (y/n)${NC}"
read apply_schema

if [[ $apply_schema == "y" || $apply_schema == "Y" ]]; then
    # Apply schema migrations
    cat > src/services/supabase/migrations/01_security_schema.sql << 'EOL'
-- 1. Add user_id column to existing tables
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_key TEXT;

ALTER TABLE suggestions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 4. Create audit cleanup function
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 5. Install pg_cron if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 6. Schedule the cleanup job (requires pg_cron extension)
SELECT cron.schedule(
  'audit-logs-cleanup',
  '0 0 * * *', -- Run daily at midnight
  $$SELECT cleanup_audit_logs()$$
);

-- 7. Create audit log trigger functions
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(auth.uid(), NEW.user_id),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('new_data', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for audit logging
DROP TRIGGER IF EXISTS prompts_audit_trigger ON prompts;
CREATE TRIGGER prompts_audit_trigger
AFTER INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS feedback_audit_trigger ON feedback;
CREATE TRIGGER feedback_audit_trigger
AFTER INSERT OR UPDATE ON feedback
FOR EACH ROW EXECUTE FUNCTION create_audit_log();
EOL

    echo -e "${BLUE}Applying schema changes...${NC}"
    npx supabase db push src/services/supabase/migrations/01_security_schema.sql
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to apply schema changes.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Schema changes applied successfully!${NC}"
fi

# Check if we need to apply RLS policies
echo
echo -e "${YELLOW}Do you want to apply Row Level Security (RLS) policies? (y/n)${NC}"
read apply_rls

if [[ $apply_rls == "y" || $apply_rls == "Y" ]]; then
    # Apply RLS migrations
    cat > src/services/supabase/migrations/02_rls_policies.sql << 'EOL'
-- 1. Enable Row Level Security on all tables
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for prompts table
DROP POLICY IF EXISTS prompts_select_own ON prompts;
CREATE POLICY prompts_select_own ON prompts
  FOR SELECT USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS prompts_insert_own ON prompts;
CREATE POLICY prompts_insert_own ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
DROP POLICY IF EXISTS prompts_update_own ON prompts;
CREATE POLICY prompts_update_own ON prompts
  FOR UPDATE USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS prompts_delete_own ON prompts;
CREATE POLICY prompts_delete_own ON prompts
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create policies for suggestions table
DROP POLICY IF EXISTS suggestions_select_own ON suggestions;
CREATE POLICY suggestions_select_own ON suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
DROP POLICY IF EXISTS suggestions_insert_own ON suggestions;
CREATE POLICY suggestions_insert_own ON suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = NEW.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
DROP POLICY IF EXISTS suggestions_update_own ON suggestions;
CREATE POLICY suggestions_update_own ON suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
DROP POLICY IF EXISTS suggestions_delete_own ON suggestions;
CREATE POLICY suggestions_delete_own ON suggestions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

-- 4. Create policies for feedback table
DROP POLICY IF EXISTS feedback_select_own ON feedback;
CREATE POLICY feedback_select_own ON feedback
  FOR SELECT USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS feedback_insert_own ON feedback;
CREATE POLICY feedback_insert_own ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
DROP POLICY IF EXISTS feedback_update_own ON feedback;
CREATE POLICY feedback_update_own ON feedback
  FOR UPDATE USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS feedback_delete_own ON feedback;
CREATE POLICY feedback_delete_own ON feedback
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create policies for citations table
DROP POLICY IF EXISTS citations_select_own ON citations;
CREATE POLICY citations_select_own ON citations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM suggestions
      JOIN prompts ON suggestions.prompt_id = prompts.id
      WHERE suggestions.id = citations.suggestion_id
      AND prompts.user_id = auth.uid()
    )
  );

-- 6. Create policies for audit_logs table
DROP POLICY IF EXISTS audit_logs_select_own ON audit_logs;
CREATE POLICY audit_logs_select_own ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
EOL

    echo -e "${BLUE}Applying RLS policies...${NC}"
    npx supabase db push src/services/supabase/migrations/02_rls_policies.sql
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to apply RLS policies.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}RLS policies applied successfully!${NC}"
fi

# Check if default users are authenticated
echo
echo -e "${YELLOW}Do you want to backfill existing data with a default user ID? (y/n)${NC}"
read backfill_data

if [[ $backfill_data == "y" || $backfill_data == "Y" ]]; then
    # Create a default user if needed
    echo -e "${YELLOW}Enter an existing auth.users ID to use for backfilling (or leave blank to create a new one):${NC}"
    read default_user_id
    
    if [ -z "$default_user_id" ]; then
        # Generate a random UUID for the default user
        default_user_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
        
        # Create migration for default user
        cat > src/services/supabase/migrations/03_default_user.sql << EOL
-- Create a default user for existing data
INSERT INTO auth.users (id, email, confirmed_at)
VALUES ('$default_user_id', 'system@example.com', NOW())
ON CONFLICT (id) DO NOTHING;
EOL

        echo -e "${BLUE}Creating default user...${NC}"
        npx supabase db push src/services/supabase/migrations/03_default_user.sql
    fi
    
    # Backfill existing data
    cat > src/services/supabase/migrations/04_backfill_data.sql << EOL
-- Backfill existing data with user_id
UPDATE prompts SET user_id = '$default_user_id' WHERE user_id IS NULL;
UPDATE suggestions SET user_id = '$default_user_id' WHERE user_id IS NULL;
UPDATE feedback SET user_id = '$default_user_id' WHERE user_id IS NULL;
EOL

    echo -e "${BLUE}Backfilling existing data...${NC}"
    npx supabase db push src/services/supabase/migrations/04_backfill_data.sql
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to backfill data.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Data backfilled successfully!${NC}"
fi

echo
echo -e "${GREEN}==== Migration Complete ====${NC}"
echo -e "${GREEN}The security changes have been applied to your Supabase project.${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update your environment variables with the service role key"
echo -e "2. Deploy your application with the updated code"
echo -e "3. Test the security features"
echo

exit 0 
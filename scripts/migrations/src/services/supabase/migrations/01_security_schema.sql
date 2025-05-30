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

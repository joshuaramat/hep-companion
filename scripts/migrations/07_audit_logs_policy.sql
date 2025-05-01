-- Add INSERT policy for audit_logs
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;

-- Allow any authenticated user to insert audit logs
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
-- Keep the existing SELECT policy but make sure it exists
DROP POLICY IF EXISTS audit_logs_select_own ON audit_logs;
CREATE POLICY audit_logs_select_own ON audit_logs
  FOR SELECT USING (auth.uid() = user_id); 
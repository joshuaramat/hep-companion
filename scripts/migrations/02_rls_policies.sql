-- 1. Enable Row Level Security on all tables
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for prompts table
CREATE POLICY prompts_select_own ON prompts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY prompts_insert_own ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY prompts_update_own ON prompts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY prompts_delete_own ON prompts
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create policies for suggestions table
CREATE POLICY suggestions_select_own ON suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
CREATE POLICY suggestions_insert_own ON suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = NEW.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
CREATE POLICY suggestions_update_own ON suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
  
CREATE POLICY suggestions_delete_own ON suggestions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = suggestions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

-- 4. Create policies for feedback table
CREATE POLICY feedback_select_own ON feedback
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY feedback_insert_own ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY feedback_update_own ON feedback
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY feedback_delete_own ON feedback
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create policies for citations table
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
-- Only allow users to see their own audit logs
CREATE POLICY audit_logs_select_own ON audit_logs
  FOR SELECT USING (auth.uid() = user_id); 
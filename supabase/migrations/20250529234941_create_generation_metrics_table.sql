-- Create table to store generation timing metrics for progress estimates
CREATE TABLE IF NOT EXISTS generation_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL CHECK (stage IN ('started', 'fetching-exercises', 'generating', 'validating', 'storing', 'complete')),
  duration_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient querying by stage
CREATE INDEX idx_generation_metrics_stage ON generation_metrics(stage);

-- Create index for querying by user
CREATE INDEX idx_generation_metrics_user_id ON generation_metrics(user_id);

-- Create index for created_at to efficiently query recent records
CREATE INDEX idx_generation_metrics_created_at ON generation_metrics(created_at DESC);

-- Enable RLS
ALTER TABLE generation_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own metrics
CREATE POLICY "Users can insert own metrics" ON generation_metrics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own metrics
CREATE POLICY "Users can read own metrics" ON generation_metrics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Function to get average duration by stage (last 30 days)
CREATE OR REPLACE FUNCTION get_stage_averages()
RETURNS TABLE(stage TEXT, avg_duration_ms NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.stage,
    ROUND(AVG(gm.duration_ms)::numeric, 0) as avg_duration_ms
  FROM generation_metrics gm
  WHERE gm.created_at > NOW() - INTERVAL '30 days'
  GROUP BY gm.stage;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_stage_averages() TO authenticated; 
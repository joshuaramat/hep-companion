-- Create citations table
CREATE TABLE citations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  journal TEXT NOT NULL,
  year TEXT NOT NULL,
  doi TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for faster lookups
CREATE INDEX idx_citations_suggestion_id ON citations(suggestion_id);

-- Update suggestions table to remove citations column
ALTER TABLE suggestions DROP COLUMN IF EXISTS citations; 
-- Create user profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  clinic_id TEXT,
  profession TEXT,
  organization TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Set up Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile after user signup
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- Create function to update profile on user update
CREATE OR REPLACE FUNCTION public.update_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', profiles.full_name),
    avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update profile after user update
DROP TRIGGER IF EXISTS update_profile_on_user_update ON auth.users;
CREATE TRIGGER update_profile_on_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (old.raw_user_meta_data->>'full_name' IS DISTINCT FROM new.raw_user_meta_data->>'full_name' OR 
        old.raw_user_meta_data->>'avatar_url' IS DISTINCT FROM new.raw_user_meta_data->>'avatar_url')
  EXECUTE FUNCTION public.update_profile_for_user(); 
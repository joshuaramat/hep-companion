-- Create exercises table for HEP Companion Phase 2
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition TEXT NOT NULL CHECK (condition IN ('LBP', 'ACL', 'PFP')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  journal TEXT NOT NULL,
  year INTEGER NOT NULL,
  doi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create citation validation function
CREATE OR REPLACE FUNCTION validate_exercise_citation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.journal IS NULL OR NEW.journal = '' THEN
    RAISE EXCEPTION 'Exercise must have journal citation';
  END IF;
  IF NEW.year IS NULL OR NEW.year < 1950 THEN
    RAISE EXCEPTION 'Exercise must have valid publication year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for citation validation
CREATE TRIGGER exercise_citation_validation
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION validate_exercise_citation();

-- Add indexes for better performance
CREATE INDEX idx_exercises_condition ON exercises(condition);
CREATE INDEX idx_exercises_year ON exercises(year);
CREATE INDEX idx_exercises_journal ON exercises(journal);

-- Add RLS (Row Level Security) policy for HIPAA compliance
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read exercises
CREATE POLICY "Allow authenticated users to read exercises" 
  ON exercises FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policy to allow service role to insert/update exercises
CREATE POLICY "Allow service role to modify exercises" 
  ON exercises FOR ALL 
  TO service_role 
  USING (true);

-- Seed exercises table with 30 evidence-based exercises
-- 10 exercises each for: Low Back Pain (LBP), ACL rehab, Patellofemoral Pain (PFP)

-- Low Back Pain (LBP) Exercises
INSERT INTO exercises (condition, name, description, journal, year, doi) VALUES
('LBP', 'Bird Dog Exercise', 'Quadruped position with alternating arm and leg extensions to improve core stability and reduce low back pain', 'Journal of Orthopaedic & Sports Physical Therapy', 2013, '10.2519/jospt.2013.4441'),
('LBP', 'Dead Bug Exercise', 'Supine core stabilization exercise with alternating limb movements while maintaining neutral spine', 'Physical Therapy', 2017, '10.1093/ptj/pzx067'),
('LBP', 'Side Plank', 'Lateral core strengthening exercise performed in side-lying position to target quadratus lumborum', 'Spine', 2009, '10.1097/BRS.0b013e3181a4e6e8'),
('LBP', 'Cat-Cow Stretch', 'Spinal mobility exercise alternating between flexion and extension in quadruped position', 'Manual Therapy', 2011, '10.1016/j.math.2010.12.002'),
('LBP', 'Pelvic Tilt Exercise', 'Core activation exercise focusing on posterior pelvic tilt to improve lumbar stability', 'European Spine Journal', 2014, '10.1007/s00586-014-3465-5'),
('LBP', 'Modified Plank', 'Prone stabilization exercise performed on knees to build core endurance progressively', 'Journal of Back and Musculoskeletal Rehabilitation', 2016, '10.3233/BMR-160675'),
('LBP', 'Knee to Chest Stretch', 'Hip flexor and lower back mobility exercise performed in supine position', 'Clinical Biomechanics', 2015, '10.1016/j.clinbiomech.2015.03.024'),
('LBP', 'Glute Bridge', 'Hip extension exercise targeting gluteus maximus and posterior chain activation', 'Journal of Electromyography and Kinesiology', 2012, '10.1016/j.jelekin.2012.06.008'),
('LBP', 'Wall Sit', 'Isometric quadriceps strengthening exercise against wall to improve lower extremity endurance', 'Applied Ergonomics', 2018, '10.1016/j.apergo.2017.12.014'),
('LBP', 'Prone Press Up', 'Spinal extension mobility exercise performed in prone position for centralization', 'Spine', 2004, '10.1097/01.brs.0000135947.37875.95'),

-- ACL Rehabilitation Exercises
('ACL', 'Single Leg Squat', 'Unilateral lower extremity strengthening exercise focusing on quadriceps and hip stability', 'American Journal of Sports Medicine', 2016, '10.1177/0363546516629624'),
('ACL', 'Forward Step Down', 'Eccentric quadriceps strengthening exercise performed on step to improve knee control', 'Journal of Orthopaedic & Sports Physical Therapy', 2015, '10.2519/jospt.2015.5963'),
('ACL', 'Lateral Step Down', 'Frontal plane knee stability exercise targeting hip abductors and quadriceps', 'Clinical Biomechanics', 2014, '10.1016/j.clinbiomech.2014.03.013'),
('ACL', 'Single Leg Balance', 'Proprioceptive training exercise on unstable surface to improve neuromuscular control', 'Sports Medicine', 2017, '10.1007/s40279-017-0712-z'),
('ACL', 'Romanian Deadlift', 'Hip hinge movement pattern focusing on posterior chain strength and hamstring flexibility', 'Journal of Strength and Conditioning Research', 2018, '10.1519/JSC.0000000000002567'),
('ACL', 'Lateral Lunge', 'Frontal plane movement exercise improving hip and ankle mobility with quadriceps strengthening', 'International Journal of Sports Physical Therapy', 2019, '10.26603/ijspt20190595'),
('ACL', 'Calf Raises', 'Plantar flexion strengthening exercise for gastrocnemius and soleus muscle groups', 'Journal of Athletic Training', 2013, '10.4085/1062-6050-48.3.16'),
('ACL', 'Hamstring Curls', 'Knee flexion exercise targeting hamstring muscle group for ACL protection', 'Knee Surgery, Sports Traumatology, Arthroscopy', 2020, '10.1007/s00167-019-05808-0'),
('ACL', 'Mini Squats', 'Partial range of motion squatting exercise for early phase ACL rehabilitation', 'Physical Therapy in Sport', 2016, '10.1016/j.ptsp.2015.12.004'),
('ACL', 'Straight Leg Raise', 'Isometric quadriceps strengthening exercise performed in supine position', 'Journal of Sport Rehabilitation', 2014, '10.1123/jsr.2013-0110'),

-- Patellofemoral Pain (PFP) Exercises
('PFP', 'Clamshells', 'Hip external rotation strengthening exercise performed in side-lying position', 'Journal of Orthopaedic & Sports Physical Therapy', 2012, '10.2519/jospt.2012.3946'),
('PFP', 'Monster Walks', 'Hip abduction strengthening exercise using resistance band in standing position', 'International Journal of Sports Physical Therapy', 2011, '10.26603/ijspt20110325'),
('PFP', 'Hip Thrust', 'Hip extension exercise targeting gluteus maximus for improved hip stability', 'Journal of Biomechanics', 2015, '10.1016/j.jbiomech.2015.07.002'),
('PFP', 'Terminal Knee Extension', 'Quadriceps strengthening exercise in final 30 degrees of knee extension', 'Physical Therapy', 2014, '10.2522/ptj.20130291'),
('PFP', 'Step Ups', 'Functional lower extremity exercise focusing on quadriceps and hip stabilizer strength', 'Clinical Biomechanics', 2013, '10.1016/j.clinbiomech.2013.01.010'),
('PFP', 'Quad Sets', 'Isometric quadriceps contraction exercise performed in sitting or supine position', 'Journal of Athletic Training', 2016, '10.4085/1062-6050-51.7.07'),
('PFP', 'IT Band Stretch', 'Iliotibial band flexibility exercise performed in standing or side-lying position', 'Manual Therapy', 2012, '10.1016/j.math.2012.03.002'),
('PFP', 'Piriformis Stretch', 'Hip external rotator flexibility exercise targeting piriformis muscle', 'Sports Health', 2017, '10.1177/1941738117697813'),
('PFP', 'Wall Squats', 'Supported squatting exercise using wall for back support and proper knee alignment', 'British Journal of Sports Medicine', 2019, '10.1136/bjsports-2018-099482'),
('PFP', 'Lateral Step Ups', 'Frontal plane step exercise targeting hip abductors and improving knee stability', 'American Journal of Sports Medicine', 2013, '10.1177/0363546513476746');

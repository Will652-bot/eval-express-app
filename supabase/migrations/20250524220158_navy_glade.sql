/*
  # Update criteria table and evaluations view
  
  1. Changes
    - Add min_value and max_value columns to criteria table
    - Add teacher_id column to criteria table
    - Update evaluations view to maintain existing column names
    - Update RLS policies for criteria table
  
  2. Security
    - Enable RLS on criteria table
    - Add policies for teachers and admins
    - Block anonymous access
*/

-- Update criteria table
ALTER TABLE criteria
ADD COLUMN IF NOT EXISTS min_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_value numeric NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES users(id);

-- Add constraint to ensure min_value <= max_value (only if it doesn't exist)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'min_max_check' AND conrelid = 'criteria'::regclass
  ) THEN
    ALTER TABLE criteria
    ADD CONSTRAINT min_max_check CHECK (min_value <= max_value);
  END IF;
END $$;

-- Drop existing view if exists
DROP VIEW IF EXISTS evaluations_with_score;

-- Create updated view with consistent column names
CREATE VIEW evaluations_with_score AS
SELECT 
  e.*,
  c.max_value as max_possible_score,
  CASE
    WHEN c.max_value > 0 THEN (c.min_value::float / c.max_value) * 100
    ELSE 0
  END as score_percentage,
  cf.color as formatting_color
FROM evaluations e
LEFT JOIN criteria c ON e.criterion_id = c.id
LEFT JOIN conditional_formatting cf 
  ON e.teacher_id = cf.teacher_id
  AND (c.min_value::float / c.max_value) * 100 BETWEEN cf.min_score AND cf.max_score;

-- Update RLS policies
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can manage their own criteria" ON criteria;
DROP POLICY IF EXISTS "Admins can access all criteria" ON criteria;
DROP POLICY IF EXISTS "Block anon access on criteria" ON criteria;

-- Create new policies
CREATE POLICY "Teachers can manage their own criteria"
  ON criteria
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can access all criteria"
  ON criteria
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE users.id = auth.uid()) = 'admin');

CREATE POLICY "Block anon access on criteria"
  ON criteria
  FOR ALL
  TO anon
  USING (false);
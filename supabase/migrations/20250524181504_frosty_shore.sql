/*
  # Add evaluation management and conditional formatting
  
  1. New Tables
    - `evaluations`
      - Stores evaluation records with scores and feedback
      - Links to teachers, students, classes, and criteria
    - `conditional_formatting` 
      - Defines score ranges and colors for visual feedback
      - Links formatting rules to teachers
  
  2. Views
    - `evaluations_with_score`
      - Calculates score percentages
      - Applies conditional formatting colors
  
  3. Security
    - Enable RLS on all tables
    - Add policies for teachers and admins
*/

-- Create evaluations table if not exists
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  comments text,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conditional formatting table if not exists
CREATE TABLE IF NOT EXISTS conditional_formatting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_score numeric,
  max_score numeric,
  color text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT min_max_check CHECK (max_score IS NULL OR min_score <= max_score)
);

-- Drop existing view if exists
DROP VIEW IF EXISTS evaluations_with_score;

-- Create view for evaluations with scores
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

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_formatting ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can manage evaluations for their students" ON evaluations;
DROP POLICY IF EXISTS "Block anon access on evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can access all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Teachers can manage their own formatting rules" ON conditional_formatting;
DROP POLICY IF EXISTS "Block anon access on conditional_formatting" ON conditional_formatting;
DROP POLICY IF EXISTS "Admins can access all formatting" ON conditional_formatting;

-- Create policies for evaluations
CREATE POLICY "Teachers can manage evaluations for their students"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Block anon access on evaluations"
  ON evaluations
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Admins can access all evaluations"
  ON evaluations
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE users.id = auth.uid()) = 'admin');

-- Create policies for conditional formatting
CREATE POLICY "Teachers can manage their own formatting rules"
  ON conditional_formatting
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Block anon access on conditional_formatting"
  ON conditional_formatting
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Admins can access all formatting"
  ON conditional_formatting
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE users.id = auth.uid()) = 'admin');

-- Grant access to view
GRANT SELECT ON evaluations_with_score TO authenticated;
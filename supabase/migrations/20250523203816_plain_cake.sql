/*
  # Create criteria and conditional formatting tables

  1. New Tables
    - `criteria`
      - `id` (uuid, primary key)
      - `name` (text)
      - `min_value` (numeric)
      - `max_value` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `conditional_formatting`
      - `id` (uuid, primary key)
      - `min_score` (numeric)
      - `max_score` (numeric)
      - `color` (text)
      - `teacher_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Policies:
      - Teachers can manage their own criteria and formatting rules
*/

CREATE TABLE IF NOT EXISTS criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_value numeric NOT NULL DEFAULT 0,
  max_value numeric NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conditional_formatting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_score numeric NOT NULL,
  max_score numeric NOT NULL,
  color text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_formatting ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own criteria
CREATE POLICY "Teachers can manage their own criteria"
  ON criteria
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evaluations
    WHERE evaluations.criterion_id = criteria.id
    AND evaluations.teacher_id = auth.uid()
  ))
  WITH CHECK (true);

-- Teachers can manage their own formatting rules
CREATE POLICY "Teachers can manage their own formatting rules"
  ON conditional_formatting
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
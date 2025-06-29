/*
  # Create evaluations table and policies

  1. New Tables
    - `evaluations`
      - `id` (uuid, primary key)
      - `title` (text)
      - `date` (timestamp)
      - `teacher_id` (uuid, foreign key to users)
      - `student_id` (uuid, foreign key to students)
      - `comments` (text)
      - `class_id` (uuid, foreign key to classes)
      - `criterion_id` (uuid, foreign key to criteria)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on evaluations table
    - Policies:
      - Teachers can manage evaluations for their students
*/

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  comments text,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Teachers can manage evaluations for their students
CREATE POLICY "Teachers can manage evaluations for their students"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
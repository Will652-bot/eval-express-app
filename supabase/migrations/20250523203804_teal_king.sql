/*
  # Create classes table and policies

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `teacher_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on classes table
    - Policies:
      - Teachers can manage their own classes
      - Teachers can view their own classes
*/

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own classes
CREATE POLICY "Teachers can manage their own classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
/*
  # Add teacher_id to students table
  
  1. Changes
    - Add teacher_id column to students table
    - Add foreign key constraint to users table
    - Update RLS policies to use teacher_id for access control
  
  2. Security
    - Enable RLS on students table
    - Add policies for teachers to manage their own students
    - Maintain backward compatibility with class-based access
*/

-- Add teacher_id column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_students_teacher_id 
ON students(teacher_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON students;
DROP POLICY IF EXISTS "Teachers access their students" ON students;
DROP POLICY IF EXISTS "Block anon access on students" ON students;
DROP POLICY IF EXISTS "Admins can access all students" ON students;
DROP POLICY IF EXISTS "Teacher can view students in own classes" ON students;
DROP POLICY IF EXISTS "Teacher can insert students in own classes" ON students;
DROP POLICY IF EXISTS "Teacher can update students in own classes" ON students;
DROP POLICY IF EXISTS "Teacher can delete students in own classes" ON students;

-- Create new policies
CREATE POLICY "Teachers can manage their own students"
  ON students
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Backward compatibility policy for students without teacher_id
CREATE POLICY "Teachers can manage students in their classes"
  ON students
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
      AND classes.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Block anon access on students"
  ON students
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Admins can access all students"
  ON students
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE users.id = auth.uid()) = 'admin');

-- Update existing students to set teacher_id based on class.teacher_id
UPDATE students
SET teacher_id = classes.teacher_id
FROM classes
WHERE students.class_id = classes.id
  AND students.teacher_id IS NULL;
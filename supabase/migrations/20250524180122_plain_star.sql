/*
  # Add teacher_id to criteria table and update policies

  1. Changes
    - Add teacher_id column to criteria table
    - Add foreign key constraint to users table
    - Update RLS policies to enforce teacher ownership

  2. Security
    - Drop existing policies
    - Add new policies for teacher ownership
    - Maintain admin and anon policies
*/

-- Add teacher_id column
ALTER TABLE criteria 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers access their criteria" ON criteria;
DROP POLICY IF EXISTS "Teachers can manage their own criteria" ON criteria;
DROP POLICY IF EXISTS "Block anon access on criteria" ON criteria;
DROP POLICY IF EXISTS "Admins can access all criteria" ON criteria;

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
USING (
  (SELECT role FROM users WHERE users.id = auth.uid()) = 'admin'
);

CREATE POLICY "Block anon access on criteria"
ON criteria
FOR ALL
TO anon
USING (false);

-- Update existing criteria to associate with teachers
UPDATE criteria
SET teacher_id = (
  SELECT id 
  FROM users 
  WHERE role = 'teacher' 
  LIMIT 1
)
WHERE teacher_id IS NULL;
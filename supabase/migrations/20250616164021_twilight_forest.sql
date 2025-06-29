/*
  # Fix conditional formatting to support evaluation_title_id

  1. Changes
    - Add evaluation_title_id column to conditional_formatting table
    - Add foreign key constraint to evaluation_titles table
    - Update existing data to maintain compatibility

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Add evaluation_title_id column to conditional_formatting
ALTER TABLE conditional_formatting 
ADD COLUMN IF NOT EXISTS evaluation_title_id uuid REFERENCES evaluation_titles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_conditional_formatting_evaluation_title_id 
ON conditional_formatting(evaluation_title_id);

-- Update the view to handle both old and new title references
DROP VIEW IF EXISTS student_total_with_formatting;

CREATE VIEW student_total_with_formatting AS
WITH student_totals AS (
  SELECT 
    e.student_id,
    e.teacher_id,
    COALESCE(et.title, e.title) AS evaluation_title,
    e.evaluation_title_id,
    SUM(e.value) AS total
  FROM evaluations e
  LEFT JOIN evaluation_titles et ON e.evaluation_title_id = et.id
  GROUP BY e.student_id, e.teacher_id, COALESCE(et.title, e.title), e.evaluation_title_id
)
SELECT 
  s.id AS student_id,
  s.first_name,
  s.last_name,
  s.class_id,
  c.name AS class_name,
  st.total,
  cf.color AS total_color,
  st.teacher_id,
  st.evaluation_title
FROM student_totals st
JOIN students s ON st.student_id = s.id
JOIN classes c ON s.class_id = c.id
LEFT JOIN conditional_formatting cf
  ON st.teacher_id = cf.teacher_id
  AND (
    -- Match by evaluation_title_id (new way)
    (cf.evaluation_title_id IS NOT NULL AND cf.evaluation_title_id = st.evaluation_title_id)
    OR
    -- Match by evaluation_title text (legacy way)
    (cf.evaluation_title_id IS NULL AND (
      cf.evaluation_title IS NULL 
      OR cf.evaluation_title = st.evaluation_title
    ))
  )
  AND st.total BETWEEN cf.min_score AND COALESCE(cf.max_score, st.total);
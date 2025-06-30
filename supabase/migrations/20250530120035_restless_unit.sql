-- Drop the view if it exists to avoid column renaming issues
DROP VIEW IF EXISTS student_total_with_formatting;

-- Create the view with the correct column names
CREATE VIEW student_total_with_formatting AS
WITH student_totals AS (
  SELECT 
    e.student_id,
    e.teacher_id,
    e.title AS evaluation_title,
    SUM(e.value) AS total
  FROM evaluations e
  GROUP BY e.student_id, e.teacher_id, e.title
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
    cf.evaluation_title IS NULL 
    OR cf.evaluation_title = st.evaluation_title
  )
  AND st.total BETWEEN cf.min_score AND COALESCE(cf.max_score, st.total);
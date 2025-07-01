-- Drop the view if it exists to avoid column renaming issues
DROP VIEW IF EXISTS student_total_with_formatting;

-- Create the view with the correct column names
CREATE VIEW student_total_with_formatting AS
SELECT 
  s.id AS student_id,
  s.first_name,
  s.last_name,
  s.class_id,
  c.name AS class_name,
  agg.total,
  cf.color AS total_color,
  agg.teacher_id,
  agg.title AS evaluation_title
FROM (
  SELECT 
    e.student_id,
    e.teacher_id,
    e.title,
    SUM(e.value) AS total
  FROM evaluations e
  GROUP BY e.student_id, e.teacher_id, e.title
) AS agg
JOIN students s ON agg.student_id = s.id
JOIN classes c ON s.class_id = c.id
LEFT JOIN conditional_formatting cf
  ON agg.teacher_id = cf.teacher_id
  AND (cf.min_score IS NULL OR agg.total BETWEEN cf.min_score AND cf.max_score);
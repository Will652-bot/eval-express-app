/*
  # Create evaluations view with scores
  
  Creates a view that combines evaluation data with score calculations and conditional formatting
  
  1. View Details
    - Combines data from evaluations, criteria, and conditional_formatting tables
    - Calculates score percentages based on criteria values
    - Applies conditional formatting colors based on score ranges
    
  2. Security
    - Grants SELECT access to authenticated users
*/

DROP VIEW IF EXISTS evaluations_with_score;

CREATE VIEW evaluations_with_score AS
SELECT 
  e.id,
  e.title,
  e.date,
  e.teacher_id,
  e.student_id,
  e.comments,
  e.created_at,
  e.updated_at,
  e.class_id,
  e.criterion_id,
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

-- Grant access to authenticated users
GRANT SELECT ON evaluations_with_score TO authenticated;
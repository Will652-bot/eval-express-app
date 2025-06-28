/*
  # Fix function overloading ambiguity

  1. Problem
    - Multiple `generate_demo_data` functions exist with same parameters but different order
    - PostgreSQL cannot resolve which function to call
    - Causing PGRST203 error in Supabase

  2. Solution
    - Drop all existing `generate_demo_data` functions
    - Create a single, unambiguous function definition
    - Also fix `delete_demo_data` function if it has the same issue

  3. Security
    - Maintain existing security context
    - Ensure function runs with proper permissions
*/

-- Drop all existing generate_demo_data functions to resolve overloading
DROP FUNCTION IF EXISTS generate_demo_data(p_user_email text, p_user_id uuid);
DROP FUNCTION IF EXISTS generate_demo_data(p_user_id uuid, p_user_email text);
DROP FUNCTION IF EXISTS generate_demo_data(text, uuid);
DROP FUNCTION IF EXISTS generate_demo_data(uuid, text);

-- Drop all existing delete_demo_data functions to prevent similar issues
DROP FUNCTION IF EXISTS delete_demo_data(p_user_email text, p_user_id uuid);
DROP FUNCTION IF EXISTS delete_demo_data(p_user_id uuid, p_user_email text);
DROP FUNCTION IF EXISTS delete_demo_data(text, uuid);
DROP FUNCTION IF EXISTS delete_demo_data(uuid, text);

-- Create single, unambiguous generate_demo_data function
CREATE OR REPLACE FUNCTION generate_demo_data(
  p_user_id uuid,
  p_user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id uuid;
  v_student_id uuid;
  v_criterion_id uuid;
  v_evaluation_id uuid;
BEGIN
  -- Log the demo data creation
  INSERT INTO demo_log (user_id, user_email, action)
  VALUES (p_user_id, p_user_email, 'CREATE_DEMO_FROM_UI');

  -- Create demo class
  INSERT INTO classes (name, teacher_id)
  VALUES ('Turma de Demonstração', p_user_id)
  RETURNING id INTO v_class_id;

  -- Create demo students
  INSERT INTO students (first_name, last_name, class_id)
  VALUES 
    ('Ana', 'Silva', v_class_id),
    ('Bruno', 'Santos', v_class_id),
    ('Carla', 'Oliveira', v_class_id),
    ('Diego', 'Costa', v_class_id),
    ('Elena', 'Ferreira', v_class_id);

  -- Create demo criteria
  INSERT INTO criteria (name, min_value, max_value, teacher_id)
  VALUES 
    ('Avaliação', 0, 10, p_user_id),
    ('Participação', 0, 5, p_user_id),
    ('Visto', 0, 2, p_user_id),
    ('Prova', 0, 10, p_user_id),
    ('Projeto', 0, 8, p_user_id);

  -- Create demo evaluations for each student and criterion
  FOR v_student_id IN (SELECT id FROM students WHERE class_id = v_class_id) LOOP
    FOR v_criterion_id IN (SELECT id FROM criteria WHERE teacher_id = p_user_id) LOOP
      INSERT INTO evaluations (
        title, 
        date, 
        teacher_id, 
        student_id, 
        class_id, 
        criterion_id, 
        value,
        comments
      )
      VALUES (
        'Avaliação Demonstração',
        CURRENT_TIMESTAMP,
        p_user_id,
        v_student_id,
        v_class_id,
        v_criterion_id,
        (SELECT min_value + (max_value - min_value) * random() FROM criteria WHERE id = v_criterion_id),
        'Comentário de demonstração'
      );
    END LOOP;
  END LOOP;

  -- Create demo conditional formatting
  INSERT INTO conditional_formatting (min_score, max_score, color, teacher_id, evaluation_title)
  VALUES 
    (0, 3, '#ef4444', p_user_id, 'Avaliação Demonstração'),
    (3, 7, '#f59e0b', p_user_id, 'Avaliação Demonstração'),
    (7, 10, '#10b981', p_user_id, 'Avaliação Demonstração');
END;
$$;

-- Create single, unambiguous delete_demo_data function
CREATE OR REPLACE FUNCTION delete_demo_data(
  p_user_id uuid,
  p_user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demo_count integer;
BEGIN
  -- Check if user has demo data
  SELECT COUNT(*) INTO v_demo_count
  FROM demo_log 
  WHERE user_id = p_user_id AND action = 'CREATE_DEMO_FROM_UI';

  IF v_demo_count = 0 THEN
    RAISE EXCEPTION 'No demo data found for this user';
  END IF;

  -- Delete demo evaluations
  DELETE FROM evaluations 
  WHERE teacher_id = p_user_id 
    AND title = 'Avaliação Demonstração';

  -- Delete demo conditional formatting
  DELETE FROM conditional_formatting 
  WHERE teacher_id = p_user_id 
    AND evaluation_title = 'Avaliação Demonstração';

  -- Delete demo students (from demo class)
  DELETE FROM students 
  WHERE class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id = p_user_id 
      AND name = 'Turma de Demonstração'
  );

  -- Delete demo criteria
  DELETE FROM criteria 
  WHERE teacher_id = p_user_id 
    AND name IN ('Avaliação', 'Participação', 'Visto', 'Prova', 'Projeto');

  -- Delete demo class
  DELETE FROM classes 
  WHERE teacher_id = p_user_id 
    AND name = 'Turma de Demonstração';

  -- Log the demo data deletion
  INSERT INTO demo_log (user_id, user_email, action)
  VALUES (p_user_id, p_user_email, 'DELETE_DEMO_FROM_UI');
END;
$$;
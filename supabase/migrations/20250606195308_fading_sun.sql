/*
  # Create demo data functions
  
  1. Functions
    - `generate_demo_data(user_id UUID, user_email TEXT)`
      - Creates demo classes, students, criteria, and evaluations
      - Logs the action in demo_log table
    - `delete_demo_data(user_id UUID)`
      - Removes all demo data for the user
      - Logs the deletion action
  
  2. Demo Log Table
    - Tracks demo data creation and deletion actions
    - Used to determine if user has demo data
*/

-- Create demo_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS demo_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on demo_log
ALTER TABLE demo_log ENABLE ROW LEVEL SECURITY;

-- Create policies for demo_log
CREATE POLICY "Users can manage their own demo log"
  ON demo_log
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to generate demo data
CREATE OR REPLACE FUNCTION generate_demo_data(
  user_id UUID,
  user_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  class_id_1 UUID;
  class_id_2 UUID;
  criterion_id_1 UUID;
  criterion_id_2 UUID;
  criterion_id_3 UUID;
  student_ids UUID[];
  student_id UUID;
  eval_date DATE;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create demo classes
  INSERT INTO classes (id, name, teacher_id) VALUES
    (gen_random_uuid(), 'Turma A - Demonstração', user_id),
    (gen_random_uuid(), 'Turma B - Demonstração', user_id)
  RETURNING id INTO class_id_1;
  
  SELECT id INTO class_id_2 FROM classes WHERE teacher_id = user_id AND name = 'Turma B - Demonstração';

  -- Create demo criteria
  INSERT INTO criteria (id, name, min_value, max_value, teacher_id) VALUES
    (gen_random_uuid(), '1-Avaliação', 0, 10, user_id),
    (gen_random_uuid(), '2-Participação', 0, 5, user_id),
    (gen_random_uuid(), '3-Projeto', 0, 15, user_id)
  RETURNING id INTO criterion_id_1;
  
  SELECT id INTO criterion_id_2 FROM criteria WHERE teacher_id = user_id AND name = '2-Participação';
  SELECT id INTO criterion_id_3 FROM criteria WHERE teacher_id = user_id AND name = '3-Projeto';

  -- Create demo students for class 1
  INSERT INTO students (id, first_name, last_name, class_id) VALUES
    (gen_random_uuid(), 'Ana', 'Silva', class_id_1),
    (gen_random_uuid(), 'Bruno', 'Santos', class_id_1),
    (gen_random_uuid(), 'Carla', 'Oliveira', class_id_1),
    (gen_random_uuid(), 'Diego', 'Costa', class_id_1),
    (gen_random_uuid(), 'Elena', 'Ferreira', class_id_1);

  -- Create demo students for class 2
  INSERT INTO students (id, first_name, last_name, class_id) VALUES
    (gen_random_uuid(), 'Felipe', 'Almeida', class_id_2),
    (gen_random_uuid(), 'Gabriela', 'Lima', class_id_2),
    (gen_random_uuid(), 'Hugo', 'Pereira', class_id_2),
    (gen_random_uuid(), 'Isabela', 'Rocha', class_id_2);

  -- Get all student IDs for evaluations
  SELECT array_agg(id) INTO student_ids 
  FROM students 
  WHERE class_id IN (class_id_1, class_id_2);

  -- Create demo evaluations for different dates and criteria
  eval_date := CURRENT_DATE - INTERVAL '7 days';
  
  FOREACH student_id IN ARRAY student_ids LOOP
    -- Evaluation 1 - Prova Bimestral
    INSERT INTO evaluations (
      title, date, teacher_id, student_id, class_id, criterion_id, value, comments
    ) VALUES (
      'Prova Bimestral',
      eval_date,
      user_id,
      student_id,
      (SELECT class_id FROM students WHERE id = student_id),
      criterion_id_1,
      6 + (random() * 4)::numeric(3,1), -- Random score between 6-10
      'Avaliação demonstrativa'
    );

    -- Evaluation 2 - Participação
    INSERT INTO evaluations (
      title, date, teacher_id, student_id, class_id, criterion_id, value, comments
    ) VALUES (
      'Participação em Aula',
      eval_date + INTERVAL '3 days',
      user_id,
      student_id,
      (SELECT class_id FROM students WHERE id = student_id),
      criterion_id_2,
      3 + (random() * 2)::numeric(3,1), -- Random score between 3-5
      'Participação ativa'
    );

    -- Evaluation 3 - Projeto
    INSERT INTO evaluations (
      title, date, teacher_id, student_id, class_id, criterion_id, value, comments
    ) VALUES (
      'Projeto Final',
      eval_date + INTERVAL '10 days',
      user_id,
      student_id,
      (SELECT class_id FROM students WHERE id = student_id),
      criterion_id_3,
      10 + (random() * 5)::numeric(3,1), -- Random score between 10-15
      'Projeto criativo'
    );
  END LOOP;

  -- Create demo conditional formatting rules
  INSERT INTO conditional_formatting (min_score, max_score, color, teacher_id, evaluation_title) VALUES
    (0, 5, '#ef4444', user_id, NULL), -- Red for low scores
    (5.1, 7, '#f97316', user_id, NULL), -- Orange for medium scores
    (7.1, 8.5, '#eab308', user_id, NULL), -- Yellow for good scores
    (8.6, 10, '#22c55e', user_id, NULL); -- Green for excellent scores

  -- Log the demo data creation
  INSERT INTO demo_log (user_id, action) VALUES (user_id, 'CREATE_DEMO_FROM_UI');
  
END;
$$;

-- Function to delete demo data
CREATE OR REPLACE FUNCTION delete_demo_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_exists BOOLEAN;
BEGIN
  -- Check if user has demo data
  SELECT EXISTS (
    SELECT 1 FROM demo_log 
    WHERE demo_log.user_id = delete_demo_data.user_id 
    AND action = 'CREATE_DEMO_FROM_UI'
  ) INTO demo_exists;

  IF NOT demo_exists THEN
    RAISE EXCEPTION 'No demo data found for this user';
  END IF;

  -- Delete evaluations first (due to foreign key constraints)
  DELETE FROM evaluations WHERE teacher_id = user_id;
  
  -- Delete students
  DELETE FROM students WHERE class_id IN (
    SELECT id FROM classes WHERE teacher_id = user_id
  );
  
  -- Delete classes
  DELETE FROM classes WHERE teacher_id = user_id;
  
  -- Delete criteria
  DELETE FROM criteria WHERE teacher_id = user_id;
  
  -- Delete conditional formatting
  DELETE FROM conditional_formatting WHERE teacher_id = user_id;
  
  -- Log the deletion
  INSERT INTO demo_log (user_id, action) VALUES (user_id, 'DELETE_DEMO_FROM_UI');
  
END;
$$;
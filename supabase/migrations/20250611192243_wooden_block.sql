/*
  # Atualizar função de dados de demonstração com journalização e tags

  1. Modificações
    - Adicionar criação de tags e links nos dados de demo
    - Adicionar entradas de log para simular histórico
    - Associer critères aux tags appropriés

  2. Sécurité
    - Maintenir les contraintes existantes
    - Assurer la cohérence des données
*/

-- Mettre à jour la fonction generate_demo_data
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
  v_criterion_id_1 uuid;
  v_criterion_id_2 uuid;
  v_criterion_id_3 uuid;
  v_criterion_id_4 uuid;
  v_criterion_id_5 uuid;
  v_evaluation_title_id uuid;
  v_tag_id_portugues uuid;
  v_tag_id_matematica uuid;
  v_tag_id_basico uuid;
  v_tag_id_participacao uuid;
  v_tag_id_projeto uuid;
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

  -- Create demo criteria with specific IDs for tag linking
  INSERT INTO criteria (name, min_value, max_value, teacher_id)
  VALUES 
    ('1-Avaliação', 0, 10, p_user_id),
    ('2-Participação', 0, 5, p_user_id),
    ('3-Visto', 0, 2, p_user_id),
    ('4-Prova', 0, 10, p_user_id),
    ('5-Projeto', 0, 8, p_user_id)
  RETURNING id INTO v_criterion_id_1;

  -- Get the other criterion IDs
  SELECT id INTO v_criterion_id_2 FROM criteria WHERE teacher_id = p_user_id AND name = '2-Participação';
  SELECT id INTO v_criterion_id_3 FROM criteria WHERE teacher_id = p_user_id AND name = '3-Visto';
  SELECT id INTO v_criterion_id_4 FROM criteria WHERE teacher_id = p_user_id AND name = '4-Prova';
  SELECT id INTO v_criterion_id_5 FROM criteria WHERE teacher_id = p_user_id AND name = '5-Projeto';

  -- Create demo evaluation title
  INSERT INTO evaluation_titles (title, teacher_id)
  VALUES ('Avaliação Demonstração', p_user_id)
  RETURNING id INTO v_evaluation_title_id;

  -- Get tag IDs
  SELECT id INTO v_tag_id_portugues FROM criterion_tags WHERE name = 'Língua Portuguesa';
  SELECT id INTO v_tag_id_matematica FROM criterion_tags WHERE name = 'Matemática';
  SELECT id INTO v_tag_id_basico FROM criterion_tags WHERE name = 'Básico';
  SELECT id INTO v_tag_id_participacao FROM criterion_tags WHERE name = 'Participação';
  SELECT id INTO v_tag_id_projeto FROM criterion_tags WHERE name = 'Projeto';

  -- Link criteria to tags
  INSERT INTO criterion_tag_links (criterion_id, tag_id) VALUES
    (v_criterion_id_1, v_tag_id_basico),
    (v_criterion_id_1, v_tag_id_portugues),
    (v_criterion_id_2, v_tag_id_participacao),
    (v_criterion_id_2, v_tag_id_basico),
    (v_criterion_id_3, v_tag_id_basico),
    (v_criterion_id_4, v_tag_id_matematica),
    (v_criterion_id_4, v_tag_id_basico),
    (v_criterion_id_5, v_tag_id_projeto);

  -- Associate some criteria with the evaluation title
  INSERT INTO evaluation_title_criteria (evaluation_title_id, criterion_id, teacher_id) VALUES
    (v_evaluation_title_id, v_criterion_id_1, p_user_id),
    (v_evaluation_title_id, v_criterion_id_2, p_user_id),
    (v_evaluation_title_id, v_criterion_id_4, p_user_id);

  -- Log the associations in evaluation_criteria_log
  INSERT INTO evaluation_criteria_log (teacher_id, evaluation_title_id, criterion_id, action) VALUES
    (p_user_id, v_evaluation_title_id, v_criterion_id_1, 'insert'),
    (p_user_id, v_evaluation_title_id, v_criterion_id_2, 'insert'),
    (p_user_id, v_evaluation_title_id, v_criterion_id_4, 'insert');

  -- Create demo evaluations for each student and criterion
  FOR v_student_id IN (SELECT id FROM students WHERE class_id = v_class_id) LOOP
    -- Only create evaluations for associated criteria
    INSERT INTO evaluations (
      title, 
      date, 
      teacher_id, 
      student_id, 
      class_id, 
      criterion_id, 
      value,
      comments,
      evaluation_title_id
    )
    SELECT
      'Avaliação Demonstração',
      CURRENT_TIMESTAMP,
      p_user_id,
      v_student_id,
      v_class_id,
      etc.criterion_id,
      (SELECT min_value + (max_value - min_value) * random() FROM criteria WHERE id = etc.criterion_id),
      'Comentário de demonstração',
      v_evaluation_title_id
    FROM evaluation_title_criteria etc
    WHERE etc.evaluation_title_id = v_evaluation_title_id;
  END LOOP;

  -- Create demo conditional formatting
  INSERT INTO conditional_formatting (min_score, max_score, color, teacher_id, evaluation_title) VALUES 
    (0, 3, '#ef4444', p_user_id, 'Avaliação Demonstração'),
    (3, 7, '#f59e0b', p_user_id, 'Avaliação Demonstração'),
    (7, 10, '#10b981', p_user_id, 'Avaliação Demonstração');
END;
$$;

-- Mettre à jour la fonction delete_demo_data
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

  -- Delete demo evaluation criteria logs
  DELETE FROM evaluation_criteria_log 
  WHERE teacher_id = p_user_id;

  -- Delete demo evaluations
  DELETE FROM evaluations 
  WHERE teacher_id = p_user_id 
    AND title = 'Avaliação Demonstração';

  -- Delete demo evaluation title criteria associations
  DELETE FROM evaluation_title_criteria
  WHERE teacher_id = p_user_id;

  -- Delete demo evaluation titles
  DELETE FROM evaluation_titles
  WHERE teacher_id = p_user_id
    AND title = 'Avaliação Demonstração';

  -- Delete demo conditional formatting
  DELETE FROM conditional_formatting 
  WHERE teacher_id = p_user_id 
    AND evaluation_title = 'Avaliação Demonstração';

  -- Delete demo criterion tag links
  DELETE FROM criterion_tag_links
  WHERE criterion_id IN (
    SELECT id FROM criteria WHERE teacher_id = p_user_id
  );

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
    AND name IN ('1-Avaliação', '2-Participação', '3-Visto', '4-Prova', '5-Projeto');

  -- Delete demo class
  DELETE FROM classes 
  WHERE teacher_id = p_user_id 
    AND name = 'Turma de Demonstração';

  -- Log the demo data deletion
  INSERT INTO demo_log (user_id, user_email, action)
  VALUES (p_user_id, p_user_email, 'DELETE_DEMO_FROM_UI');
END;
$$;
/*
  # Créer les fonctions d'aide pour les données de démonstration

  1. Fonctions
    - `has_demo_data(p_user_id UUID)` - vérifie si l'utilisateur a des données de démonstration actives
    - `has_demo_data_to_delete(p_user_id UUID)` - identique à has_demo_data (pour compatibilité)

  2. Sécurité
    - Fonctions SECURITY DEFINER pour accès contrôlé
    - Vérification de l'existence de l'utilisateur
*/

-- Fonction pour vérifier si l'utilisateur a des données de démonstration
CREATE OR REPLACE FUNCTION has_demo_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier si l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Compter les entrées CREATE_DEMO_FROM_UI pour cet utilisateur
  SELECT COUNT(*) INTO v_count
  FROM demo_log 
  WHERE user_id = p_user_id 
    AND action = 'CREATE_DEMO_FROM_UI';

  RETURN v_count > 0;
END;
$$;

-- Fonction identique pour compatibilité
CREATE OR REPLACE FUNCTION has_demo_data_to_delete(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN has_demo_data(p_user_id);
END;
$$;

-- Mettre à jour la fonction delete_demo_data pour ajouter le log de suppression
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
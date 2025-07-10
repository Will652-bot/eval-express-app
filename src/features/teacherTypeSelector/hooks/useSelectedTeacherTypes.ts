import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Hook personnalisé pour récupérer les teacher types sélectionnés d'un utilisateur.
 */
export function useSelectedTeacherTypes(userId: string) {
  const [selectedTeacherTypes, setSelectedTeacherTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fonction de récupération des teacher types sélectionnés
   */
  const fetchSelectedTeacherTypes = async () => {
    if (!userId) {
      setSelectedTeacherTypes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_teachertypes')
        .select('teachertype_id')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao carregar teacherTypes:', error.message);
        setSelectedTeacherTypes([]);
      } else {
        const ids = data?.map((item) => item.teachertype_id) ?? [];
        setSelectedTeacherTypes(ids);
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao buscar teacherTypes:', err);
      setSelectedTeacherTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedTeacherTypes();
  }, [userId]);

  return {
    selectedTeacherTypes,
    loading,
    refetchSelectedTeacherTypes: fetchSelectedTeacherTypes,
  };
}

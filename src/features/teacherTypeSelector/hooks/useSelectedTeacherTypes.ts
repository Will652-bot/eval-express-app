import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export function useSelectedTeacherTypes(userId: string) {
  const [selectedTeacherTypes, setSelectedTeacherTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSelectedTeacherTypes = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_teachertypes') // ✅ nom corrigé
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

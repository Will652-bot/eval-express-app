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
        .from('user_teacher_types')
        .select('teachertype_id')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao carregar teacherTypes:', error.message);
        setSelectedTeacherTypes([]);
      } else {
        const ids = data.map((item) => item.teachertype_id);
        setSelectedTeacherTypes(ids);
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao buscar teacherTypes:', err);
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

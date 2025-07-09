// src/features/teacherTypeSelector/hooks/useSelectedTeacherTypes.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export function useSelectedTeacherTypes(userId: string | undefined) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchSelected = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_teachertypes')
        .select('teachertype_id')
        .eq('user_id', userId);
      if (!error && data) {
        setSelectedTypes(data.map((d) => d.teachertype_id));
      }
      setLoading(false);
    };

    fetchSelected();
  }, [userId]);

  return { selectedTypes, loading };
}

// src/features/teacherTypeSelector/TeacherTypeSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface TeacherType {
  id: string;
  teachertype: string;
}

export const TeacherTypeSelector: React.FC = () => {
  const { user } = useAuth();
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeacherTypes();
    fetchUserSelectedTypes();
  }, []);

  const fetchTeacherTypes = async () => {
    const { data, error } = await supabase.from('teachertypes').select('*');
    if (error) {
      toast.error('Erro ao carregar tipos de professor');
    } else {
      setTeacherTypes(data);
    }
  };

  const fetchUserSelectedTypes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users_teachertypes')
      .select('teachertype_id')
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao carregar seleção anterior');
    } else {
      setSelectedTypes(data.map((entry) => entry.teachertype_id));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    if (selected.length > 2) {
      toast.error('Você pode selecionar no máximo dois tipos.');
    } else {
      setSelectedTypes(selected);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.rpc('save_teachertype_selection', {
      p_user_id: user.id,
      p_teachertype_ids: selectedTypes,
    });

    if (error) {
      toast.error('Erro ao salvar seleção');
    } else {
      toast.success('Seleção salva com sucesso');
    }
    setLoading(false);
  };

  return (
    <div className="mb-6">
      <Label htmlFor="teacherTypeSelect">Qual seu tipo de ensino? (máx. 2)</Label>
      <select
        id="teacherTypeSelect"
        multiple
        value={selectedTypes}
        onChange={handleChange}
        className="mt-1 w-full h-28 border rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
      >
        {teacherTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.teachertype}
          </option>
        ))}
      </select>
      <Button
        className="mt-2"
        onClick={handleSave}
        disabled={loading || selectedTypes.length === 0}
      >
        {loading ? 'Salvando...' : 'Salvar escolha'}
      </Button>
    </div>
  );
};

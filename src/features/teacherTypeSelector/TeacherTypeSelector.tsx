// src/features/teacherTypeSelector/TeacherTypeSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import toast from 'react-hot-toast';

interface TeacherType {
  id: string;
  teachertype: string;
}

interface TeacherTypeSelectorProps {
  userId: string;
  onSelectionChange?: (selectedTypes: string[]) => void;
}

export const TeacherTypeSelector: React.FC<TeacherTypeSelectorProps> = ({
  userId,
  onSelectionChange,
}) => {
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchTeacherTypes();
    fetchUserSelectedTypes();
  }, [userId]);

  const fetchTeacherTypes = async () => {
    const { data, error } = await supabase.from('teachertypes').select('*');
    if (error) {
      toast.error('Erro ao carregar tipos de professor');
    } else {
      setTeacherTypes(data || []);
    }
  };

  const fetchUserSelectedTypes = async () => {
    const { data, error } = await supabase
      .from('view_user_selected_teachertypes')
      .select('teachertype_id')
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao carregar seleção anterior');
    } else {
      const ids = (data || []).map((entry) => entry.teachertype_id);
      setSelectedTypes(ids);
      onSelectionChange?.(ids);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    if (selected.length > 2) {
      toast.error('Você pode selecionar no máximo dois tipos.');
    } else {
      setSelectedTypes(selected);
      onSelectionChange?.(selected);
    }
  };

  const validateSelection = async () => {
    const { data: saved, error: loadError } = await supabase
      .from('users_teachertypes')
      .select('teachertype_id')
      .eq('user_id', userId);

    if (loadError || !saved || saved.length === 0) {
      toast.error('Nenhum tipo salvo ou erro de leitura.');
      return false;
    }

    const validTypeIds = teacherTypes.map((t) => t.id);
    const invalidDetected = saved.some((entry) => !validTypeIds.includes(entry.teachertype_id));

    if (invalidDetected) {
      toast.error('Tipo inválido detectado! Revise sua seleção.');
      return false;
    }

    toast.success('Seleção verificada com sucesso');
    return true;
  };

  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.rpc('save_teachertype_selection', {
      p_user_id: userId,
      p_selected_types: selectedTypes,
    });

    if (error) {
      toast.error('Erro ao salvar seleção');
      console.error('[save_teachertype_selection]', error);
    } else {
      toast.success('Seleção salva com sucesso');
      await validateSelection(); // ⬅️ Nouvelle vérification juste après enregistrement
    }

    setLoading(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="teacherTypeSelect">Qual seu tipo de ensino? (máx. 2)</Label>
        <span className="text-sm text-gray-600 italic">
          {selectedTypes.length > 0
            ? teacherTypes
                .filter((t) => selectedTypes.includes(t.id))
                .map((t) => t.teachertype)
                .join('; ')
            : 'Nenhum selecionado'}
        </span>
      </div>

      <select
        id="teacherTypeSelect"
        multiple
        value={selectedTypes}
        onChange={handleChange}
        className="w-full max-h-40 overflow-auto border rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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

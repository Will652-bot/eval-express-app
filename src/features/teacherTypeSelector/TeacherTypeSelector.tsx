// src/features/teacherTypeSelector/TeacherTypeSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface TeacherType {
  id: string;
  teachertype: string;
}

interface TeacherTypeSelectorProps {
  userId: string;
  onSelectionChange?: (selectedTypes: string[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const TeacherTypeSelector: React.FC<TeacherTypeSelectorProps> = ({
  userId,
  onSelectionChange,
  onValidationChange,
}) => {
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validSelection, setValidSelection] = useState<boolean | null>(null);

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

  const validateSelection = async (silent = false): Promise<boolean> => {
    if (teacherTypes.length === 0) {
      if (!silent) console.warn('[validateSelection] Lista de referência ainda vazia.');
      return false;
    }

    const { data: saved, error: loadError } = await supabase
      .from('users_teachertypes')
      .select('teachertype_id')
      .eq('user_id', userId);

    if (loadError || !saved || saved.length === 0) {
      setValidSelection(null); // ⚠️ Ne pas forcer false
      onValidationChange?.(false);
      if (!silent) {
        toast.error('Nenhum tipo salvo ou erro de leitura.');
      }
      return false;
    }

    const validTypeIds = teacherTypes.map((t) => t.id);
    const invalidDetected = saved.some((entry) => !validTypeIds.includes(entry.teachertype_id));

    if (invalidDetected) {
      setValidSelection(false);
      onValidationChange?.(false);
      if (!silent) {
        toast.error('Tipo inválido detectado! Revise sua seleção.');
      }
      return false;
    }

    setValidSelection(true);
    onValidationChange?.(true);
    if (!silent) {
      toast.success('Seleção verificada com sucesso');
    }
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
      setLoading(false);
      return;
    }

    toast.success('Seleção salva com sucesso');

    const isValid = await validateSelection(false);

    if (isValid) {
      const { data, error: fetchError } = await supabase
        .from('view_user_selected_teachertypes')
        .select('teachertype_id')
        .eq('user_id', userId);

      if (!fetchError && data) {
        const updatedIds = data.map((entry) => entry.teachertype_id);
        setSelectedTypes(updatedIds);
        onSelectionChange?.(updatedIds);
      }
    }

    setLoading(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="teacherTypeSelect">Qual seu tipo de ensino? (máx. 2)</Label>
        <span className="text-sm text-gray-600 italic flex items-center gap-1">
          {selectedTypes.length > 0
            ? teacherTypes
                .filter((t) => selectedTypes.includes(t.id))
                .map((t) => t.teachertype)
                .join('; ')
            : 'Nenhum selecionado'}
        </span>
        {validSelection === true && (
          <span className="text-green-600 flex items-center gap-1 text-sm ml-2">
            <CheckCircle className="w-4 h-4" /> Seleção ativa
          </span>
        )}
        {validSelection === false && selectedTypes.length > 0 && (
          <span className="text-red-600 flex items-center gap-1 text-sm ml-2">
            <AlertTriangle className="w-4 h-4" /> Seleção inválida
          </span>
        )}
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

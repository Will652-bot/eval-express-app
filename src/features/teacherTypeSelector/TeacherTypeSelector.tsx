// src/features/teacherTypeSelector/TeacherTypeSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
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
  }, [user]);

  const fetchTeacherTypes = async () => {
    const { data, error } = await supabase.from('teachertypes').select('*');
    if (error) {
      toast.error('Erro ao carregar tipos de professor');
    } else {
      setTeacherTypes(data || []);
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
      setSelectedTypes((data || []).map((entry) => entry.teachertype_id));
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
      p_selected_types: selectedTypes,
    });

    if (error) {
      toast.error('Erro ao salvar seleção');
      console.error('[save_teachertype_selection]', error);
    } else {
      toast.success('Seleção salva com sucesso');
    }
    setLoading(false);
  };

  const handleGenerateDemoData = async () => {
    if (!user) return;

    if (selectedTypes.length === 0 || selectedTypes.length > 2) {
      toast.error('Você deve selecionar 1 ou 2 tipos de ensino para gerar os dados.');
      return;
    }

    const { error } = await supabase.rpc('generate_demo_data_by_type', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_teachertype_ids: selectedTypes,
    });

    if (error) {
      toast.error('Erro ao criar dados de demonstração');
      console.error('[generate_demo_data_by_type]', error);
    } else {
      toast.success('Dados de demonstração criados com sucesso!');
    }
  };

  const handleDeleteDemoData = async () => {
    if (!user) return;

    if (selectedTypes.length === 0) {
      toast.error('Você deve ter pelo menos um tipo selecionado para excluir os dados.');
      return;
    }

    const { error } = await supabase.rpc('delete_demo_data_by_type', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_teachertype_ids: selectedTypes,
    });

    if (error) {
      toast.error('Erro ao excluir dados de demonstração');
      console.error('[delete_demo_data_by_type]', error);
    } else {
      toast.success('Dados de demonstração excluídos com sucesso!');
    }
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

      <Button
        className="mt-4 bg-green-600 hover:bg-green-700 text-white"
        onClick={handleGenerateDemoData}
        disabled={selectedTypes.length === 0}
      >
        Criar conjunto de dados de demonstração
      </Button>

      <Button
        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
        onClick={handleDeleteDemoData}
        disabled={selectedTypes.length === 0}
      >
        Excluir conjunto de dados de demonstração
      </Button>
    </div>
  );
};

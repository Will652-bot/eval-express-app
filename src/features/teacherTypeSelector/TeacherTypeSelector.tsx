import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import toast from 'react-hot-toast';

interface TeacherType {
  id: string;
  teachertype: string;
}

export const TeacherTypeSelector: React.FC = () => {
  const { user } = useAuth();
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeacherTypes = async () => {
      const { data, error } = await supabase.from('teachertypes').select('*');
      if (error) {
        toast.error('Erro ao carregar tipos de professores');
        return;
      }
      setTeacherTypes(data);
    };

    const fetchUserSelections = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('users_teachertypes')
        .select('teachertype_id')
        .eq('user_id', user.id);
      if (!error && data) {
        setSelectedIds(data.map((item) => item.teachertype_id));
      }
    };

    fetchTeacherTypes();
    fetchUserSelections();
  }, [user]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((tid) => tid !== id);
      if (prev.length < 2) return [...prev, id];
      toast.error('Selecione no máximo 2 tipos.');
      return prev;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.rpc('save_teachertype_selection', {
      user_id: user.id,
      teachertype_ids: selectedIds,
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar a seleção');
    } else {
      toast.success('Seleção salva com sucesso');
    }
  };

  return (
    <div className="space-y-4">
      <Label>Selecione até dois tipos de ensino:</Label>
      <div className="grid grid-cols-1 gap-2">
        {teacherTypes.map((type) => (
          <label key={type.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedIds.includes(type.id)}
              onCheckedChange={() => toggleSelection(type.id)}
            />
            <span>{type.teachertype}</span>
          </label>
        ))}
      </div>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar escolha'}
      </Button>
    </div>
  );
};

export default TeacherTypeSelector;

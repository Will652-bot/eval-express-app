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

interface TeacherTypeSelectorProps {
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
}

export const TeacherTypeSelector: React.FC<TeacherTypeSelectorProps> = ({ selectedTypes, setSelectedTypes }) => {
  const { user } = useAuth();
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger tous les types disponibles
  useEffect(() => {
    const fetchTeacherTypes = async () => {
      const { data, error } = await supabase.from('teachertypes').select('id, teachertype');
      if (error) {
        toast.error('Erro ao carregar tipos de professor');
        return;
      }
      setTeacherTypes(data);
    };

    fetchTeacherTypes();
  }, []);

  // Activer ou désactiver un type
  const toggleType = (id: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          toast.error('Você deve selecionar ao menos um tipo de professor');
          return prev;
        }
        return prev.filter((t) => t !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      } else {
        toast.error('Você pode selecionar no máximo dois tipos');
        return prev;
      }
    });
  };

  // Bouton désactivé si aucune sélection valide
  const isSaveDisabled = selectedTypes.length === 0 || loading;

  // Si jamais cette sauvegarde est utilisée ailleurs
  const handleSaveTypes = async () => {
    if (!user?.id || selectedTypes.length === 0) {
      toast.error('Selecione ao menos um tipo de professor');
      return;
    }

    setLoading(true);

    try {
      await supabase.from('users_teachertypes').delete().eq('user_id', user.id);

      const inserts = selectedTypes.map((typeId) => ({
        user_id: user.id,
        teachertype_id: typeId,
      }));

      const { error } = await supabase.from('users_teachertypes').insert(inserts);

      if (error) throw error;

      toast.success('Tipos de professor salvos com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao salvar tipos:', err);
      toast.error('Erro ao salvar tipos de professor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Tipo de ensino</Label>
      <div className="flex flex-wrap gap-2">
        {teacherTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedTypes.includes(type.id) ? 'default' : 'outline'}
            onClick={() => toggleType(type.id)}
          >
            {type.teachertype}
          </Button>
        ))}
      </div>
    </div>
  );
};


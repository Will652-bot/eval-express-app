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

  // Charger les types déjà sélectionnés par l'utilisateur
  useEffect(() => {
    const fetchSelectedTypes = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('user_teachertypes')
        .select('teachertype_id')
        .eq('user_id', user.id);

      if (!error && data) {
        const selected = data.map((row) => row.teachertype_id);
        setSelectedTypes(selected);
      }
    };

    fetchSelectedTypes();
  }, [user?.id]);

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

  // Sauvegarder la sélection dans la table user_teachertypes
  const handleSaveTypes = async () => {
    if (!user?.id || selectedTypes.length === 0) {
      toast.error('Selecione ao menos um tipo de professor');
      return;
    }

    setLoading(true);

    try {
      await supabase.from('user_teachertypes').delete().eq('user_id', user.id);

      const inserts = selectedTypes.map((typeId) => ({
        user_id: user.id,
        teachertype_id: typeId,
      }));

      const { error } = await supabase.from('user_teachertypes').insert(inserts);

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

      <div className="pt-2">
        <Button onClick={handleSaveTypes} disabled={selectedTypes.length === 0 || loading}>
          {loading ? 'Salvando...' : 'Salvar Tipos de Professor'}
        </Button>
      </div>
    </div>
  );
};

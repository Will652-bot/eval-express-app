// src/features/teacherTypeSelector/TeacherTypeSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TeacherType {
  id: string;
  teachertype: string;
}

interface TeacherTypeSelectorProps {
  userId: string;
  onSelectionChange?: (selectedTypes: string[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const TeacherTypeSelector: React.FC<TeacherTypeSelectorProps> = ({ userId, onSelectionChange, onValidationChange }) => {
  const { user } = useAuth();
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchTeacherTypes();
    fetchActiveTypes();
  }, [userId]);

  const fetchTeacherTypes = async () => {
    const { data, error } = await supabase.from('teachertypes').select('*');
    if (error) {
      toast.error('Erro ao carregar tipos de professor');
    } else {
      setTeacherTypes(data || []);
    }
  };

  const fetchActiveTypes = async () => {
    const { data, error } = await supabase
      .from('user_teachertypes')
      .select('teachertype_id')
      .eq('user_id', userId);
    if (!error && data) {
      setActiveTypes(data.map((row) => row.teachertype_id));
    }
  };

  const toggleType = (id: string) => {
    let updated: string[] = [];
    if (selectedTypes.includes(id)) {
      updated = selectedTypes.filter((tid) => tid !== id);
    } else {
      if (selectedTypes.length >= 2) {
        toast.error('Selecione no máximo 2 tipos');
        return;
      }
      updated = [...selectedTypes, id];
    }
    setSelectedTypes(updated);
    onSelectionChange?.(updated);
    onValidationChange?.(updated.length > 0 && updated.length <= 2);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {teacherTypes.map((type) => {
        const isSelected = selectedTypes.includes(type.id);
        const isActive = activeTypes.includes(type.id);
        return (
          <button
            key={type.id}
            onClick={() => toggleType(type.id)}
            className={`px-3 py-1 rounded-full border text-sm transition-all
              ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}
              ${isActive ? ' ring-2 ring-green-400' : ''}`}
          >
            {type.teachertype} {isActive && '✅'}
          </button>
        );
      })}
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TagCreatorProps {
  onTagCreated: () => void;
}

export const TagCreator: React.FC<TagCreatorProps> = ({ onTagCreated }) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('criterion_tags')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          user_id: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Já existe uma tag com este nome');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Tag criada com sucesso');
      setFormData({ name: '', description: '' });
      setIsCreating(false);
      onTagCreated();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setFormData({ name: '', description: '' });
  };

  if (!isCreating) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCreating(true)}
        leftIcon={<Plus className="h-3 w-3" />}
      >
        Criar Nova Tag
      </Button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Criar Nova Tag</h4>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Nome da Tag"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Matemática, Português, Projeto..."
          required
          fullWidth
        />
        
        <Input
          label="Descrição (opcional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da tag..."
          fullWidth
        />
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            leftIcon={<X className="h-3 w-3" />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={creating}
            leftIcon={<Save className="h-3 w-3" />}
          >
            Salvar Tag
          </Button>
        </div>
      </form>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const ClassFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchClass();
    }
  }, [id]);

  const fetchClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados da turma');
      navigate('/classes');
    }
  };

  const checkDuplicateName = async (name: string): Promise<boolean> => {
    try {
      const query = supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user?.id)
        .ilike('name', name);

      if (isEditing && id) {
        query.neq('id', id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const name = formData.name.trim();
      
      if (!name) {
        toast.error('O nome da turma é obrigatório');
        return;
      }

      const isDuplicate = await checkDuplicateName(name);
      if (isDuplicate) {
        toast.error('Você já tem uma turma com este nome');
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Turma atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            name: name,
            teacher_id: user?.id,
          });

        if (error) throw error;
        toast.success('Turma criada com sucesso');
      }

      navigate('/classes');
    } catch (error) {
      toast.error('Erro ao salvar turma');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Turma' : 'Nova Turma'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing
            ? 'Atualize as informações da turma'
            : 'Preencha as informações para criar uma nova turma'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Input
            label="Nome da Turma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/classes')}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
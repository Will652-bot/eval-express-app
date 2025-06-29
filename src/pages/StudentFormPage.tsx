import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const StudentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId, id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .eq('teacher_id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do aluno');
      navigate(`/classes/${classId}/students`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const first_name = formData.first_name.trim();
      const last_name = formData.last_name.trim();
      
      if (!first_name || !last_name) {
        toast.error('Todos os campos são obrigatórios');
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('students')
          .update({
            first_name,
            last_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('teacher_id', user?.id);

        if (error) throw error;
        toast.success('Aluno atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            first_name,
            last_name,
            class_id: classId,
            teacher_id: user?.id,
          });

        if (error) throw error;
        toast.success('Aluno cadastrado com sucesso');
      }

      navigate(`/classes/${classId}/students`);
    } catch (error) {
      toast.error('Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing
            ? 'Atualize as informações do aluno'
            : 'Preencha as informações para cadastrar um novo aluno'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Input
            label="Nome"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            fullWidth
          />

          <Input
            label="Sobrenome"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            fullWidth
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/classes/${classId}/students`)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
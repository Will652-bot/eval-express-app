import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const CriteriaFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    min_value: '0',
    max_value: '10',
  });

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchCriteria();
    }
  }, [id]);

  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          min_value: data.min_value.toString(),
          max_value: data.max_value.toString(),
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar critério');
      navigate('/criteria');
    }
  };

  const validateForm = () => {
    const min = parseFloat(formData.min_value);
    const max = parseFloat(formData.max_value);
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (isNaN(min) || isNaN(max)) {
      toast.error('Valores mínimo e máximo devem ser números válidos');
      return false;
    }
    
    if (min >= max) {
      toast.error('Valor mínimo deve ser menor que o valor máximo');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const criteriaData = {
        name: formData.name.trim(),
        min_value: parseFloat(formData.min_value),
        max_value: parseFloat(formData.max_value),
        teacher_id: user?.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('criteria')
          .update({
            ...criteriaData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Critério atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('criteria')
          .insert(criteriaData);

        if (error) throw error;
        toast.success('Critério criado com sucesso');
      }

      navigate('/criteria');
    } catch (error) {
      console.error('Erro ao salvar critério:', error);
      toast.error('Erro ao salvar critério');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Critério' : 'Novo Critério'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing
            ? 'Atualize as informações do critério'
            : 'Defina um novo critério de avaliação'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor Mínimo"
              type="number"
              value={formData.min_value}
              onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Valor Máximo"
              type="number"
              value={formData.max_value}
              onChange={(e) => setFormData({ ...formData, max_value: e.target.value })}
              required
              fullWidth
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/criteria')}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEditing ? 'Salvar Alterações' : 'Criar Critério'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
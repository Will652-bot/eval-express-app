import React, { useState, useEffect } from 'react';
import { Plus, Search, SortAsc, Trash2, Edit } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FormattingRule {
  id: string;
  min_score: number;
  max_score: number;
  color: string;
  teacher_id: string;
  evaluation_title: string | null;
  evaluation_title_id: string | null;
}

interface EvaluationTitle {
  id: string;
  title: string;
}

export const ConditionalFormattingPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<FormattingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<FormattingRule | null>(null);
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [filterTitleId, setFilterTitleId] = useState('');
  const [formData, setFormData] = useState({
    min_score: '',
    max_score: '',
    color: '#000000',
    evaluation_title_id: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    ruleId: '',
  });

  useEffect(() => {
    fetchRules();
    fetchEvaluationTitles();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('conditional_formatting')
        .select(`
          *,
          evaluation_title_ref:evaluation_titles(title)
        `)
        .eq('teacher_id', user?.id)
        .order('min_score', { ascending: true });

      if (error) throw error;
      
      // ✅ CORRECTION: Process rules to show proper title
      const processedRules = (data || []).map(rule => ({
        ...rule,
        display_title: rule.evaluation_title_ref?.title || rule.evaluation_title || 'Todas as avaliações'
      }));
      
      setRules(processedRules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Erro ao carregar regras de formatação');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationTitles = async () => {
    try {
      // ✅ CORRECTION: Fetch from evaluation_titles table
      const { data, error } = await supabase
        .from('evaluation_titles')
        .select('id, title')
        .eq('teacher_id', user?.id)
        .order('title');

      if (error) throw error;
      setEvaluationTitles(data || []);
    } catch (error) {
      console.error('Error fetching evaluation titles:', error);
      toast.error('Erro ao carregar títulos de avaliação');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const min = parseFloat(formData.min_score);
    const max = parseFloat(formData.max_score);

    if (isNaN(min) || isNaN(max)) {
      toast.error('Os valores mínimo e máximo devem ser números válidos');
      return;
    }

    if (min > max) {
      toast.error('O valor mínimo deve ser menor que o valor máximo');
      return;
    }

    try {
      // ✅ CORRECTION: Store evaluation_title_id instead of text
      const ruleData = {
        min_score: min,
        max_score: max,
        color: formData.color,
        teacher_id: user?.id,
        evaluation_title_id: formData.evaluation_title_id || null,
        // Keep legacy field for backward compatibility
        evaluation_title: formData.evaluation_title_id ? null : null
      };

      if (editingRule) {
        const { error } = await supabase
          .from('conditional_formatting')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Regra atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('conditional_formatting')
          .insert(ruleData);

        if (error) throw error;
        toast.success('Regra criada com sucesso');
      }

      setFormData({ min_score: '', max_score: '', color: '#000000', evaluation_title_id: '' });
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erro ao salvar regra');
    }
  };

  const handleEdit = (rule: FormattingRule) => {
    setEditingRule(rule);
    setFormData({
      min_score: rule.min_score.toString(),
      max_score: rule.max_score.toString(),
      color: rule.color,
      evaluation_title_id: rule.evaluation_title_id || ''
    });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('conditional_formatting')
        .delete()
        .eq('id', confirmDialog.ruleId);

      if (error) throw error;
      toast.success('Regra excluída com sucesso');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Erro ao excluir regra');
    } finally {
      setConfirmDialog({ isOpen: false, ruleId: '' });
    }
  };

  // ✅ CORRECTION: Filter rules based on evaluation_title_id
  const filteredRules = rules.filter(rule => {
    if (!filterTitleId) return true;
    if (filterTitleId === 'null') return !rule.evaluation_title_id;
    return rule.evaluation_title_id === filterTitleId;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formatação Condicional</h1>
        <p className="mt-1 text-gray-500">
          Defina regras de formatação baseadas em intervalos de notas
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Nota Mínima"
              type="number"
              step="0.1"
              value={formData.min_score}
              onChange={(e) => setFormData({ ...formData, min_score: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Nota Máxima"
              type="number"
              step="0.1"
              value={formData.max_score}
              onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Cor"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Avaliação
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                value={formData.evaluation_title_id}
                onChange={(e) => setFormData({ ...formData, evaluation_title_id: e.target.value })}
              >
                <option value="">Todas as avaliações</option>
                {evaluationTitles.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            {editingRule && (
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setEditingRule(null);
                  setFormData({ min_score: '', max_score: '', color: '#000000', evaluation_title_id: '' });
                }}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit">
              {editingRule ? 'Atualizar Regra' : 'Adicionar Regra'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Filtrar por avaliação:
            </label>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
              value={filterTitleId}
              onChange={(e) => setFilterTitleId(e.target.value)}
            >
              <option value="">Todas as avaliações</option>
              <option value="null">Regras globais</option>
              {evaluationTitles.map((title) => (
                <option key={title.id} value={title.id}>
                  {title.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intervalo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avaliação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma regra de formatação encontrada
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.min_score} - {rule.max_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-6 w-6 rounded border border-gray-200 mr-2"
                          style={{ backgroundColor: rule.color }}
                        ></div>
                        {rule.color}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.display_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                          leftIcon={<Edit className="h-4 w-4" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            ruleId: rule.id
                          })}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Excluir Regra"
        message="Tem certeza que deseja excluir esta regra de formatação?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, ruleId: '' })}
      />
    </div>
  );
};
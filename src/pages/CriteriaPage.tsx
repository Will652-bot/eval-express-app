import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SortAsc, Trash2, Edit, FileText, Tag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CriteriaTagManager } from '../components/criteria/CriteriaTagManager';
import { TagCreator } from '../components/criteria/TagCreator';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Criteria {
  id: string;
  name: string;
  min_value: number;
  max_value: number;
  created_at: string;
  tags?: CriterionTag[];
}

interface CriterionTag {
  id: string;
  name: string;
  description: string;
}

export const CriteriaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [tags, setTags] = useState<CriterionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    criteriaId: '',
    criteriaName: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [criteriaRes, tagsRes] = await Promise.all([
        supabase
          .from('criteria')
          .select(`
            *,
            criterion_tag_links(
              tag:criterion_tags(*)
            )
          `)
          .eq('teacher_id', user?.id)
          .order('name', { ascending: sortOrder === 'asc' }),
        supabase
          .from('criterion_tags')
          .select('*')
          .order('name')
      ]);

      if (criteriaRes.error) throw criteriaRes.error;
      if (tagsRes.error) throw tagsRes.error;

      // Process criteria with tags
      const processedCriteria = (criteriaRes.data || []).map(criterion => ({
        ...criterion,
        tags: criterion.criterion_tag_links?.map((link: any) => link.tag).filter(Boolean) || []
      }));

      setCriteria(processedCriteria);
      setTags(tagsRes.data || []);
    } catch (error) {
      console.error('Error fetching criteria:', error);
      toast.error('Erro ao carregar critérios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      criteriaId: id,
      criteriaName: name
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('criteria')
        .delete()
        .eq('id', confirmDialog.criteriaId);

      if (error) throw error;

      toast.success('Critério excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting criteria:', error);
      toast.error('Erro ao excluir critério');
    } finally {
      setConfirmDialog({ isOpen: false, criteriaId: '', criteriaName: '' });
    }
  };

  const handleTagsUpdated = () => {
    fetchData();
  };

  const handleTagCreated = () => {
    fetchData();
  };

  const toggleTagManager = (criterionId: string) => {
    setExpandedCriterion(expandedCriterion === criterionId ? null : criterionId);
  };

  const filteredCriteria = criteria.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTagFilter || 
      c.tags?.some(tag => tag.id === selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Critérios de Avaliação</h1>
          <p className="mt-1 text-gray-500">
            Gerencie os critérios para avaliar seus alunos e organize-os com tags
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/evaluation-titles')}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Gerenciar Títulos e Provas
          </Button>
          <Button
            onClick={() => navigate('/criteria/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Novo Critério
          </Button>
        </div>
      </div>

      {/* Tag Creator Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Tags</h3>
          <TagCreator onTagCreated={handleTagCreated} />
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar critérios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                fullWidth
              />
            </div>
            <div className="flex space-x-2">
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
              >
                <option value="">Todas as tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={toggleSort}
                leftIcon={<SortAsc className="h-4 w-4" />}
              >
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando critérios...</p>
          </div>
        ) : filteredCriteria.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum critério encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCriteria.map((criterion) => (
              <div key={criterion.id} className="space-y-4">
                <div className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {criterion.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Valor: {criterion.min_value} - {criterion.max_value}
                    </p>
                    {criterion.tags && criterion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {criterion.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            title={tag.description}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTagManager(criterion.id)}
                      leftIcon={<Tag className="h-4 w-4" />}
                    >
                      {expandedCriterion === criterion.id ? 'Ocultar' : 'Gerenciar'} Tags
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/criteria/${criterion.id}/edit`)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(criterion.id, criterion.name)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* Tag Manager */}
                {expandedCriterion === criterion.id && (
                  <div className="px-4 pb-4">
                    <CriteriaTagManager
                      criterionId={criterion.id}
                      criterionName={criterion.name}
                      onTagsUpdated={handleTagsUpdated}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Excluir Critério"
        message={`Tem certeza que deseja excluir o critério "${confirmDialog.criteriaName}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, criteriaId: '', criteriaName: '' })}
      />
    </div>
  );
};
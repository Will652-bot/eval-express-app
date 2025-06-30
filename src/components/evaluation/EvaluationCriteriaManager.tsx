import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Search, Save, X, CheckCircle, Circle, History, Tag, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EvaluationTitle {
  id: string;
  title: string;
  teacher_id: string;
  created_at: string;
}

interface Criterion {
  id: string;
  name: string;
  min_value: number;
  max_value: number;
  teacher_id: string;
  tags?: CriterionTag[];
}

interface CriterionTag {
  id: string;
  name: string;
  description: string;
}

interface EvaluationTitleCriteria {
  id: string;
  evaluation_title_id: string;
  criterion_id: string;
  teacher_id: string;
}

interface LogEntry {
  id: string;
  action: 'insert' | 'delete';
  timestamp: string;
  criterion: {
    name: string;
  };
  evaluation_title: {
    title: string;
  };
}

interface AssociationWithDetails {
  id: string;
  evaluation_title_id: string;
  criterion_id: string;
  teacher_id: string;
  evaluation_title: {
    title: string;
  };
  criterion: {
    name: string;
  };
  created_at: string;
}

export const EvaluationCriteriaManager: React.FC = () => {
  const { user } = useAuth();
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [tags, setTags] = useState<CriterionTag[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string>('');
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>([]);
  const [existingAssociations, setExistingAssociations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [lastLogMessage, setLastLogMessage] = useState<string>('');
  const [associations, setAssociations] = useState<AssociationWithDetails[]>([]);
  const [editingAssociation, setEditingAssociation] = useState<string | null>(null);
  const [editCriterionId, setEditCriterionId] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    associationId: '',
    associationTitle: '',
    associationCriterion: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedTitleId) {
      fetchExistingAssociations();
    } else {
      setSelectedCriteriaIds([]);
      setExistingAssociations([]);
    }
  }, [selectedTitleId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [titlesRes, criteriaRes, tagsRes] = await Promise.all([
        supabase
          .from('evaluation_titles')
          .select('*')
          .eq('teacher_id', user?.id)
          .order('title'),
        supabase
          .from('criteria')
          .select(`
            *,
            criterion_tag_links(
              tag:criterion_tags(*)
            )
          `)
          .eq('teacher_id', user?.id)
          .order('name'),
        supabase
          .from('criterion_tags')
          .select('*')
          .order('name')
      ]);

      if (titlesRes.error) throw titlesRes.error;
      if (criteriaRes.error) throw criteriaRes.error;
      if (tagsRes.error) throw tagsRes.error;

      console.log('📊 Données récupérées:', {
        titles: titlesRes.data?.length || 0,
        criteria: criteriaRes.data?.length || 0,
        tags: tagsRes.data?.length || 0
      });

      setEvaluationTitles(titlesRes.data || []);
      
      // Process criteria with tags
      const processedCriteria = (criteriaRes.data || []).map(criterion => ({
        ...criterion,
        tags: criterion.criterion_tag_links?.map((link: any) => link.tag).filter(Boolean) || []
      }));
      
      console.log('🎯 Critères traités:', processedCriteria);
      setCriteria(processedCriteria);
      setTags(tagsRes.data || []);

      // Fetch all associations for display
      await fetchAllAssociations();
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAssociations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_title_criteria')
        .select(`
          *,
          evaluation_title:evaluation_titles(title),
          criterion:criteria(name)
        `)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssociations(data || []);
    } catch (error) {
      console.error('Error fetching associations:', error);
      toast.error('Erro ao carregar associações');
    }
  };

  const fetchExistingAssociations = async () => {
    try {
      console.log('🔍 Recherche des associations existantes pour le titre:', selectedTitleId);
      
      const { data, error } = await supabase
        .from('evaluation_title_criteria')
        .select('criterion_id')
        .eq('evaluation_title_id', selectedTitleId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      const criteriaIds = data?.map(item => item.criterion_id) || [];
      console.log('📋 Associations existantes trouvées:', criteriaIds);
      
      setExistingAssociations(criteriaIds);
      setSelectedCriteriaIds(criteriaIds);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des associations:', error);
      toast.error('Erro ao carregar associações');
    }
  };

  const fetchLog = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_criteria_log')
        .select(`
          *,
          criterion:criteria(name),
          evaluation_title:evaluation_titles(title)
        `)
        .eq('teacher_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogEntries(data || []);
    } catch (error) {
      console.error('Error fetching log:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  const logAction = async (action: 'insert' | 'delete', criterionId: string, evaluationTitleId?: string) => {
    try {
      await supabase
        .from('evaluation_criteria_log')
        .insert({
          teacher_id: user?.id,
          evaluation_title_id: evaluationTitleId || selectedTitleId,
          criterion_id: criterionId,
          action
        });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleCriterionToggle = (criterionId: string) => {
    console.log('🔄 Toggle critère:', criterionId);
    setSelectedCriteriaIds(prev => {
      const newSelection = prev.includes(criterionId)
        ? prev.filter(id => id !== criterionId)
        : [...prev, criterionId];
      
      console.log('📝 Nouvelle sélection:', newSelection);
      return newSelection;
    });
  };

  const handleSaveAssociations = async () => {
    if (!selectedTitleId) {
      toast.error('Selecione um título de avaliação');
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Sauvegarde des associations...');
      console.log('📊 État actuel:', {
        selectedTitleId,
        selectedCriteriaIds,
        existingAssociations
      });

      // Determine which criteria were added and removed
      const addedCriteria = selectedCriteriaIds.filter(id => !existingAssociations.includes(id));
      const removedCriteria = existingAssociations.filter(id => !selectedCriteriaIds.includes(id));

      console.log('➕ Critères ajoutés:', addedCriteria);
      console.log('➖ Critères supprimés:', removedCriteria);

      // 1. Delete existing associations for this title
      const { error: deleteError } = await supabase
        .from('evaluation_title_criteria')
        .delete()
        .eq('evaluation_title_id', selectedTitleId)
        .eq('teacher_id', user?.id);

      if (deleteError) throw deleteError;

      // 2. Insert new associations
      if (selectedCriteriaIds.length > 0) {
        const newAssociations = selectedCriteriaIds.map(criterionId => ({
          evaluation_title_id: selectedTitleId,
          criterion_id: criterionId,
          teacher_id: user?.id
        }));

        console.log('📝 Nouvelles associations à insérer:', newAssociations);

        const { error: insertError } = await supabase
          .from('evaluation_title_criteria')
          .insert(newAssociations);

        if (insertError) throw insertError;
      }

      // 3. Log the actions
      for (const criterionId of addedCriteria) {
        await logAction('insert', criterionId);
      }
      for (const criterionId of removedCriteria) {
        await logAction('delete', criterionId);
      }

      setExistingAssociations(selectedCriteriaIds);
      
      // Set log message for UI feedback
      if (addedCriteria.length > 0 || removedCriteria.length > 0) {
        const actions = [];
        if (addedCriteria.length > 0) actions.push(`${addedCriteria.length} critério(s) adicionado(s)`);
        if (removedCriteria.length > 0) actions.push(`${removedCriteria.length} critério(s) removido(s)`);
        setLastLogMessage(`✅ ${actions.join(' e ')} - registrado no histórico`);
        
        // Clear message after 5 seconds
        setTimeout(() => setLastLogMessage(''), 5000);
      }
      
      // Refresh associations list
      await fetchAllAssociations();
      
      toast.success('Critérios salvos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar associações:', error);
      toast.error('Erro ao salvar critérios');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAssociation = (association: AssociationWithDetails) => {
    setEditingAssociation(association.id);
    setEditCriterionId(association.criterion_id);
  };

  const handleSaveEdit = async (associationId: string) => {
    if (!editCriterionId) {
      toast.error('Selecione um critério');
      return;
    }

    try {
      const association = associations.find(a => a.id === associationId);
      if (!association) return;

      const { error } = await supabase
        .from('evaluation_title_criteria')
        .update({
          criterion_id: editCriterionId
        })
        .eq('id', associationId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      // Log the change
      await logAction('delete', association.criterion_id, association.evaluation_title_id);
      await logAction('insert', editCriterionId, association.evaluation_title_id);

      toast.success('Associação atualizada com sucesso');
      setEditingAssociation(null);
      setEditCriterionId('');
      
      // Refresh data
      await fetchAllAssociations();
      if (selectedTitleId === association.evaluation_title_id) {
        await fetchExistingAssociations();
      }
    } catch (error) {
      console.error('Error updating association:', error);
      toast.error('Erro ao atualizar associação');
    }
  };

  const handleCancelEdit = () => {
    setEditingAssociation(null);
    setEditCriterionId('');
  };

  const handleDeleteAssociation = (association: AssociationWithDetails) => {
    setConfirmDialog({
      isOpen: true,
      associationId: association.id,
      associationTitle: association.evaluation_title.title,
      associationCriterion: association.criterion.name
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const association = associations.find(a => a.id === confirmDialog.associationId);
      if (!association) return;

      const { error } = await supabase
        .from('evaluation_title_criteria')
        .delete()
        .eq('id', confirmDialog.associationId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      // Log the deletion
      await logAction('delete', association.criterion_id, association.evaluation_title_id);

      toast.success('Associação excluída com sucesso');
      
      // Refresh data
      await fetchAllAssociations();
      if (selectedTitleId === association.evaluation_title_id) {
        await fetchExistingAssociations();
      }
    } catch (error) {
      console.error('Error deleting association:', error);
      toast.error('Erro ao excluir associação');
    } finally {
      setConfirmDialog({
        isOpen: false,
        associationId: '',
        associationTitle: '',
        associationCriterion: ''
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedTitleId('');
    setSelectedCriteriaIds([]);
    setExistingAssociations([]);
    setLastLogMessage('');
  };

  const handleShowLog = () => {
    setShowLog(!showLog);
    if (!showLog) {
      fetchLog();
    }
  };

  // ✅ CORRECTION: Filtrage des critères disponibles
  const filteredCriteria = criteria.filter(criterion => {
    const matchesSearch = criterion.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTagFilter || 
      criterion.tags?.some(tag => tag.id === selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  console.log('🔍 Critères filtrés disponibles:', {
    total: criteria.length,
    filtered: filteredCriteria.length,
    searchTerm,
    selectedTagFilter
  });

  const selectedTitle = evaluationTitles.find(title => title.id === selectedTitleId);
  
  // ✅ CORRECTION: Vérifier s'il y a des changements par rapport à l'état sauvé
  const hasChanges = JSON.stringify([...selectedCriteriaIds].sort()) !== JSON.stringify([...existingAssociations].sort());

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Critérios por Título</h2>
          <p className="mt-1 text-gray-500">
            Associe critérios específicos aos títulos de avaliação
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleShowLog}
          leftIcon={<History className="h-4 w-4" />}
        >
          {showLog ? 'Ocultar' : 'Ver'} Histórico
        </Button>
      </div>

      {/* Log Message */}
      {lastLogMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">{lastLogMessage}</p>
        </div>
      )}

      {/* Log Panel */}
      {showLog && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Histórico de Associações
            </h3>
            
            {logEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma ação registrada</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border ${
                      entry.action === 'insert' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${
                          entry.action === 'insert' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {entry.action === 'insert' ? '➕ Adicionado' : '➖ Removido'}
                        </span>
                        <p className="text-sm text-gray-600">
                          Critério: <strong>{entry.criterion.name}</strong>
                        </p>
                        <p className="text-sm text-gray-600">
                          Título: <strong>{entry.evaluation_title.title}</strong>
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Associations Management */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Associações Existentes
          </h3>
          
          {associations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma associação encontrada</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {associations.map((association) => (
                <div
                  key={association.id}
                  className="p-3 rounded-lg border bg-white hover:bg-gray-50"
                >
                  {editingAssociation === association.id ? (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título da Avaliação
                          </label>
                          <input
                            type="text"
                            value={association.evaluation_title.title}
                            disabled
                            className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Critério
                          </label>
                          <select
                            value={editCriterionId}
                            onChange={(e) => setEditCriterionId(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                          >
                            <option value="">Selecione um critério</option>
                            {criteria.map((criterion) => (
                              <option key={criterion.id} value={criterion.id}>
                                {criterion.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(association.id)}
                          leftIcon={<Save className="h-3 w-3" />}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          leftIcon={<X className="h-3 w-3" />}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <strong>Título:</strong> {association.evaluation_title.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Critério:</strong> {association.criterion.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criado em: {new Date(association.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditAssociation(association)}
                          leftIcon={<Edit className="h-3 w-3" />}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAssociation(association)}
                          leftIcon={<Trash2 className="h-3 w-3" />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Títulos de Avaliação */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Títulos de Avaliação
            </h3>
            
            {evaluationTitles.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum título encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Crie títulos na página "Títulos da Avaliação"
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {evaluationTitles.map((title) => (
                  <div
                    key={title.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTitleId === title.id
                        ? 'bg-primary-50 border-primary-200 text-primary-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTitleId(title.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{title.title}</span>
                      {selectedTitleId === title.id && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Critérios */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Critérios Disponíveis
              </h3>
              {selectedTitleId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Limpar
                </Button>
              )}
            </div>

            {!selectedTitleId ? (
              <div className="text-center py-12">
                <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Selecione um título de avaliação</p>
                <p className="text-sm text-gray-400 mt-1">
                  para gerenciar seus critérios
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  <Input
                    type="search"
                    placeholder="Buscar critérios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    fullWidth
                  />
                  
                  {/* Tag Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Filtrar por tag:
                    </label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
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
                  </div>
                </div>

                {/* ✅ CORRECTION: Affichage conditionnel amélioré */}
                {criteria.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Nenhum critério encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Crie critérios na página "Critérios de Avaliação"
                    </p>
                  </div>
                ) : filteredCriteria.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      {searchTerm || selectedTagFilter 
                        ? 'Nenhum critério corresponde aos filtros aplicados'
                        : 'Nenhum critério disponível'
                      }
                    </p>
                    {(searchTerm || selectedTagFilter) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedTagFilter('');
                        }}
                        className="mt-2"
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredCriteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCriteriaIds.includes(criterion.id)
                            ? 'bg-success-50 border-success-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleCriterionToggle(criterion.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {criterion.name}
                            </span>
                            <p className="text-sm text-gray-500">
                              {criterion.min_value} - {criterion.max_value}
                            </p>
                            {criterion.tags && criterion.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {criterion.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedCriteriaIds.includes(criterion.id) ? (
                            <CheckCircle className="h-5 w-5 text-success-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Status e Ações */}
      {selectedTitleId && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedTitle?.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCriteriaIds.length} critério(s) selecionado(s)
                  {existingAssociations.length > 0 && (
                    <span className="ml-2">
                      • {existingAssociations.length} salvo(s) anteriormente
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {hasChanges && (
                  <span className="text-sm text-warning-600 font-medium">
                    Alterações não salvas
                  </span>
                )}
                <Button
                  onClick={handleSaveAssociations}
                  isLoading={saving}
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={!hasChanges}
                >
                  Salvar Critérios
                </Button>
              </div>
            </div>

            {selectedCriteriaIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Critérios Selecionados:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedCriteriaIds.map(criterionId => {
                    const criterion = criteria.find(c => c.id === criterionId);
                    return criterion ? (
                      <span
                        key={criterionId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {criterion.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Excluir Associação"
        message={`Tem certeza que deseja excluir a associação entre "${confirmDialog.associationTitle}" e "${confirmDialog.associationCriterion}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({
          isOpen: false,
          associationId: '',
          associationTitle: '',
          associationCriterion: ''
        })}
      />
    </div>
  );
};
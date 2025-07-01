import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FileText, Eye, Download, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EvaluationTitle {
  id: string;
  title: string;
  teacher_id: string;
}

interface EvaluationAttachment {
  id: string;
  evaluation_title_id: string;
  teacher_id: string;
  class_id: string;
  file_path: string;
  created_at?: string;
  class?: {
    name: string;
  };
}

export const EvaluationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<any>(null);
  const [selectedEvaluationTitleId, setSelectedEvaluationTitleId] = useState('');
  const [attachedPDF, setAttachedPDF] = useState<EvaluationAttachment | null>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  
  // Multiple evaluations state
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');

  // État pour contrôler si on doit montrer le champ titre
  const [showTitleField, setShowTitleField] = useState(false);
  const [evaluationTitleName, setEvaluationTitleName] = useState('');

  // Delete confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const isEditing = !!id;

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        fetchClasses(),
        fetchCriteria(),
        fetchEvaluationTitles()
      ]);
      
      if (isEditing) {
        await fetchEvaluation();
      }
    };

    initialize();
  }, [id]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    const criterion = availableCriteria.find(c => c.id === evaluations[0]?.criterion_id);
    setSelectedCriterion(criterion);
  }, [evaluations, availableCriteria]);

  // Filter criteria based on selected evaluation title
  useEffect(() => {
    if (selectedEvaluationTitleId) {
      fetchCriteriaForTitle(selectedEvaluationTitleId);
    } else {
      setAvailableCriteria(criteria);
    }
  }, [selectedEvaluationTitleId, criteria]);

  // Check for attached PDF when evaluation title changes
  useEffect(() => {
    if (selectedEvaluationTitleId && selectedClass) {
      checkForAttachedPDF();
    } else {
      setAttachedPDF(null);
    }
  }, [selectedEvaluationTitleId, selectedClass]);

  // Auto-remplissage du champ Título baseado no evaluation_title selecionado
  useEffect(() => {
    if (selectedEvaluationTitleId && !isEditing) {
      const selectedEvaluationTitle = evaluationTitles.find(
        evalTitle => evalTitle.id === selectedEvaluationTitleId
      );
      
      if (selectedEvaluationTitle) {
        setEvaluationTitleName(selectedEvaluationTitle.title);
        setShowTitleField(false); // Não mostrar campo editável quando há evaluation_title_id
      }
    } else if (!selectedEvaluationTitleId && !isEditing) {
      setEvaluationTitleName('');
      setShowTitleField(true); // Mostrar campo editável quando não há evaluation_title_id
    }
  }, [selectedEvaluationTitleId, evaluationTitles, isEditing]);

  // Controlar visibilidade do campo título na edição
  useEffect(() => {
    if (isEditing && selectedEvaluationTitleId) {
      const selectedEvaluationTitle = evaluationTitles.find(
        evalTitle => evalTitle.id === selectedEvaluationTitleId
      );
      
      if (selectedEvaluationTitle) {
        setEvaluationTitleName(selectedEvaluationTitle.title);
        setShowTitleField(false); // Não mostrar campo editável
      }
    } else if (isEditing && !selectedEvaluationTitleId) {
      setShowTitleField(true); // Mostrar campo editável para avaliações legacy
    }
  }, [isEditing, selectedEvaluationTitleId, evaluationTitles]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Erro ao carregar turmas');
    }
  };

  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
      
      // Initialize evaluations for all students
      if (!isEditing) {
        const initialEvaluations = data?.map(student => ({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          criterion_id: '',
          value: ''
        })) || [];
        
        setEvaluations(initialEvaluations);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (error) throw error;
      setCriteria(data || []);
      setAvailableCriteria(data || []);
    } catch (error) {
      console.error('Error fetching criteria:', error);
      toast.error('Erro ao carregar critérios');
    }
  };

  const fetchCriteriaForTitle = async (titleId: string) => {
    try {
      const { data, error } = await supabase
        .from('evaluation_title_criteria')
        .select(`
          criterion_id,
          criteria:criteria(*)
        `)
        .eq('evaluation_title_id', titleId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      const titleCriteria = data?.map(item => item.criteria).filter(Boolean) || [];
      
      if (titleCriteria.length > 0) {
        setAvailableCriteria(titleCriteria);
      } else {
        // If no criteria are associated with this title, show all criteria
        setAvailableCriteria(criteria);
      }
    } catch (error) {
      console.error('Error fetching criteria for title:', error);
      // Fallback to all criteria if there's an error
      setAvailableCriteria(criteria);
    }
  };

  const fetchEvaluationTitles = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_titles')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('title');

      if (error) throw error;
      setEvaluationTitles(data || []);
    } catch (error) {
      console.error('Error fetching evaluation titles:', error);
      toast.error('Erro ao carregar títulos de avaliação');
    }
  };

  const checkForAttachedPDF = async () => {
    try {
      setLoadingPDF(true);
      const { data, error } = await supabase
        .from('evaluation_attachments')
        .select('*, class:classes(name)')
        .eq('evaluation_title_id', selectedEvaluationTitleId)
        .eq('class_id', selectedClass)
        .eq('teacher_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      setAttachedPDF(data);
    } catch (error) {
      console.error('Error checking for attached PDF:', error);
      toast.error('Erro ao verificar anexos');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleViewPDF = async () => {
    if (!attachedPDF) return;

    try {
      const { data, error } = await supabase.storage
        .from('evaluation-attachments')
        .createSignedUrl(attachedPDF.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Erro ao visualizar PDF');
    }
  };

  const handleDownloadPDF = async () => {
    if (!attachedPDF) return;

    try {
      toast.loading('Preparando download...');
      
      const { data, error } = await supabase.storage
        .from('evaluation-attachments')
        .download(attachedPDF.file_path);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachedPDF.file_path.split('/').pop() || 'documento.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Download concluído');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Erro ao baixar PDF');
    }
  };

  const fetchEvaluation = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          student:students(
            id,
            first_name,
            last_name,
            class_id
          ),
          evaluation_title:evaluation_titles(title)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        // Usar evaluation_title.title se disponível, senão usar title legacy
        const displayTitle = data.evaluation_title?.title || '';
        setDate(new Date(data.date).toISOString().split('T')[0]);
        setComments(data.comments || '');
        setSelectedClass(data.class_id);
        setSelectedEvaluationTitleId(data.evaluation_title_id || '');
        
        // Definir se deve mostrar campo título baseado na presença de evaluation_title_id
        if (data.evaluation_title_id) {
          setEvaluationTitleName(data.evaluation_title?.title || '');
          setShowTitleField(false);
        } else {
          setShowTitleField(true);
        }
        
        // We'll need to fetch all students for this class to show the full grid
        const { data: classStudents, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', data.class_id)
          .order('first_name');
          
        if (studentsError) throw studentsError;
        
        // Now fetch all evaluations for this class, date and criterion
        const { data: existingEvaluations, error: evalError } = await supabase
          .from('evaluations')
          .select(`
            *,
            student:students(
              id,
              first_name,
              last_name
            )
          `)
          .eq('class_id', data.class_id)
          .eq('criterion_id', data.criterion_id)
          .eq('date', data.date);
          
        if (evalError) throw evalError;
        
        // Create the evaluations array with all students
        const evaluationsMap = new Map();
        existingEvaluations?.forEach(evaluation => {
          evaluationsMap.set(evaluation.student_id, {
            id: evaluation.id,
            student_id: evaluation.student_id,
            student_name: `${evaluation.student.first_name} ${evaluation.student.last_name}`,
            criterion_id: evaluation.criterion_id,
            value: evaluation.value?.toString() || '',
          });
        });
        
        const allEvaluations = classStudents?.map(student => {
          const existing = evaluationsMap.get(student.id);
          if (existing) return existing;
          
          return {
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            criterion_id: data.criterion_id,
            value: ''
          };
        }) || [];
        
        setEvaluations(allEvaluations);
      }
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      toast.error('Erro ao carregar avaliação');
      navigate('/evaluations');
    }
  };

  const handleCriterionChange = (criterionId: string) => {
    const criterion = availableCriteria.find(c => c.id === criterionId);
    setSelectedCriterion(criterion);
    
    setEvaluations(prev => 
      prev.map(evaluation => ({
        ...evaluation,
        criterion_id: criterionId,
        value: evaluation.criterion_id !== criterionId ? '' : evaluation.value
      }))
    );
  };

  const handleValueChange = (studentId: string, value: string) => {
    setEvaluations(prev => 
      prev.map(evaluation => 
        evaluation.student_id === studentId 
          ? { ...evaluation, value } 
          : evaluation
      )
    );
  };

  const validateForm = () => {
    if (!selectedClass) {
      toast.error('Selecione uma turma');
      return false;
    }

    if (!selectedEvaluationTitleId) {
      toast.error('Selecione um título de avaliação');
      return false;
    }

    if (!date) {
      toast.error('Informe uma data para a avaliação');
      return false;
    }

    const criterionId = evaluations[0]?.criterion_id;
    if (!criterionId) {
      toast.error('Selecione um critério');
      return false;
    }

    // Check if at least one student has a value
    const hasValues = evaluations.some(evaluation => evaluation.value && evaluation.value.trim() !== '');
    if (!hasValues) {
      toast.error('Informe pelo menos um valor de avaliação');
      return false;
    }

    // Validate values against criterion min/max
    if (selectedCriterion) {
      const invalidValues = evaluations
        .filter(evaluation => evaluation.value && evaluation.value.trim() !== '')
        .filter(evaluation => {
          const value = parseFloat(evaluation.value);
          return isNaN(value) || 
                 value < selectedCriterion.min_value || 
                 value > selectedCriterion.max_value;
        });
      
      if (invalidValues.length > 0) {
        toast.error(`Alguns valores estão fora do intervalo permitido (${selectedCriterion.min_value} - ${selectedCriterion.max_value})`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Filter out evaluations with no values
      const evaluationsToSave = evaluations
        .filter(evaluation => evaluation.value && evaluation.value.trim() !== '')
        .map(evaluation => {
          const baseEvaluation = {
            date,
            comments,
            class_id: selectedClass,
            teacher_id: user?.id,
            student_id: evaluation.student_id,
            criterion_id: evaluation.criterion_id,
            value: parseFloat(evaluation.value),
            evaluation_title_id: selectedEvaluationTitleId
          };

          if (evaluation.id) {
            return { ...baseEvaluation, id: evaluation.id };
          }

          return baseEvaluation;
        });

      if (isEditing) {
        // For editing, we need to handle updates and inserts separately
        const toUpdate = evaluationsToSave.filter(evaluation => 'id' in evaluation);
        if (toUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('evaluations')
            .upsert(toUpdate);

          if (updateError) throw updateError;
        }
        
        const toInsert = evaluationsToSave.filter(evaluation => !('id' in evaluation));
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('evaluations')
            .insert(toInsert);

          if (insertError) throw insertError;
        }
        
        toast.success('Avaliações atualizadas com sucesso');
      } else {
        const { error } = await supabase
          .from('evaluations')
          .insert(evaluationsToSave);

        if (error) throw error;
        toast.success('Avaliações criadas com sucesso');
      }

      navigate('/evaluations');
    } catch (error) {
      console.error('Error saving evaluations:', error);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Avaliação',
      message: `Tem certeza que deseja excluir a avaliação "${evaluationTitleName}"? Esta ação não pode ser desfeita e excluirá todas as avaliações associadas.`
    });
  };

  const handleConfirmDelete = async () => {
    if (!isEditing || !id) return;

    setDeleting(true);
    try {
      // Get the evaluation data to find related evaluations
      const { data: evaluationData, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Verify that the evaluation belongs to the current user (security check)
      if (evaluationData.teacher_id !== user?.id) {
        toast.error('Você não tem permissão para excluir esta avaliação');
        return;
      }

      // Delete all evaluations with the same date, criterion, and class
      // This handles both evaluation_title_id and legacy title matching
      let deleteQuery = supabase
        .from('evaluations')
        .delete()
        .eq('date', evaluationData.date)
        .eq('criterion_id', evaluationData.criterion_id)
        .eq('class_id', evaluationData.class_id)
        .eq('teacher_id', user?.id); // Security check

      // Handle both new evaluation_title_id and legacy title matching
      if (evaluationData.evaluation_title_id) {
        deleteQuery = deleteQuery.eq('evaluation_title_id', evaluationData.evaluation_title_id);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) throw deleteError;

      toast.success('Avaliação excluída com sucesso');
      navigate('/evaluations');
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error('Erro ao excluir avaliação');
    } finally {
      setDeleting(false);
      setConfirmDialog({ isOpen: false, title: '', message: '' });
    }
  };

  // Sort evaluations by whether they have a value
  const sortedEvaluations = [...evaluations].sort((a, b) => {
    const aHasValue = a.value && a.value.trim() !== '' && a.value !== '0-10';
    const bHasValue = b.value && b.value.trim() !== '' && b.value !== '0-10';
    if (aHasValue && !bHasValue) return -1;
    if (!aHasValue && bHasValue) return 1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Avaliações' : 'Novas Avaliações'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing
            ? 'Atualize as informações das avaliações'
            : 'Preencha as informações para criar múltiplas avaliações'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Turma
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                }}
                required
                disabled={isEditing}
              >
                <option value="">Selecione uma turma</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Título da Avaliação
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={selectedEvaluationTitleId}
                onChange={(e) => setSelectedEvaluationTitleId(e.target.value)}
                required
              >
                <option value="">Selecione um título</option>
                {evaluationTitles.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.title}
                  </option>
                ))}
              </select>
              {selectedEvaluationTitleId && availableCriteria.length < criteria.length && (
                <p className="text-xs text-blue-600 mt-1">
                  ℹ️ Critérios filtrados baseados no título selecionado
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evaluationTitleName && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Título da Avaliação Selecionado
                </label>
                <div className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                  {evaluationTitleName}
                </div>
                <p className="text-xs text-gray-500">
                  Título definido pelo "Título da Avaliação" selecionado
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Critério
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={evaluations[0]?.criterion_id || ''}
                onChange={(e) => handleCriterionChange(e.target.value)}
                required
                disabled={isEditing && evaluations.length > 0}
              >
                <option value="">Selecione um critério</option>
                {availableCriteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.min_value} - {c.max_value})
                  </option>
                ))}
              </select>
              {availableCriteria.length === 0 && (
                <p className="text-sm text-error-600">
                  Nenhum critério encontrado.{' '}
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => navigate('/criteria/new')}
                  >
                    Criar critério
                  </Button>
                </p>
              )}
            </div>
          </div>

          {/* PDF Attachment Indicator */}
          {loadingPDF ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent mr-2"></div>
              <p className="text-sm text-gray-600">Verificando anexos...</p>
            </div>
          ) : attachedPDF ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      PDF da Prova Anexado
                    </p>
                    <p className="text-xs text-blue-700">
                      {attachedPDF.file_path.split('/').pop()}
                    </p>
                    <p className="text-xs text-blue-600">
                      Turma: {attachedPDF.class?.name}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewPDF}
                    leftIcon={<Eye className="h-4 w-4" />}
                  >
                    Visualizar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedEvaluationTitleId && selectedClass ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                Não há PDF anexado para esta combinação de título e turma.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comentários
            </label>
            <textarea
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {selectedClass && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Avaliações dos Alunos</h3>
              
              {loadingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-gray-500">Carregando alunos...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Nenhum aluno encontrado nesta turma.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate(`/classes/${selectedClass}/students/new`)}
                  >
                    Adicionar aluno
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aluno
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedEvaluations.map((evaluation) => {
                        const hasValue = evaluation.value && evaluation.value.trim() !== '' && evaluation.value !== '0-10';
                        return (
                          <tr key={evaluation.student_id}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${hasValue ? 'font-bold' : ''} text-gray-900`}>
                              {evaluation.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">
                              <input
                                type="number"
                                step="0.1"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                                value={evaluation.value}
                                onChange={(e) => handleValueChange(evaluation.student_id, e.target.value)}
                                min={selectedCriterion?.min_value}
                                max={selectedCriterion?.max_value}
                                placeholder={selectedCriterion ? `${selectedCriterion.min_value}-${selectedCriterion.max_value}` : ''}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Delete button - only show when editing */}
            {isEditing && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteClick}
                isLoading={deleting}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Excluir Avaliação
              </Button>
            )}
            
            <div className={`flex space-x-3 ${!isEditing ? 'ml-auto' : ''}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/evaluations')}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={loading}>
                {isEditing ? 'Salvar Alterações' : 'Criar Avaliações'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};
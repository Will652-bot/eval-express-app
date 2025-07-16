import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FileText, Eye, Download, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext'; 
import toast from 'react-hot-toast';
// import { v4 as uuidv4 } from 'uuid'; // <-- ASSUREZ-VOUS QUE CETTE LIGNE EST COMMENTÉE OU SUPPRIMÉE

// Interface for evaluation titles
interface EvaluationTitle {
  id: string;
  title: string;
  teacher_id: string;
}

// Interface for evaluation attachments (PDFs)
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

// New interface for student evaluation data, including comments
interface StudentEvaluationData {
  id?: string; 
  student_id: string;
  student_name: string;
  criterion_id: string;
  value: string;
  comments: string;
}

export const EvaluationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { user } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [attachedPDF, setAttachedPDF] = useState<EvaluationAttachment | null>(null);

  // Form input states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<any>(null); 
  const [selectedEvaluationTitleId, setSelectedEvaluationTitleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Multiple evaluations state - now includes 'comments' for each student
  const [evaluations, setEvaluations] = useState<StudentEvaluationData[]>([]);

  // State for evaluation title display
  const [showTitleField, setShowTitleField] = useState(false);
  const [evaluationTitleName, setEvaluationTitleName] = useState('');

  // Delete confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const isEditing = !!id;

  // --- Fonctions de gestion des changements de valeur et de commentaire (utilisent useCallback) ---
  const handleValueChange = useCallback((studentId: string, value: string) => {
    setEvaluations(prev =>
      prev.map(evaluation =>
        evaluation.student_id === studentId
          ? { ...evaluation, value }
          : evaluation
      )
    );
  }, []); 

  const handleCommentChange = useCallback((studentId: string, comment: string) => {
    setEvaluations(prev =>
      prev.map(evaluation =>
        evaluation.student_id === studentId
          ? { ...evaluation, comments: comment }
          : evaluation
      )
    );
  }, []); 
  // --- FIN Fonctions de gestion ---


  // --- Fonctions de récupération de données (TOUTES en useCallback pour la stabilité) ---
  const fetchClasses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error.message);
      toast.error('Erro ao carregar turmas');
    }
  }, [user?.id, supabase]); 

  const fetchCriteria = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');
      if (error) throw error;
      setCriteria(data || []);
      setAvailableCriteria(data || []);
    }
    catch (error: any) {
      console.error('Error fetching criteria:', error.message);
      toast.error('Erro ao carregar critérios');
    }
  }, [user?.id, supabase]); 

  const fetchEvaluationTitles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_titles')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('title');
      if (error) throw error;
      setEvaluationTitles(data || []);
    } catch (error: any) {
      console.error('Error fetching evaluation titles:', error.message);
      toast.error('Erro ao carregar títulos de avaliação');
    }
  }, [user?.id, supabase]); 

  const fetchCriteriaForTitle = useCallback(async (titleId: string) => {
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
        setAvailableCriteria(criteria); 
      }
    } catch (error: any) {
      console.error('Error fetching criteria for title:', error.message);
      setAvailableCriteria(criteria);
    }
  }, [user?.id, criteria, supabase]); 

  const checkForAttachedPDF = useCallback(async () => {
    try {
      setLoadingPDF(true);
      const { data, error } = await supabase
        .from('evaluation_attachments')
        .select('*, class:classes(name)')
        .eq('evaluation_title_id', selectedEvaluationTitleId)
        .eq('class_id', selectedClass)
        .eq('teacher_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setAttachedPDF(data);
    }
    catch (error: any) {
      console.error('Error checking for attached PDF:', error.message);
      toast.error('Erro ao verificar anexos');
    } finally {
      setLoadingPDF(false);
    }
  }, [selectedEvaluationTitleId, selectedClass, user?.id, supabase]); 

  const fetchStudents = useCallback(async (classId: string) => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', classId)
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);

      if (data) {
        const initialEvaluations: StudentEvaluationData[] = data.map(student => ({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          criterion_id: selectedCriterion?.id || '', 
          value: '',
          comments: ''
        }));
        setEvaluations(initialEvaluations);
      } else if (!data || data.length === 0) {
        setEvaluations([]);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error.message);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedCriterion?.id, supabase, setEvaluations]); 

  const fetchEvaluation = useCallback(async (evaluationId: string) => { 
    setLoading(true);
    try {
      const { data: singleEvaluationRecord, error: singleFetchError } = await supabase
          .from('evaluations')
          .select(`date, class_id, criterion_id, evaluation_title_id`)
          .eq('id', evaluationId)
          .eq('teacher_id', user?.id)
          .single();

      if (singleFetchError) {
          console.error('Error fetching single evaluation record to identify group:', singleFetchError.message);
          toast.error('Avaliação não encontrada ou sem permissão.');
          navigate('/evaluations');
          return;
      }

      const { date: groupDate, class_id: groupClassId, criterion_id: groupCriterionId, evaluation_title_id: groupEvaluationTitleId } = singleEvaluationRecord;

      setDate(new Date(groupDate).toISOString().split('T')[0]);
      setSelectedClass(groupClassId);
      setSelectedEvaluationTitleId(groupEvaluationTitleId || '');

      await fetchStudents(groupClassId); 

      const { data: existingEvaluations, error: evalError } = await supabase
          .from('evaluations')
          .select(`id, student_id, value, comments`)
          .eq('class_id', groupClassId)
          .eq('criterion_id', groupCriterionId)
          .eq('date', groupDate) 
          .eq('teacher_id', user?.id);

      if (evalError) throw evalError;

      setEvaluations(currentEvaluations => {
        const evaluationsMap = new Map<string, Omit<StudentEvaluationData, 'student_name'>>();
        existingEvaluations?.forEach(evaluation => {
            evaluationsMap.set(evaluation.student_id, {
                id: evaluation.id,
                student_id: evaluation.student_id,
                criterion_id: groupCriterionId,
                value: evaluation.value?.toString() || '',
                comments: evaluation.comments || ''
            });
        });

        return (currentEvaluations || []).map(studentEval => {
          const existing = evaluationsMap.get(studentEval.student_id);
          return {
            ...studentEval, 
            criterion_id: existing?.criterion_id || groupCriterionId, 
            value: existing?.value || '',
            comments: existing?.comments || '',
            id: existing?.id 
          };
        });
      });

    } catch (error: any) {
      console.error('Error fetching evaluation group:', error.message);
      toast.error('Erro ao carregar avaliação. Redireccionando...');
      navigate('/evaluations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate, supabase, fetchStudents, setEvaluations]); 
  // --- FIN Fonctions de récupération de données ---


  // --- useEffects pour le chargement des données et la logique du formulaire ---

  // Effet pour l'initialisation générale et le chargement d'évaluation en mode édition
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchClasses(), 
          fetchCriteria(),
          fetchEvaluationTitles()
        ]);

        if (isEditing) {
          if (id) {
            await fetchEvaluation(id); 
          } else {
            console.error("Erreur: isEditing est vrai mais l'ID de l'évaluation est manquant dans les paramètres de l'URL.");
            toast.error("Erro ao carregar avaliação: ID ausente.");
            navigate('/evaluations'); 
          }
        } 
      } catch (err: any) {
        console.error("Erreur d'initialisation du formulário:", err.message);
        toast.error('Erro ao iniciar formulário.');
        navigate('/evaluations');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [id, user?.id, isEditing, navigate, fetchClasses, fetchCriteria, fetchEvaluationTitles, fetchEvaluation]); 


  // Effet pour charger les étudiants quand la classe sélectionnée change
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass); 
    } else {
      setStudents([]);
      if (!isEditing) { 
        setEvaluations([]); 
      }
    }
  }, [selectedClass, isEditing, fetchStudents]); 


  // Effet pour définir le critère sélectionné (principalement en mode édition)
  // et s'assurer que availableCriteria est prêt.
  useEffect(() => {
    if (evaluations.length > 0 && evaluations[0]?.criterion_id && availableCriteria.length > 0) {
      const criterion = availableCriteria.find(c => c.id === evaluations[0].criterion_id);
      setSelectedCriterion(criterion || null);
    } else if (evaluations.length === 0) {
      setSelectedCriterion(null);
    }
  }, [evaluations, availableCriteria]);


  // Effet pour filtrer les critères basés sur le titre d'évaluation sélectionné
  useEffect(() => {
    if (selectedEvaluationTitleId) {
      fetchCriteriaForTitle(selectedEvaluationTitleId); 
    } else {
      setAvailableCriteria(criteria);
    }
  }, [selectedEvaluationTitleId, criteria, fetchCriteriaForTitle]); 


  // Effet pour vérifier et afficher le PDF attaché
  useEffect(() => {
    if (selectedEvaluationTitleId && selectedClass) {
      checkForAttachedPDF(); 
    } else {
      setAttachedPDF(null);
    }
  }, [selectedEvaluationTitleId, selectedClass, user?.id, checkForAttachedPDF]); 


  // Effet pour auto-remplir le nom du titre d'évaluation affiché
  useEffect(() => {
    if (selectedEvaluationTitleId && !isEditing) {
      const selectedEvaluationTitle = evaluationTitles.find(
        evalTitle => evalTitle.id === selectedEvaluationTitleId
      );

      if (selectedEvaluationTitle) {
        setEvaluationTitleName(selectedEvaluationTitle.title);
        setShowTitleField(false);
      }
    } else if (!selectedEvaluationTitleId && !isEditing) {
      setEvaluationTitleName('');
      setShowTitleField(true);
    }
  }, [selectedEvaluationTitleId, evaluationTitles, isEditing]);


  // Effet pour contrôler la visibilité du champ de titre en mode édition
  useEffect(() => {
    if (isEditing && selectedEvaluationTitleId) {
      const selectedEvaluationTitle = evaluationTitles.find(
        evalTitle => evalTitle.id === selectedEvaluationTitleId
      );

      if (selectedEvaluationTitle) {
        setEvaluationTitleName(selectedEvaluationTitle.title);
        setShowTitleField(false);
      }
    } else if (isEditing && !selectedEvaluationTitleId) {
      setShowTitleField(true);
    }
  }, [isEditing, selectedEvaluationTitleId, evaluationTitles]);


  // NOUVEL Effet : Récupérer et pré-remplir les évaluations existantes pour le mode "Nouvelle Évaluation"
  useEffect(() => {
    if (isEditing || !user || !selectedClass || !selectedCriterion?.id || !selectedEvaluationTitleId || students.length === 0) {
        return; 
    }

    setLoadingStudents(true); 
    const fetchExistingEvalsForPreFill = async () => {
      try {
        const { data: existingEvals, error } = await supabase
          .from('evaluations')
          .select(`id, student_id, value, comments, date`) 
          .eq('class_id', selectedClass)
          .eq('criterion_id', selectedCriterion.id)
          .eq('evaluation_title_id', selectedEvaluationTitleId)
          .eq('teacher_id', user.id)
          .order('date', { ascending: false }) 
          .order('created_at', { ascending: false });

        if (error) throw error;

        const existingEvalsMap = new Map<string, Pick<StudentEvaluationData, 'id' | 'value' | 'comments'>>();
        existingEvals?.forEach(evalItem => {
            if (!existingEvalsMap.has(evalItem.student_id)) { 
                existingEvalsMap.set(evalItem.student_id, {
                    id: evalItem.id,
                    value: evalItem.value?.toString() || '',
                    comments: evalItem.comments || ''
                });
            }
        });

        setEvaluations(currentEvaluations => {
            if (!currentEvaluations || currentEvaluations.length === 0) {
                return students.map(student => {
                    const existing = existingEvalsMap.get(student.id);
                    return {
                        student_id: student.id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        criterion_id: selectedCriterion.id,
                        value: existing?.value || '',
                        comments: existing?.comments || '',
                        id: existing?.id
                    };
                });
            }

            return currentEvaluations.map(evaluation => {
                const existing = existingEvalsMap.get(evaluation.student_id);
                if (existing) {
                    return {
                        ...evaluation,
                        value: existing.value,
                        comments: existing.comments,
                        id: existing.id 
                    };
                }
                return evaluation; 
            });
        });

      } catch (error: any) {
        console.error('Error fetching existing evaluations for pre-fill:', error.message);
        toast.error('Erro ao pré-carregar avaliações existentes.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchExistingEvalsForPreFill();
  }, [user, isEditing, selectedClass, selectedCriterion, selectedEvaluationTitleId, students, supabase, setEvaluations]);

  // --- FIN useEffects ---


  // Handles viewing the attached PDF in a new tab
  const handleViewPDF = async () => {
    if (!attachedPDF) return;

    try {
      const { data, error } = await supabase.storage
        .from('evaluation-attachments')
        .createSignedUrl(attachedPDF.file_path, 3600); 

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing PDF:', error.message);
      toast.error('Erro ao visualizar PDF');
    }
  };

  // Handles downloading the attached PDF
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
    } catch (error: any) {
      console.error('Error downloading PDF:', error.message);
      toast.dismiss();
      toast.error('Erro ao baixar PDF');
    }
  };

  // Handles change in selected criterion
  const handleCriterionChange = (criterionId: string) => {
    const criterion = availableCriteria.find(c => c.id === criterionId);
    setSelectedCriterion(criterion); 

    setEvaluations(prev =>
      prev.map(evaluation => ({
        ...evaluation,
        criterion_id: criterionId,
        value: evaluation.criterion_id !== criterionId ? '' : evaluation.value,
        comments: evaluation.criterion_id !== criterionId ? '' : evaluation.comments
      }))
    );
  };

  // Validates the form inputs before submission
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
    
    if (!selectedCriterion || !selectedCriterion.id) {
        toast.error('Selecione un critère valide.');
        return false;
    }

    const hasCorrectCriterionId = evaluations.every(evalItem => evalItem.criterion_id === selectedCriterion.id);
    if (!hasCorrectCriterionId) {
        toast.error('O ID do critère não corresponde para todas as avaliações. Por favor, selecione o critère novamente.');
        return false;
    }

    const hasValues = evaluations.some(evaluation => evaluation.value && evaluation.value.trim() !== '');
    if (!hasValues) {
      toast.error('Informe pelo menos um valor de avaliação');
      return false;
    }

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

  // Handles form submission (create or update evaluations)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const evaluationsToSave = evaluations
        .filter(evaluation => evaluation.value && evaluation.value.trim() !== '')
        .map(evaluation => {
          const finalCriterionId = selectedCriterion?.id; 
          if (!finalCriterionId) {
              throw new Error("Criterion ID is missing during submission. This should be caught by validation.");
          }

          const baseEvaluation: any = { 
            date,
            comments: evaluation.comments || null,
            class_id: selectedClass,
            teacher_id: user?.id,
            student_id: evaluation.student_id,
            criterion_id: finalCriterionId, 
            value: parseFloat(evaluation.value),
            evaluation_title_id: selectedEvaluationTitleId
          };

          // MODIFICATION CLÉ ICI : Inclure 'id' UNIQUEMENT si evaluation.id existe déjà.
          // Sinon, l'ID sera généré par la base de données (DEFAULT gen_random_uuid()).
          if (evaluation.id) { 
            baseEvaluation.id = evaluation.id;
          }

          return baseEvaluation;
        });

      // Séparez les insertions des mises à jour
      const toUpdate = evaluationsToSave.filter(evaluation => 'id' in evaluation);
      const toInsert = evaluationsToSave.filter(evaluation => !('id' in evaluation));

      // Effectuez les mises à jour
      if (toUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('evaluations')
          .upsert(toUpdate, { 
              onConflict: 'student_id, criterion_id, class_id, date, evaluation_title_id' // Utilisez onConflict pour les mises à jour
          }); 
        if (updateError) throw updateError;
      }

      // Effectuez les insertions
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('evaluations')
          .insert(toInsert); // Utilisez insert pour les nouveaux enregistrements (l'ID sera généré)
        if (insertError) throw insertError;
      }

      toast.success(isEditing ? 'Avaliações atualizadas com sucesso' : 'Avaliações criadas com sucesso');
      navigate('/evaluations');
    } catch (error: any) {
      console.error('Error saving evaluations:', error.message);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setLoading(false);
    }
  };

  // Handles deletion confirmation dialog
  const handleDeleteClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Avaliação',
      message: `Tem certeza que deseja excluir a avaliação "${evaluationTitleName}"? Esta ação non pode ser desfeita e excluirá todas as avaliações associées.`
    });
  };

  // Handles the actual deletion of evaluations
  const handleConfirmDelete = async () => {
    if (!isEditing || !id) return;

    setDeleting(true);
    try {
      const { data: evaluationData, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (evaluationData.teacher_id !== user?.id) {
        toast.error('Você não tem permissão para excluir esta avaliação');
        setDeleting(false);
        setConfirmDialog({ isOpen: false, title: '', message: '' });
        return;
      }

      let deleteQuery = supabase
        .from('evaluations')
        .delete()
        .eq('date', evaluationData.date)
        .eq('criterion_id', evaluationData.criterion_id)
        .eq('class_id', evaluationData.class_id)
        .eq('teacher_id', user?.id);

      if (evaluationData.evaluation_title_id) {
        deleteQuery = deleteQuery.eq('evaluation_title_id', evaluationData.evaluation_title_id);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) throw error;

      toast.success('Avaliação excluída com sucesso');
      navigate('/evaluations');
    } catch (error: any) {
      console.error('Error deleting evaluation:', error.message);
      toast.error('Erro ao excluir avaliação');
    } finally {
      setDeleting(false);
      setConfirmDialog({ isOpen: false, title: '', message: '' });
    }
  };

  // Sort evaluations: those with values first, then alphabetically by student name
  const sortedEvaluations = [...evaluations].sort((a, b) => {
    const aHasValue = a.value && a.value.trim() !== '';
    const bHasValue = b.value && b.value.trim() !== '';

    if (aHasValue && !bHasValue) return -1;
    if (!aHasValue && bHasValue) return 1;

    return a.student_name.localeCompare(b.student_name);
  });

  // Global loading overlay to prevent interaction and show status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        <p className="ml-4 text-xl text-primary-600">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Avaliações' : 'Novas Avaliações'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEditing
            ? 'Atualize as informations des évaluations'
            : 'Preencha as informations pour créer múltiples évaluations'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Input */}
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
            />

            {/* Class Selection */}
            <div className="space-y-2">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">
                Turma
              </label>
              <select
                id="class-select"
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

            {/* Evaluation Title Selection */}
            <div className="space-y-2">
              <label htmlFor="evaluation-title-select" className="block text-sm font-medium text-gray-700">
                Título da Avaliação
              </label>
              <select
                id="evaluation-title-select"
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
                  ℹ️ Critères filtrés baseados no título selecionado
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Selected Evaluation Title Name */}
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

            {/* Criterion Selection */}
            <div className="space-y-2">
              <label htmlFor="criterion-select" className="block text-sm font-medium text-gray-700">
                Critério
              </label>
              <select
                id="criterion-select"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={selectedCriterion?.id || ''} 
                onChange={(e) => handleCriterionChange(e.target.value)}
                required
                disabled={isEditing && evaluations.length > 0} 
              >
                <option value="">Selecione un critère</option>
                {availableCriteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.min_value} - {c.max_value})
                  </option>
                ))}
              </select>
              {availableCriteria.length === 0 && (
                <p className="text-sm text-error-600">
                  Nenhum critère encontrado.{' '}
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => navigate('/criteria/new')}
                  >
                    Criar critère
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

          {/* Student Evaluations Table - Now includes comments column */}
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

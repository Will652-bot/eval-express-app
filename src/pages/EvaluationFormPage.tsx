import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; // Assuming this is a custom Input component
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FileText, Eye, Download, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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
  id?: string; // Optional: ID of the existing evaluation record in Supabase
  student_id: string;
  student_name: string;
  criterion_id: string;
  value: string;
  comments: string; // Added: Comment specific to this student's evaluation
}

export const EvaluationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 'id' is the ID of a single evaluation record for editing

  const { user } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(false); // Global loading state for the form
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); // Raw student list for the selected class
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

  // Determine if we are in editing mode
  const isEditing = !!id;

  // Initial data fetching on component mount or ID change
  useEffect(() => {
    const initialize = async () => {
      setLoading(true); // Commencer le chargement global du formulaire
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
        console.error("Erreur d'initialisation du formulaire:", err.message);
        toast.error("Erro ao iniciar formulário.");
        navigate('/evaluations');
      } finally {
        setLoading(false); // Fin du chargement global du formulaire
      }
    };

    initialize();
  }, [id, user?.id, isEditing]);

  // Fetch students when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
      // Only clear evaluations if not in editing mode or if the class is explicitly unselected
      if (!isEditing) { 
        setEvaluations([]); 
      }
    }
  }, [selectedClass, isEditing]);

  // Set selected criterion based on the first evaluation's criterion_id (for editing)
  useEffect(() => {
    if (evaluations.length > 0 && evaluations[0]?.criterion_id) {
      const criterion = availableCriteria.find(c => c.id === evaluations[0].criterion_id);
      setSelectedCriterion(criterion);
    } else {
      setSelectedCriterion(null); // Clear criterion if no evaluations or criterion_id
    }
  }, [evaluations, availableCriteria]);

  // Filter criteria based on selected evaluation title
  useEffect(() => {
    if (selectedEvaluationTitleId) {
      fetchCriteriaForTitle(selectedEvaluationTitleId);
    } else {
      setAvailableCriteria(criteria); // Show all criteria if no title is selected
    }
  }, [selectedEvaluationTitleId, criteria]);

  // Check for attached PDF when evaluation title or class changes
  useEffect(() => {
    if (selectedEvaluationTitleId && selectedClass) {
      checkForAttachedPDF();
    } else {
      setAttachedPDF(null);
    }
  }, [selectedEvaluationTitleId, selectedClass, user?.id]);

  // Auto-fill evaluation title name for display (new evaluation mode)
  useEffect(() => {
    if (selectedEvaluationTitleId && !isEditing) {
      const selectedEvaluationTitle = evaluationTitles.find(
        evalTitle => evalTitle.id === selectedEvaluationTitleId
      );

      if (selectedEvaluationTitle) {
        setEvaluationTitleName(selectedEvaluationTitle.title);
        setShowTitleField(false); // Do not show editable field when evaluation_title_id is selected
      }
    } else if (!selectedEvaluationTitleId && !isEditing) {
      setEvaluationTitleName('');
      setShowTitleField(true); // Show editable field when no evaluation_title_id is selected
    }
  }, [selectedEvaluationTitleId, evaluationTitles, isEditing]);

  // Control visibility of title field in editing mode
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
      setShowTitleField(true); // Show editable field for legacy evaluations without evaluation_title_id
    }
  }, [isEditing, selectedEvaluationTitleId, evaluationTitles]);

  // NEW useEffect: Fetch and pre-fill existing student evaluations for "new evaluation" mode
  useEffect(() => {
    const fetchAndPreFillEvaluations = async () => {
      if (!user || isEditing || !selectedClass || !selectedCriterion || !selectedEvaluationTitleId) {
        // If not in new mode, or essential data is missing, do nothing.
        // Also, if students are not yet loaded, we can't pre-fill.
        if (!isEditing && selectedClass && students.length > 0) {
            // Re-initialize evaluations with empty values if criteria/title change
            // and no existing data is found yet.
            const initialEvaluations: StudentEvaluationData[] = students.map(student => ({
                student_id: student.id,
                student_name: `${student.first_name} ${student.last_name}`,
                criterion_id: selectedCriterion?.id || '',
                value: '',
                comments: ''
            }));
            setEvaluations(initialEvaluations);
        }
        return;
      }

      setLoadingStudents(true); // Indicate loading for student evaluations
      try {
        // Fetch existing evaluations for the selected class, criterion, and evaluation title
        const { data: existingEvals, error } = await supabase
          .from('evaluations')
          .select(`id, student_id, value, comments`)
          .eq('class_id', selectedClass)
          .eq('criterion_id', selectedCriterion.id)
          .eq('evaluation_title_id', selectedEvaluationTitleId)
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false }); // Get most recent if multiple exist

        if (error) throw error;

        const existingEvalsMap = new Map<string, Pick<StudentEvaluationData, 'id' | 'value' | 'comments'>>();
        // Populate map, ensuring we only take the most recent for each student if duplicates exist
        existingEvals?.forEach(evalItem => {
            if (!existingEvalsMap.has(evalItem.student_id)) { // Only add if not already added (i.e., take the first/most recent)
                existingEvalsMap.set(evalItem.student_id, {
                    id: evalItem.id,
                    value: evalItem.value?.toString() || '',
                    comments: evalItem.comments || ''
                });
            }
        });

        // Create the evaluations array, pre-filling with existing data
        const updatedEvaluations: StudentEvaluationData[] = students.map(student => {
          const existing = existingEvalsMap.get(student.id);
          return {
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            criterion_id: selectedCriterion.id,
            value: existing?.value || '', // Pre-fill value
            comments: existing?.comments || '', // Pre-fill comments
            id: existing?.id // Keep ID if it's an existing record (though for 'new', we'll insert new ones)
          };
        });
        setEvaluations(updatedEvaluations);

      } catch (error: any) {
        console.error('Error fetching existing evaluations for pre-fill:', error.message);
        toast.error('Erro ao pré-carregar avaliações existentes.');
      } finally {
        setLoadingStudents(false);
      }
    };

    // Only run this effect if students are already loaded
    if (students.length > 0) {
        fetchAndPreFillEvaluations();
    }
  }, [user, isEditing, selectedClass, selectedCriterion, selectedEvaluationTitleId, students]); // Add students to dependencies

  // Fetches all classes for the current teacher
  const fetchClasses = async () => {
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
  };

  // Fetches students for a given class and initializes evaluation state
  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name') // Optimized select to only get necessary student fields
        .eq('class_id', classId)
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);

      // Initialize evaluations for all students if NOT IN EDITING MODE
      // This will be overridden by the new useEffect if existing evaluations are found.
      if (!isEditing && data && data.length > 0) {
        const initialEvaluations: StudentEvaluationData[] = data.map(student => ({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          criterion_id: selectedCriterion?.id || '', // Initialize with selected criterion if any
          value: '',
          comments: ''
        }));
        setEvaluations(initialEvaluations);
      } else if (!isEditing && (!data || data.length === 0)) {
          setEvaluations([]);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error.message);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetches all criteria for the current teacher
  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (error) throw error;
      setCriteria(data || []);
      setAvailableCriteria(data || []); // Initially, all criteria are available
    } catch (error: any) {
      console.error('Error fetching criteria:', error.message);
      toast.error('Erro ao carregar critérios');
    }
  };

  // Fetches criteria specifically linked to an evaluation title
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
        // If no criteria are explicitly associated with this title, show all criteria
        setAvailableCriteria(criteria);
      }
    } catch (error: any) {
      console.error('Error fetching criteria for title:', error.message);
      // Fallback to all criteria if there's an error
      setAvailableCriteria(criteria);
    }
  };

  // Fetches all evaluation titles for the current teacher
  const fetchEvaluationTitles = async () => {
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
  };

  // Checks for and sets attached PDF for the selected title and class
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
    } catch (error: any) {
      console.error('Error checking for attached PDF:', error.message);
      toast.error('Erro ao verificar anexos');
    } finally {
      setLoadingPDF(false);
    }
  };

  // Handles viewing the attached PDF in a new tab
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

  // Fetches a single evaluation record by ID and populates the form for editing
  // Accepte evaluationId comme argument pour une meilleure clarté et testabilité
  const fetchEvaluation = async (evaluationId: string) => { 
    setLoading(true); // Set loading state specifically for fetching evaluation data
    try {
      // 1. Fetch the primary evaluation record to identify the group parameters
      const { data: singleEvaluationRecord, error: singleFetchError } = await supabase
          .from('evaluations')
          .select(`date, class_id, criterion_id, evaluation_title_id`) // Just need these fields to define the group
          .eq('id', evaluationId)
          .eq('teacher_id', user?.id) // Security check: ensure current user owns this
          .single();

      if (singleFetchError) {
          console.error('Error fetching single evaluation record to identify group:', singleFetchError.message);
          toast.error('Avaliação não encontrada ou sem permissão.');
          navigate('/evaluations');
          return;
      }

      // Destructure the group parameters
      const { date: groupDate, class_id: groupClassId, criterion_id: groupCriterionId, evaluation_title_id: groupEvaluationTitleId } = singleEvaluationRecord;

      // Set common form fields from the identified group
      setDate(new Date(groupDate).toISOString().split('T')[0]);
      setSelectedClass(groupClassId);
      setSelectedEvaluationTitleId(groupEvaluationTitleId || '');

      // Fetch students for the identified class
      const { data: classStudents, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('class_id', groupClassId)
          .order('first_name');
      if (studentsError) throw studentsError;
      setStudents(classStudents || []); // Set raw students list for the table

      // 2. Fetch ALL evaluation records for this identified group
      const { data: existingEvaluations, error: evalError } = await supabase
          .from('evaluations')
          .select(`id, student_id, value, comments`)
          .eq('class_id', groupClassId)
          .eq('criterion_id', groupCriterionId)
          .eq('date', groupDate)
          .eq('teacher_id', user?.id); // Security check

      if (evalError) throw evalError;

      // Map existing evaluations to students for easy lookup
      const evaluationsMap = new Map<string, Omit<StudentEvaluationData, 'student_name'>>();
      existingEvaluations?.forEach(evaluation => {
          evaluationsMap.set(evaluation.student_id, {
              id: evaluation.id,
              student_id: evaluation.student_id,
              criterion_id: groupCriterionId, // Common criterion for the group
              value: evaluation.value?.toString() || '',
              comments: evaluation.comments || ''
          });
      });

      // Create the final evaluations array, combining all students with their existing evaluation data
      const allEvaluations: StudentEvaluationData[] = classStudents?.map(student => {
          const existing = evaluationsMap.get(student.id);
          return {
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              criterion_id: existing?.criterion_id || groupCriterionId, // Ensure criterion_id is set
              value: existing?.value || '',
              comments: existing?.comments || '',
              id: existing?.id // Pass the evaluation record ID if it exists
          };
      }) || [];

      setEvaluations(allEvaluations);
    } catch (error: any) {
      console.error('Error fetching evaluation group:', error.message);
      toast.error('Erro ao carregar avaliação. Redirecionando...');
      navigate('/evaluations'); // Redirect on any error during fetch
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  };

  // Handles change in selected criterion
  const handleCriterionChange = (criterionId: string) => {
    const criterion = availableCriteria.find(c => c.id === criterionId);
    setSelectedCriterion(criterion);

    // Update criterion_id for all students in the evaluations state
    setEvaluations(prev =>
      prev.map(evaluation => ({
        ...evaluation,
        criterion_id: criterionId,
        // Reset value if criterion changes, unless it's the same criterion
        // This logic might need adjustment based on desired UX
        value: evaluation.criterion_id !== criterionId ? '' : evaluation.value,
        comments: evaluation.criterion_id !== criterionId ? '' : evaluation.comments // Also reset comments
      }))
    );
  };

  // NEW: Handles comment change for a specific student's evaluation
  const handleCommentChange = (studentId: string, comment: string) => {
    setEvaluations(prev =>
      prev.map(evaluation =>
        evaluation.student_id === studentId
          ? { ...evaluation, comments: comment }
          : evaluation
      )
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

    if (evaluations.length === 0 || !evaluations[0]?.criterion_id) {
        toast.error('Selecione um critério e assurez-vous que les élèves sont chargés.');
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

  // Handles form submission (create or update evaluations)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Filter out evaluations with no values, and map to Supabase schema
      const evaluationsToSave = evaluations
        .filter(evaluation => evaluation.value && evaluation.value.trim() !== '')
        .map(evaluation => {
          // Base object for an evaluation record
          const baseEvaluation = {
            date,
            comments: evaluation.comments || null, // Use student-specific comment
            class_id: selectedClass,
            teacher_id: user?.id,
            student_id: evaluation.student_id,
            criterion_id: evaluation.criterion_id,
            value: parseFloat(evaluation.value),
            evaluation_title_id: selectedEvaluationTitleId
          };

          // If editing an existing record, include its ID
          if (evaluation.id) {
            return { ...baseEvaluation, id: evaluation.id };
          }
          return baseEvaluation;
        });

      if (isEditing) {
        // For editing, we need to handle updates and inserts separately
        // Records with an 'id' are existing and need to be updated
        const toUpdate = evaluationsToSave.filter(evaluation => 'id' in evaluation);
        if (toUpdate.length > 0) {
          // Use upsert to update existing records
          const { error: updateError } = await supabase
            .from('evaluations')
            .upsert(toUpdate); // Upsert handles update if ID exists

          if (updateError) throw updateError;
        }

        // Records without an 'id' are new and need to be inserted
        const toInsert = evaluationsToSave.filter(evaluation => !('id' in evaluation));
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('evaluations')
            .insert(toInsert);

          if (insertError) throw insertError;
        }

        toast.success('Avaliações atualizadas com sucesso');
      } else {
        // For new evaluations, insert all records
        const { error } = await supabase
          .from('evaluations')
          .insert(evaluationsToSave);

        if (error) throw error;
        toast.success('Avaliações criadas com sucesso');
      }

      navigate('/evaluations'); // Redirect after successful save
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
      message: `Tem certeza que deseja excluir a avaliação "${evaluationTitleName}"? Esta ação não pode ser desfeita e excluirá todas as avaliações associées.`
    });
  };

  // Handles the actual deletion of evaluations
  const handleConfirmDelete = async () => {
    if (!isEditing || !id) return; // Ensure we are in editing mode and have an ID

    setDeleting(true);
    try {
      // Get the initial evaluation data to find related evaluations for deletion
      const { data: evaluationData, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Security check: Ensure the evaluation belongs to the current user
      if (evaluationData.teacher_id !== user?.id) {
        toast.error('Você não tem permissão para excluir esta avaliação');
        setDeleting(false); // Stop loading if no permission
        setConfirmDialog({ isOpen: false, title: '', message: '' }); // Close dialog
        return;
      }

      // Delete all evaluations with the same date, criterion, class, and evaluation_title_id
      let deleteQuery = supabase
        .from('evaluations')
        .delete()
        .eq('date', evaluationData.date)
        .eq('criterion_id', evaluationData.criterion_id)
        .eq('class_id', evaluationData.class_id)
        .eq('teacher_id', user?.id); // Security check

      // If there's an evaluation_title_id, use it for more precise deletion
      if (evaluationData.evaluation_title_id) {
        deleteQuery = deleteQuery.eq('evaluation_title_id', evaluationData.evaluation_title_id);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) throw deleteError;

      toast.success('Avaliação excluída com sucesso');
      navigate('/evaluations'); // Redirect after successful deletion
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

    // Prioritize students with values
    if (aHasValue && !bHasValue) return -1;
    if (!aHasValue && bHasValue) return 1;

    // Then sort alphabetically by student name
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
                  ℹ️ Critérios filtrados baseados no título selecionado
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
                value={evaluations[0]?.criterion_id || ''}
                onChange={(e) => handleCriterionChange(e.target.value)}
                required
                disabled={isEditing && evaluations.length > 0} // Disable if editing and evaluations exist
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
                          Aluno
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        {/* NEW: Comments Header */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comentários
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedEvaluations.map((evaluation) => {
                        const hasValue = evaluation.value && evaluation.value.trim() !== '';
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
                            {/* NEW: Comments Input for each student */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-full">
                              <textarea
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                                rows={2} // Adjust rows as needed for comments
                                value={evaluation.comments}
                                onChange={(e) => handleCommentChange(evaluation.student_id, e.target.value)}
                                placeholder="Adicionar comentário..."
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

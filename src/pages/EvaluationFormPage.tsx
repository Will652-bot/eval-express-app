import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  value: string;
  comment: string;
}

const EvaluationFormPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string>('');
  const [selectedCriterioId, setSelectedCriterioId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId || !user?.id) return;
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, name')
          .eq('class_id', selectedClassId)
          .eq('teacher_id', user.id);

        if (error) throw error;

        const formatted = data.map((s) => ({
          id: s.id,
          name: s.name,
          value: '',
          comment: '',
        }));
        setStudents(formatted);
      } catch (error) {
        console.error('❌ Erro ao buscar alunos:', error);
        toast.error('Erro ao buscar alunos');
      }
    };

    fetchStudents();
  }, [selectedClassId, user?.id]);

  useEffect(() => {
    const fetchStudentEvaluations = async () => {
      if (!user?.id || !selectedTitleId || !selectedCriterioId || !selectedClassId) return;

      try {
        const { data: evaluations, error } = await supabase
          .from('evaluations')
          .select('student_id, value, comment')
          .eq('evaluation_title_id', selectedTitleId)
          .eq('criterio_id', selectedCriterioId)
          .eq('class_id', selectedClassId)
          .eq('teacher_id', user.id);

        if (error) throw error;

        const evaluationMap = new Map(
          evaluations.map((e) => [e.student_id, { value: e.value, comment: e.comment }])
        );

        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            value: evaluationMap.get(s.id)?.value ?? '',
            comment: evaluationMap.get(s.id)?.comment ?? '',
          }))
        );
      } catch (err) {
        console.error('💥 Erro ao buscar avaliações:', err);
        toast.error('Erro ao buscar avaliações');
      }
    };

    fetchStudentEvaluations();
  }, [user?.id, selectedTitleId, selectedCriterioId, selectedClassId]);

  const handleSaveEvaluations = async () => {
    if (!user?.id || !selectedTitleId || !selectedCriterioId || !selectedClassId) {
      toast.error('Preencha todos os campos antes de salvar');
      return;
    }

    setSaving(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        evaluation_title_id: selectedTitleId,
        criterio_id: selectedCriterioId,
        class_id: selectedClassId,
        value: s.value,
        comment: s.comment,
        teacher_id: user.id,
      }));

      const { error } = await supabase.from('evaluations').upsert(payload, {
        onConflict: 'student_id,evaluation_title_id,criterio_id,class_id,teacher_id',
      });

      if (error) throw error;

      toast.success('✅ Avaliações salvas com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao salvar:', err);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold mb-4">Formulário de Avaliação</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="ID do Título da Avaliação"
          value={selectedTitleId}
          onChange={(e) => setSelectedTitleId(e.target.value)}
        />
        <Input
          placeholder="ID do Critério"
          value={selectedCriterioId}
          onChange={(e) => setSelectedCriterioId(e.target.value)}
        />
        <Input
          placeholder="ID da Turma"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <div key={student.id} className="border p-3 rounded shadow-sm space-y-2">
            <p className="font-medium">{student.name}</p>
            <Label htmlFor={`value-${student.id}`}>Nota</Label>
            <Input
              id={`value-${student.id}`}
              value={student.value}
              onChange={(e) => {
                const updated = students.map((s) =>
                  s.id === student.id ? { ...s, value: e.target.value } : s
                );
                setStudents(updated);
              }}
            />
            <Label htmlFor={`comment-${student.id}`}>Comentário</Label>
            <Textarea
              id={`comment-${student.id}`}
              value={student.comment}
              onChange={(e) => {
                const updated = students.map((s) =>
                  s.id === student.id ? { ...s, comment: e.target.value } : s
                );
                setStudents(updated);
              }}
            />
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button onClick={handleSaveEvaluations} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Avaliações'}
        </Button>
      </div>
    </div>
  );
};

export default EvaluationFormPage;

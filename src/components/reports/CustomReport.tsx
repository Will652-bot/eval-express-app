import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Download, ArrowUpDown, FileSpreadsheet, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { StudentTotalWithFormatting } from '../../types';

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  teacher_id: string;
}

interface Criterion {
  id: string;
  name: string;
  min_value: number;
  max_value: number;
}

interface ConditionalFormatting {
  min_score: number;
  max_score: number;
  color: string;
  evaluation_title: string | null;
  evaluation_title_id: string | null;
}

interface EvaluationTitle {
  id: string;
  title: string;
}

export const CustomReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [selectedTitleIds, setSelectedTitleIds] = useState<string[]>([]);
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pivotData, setPivotData] = useState<Record<string, Record<string, number>>>({});
  const [studentTotals, setStudentTotals] = useState<Record<string, StudentTotalWithFormatting>>({});
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc' as 'asc' | 'desc'
  });
  const [visibleCriteria, setVisibleCriteria] = useState<Criterion[]>([]);
  const [conditionalFormatting, setConditionalFormatting] = useState<ConditionalFormatting[]>([]);
  const [studentEvaluationTitles, setStudentEvaluationTitles] = useState<Record<string, Set<string>>>({});

  // ✅ CORRECTION: Détection correcte du plan Pro
  const isPro = user?.current_plan === 'pro' || user?.pro_subscription_active === true;

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesRes, studentsRes, criteriaRes, titlesRes, formattingRes] = await Promise.all([
        supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user?.id),
        supabase
          .from('students')
          .select('*')
          .eq('teacher_id', user?.id),
        supabase
          .from('criteria')
          .select('*')
          .eq('teacher_id', user?.id)
          .order('name'),
        // Fetch from evaluation_titles table
        supabase
          .from('evaluation_titles')
          .select('id, title')
          .eq('teacher_id', user?.id)
          .order('title'),
        supabase
          .from('conditional_formatting')
          .select('*')
          .eq('teacher_id', user?.id)
      ]);

      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (criteriaRes.error) throw criteriaRes.error;
      if (titlesRes.error) throw titlesRes.error;
      if (formattingRes.error) throw formattingRes.error;

      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
      
      const sortedCriteria = (criteriaRes.data || []).sort((a, b) => {
        const aPrefix = parseInt(a.name.split('-')[0]) || 0;
        const bPrefix = parseInt(b.name.split('-')[0]) || 0;
        return aPrefix - bPrefix;
      });
      
      setCriteria(sortedCriteria);
      setConditionalFormatting(formattingRes.data || []);
      setEvaluationTitles(titlesRes.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getColorForTotal = (total: number, studentName: string) => {
    if (selectedTitleIds.length === 0) {
      return 'inherit';
    }

    const studentTitles = studentEvaluationTitles[studentName];
    if (!studentTitles) {
      return 'inherit';
    }

    // Get all applicable rules
    const matchingRules = conditionalFormatting.filter(rule => {
      // Check if the rule applies to this total
      const matchesRange = total >= rule.min_score && total <= rule.max_score;
      
      if (!matchesRange) return false;

      // Check evaluation_title_id instead of evaluation_title
      if (rule.evaluation_title_id) {
        // Find the title name for this ID
        const titleName = evaluationTitles.find(t => t.id === rule.evaluation_title_id)?.title;
        return titleName && studentTitles.has(titleName);
      }

      // Global rules (evaluation_title_id is null) always apply if range matches
      return true;
    });

    // Sort rules by priority
    const sortedRules = matchingRules.sort((a, b) => {
      // If one rule is title-specific and the other isn't, prioritize the title-specific one
      if (a.evaluation_title_id && !b.evaluation_title_id) return -1;
      if (!a.evaluation_title_id && b.evaluation_title_id) return 1;

      // If both rules are of the same type, prioritize the one with the smaller range
      const aRange = a.max_score - a.min_score;
      const bRange = b.max_score - b.min_score;
      return aRange - bRange;
    });

    return sortedRules[0]?.color || 'inherit';
  };

  const generatePivotData = useCallback(async () => {
    if (selectedTitleIds.length === 0) {
      setPivotData({});
      setVisibleCriteria([]);
      return;
    }

    try {
      setLoading(true);

      // Query evaluations with evaluation_title_id filter
      let query = supabase
  .from('evaluations')
  .select(`
    *,
    student:students(first_name, last_name),
    criteria:criteria(name, min_value, max_value),
    evaluation_title:evaluation_titles(title)
  `)
  .eq('teacher_id', user?.id)
  .gte('date', startDate || '1900-01-01')
  .lte('date', endDate || '2100-12-31')
  .not('value', 'eq', 0);

if (selectedClasses.length > 0) {
  query = query.in('class_id', selectedClasses);
}
if (selectedStudents.length > 0) {
  query = query.in('student_id', selectedStudents);
}
if (selectedCriteria.length > 0) {
  query = query.in('criterion_id', selectedCriteria);
}
if (selectedTitleIds.length > 0) {
  query = query.in('evaluation_title_id', selectedTitleIds);
}

      const [evaluationsResult, totalsResult] = await Promise.all([
        query,
        supabase
          .from('student_total_with_formatting')
          .select('*')
          .eq('teacher_id', user?.id)
          .in('student_id', selectedStudents)
      ]);

      if (evaluationsResult.error) throw evaluationsResult.error;
      if (totalsResult.error) throw totalsResult.error;

      const totals: Record<string, StudentTotalWithFormatting> = {};
      totalsResult.data?.forEach(item => {
        totals[item.student_id] = item;
      });
      
      setStudentTotals(totals);

      // Get unique criteria that have data
      const criteriaWithData = new Set(
        evaluationsResult.data
          ?.map(e => e.criterion_id)
          .filter(Boolean)
      );

      // Filter visible criteria based on those that have data
      const filteredCriteria = criteria
        .filter(c => selectedCriteria.includes(c.id))
        .filter(c => criteriaWithData.has(c.id));

      setVisibleCriteria(filteredCriteria);

      const pivot: Record<string, Record<string, number>> = {};
      const newStudentEvaluationTitles: Record<string, Set<string>> = {};
      
      const studentsWithEvaluations = new Set(evaluationsResult.data?.map(e => e.student_id));
      
      selectedStudents.forEach(studentId => {
        if (!studentsWithEvaluations.has(studentId)) return;
        
        const student = students.find(s => s.id === studentId);
        if (student) {
          const studentName = `${student.last_name}, ${student.first_name}`;
          pivot[studentName] = {};
          newStudentEvaluationTitles[studentName] = new Set();
          
          filteredCriteria.forEach(criterion => {
            pivot[studentName][criterion.name] = 0;
          });
          
          pivot[studentName]['TOTAL'] = 0;
        }
      });

      evaluationsResult.data?.forEach(evaluation => {
        const student = students.find(s => s.id === evaluation.student_id);
        if (!student) return;
        
        const studentName = `${student.last_name}, ${student.first_name}`;
        const criterionName = evaluation.criteria.name;
        
        if (pivot[studentName] && evaluation.value) {
          pivot[studentName][criterionName] = evaluation.value;
          pivot[studentName]['TOTAL'] = Object.entries(pivot[studentName])
            .reduce((sum, [key, val]) => key !== 'TOTAL' ? sum + (val || 0) : sum, 0);
          
          // Use evaluation_title.title instead of evaluation.title
          const titleName = evaluation.evaluation_title?.title || '';
          if (titleName) {
            newStudentEvaluationTitles[studentName].add(titleName);
          }
        }
      });

      setPivotData(pivot);
      setStudentEvaluationTitles(newStudentEvaluationTitles);
    } catch (error) {
      console.error('Error generating pivot data:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }, [selectedClasses, selectedStudents, selectedCriteria, startDate, endDate, selectedTitleIds, students, criteria, evaluationTitles, user?.id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedClasses.length > 0 && selectedStudents.length > 0 && selectedCriteria.length > 0) {
      generatePivotData();
    }
  }, [generatePivotData]);

  const handleSelectAll = useCallback((type: 'classes' | 'students' | 'criteria' | 'titles') => {
    switch (type) {
      case 'classes':
        setSelectedClasses(classes.map(cls => cls.id));
        break;
      case 'students':
        setSelectedStudents(
          students
            .filter(student => selectedClasses.includes(student.class_id))
            .map(student => student.id)
        );
        break;
      case 'criteria':
        setSelectedCriteria(criteria.map(criterion => criterion.id));
        break;
      case 'titles':
        setSelectedTitleIds(evaluationTitles.map(title => title.id));
        break;
    }
  }, [classes, students, selectedClasses, criteria, evaluationTitles]);

  const handleSort = useCallback((key: 'name' | 'total') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const getSortedData = useCallback(() => {
    const data = Object.entries(pivotData).map(([studentName, scores]) => ({
      studentName,
      ...scores
    }));

    return data.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      } else {
        return sortConfig.direction === 'asc'
          ? a.TOTAL - b.TOTAL
          : b.TOTAL - a.TOTAL;
      }
    });
  }, [pivotData, sortConfig]);

  const handleExportPDF = useCallback(async () => {
    if (!isPro) {
      toast.error('Funcionalidade exclusiva para usuários do plano Pro');
      return;
    }

    const element = document.getElementById('custom-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('relatorio-personalizado.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  }, [isPro]);

  const handleExportExcel = useCallback(() => {
    if (!isPro) {
      toast.error('Funcionalidade exclusiva para usuários do plano Pro');
      return;
    }

    try {
      const data = getSortedData();
      const ws = XLSX.utils.json_to_sheet(data.map(row => {
        const formattedRow: any = {
          'Aluno': row.studentName
        };
        
        visibleCriteria.forEach(criterion => {
          formattedRow[criterion.name] = row[criterion.name] || '-';
        });
        
        formattedRow['TOTAL'] = row.TOTAL;
        
        return formattedRow;
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      XLSX.writeFile(wb, 'relatorio-personalizado.xlsx');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Erro ao gerar Excel');
    }
  }, [isPro, getSortedData, visibleCriteria]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Classes selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turmas
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll('classes')}
                  className="w-full"
                >
                  Selecionar Todas
                </Button>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {classes.map(cls => (
                    <label key={cls.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(cls.id)}
                        onChange={(e) => {
                          setSelectedClasses(prev => 
                            e.target.checked
                              ? [...prev, cls.id]
                              : prev.filter(id => id !== cls.id)
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2">{cls.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Evaluation Titles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Títulos das Avaliações
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll('titles')}
                  className="w-full"
                >
                  Selecionar Todos
                </Button>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {evaluationTitles.map(title => (
                    <label key={title.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedTitleIds.includes(title.id)}
                        onChange={(e) => {
                          setSelectedTitleIds(prev => 
                            e.target.checked
                              ? [...prev, title.id]
                              : prev.filter(id => id !== title.id)
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2">{title.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Criteria selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critérios
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll('criteria')}
                  className="w-full"
                >
                  Selecionar Todos
                </Button>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {criteria.map(criterion => (
                    <label key={criterion.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedCriteria.includes(criterion.id)}
                        onChange={(e) => {
                          setSelectedCriteria(prev => 
                            e.target.checked
                              ? [...prev, criterion.id]
                              : prev.filter(id => id !== criterion.id)
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2">{criterion.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Students selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alunos
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll('students')}
                  className="w-full"
                >
                  Selecionar Todos
                </Button>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {students
                    .filter(student => selectedClasses.includes(student.class_id))
                    .map(student => (
                      <label key={student.id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            setSelectedStudents(prev => 
                              e.target.checked
                                ? [...prev, student.id]
                                : prev.filter(id => id !== student.id)
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2">{`${student.last_name}, ${student.first_name}`}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Data Inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            <Input
              type="date"
              label="Data Final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        {isPro ? (
          <>
            <Button
              onClick={handleExportExcel}
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            >
              Exportar Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar PDF
            </Button>
          </>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-200">
            <Lock className="h-4 w-4" />
            <span>Exportação disponível apenas no plano Pro</span>
          </div>
        )}
      </div>

      <div id="custom-report">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky left-0 bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Aluno
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  {visibleCriteria.map(criterion => (
                    <th key={criterion.id} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {criterion.name}
                    </th>
                  ))}
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky right-0 bg-gray-50"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center">
                      TOTAL
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={visibleCriteria.length + 2} className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                      </div>
                    </td>
                  </tr>
                ) : Object.keys(pivotData).length === 0 ? (
                  <tr>
                    <td colSpan={visibleCriteria.length + 2} className="px-3 sm:px-6 py-4 text-center text-gray-500">
                      {selectedTitleIds.length === 0 
                        ? "Selecione pelo menos um título de avaliação para visualizar os dados"
                        : "Nenhum dado encontrado para os filtros selecionados"}
                    </td>
                  </tr>
                ) : (
                  getSortedData().map(row => {
                    const total = row.TOTAL;
                    const totalColor = getColorForTotal(total, row.studentName);
                    
                    return (
                      <tr key={row.studentName}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                          {row.studentName}
                        </td>
                        {visibleCriteria.map(criterion => (
                          <td key={criterion.id} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row[criterion.name] || '-'}
                          </td>
                        ))}
                        <td 
                          className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold sticky right-0 bg-white"
                          style={{ color: totalColor }}
                        >
                          {total.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

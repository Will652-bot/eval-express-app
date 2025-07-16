import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EvaluationTitle {
  id: string;
  title: string;
}

export const StandardReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [selectedTitleIds, setSelectedTitleIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [evaluationTitles, setEvaluationTitles] = useState<EvaluationTitle[]>([]);
  const [chartScales, setChartScales] = useState({
    classMax: 0,
    criteriaMax: 0
  });
  const [performanceData, setPerformanceData] = useState<any>({
    byClass: {
      labels: [],
      datasets: [],
    },
    byCriteria: {
      labels: [],
      datasets: [],
    },
    lowPerformance: [],
  });

  // ✅ CORRECTION: Détection correcte du plan Pro
  const isPro = user?.current_plan === 'pro' || user?.pro_subscription_active === true;

  const fetchInitialData = useCallback(async () => {
    const abortController = new AbortController();

    try {
      const [classesRes, criteriaRes, titlesRes] = await Promise.all([
        supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user?.id),
        supabase
          .from('criteria')
          .select('*')
          .eq('teacher_id', user?.id),
        // Fetch from evaluation_titles table
        supabase
          .from('evaluation_titles')
          .select('id, title')
          .eq('teacher_id', user?.id)
          .order('title')
      ]);

      if (!abortController.signal.aborted) {
        if (classesRes.error) throw classesRes.error;
        if (criteriaRes.error) throw criteriaRes.error;
        if (titlesRes.error) throw titlesRes.error;

        setClasses(classesRes.data || []);
        setCriteria(criteriaRes.data || []);
        setEvaluationTitles(titlesRes.data || []);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Error fetching initial data:', error);
      }
    }

    return () => {
      abortController.abort();
    };
  }, [user?.id]);

  // INERTION POURCENTAGE
  const fetchData = useCallback(async () => {
    setLoading(true);

    let totalsQuery = supabase.from('student_total_with_formatting').select('*').eq('teacher_id', user?.id);
    if (selectedClasses.length > 0) totalsQuery = totalsQuery.in('class_id', selectedClasses);

    let evaluationsQuery = supabase.from('evaluations_with_score').select('*').eq('teacher_id', user?.id);
    if (selectedClasses.length > 0) evaluationsQuery = evaluationsQuery.in('class_id', selectedClasses);
    if (selectedCriteria.length > 0) evaluationsQuery = evaluationsQuery.in('criterion_id', selectedCriteria);
    if (startDate) evaluationsQuery = evaluationsQuery.gte('date', startDate);
    if (endDate) evaluationsQuery = evaluationsQuery.lte('date', endDate);
    if (selectedTitleIds.length > 0) evaluationsQuery = evaluationsQuery.in('evaluation_title_id', selectedTitleIds);

    const [studentTotals, evaluations] = await Promise.all([totalsQuery, evaluationsQuery]);
    if (studentTotals.error) throw studentTotals.error;
    if (evaluations.error) throw evaluations.error;

    const classSummary = new Map();
    evaluations.data?.forEach(evaluation => {
      const className = evaluation.class_name || 'Sem Turma';
      if (!classSummary.has(className)) classSummary.set(className, { sum: 0, count: 0 });
      const classData = classSummary.get(className);
      classData.sum += evaluation.percentage;
      classData.count += 1;
    });

    const criteriaSummary = new Map();
    evaluations.data?.forEach(evaluation => {
      const criteriaName = evaluation.criterion_name || 'Sem Nome';
      if (!criteriaSummary.has(criteriaName)) criteriaSummary.set(criteriaName, { sum: 0, count: 0 });
      const criteriaData = criteriaSummary.get(criteriaName);
      criteriaData.sum += evaluation.percentage;
      criteriaData.count += 1;
    });

    const lowPerformers = studentTotals.data?.filter(s => s.total < 60).map(s => ({
      name: `${s.first_name} ${s.last_name}`,
      class: s.class_name,
      total: s.total
    })) || [];

    const classLabels = Array.from(classSummary.keys());
    const classAverages = classLabels.map(c => {
      const { sum, count } = classSummary.get(c);
      return count > 0 ? sum / count : 0;
    });

    const criteriaLabels = Array.from(criteriaSummary.keys());
    const criteriaAverages = criteriaLabels.map(c => {
      const { sum, count } = criteriaSummary.get(c);
      return count > 0 ? sum / count : 0;
    });

    setChartScales({
      classMax: Math.min(100, Math.ceil(Math.max(...classAverages) * 1.1)),
      criteriaMax: Math.min(100, Math.ceil(Math.max(...criteriaAverages) * 1.1))
    });

    setPerformanceData({
      byClass: {
        labels: classLabels,
        datasets: [{
          label: 'Média da Turma (%)',
          data: classAverages,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        }],
      },
      byCriteria: {
        labels: criteriaLabels,
        datasets: [{
          label: 'Média por Critério (%)',
          data: criteriaAverages,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
        }],
      },
      lowPerformance: lowPerformers.slice(0, 5).sort((a, b) => a.total - b.total),
    });

    setLoading(false);
  }, [user?.id, selectedClasses, selectedCriteria, selectedTitleIds, startDate, endDate]);
// FIN POURCENTAGE


  useEffect(() => {
    const cleanup = fetchInitialData();
    return () => {
      cleanup.then(abort => abort());
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedClasses.length > 0 || selectedCriteria.length > 0 || startDate || endDate || selectedTitleIds.length > 0) {
      const cleanup = fetchData();
      return () => {
        cleanup.then(abort => abort());
      };
    }
  }, [fetchData]);

  const handleSelectAll = useCallback((type: 'classes' | 'criteria' | 'titles') => {
    switch (type) {
      case 'classes':
        setSelectedClasses(classes.map(c => c.id));
        break;
      case 'criteria':
        setSelectedCriteria(criteria.map(c => c.id));
        break;
      case 'titles':
        setSelectedTitleIds(evaluationTitles.map(title => title.id));
        break;
    }
  }, [classes, criteria, evaluationTitles]);

  const handleExportPDF = useCallback(async () => {
    if (!isPro) {
      toast.error('Funcionalidade exclusiva para usuários do plano Pro');
      return;
    }

    const element = document.getElementById('standard-report');
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
      pdf.save('relatorio-padrao.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }, [isPro]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                  {classes.map((cls) => (
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
                  Selecionar Todas
                </Button>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {evaluationTitles.map((title) => (
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
                  {criteria.map((criterion) => (
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        {isPro ? (
          <Button
            onClick={handleExportPDF}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Exportar PDF
          </Button>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-200">
            <Lock className="h-4 w-4" />
            <span>Exportação disponível apenas no plano Pro</span>
          </div>
        )}
      </div>

      <div id="standard-report" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Desempenho por Turma</h3>
            <div className="w-full h-64 sm:h-80">
              <Bar
                data={performanceData.byClass}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: chartScales.classMax || undefined,
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Radar de Critérios</h3>
            <div className="w-full h-64 sm:h-80">
              <Radar
                data={performanceData.byCriteria}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: chartScales.criteriaMax || undefined,
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">
              <span className="text-error-500">⚠</span> Alunos com Baixo Desempenho
            </h3>
            <div className="space-y-4">
              {performanceData.lowPerformance.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum aluno com baixo desempenho encontrado
                </p>
              ) : (
                performanceData.lowPerformance.map((student: any) => (
                  <div
                    key={student.name}
                    className="flex justify-between items-center p-3 bg-error-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.class}</p>
                    </div>
                    <div className="text-error-600 font-semibold">
                      {student.total.toFixed(1)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

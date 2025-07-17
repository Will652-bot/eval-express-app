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

// Enregistrement des composants Chart.js
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

  const isPro = user?.current_plan === 'pro' || user?.pro_subscription_active === true;

  // --- fetchInitialData : Charge les listes de classes, critères, titres ---
  const fetchInitialData = useCallback(async (signal: AbortSignal) => {
    try {
      const [classesRes, criteriaRes, titlesRes] = await Promise.all([
        supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user?.id)
          .abortSignal(signal),
        supabase
          .from('criteria')
          .select('*')
          .eq('teacher_id', user?.id)
          .abortSignal(signal),
        supabase
          .from('evaluation_titles')
          .select('id, title')
          .eq('teacher_id', user?.id)
          .order('title')
          .abortSignal(signal)
      ]);

      if (classesRes.error) throw classesRes.error;
      if (criteriaRes.error) throw criteriaRes.error;
      if (titlesRes.error) throw titlesRes.error;

      setClasses(classesRes.data || []);
      setCriteria(criteriaRes.data || []);
      setEvaluationTitles(titlesRes.data || []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch initial data aborted');
      } else {
        console.error('Error fetching initial data:', error);
        toast.error('Erro ao carregar dados iniciais');
      }
    }
  }, [user?.id, supabase]);

  // --- fetchData : Charge les données de performance pour les graphiques ---
  const fetchData = useCallback(async (signal: AbortSignal) => {
    setLoading(true);

    let totalsQuery = supabase.from('student_total_with_formatting').select('*').eq('teacher_id', user?.id);
    if (selectedClasses.length > 0) totalsQuery = totalsQuery.in('class_id', selectedClasses);

    let evaluationsQuery = supabase.from('evaluations_with_score').select('*').eq('teacher_id', user?.id);
    if (selectedClasses.length > 0) evaluationsQuery = evaluationsQuery.in('class_id', selectedClasses);
    if (selectedCriteria.length > 0) evaluationsQuery = evaluationsQuery.in('criterion_id', selectedCriteria);
    if (startDate) evaluationsQuery = evaluationsQuery.gte('date', startDate);
    if (endDate) evaluationsQuery = evaluationsQuery.lte('date', endDate);
    if (selectedTitleIds.length > 0) evaluationsQuery = evaluationsQuery.in('evaluation_title_id', selectedTitleIds);

    try {
        const [studentTotalsRes, evaluationsRes] = await Promise.all([
            totalsQuery.abortSignal(signal),
            evaluationsQuery.abortSignal(signal)
        ]);
        
        if (studentTotalsRes.error) throw studentTotalsRes.error;
        if (evaluationsRes.error) throw evaluationsRes.error;

        const studentTotals = studentTotalsRes.data;
        const evaluations = evaluationsRes.data;

        // --- DÉBUT DES LOGS POUR DÉBOGAGE (À SUPPRIMER APRÈS CORRECTION) ---
        console.log("Données brutes des évaluations (fetchData):", evaluations); 
        // --- FIN DES LOGS POUR DÉBOGAGE ---

        const classSummary = new Map();
        evaluations?.forEach(evaluation => {
          // RESTAURATION : Utilisation de evaluation.percentage (car c'était le nom de colonne qui fonctionnait)
          const percentage = evaluation.percentage; 
          // La vérification du type est maintenue pour la robustesse générale
          if (typeof percentage !== 'number' || isNaN(percentage)) { 
              console.warn("Skipping non-numeric or NaN percentage in class summary:", evaluation);
              return; 
          }

          const className = evaluation.class_name || 'Sem Turma';
          if (!classSummary.has(className)) classSummary.set(className, { sum: 0, count: 0 });
          const classData = classSummary.get(className);
          classData.sum += percentage;
          classData.count += 1;
        });

        console.log("Résumé par classe (classSummary):", classSummary); // LOG DE DÉBOGAGE

        const criteriaSummary = new Map();
        evaluations?.forEach(evaluation => {
          // RESTAURATION : Utilisation de evaluation.percentage (car c'était le nom de colonne qui fonctionnait)
          const percentage = evaluation.percentage; 
          // La vérification du type est maintenue pour la robustesse générale
          if (typeof percentage !== 'number' || isNaN(percentage)) { 
              console.warn("Skipping non-numeric or NaN percentage in criteria summary:", evaluation);
              return; 
          }

          const criteriaName = evaluation.criterion_name || 'Sem Nome';
          if (!criteriaSummary.has(criteriaName)) criteriaSummary.set(criteriaName, { sum: 0, count: 0 });
          const criteriaData = criteriaSummary.get(criteriaName);
          criteriaData.sum += percentage;
          criteriaData.count += 1;
        });

        console.log("Résumé par critère (criteriaSummary):", criteriaSummary); // LOG DE DÉBOGAGE


        const lowPerformers = studentTotals?.filter(s => {
          const total = s.total; 
          return typeof total === 'number' && !isNaN(total) && total < 60;
        }).map(s => ({
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
          // CONSERVE : Utilisation de Math.max(0, ...) pour gérer les tableaux vides
          classMax: Math.min(100, Math.ceil(Math.max(0, ...classAverages) * 1.1)), 
          criteriaMax: Math.min(100, Math.ceil(Math.max(0, ...criteriaAverages) * 1.1)) 
        });

        // --- DÉBUT DES LOGS POUR DÉBOGAGE ---
        console.log("Données finales pour Bar Chart (byClass):", {
            labels: classLabels,
            data: classAverages
        }); 
        console.log("Données finales pour Radar Chart (byCriteria):", {
            labels: criteriaLabels,
            data: criteriaAverages
        }); 
        // --- FIN DES LOGS POUR DÉBOGAGE ---


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

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Fetch data aborted');
        } else {
            console.error('Error fetching data for reports:', error);
            toast.error('Erro ao carregar dados do relatório.');
        }
    } finally {
        setLoading(false);
    }
  }, [user?.id, selectedClasses, selectedCriteria, selectedTitleIds, startDate, endDate, supabase]);

  // --- useEffect principal pour le chargement initial et la réaction aux changements de filtres ---
  useEffect(() => {
    const abortController = new AbortController();

    const loadReportData = async () => {
        setLoading(true); 
        try {
            // Passer le signal d'abort aux fonctions de fetch
            await fetchInitialData(abortController.signal); 
            await fetchData(abortController.signal); 
        } catch (error) {
            console.error("Erro inesperado durante o carregamento do relatório:", error);
            if (error.name !== 'AbortError') {
                toast.error("Erro no carregamento dos relatórios.");
            }
        } finally {
            // Le setLoading est déjà géré dans fetchData.
        }
    };
    
    loadReportData(); 

    // Fonction de nettoyage du useEffect : annule la requête si le composant est démonté
    return () => {
        abortController.abort(); 
    };
  }, [fetchInitialData, fetchData]); 


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
      toast.error('Erro ao gerar PDF.'); 
    }
  }, [isPro]);

  // Options pour le Bar Chart (Desempenho por Turma)
  // CONSERVEES : Options robustes de Chart.js
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: {
            position: 'top' as const, 
        },
        title: {
            display: false, 
        },
        tooltip: {
            callbacks: {
                label: function(context: any) { 
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (typeof context.parsed.y === 'number' && !isNaN(context.parsed.y)) {
                        label += context.parsed.y.toFixed(1) + '%';
                    } else {
                        label += 'N/A'; 
                    }
                    return label;
                }
            }
        }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartScales.classMax || 100, 
        title: { 
          display: true,
          text: 'Média (%)'
        },
        ticks: {
            callback: function(value: any) { 
                if (typeof value === 'number' && !isNaN(value)) {
                    return value.toFixed(0) + '%'; 
                }
                return '';
            }
        }
      },
      x: {
        title: { 
          display: true,
          text: 'Turma'
        }
      }
    },
  };

  // Options pour le Radar Chart (Radar de Critérios)
  // CONSERVEES : Options robustes de Chart.js
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: {
            position: 'top' as const,
        },
        title: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: function(context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (typeof context.parsed.r === 'number' && !isNaN(context.parsed.r)) { 
                        label += context.parsed.r.toFixed(1) + '%';
                    } else {
                        label += 'N/A'; 
                    }
                    return label;
                }
            }
        }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: chartScales.criteriaMax || 100, 
        pointLabels: { 
            font: {
                size: 10 
            }
        },
        ticks: {
            callback: function(value: any) {
                if (typeof value === 'number' && !isNaN(value)) {
                    return value.toFixed(0) + '%'; 
                }
                return '';
            }
        },
        title: {
            display: true,
            text: 'Moyenne (%)' 
        }
      },
    },
  };


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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-500 focus:ring focus:ring-primary-500"
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
                options={barOptions} // Utilisation de l'objet options défini
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
                options={radarOptions} // Utilisation de l'objet options défini
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

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Class, Evaluation, Student } from '../types';
import { formatDateShort } from '../lib/utils';
import {
  Users,
  BookOpen,
  FileCheck,
  ArrowRight,
  PlusCircle,
  ArrowUpRight,
  Plus,
  GraduationCap,
  Settings,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([]);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const checkDemoDataExists = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('demo_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', 'CREATE_DEMO_FROM_UI')
        .maybeSingle();

      const dismissed = localStorage.getItem(`demo-banner-dismissed-${user.id}`) === 'true';
      
      setShowDemoBanner(!data && !dismissed);
      setBannerDismissed(dismissed);
    } catch (error) {
      console.error('Error checking demo data:', error);
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async () => {
    const abortController = new AbortController();

    try {
      setLoading(true);
      
      const [classData, studentData, evaluationData, recentData] = await Promise.all([
        supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('students')
          .select('*')
          .eq('teacher_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('evaluations')
          .select('*')
          .eq('teacher_id', user?.id),
        supabase
          .from('evaluations')
          .select(`
            *,
            student:students(first_name, last_name),
            class:classes(name),
            criteria:criteria(name),
            evaluation_title:evaluation_titles(title)
          `)
          .eq('teacher_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (!abortController.signal.aborted) {
        if (classData.error) throw classData.error;
        if (studentData.error) throw studentData.error;
        if (evaluationData.error) throw evaluationData.error;
        if (recentData.error) throw recentData.error;

        setClasses(classData.data || []);
        setStudents(studentData.data || []);
        setEvaluations(evaluationData.data || []);
        setRecentEvaluations(recentData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!abortController.signal.aborted) {
        toast.error('Erro ao carregar dados do painel');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    return () => {
      abortController.abort();
    };
  }, [user?.id]);

  useEffect(() => {
    const cleanup = fetchDashboardData();
    return () => {
      cleanup.then(abort => abort());
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    checkDemoDataExists();
  }, [checkDemoDataExists]);

  const handleDismissBanner = () => {
    if (user?.id) {
      localStorage.setItem(`demo-banner-dismissed-${user.id}`, 'true');
      setShowDemoBanner(false);
      setBannerDismissed(true);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    linkTo,
    color = 'text-primary-600',
    actionButton,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    linkTo: string;
    color?: string;
    actionButton?: React.ReactNode;
  }) => (
    <Card className="col-span-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text', 'bg')}`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Link to={linkTo} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
          Ver todos
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
        {actionButton}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in">
      {/* Demo Data Banner */}
      {showDemoBanner && (
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="p-3 bg-primary-100 rounded-full">
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    🎓 Quer conhecer o EvalExpress na prática?
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Clique aqui para acessar os dados de demonstração!
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  onClick={() => navigate('/settings')}
                  leftIcon={<Settings className="h-4 w-4" />}
                  className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
                >
                  Clique aqui
                </Button>
                <Button
                  onClick={handleDismissBanner}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel</h1>
          <p className="mt-1 text-gray-500">
            Bem-vindo de volta! Aqui está um resumo dos seus dados de ensino.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/evaluations/new">
            <Button leftIcon={<PlusCircle className="h-4 w-4" />}>
              Nova Avaliação
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-32 bg-gray-100 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Total de Alunos"
            value={students.length}
            icon={<Users className="h-6 w-6" />}
            linkTo="/students"
            color="text-primary-600"
            actionButton={
              classes.length > 0 && (
                <Link to={`/classes/${classes[0].id}/students/new`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Novo Aluno
                  </Button>
                </Link>
              )
            }
          />
          <StatCard
            title="Turmas"
            value={classes.length}
            icon={<BookOpen className="h-6 w-6" />}
            linkTo="/classes"
            color="text-secondary-600"
          />
          <StatCard
            title="Avaliações"
            value={evaluations.length}
            icon={<FileCheck className="h-6 w-6" />}
            linkTo="/evaluations"
            color="text-accent-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card title="Avaliações Recentes">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-16 bg-gray-100 rounded-md animate-pulse"
                ></div>
              ))}
            </div>
          ) : recentEvaluations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Nenhuma avaliação recente encontrada.</p>
              <Link to="/evaluations/new" className="mt-2 inline-block">
                <Button variant="outline" size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
                  Criar Avaliação
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvaluations.map((evaluation: any) => (
                <div
                  key={evaluation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-md hover:bg-gray-50"
                >
                  <div className="mb-3 sm:mb-0">
                    <h4 className="font-medium text-gray-900">
                      {/* Utiliser le titre de evaluation_title si disponible, sinon fallback sur title */}
                      {evaluation.evaluation_title?.title || evaluation.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Aluno: {evaluation.student?.first_name} {evaluation.student?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Turma: {evaluation.class?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Critério: {evaluation.criteria?.name}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Link to={`/evaluations/${evaluation.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ArrowUpRight className="h-4 w-4" />}
                      >
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <Link
                to="/evaluations"
                className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 mt-4"
              >
                Ver todas as avaliações
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
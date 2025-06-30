import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SortAsc, Trash2, Edit, Users, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ClassPDFAttachments } from '../components/attachments/ClassPDFAttachments';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Class {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  student_count?: number;
}

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    classId: '',
    className: ''
  });

  // 🔍 DEBUG: Log initial state
  console.log('🏫 ClassesPage - État initial:', {
    user: user?.id || 'non défini',
    authLoading,
    loading
  });

  useEffect(() => {
    console.log('🔄 ClassesPage useEffect déclenché:', {
      user: user?.id || 'non défini',
      authLoading
    });

    // ✅ CORRECTION: Attendre que l'authentification soit terminée
    if (authLoading) {
      console.log('⏳ Authentification en cours, attente...');
      return;
    }

    if (!user?.id) {
      console.log('❌ Utilisateur non authentifié');
      setLoading(false);
      return;
    }

    console.log('✅ Utilisateur authentifié, récupération des classes...');
    fetchClasses();
  }, [user?.id, authLoading]); // ✅ CORRECTION: Ajouter authLoading comme dépendance

  const fetchClasses = async () => {
    // ✅ CORRECTION: Vérification de sécurité
    if (!user?.id) {
      console.log('❌ fetchClasses: Pas d\'utilisateur authentifié');
      setLoading(false);
      return;
    }

    try {
      console.log('📡 Début de la récupération des classes pour l\'utilisateur:', user.id);
      setLoading(true);

      // ✅ CORRECTION: Timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La requête a pris trop de temps')), 10000);
      });

      const fetchPromise = supabase
        .from('classes')
        .select(`
          *,
          students (count)
        `)
        .eq('teacher_id', user.id)
        .order('name', { ascending: sortOrder === 'asc' });

      console.log('⏱️ Exécution de la requête Supabase...');
      
      // ✅ CORRECTION: Race entre la requête et le timeout
      const { data: classesData, error: classesError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      console.log('📊 Réponse Supabase reçue:', {
        data: classesData?.length || 0,
        error: classesError?.message || 'aucune'
      });

      if (classesError) {
        console.error('❌ Erreur Supabase:', classesError);
        throw classesError;
      }

      const classesWithCount = (classesData || []).map(c => ({
        ...c,
        student_count: c.students?.[0]?.count || 0
      }));

      console.log('✅ Classes traitées:', classesWithCount);
      setClasses(classesWithCount);

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des classes:', error);
      
      // ✅ CORRECTION: Messages d'erreur spécifiques
      if (error.message?.includes('Timeout')) {
        toast.error('La connexion prend trop de temps. Veuillez réessayer.');
      } else if (error.message?.includes('network')) {
        toast.error('Problème de connexion réseau. Vérifiez votre connexion.');
      } else {
        toast.error('Erro ao carregar turmas');
      }
      
      // ✅ CORRECTION: Fallback en cas d'erreur
      setClasses([]);
    } finally {
      console.log('🏁 Fin de fetchClasses, arrêt du loading');
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    console.log('🗑️ Demande de suppression:', { id, name });
    setConfirmDialog({
      isOpen: true,
      classId: id,
      className: name
    });
  };

  const handleConfirmDelete = async () => {
    if (!user?.id) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    try {
      console.log('🗑️ Suppression de la classe:', confirmDialog.classId);
      
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', confirmDialog.classId)
        .eq('teacher_id', user.id); // ✅ CORRECTION: Sécurité supplémentaire

      if (error) throw error;

      toast.success('Turma excluída com sucesso');
      console.log('✅ Classe supprimée, rechargement...');
      fetchClasses();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erro ao excluir turma');
    } finally {
      setConfirmDialog({ isOpen: false, classId: '', className: '' });
    }
  };

  const toggleAttachments = (classId: string) => {
    console.log('📎 Toggle attachments pour la classe:', classId);
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSort = () => {
    console.log('🔄 Changement de tri:', sortOrder === 'asc' ? 'desc' : 'asc');
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  // ✅ CORRECTION: Gestion des états de chargement
  if (authLoading) {
    console.log('⏳ Affichage: Authentification en cours');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    console.log('❌ Affichage: Utilisateur non authentifié');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Utilisateur non authentifié</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendu de la page avec:', {
    loading,
    classesCount: classes.length,
    filteredCount: filteredClasses.length
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Turmas</h1>
          <p className="mt-1 text-gray-500">
            Gerencie suas turmas, alunos e anexos PDF
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => navigate('/classes/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Nova Turma
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              onClick={toggleSort}
              leftIcon={<SortAsc className="h-4 w-4" />}
            >
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando turmas...</p>
            {/* ✅ CORRECTION: Bouton d'urgence en cas de blocage */}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                console.log('🚨 Bouton d\'urgence activé');
                setLoading(false);
                setClasses([]);
              }}
            >
              Forcer l'arrêt du chargement
            </Button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {classes.length === 0 ? 'Nenhuma turma encontrada' : 'Nenhuma turma corresponde à busca'}
            </p>
            {classes.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/classes/new')}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Criar primeira turma
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="space-y-4">
                <div className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {classItem.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {classItem.student_count} alunos
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAttachments(classItem.id)}
                      leftIcon={<FileText className="h-4 w-4" />}
                    >
                      {expandedClass === classItem.id ? 'Ocultar' : 'Anexos'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/classes/${classItem.id}/students`)}
                      leftIcon={<Users className="h-4 w-4" />}
                    >
                      Alunos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/classes/${classItem.id}/edit`)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(classItem.id, classItem.name)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* PDF Attachments Section */}
                {expandedClass === classItem.id && (
                  <div className="px-4 pb-4">
                    <ClassPDFAttachments 
                      classId={classItem.id}
                      className={classItem.name}
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
        title="Excluir Turma"
        message={`Tem certeza que deseja excluir a turma "${confirmDialog.className}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, classId: '', className: '' })}
      />
    </div>
  );
};
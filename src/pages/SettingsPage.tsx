import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { UpdatePasswordForm } from '../components/auth/UpdatePasswordForm';
import { TeacherTypeSelector } from '../features/teacherTypeSelector/TeacherTypeSelector';
import { useSelectedTeacherTypes } from '../features/teacherTypeSelector/hooks/useSelectedTeacherTypes';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
  const [checkingDemoStatus, setCheckingDemoStatus] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ email: user?.email || '' });

  const { refetchSelectedTeacherTypes } = useSelectedTeacherTypes(user?.id || '');
  const [selectedTeacherTypesLocal, setSelectedTeacherTypesLocal] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({ email: user.email || '' });
      checkDemoDataStatus();
    }
  }, [user]);

  const checkDemoDataStatus = async () => {
    if (!user?.id) return;
    try {
      setCheckingDemoStatus(true);
      const { data, error } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
      if (error) throw error;
      setHasDemoData(data);
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      setHasDemoData(false);
    } finally {
      setCheckingDemoStatus(false);
    }
  };

  const refetchDemoStatus = async () => {
    await checkDemoDataStatus();
    await refetchSelectedTeacherTypes();
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error('O email é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: formData.email });
      if (error) throw error;
      toast.success('Email atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar email');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }
    if (selectedTeacherTypesLocal.length === 0 || selectedTeacherTypesLocal.length > 2) {
      toast.error('Selecione 1 ou 2 tipos de ensino');
      return;
    }
    setDemoLoading(true);
    try {
      const { error } = await supabase.rpc('generate_demo_data_by_type', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_teachertype_ids: selectedTeacherTypesLocal,
      });
      if (error) throw error;

      toast.success('✅ Dados de demonstração criados com sucesso');
      await refetchDemoStatus();
      localStorage.removeItem(`demo-banner-dismissed-${user.id}`);
    } catch (error: any) {
      toast.error('❌ Erro ao criar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDeleteDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }
    if (selectedTeacherTypesLocal.length === 0) {
      toast.error('Selecione pelo menos um tipo de ensino');
      return;
    }
    setDemoLoading(true);
    try {
      const { error } = await supabase.rpc('delete_demo_data_by_type', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_teachertype_ids: selectedTeacherTypesLocal,
      });
      if (error) throw error;

      toast.success('✅ Dados de demonstração excluídos com sucesso');
      await refetchDemoStatus();
    } catch (error: any) {
      toast.error('❌ Erro ao excluir dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDemoLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <h2 className="text-lg font-semibold mb-2">Email</h2>
        <form onSubmit={handleEmailUpdate} className="flex gap-2 items-center">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Tipo de ensino</h2>
        <TeacherTypeSelector
          userId={user?.id || ''}
          onSelectionChange={(types) => setSelectedTeacherTypesLocal(types)}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Dados de demonstração</h2>
        <div className="flex gap-4 items-center">
          <Button
            onClick={handleCreateDemoData}
            disabled={demoLoading || checkingDemoStatus}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar um conjunto de dados de demonstração
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={demoLoading || checkingDemoStatus}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir o conjunto de dados de demonstração
          </Button>
        </div>
        {hasDemoData && (
          <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
            <CheckCircle className="w-4 h-4" />
            Conjunto de demonstração ativo
          </p>
        )}
        {hasDemoData === false && (
          <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
            <XCircle className="w-4 h-4" />
            Nenhum conjunto ativo
          </p>
        )}
      </Card>

      <Card>
        <UpdatePasswordForm />
      </Card>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteDemoData}
        title="Excluir dados de demonstração"
        description="Tem certeza que deseja excluir os dados de demonstração?"
        confirmText="Sim, excluir"
      />
    </div>
  );
};

export default SettingsPage;

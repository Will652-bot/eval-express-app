import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, CheckCircle, XCircle, Save } from 'lucide-react';
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
  const [validTeacherSelection, setValidTeacherSelection] = useState<boolean | null>(null);
  const [existingDemoTeachertypes, setExistingDemoTeachertypes] = useState<string[]>([]);

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
      const { data: demoRows, error } = await supabase
        .from('demo_entities')
        .select('teachertype_id')
        .eq('user_id', user.id);
      if (error) throw error;
      const types = (demoRows || []).map((row: any) => row.teachertype_id);
      setExistingDemoTeachertypes(types);
      setHasDemoData(types.length > 0);
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
      toast.dismiss('email-required');
      toast.error('O email é obrigatório', { id: 'email-required' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: formData.email });
      if (error) throw error;
      toast.dismiss('email-success');
      toast.success('Email atualizado com sucesso!', { id: 'email-success' });
    } catch (error: any) {
      toast.dismiss('email-error');
      toast.error(error.message || 'Erro ao atualizar email', { id: 'email-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeacherTypes = async () => {
    if (!user?.id) return;

    if (selectedTeacherTypesLocal.length === 0) {
      toast.error('Selecione ao menos um tipo de professor antes de salvar');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('users_teachertypes')
        .delete()
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      const inserts = selectedTeacherTypesLocal.map((typeId) => ({
        user_id: user.id,
        teachertype_id: typeId,
      }));

      const { error: insertError } = await supabase.from('users_teachertypes').insert(inserts);
      if (insertError) throw insertError;

      toast.success('Tipos de professor salvos com sucesso!');
      await refetchSelectedTeacherTypes();
    } catch (err: any) {
      console.error('❌ Erro ao salvar tipos:', err);
      toast.error('Erro ao salvar tipos selecionados');
    }
  };

  const handleCreateDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.dismiss('not-authenticated');
      toast.error('Usuário não autenticado', { id: 'not-authenticated' });
      return;
    }

    if (validTeacherSelection !== true) {
      toast.dismiss('invalid-selection');
      toast.error('Selecione um tipo de ensino válido antes de continuar', { id: 'invalid-selection' });
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

      toast.dismiss('demo-success');
      toast.success('✅ Dados de demonstração criados com sucesso', { id: 'demo-success' });

      await refetchDemoStatus();
      localStorage.removeItem(`demo-banner-dismissed-${user.id}`);
    } catch (error: any) {
      toast.dismiss('demo-error');
      toast.error('❌ Erro ao criar dados: ' + (error.message || 'Erro desconhecido'), { id: 'demo-error' });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDeleteDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.dismiss('not-authenticated');
      toast.error('Usuário não autenticado', { id: 'not-authenticated' });
      return;
    }

    if (validTeacherSelection !== true) {
      toast.dismiss('invalid-selection');
      toast.error('Seleção inválida. Verifique os tipos de ensino antes de continuar.', { id: 'invalid-selection' });
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

      toast.dismiss('delete-success');
      toast.success('✅ Dados de demonstração excluídos com sucesso', { id: 'delete-success' });

      await refetchDemoStatus();
    } catch (error: any) {
      toast.dismiss('delete-error');
      toast.error('❌ Erro ao excluir dados: ' + (error.message || 'Erro desconhecido'), { id: 'delete-error' });
    } finally {
      setDemoLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const enableCreateButton = selectedTeacherTypesLocal.some(
    (typeId) => !existingDemoTeachertypes.includes(typeId)
  );

  const enableDeleteButton = selectedTeacherTypesLocal.some(
    (typeId) => existingDemoTeachertypes.includes(typeId)
  );

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
          onValidationChange={(isValid) => setValidTeacherSelection(isValid)}
        />
        <div className="mt-3">
          <Button onClick={handleSaveTeacherTypes} variant="default">
            <Save className="w-4 h-4 mr-2" /> Salvar tipos selecionados
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Dados de demonstração</h2>
        <div className="flex gap-4 items-center">
          <Button
            onClick={handleCreateDemoData}
            disabled={demoLoading || checkingDemoStatus || validTeacherSelection !== true || !enableCreateButton}
            title={
              validTeacherSelection !== true
                ? 'Seleção inválida: escolha 1 ou 2 tipos válidos'
                : !enableCreateButton
                ? 'Todos os conjuntos de demonstração já existem para os tipos selecionados'
                : undefined
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar um conjunto de dados de demonstração
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={demoLoading || checkingDemoStatus || validTeacherSelection !== true || !enableDeleteButton}
            variant="destructive"
            title={
              validTeacherSelection !== true
                ? 'Seleção inválida: escolha tipos válidos antes de excluir'
                : !enableDeleteButton
                ? 'Nenhum conjunto ativo para excluir'
                : undefined
            }
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir o conjunto de dados de demonstração
          </Button>
        </div>
        {selectedTeacherTypesLocal.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedTeacherTypesLocal.map((typeId) => (
              <p key={typeId} className="text-sm flex items-center gap-1">
                {existingDemoTeachertypes.includes(typeId) ? (
                  <span className="text-green-600">
                    <CheckCircle className="w-4 h-4" /> Conjunto ativo para tipo {typeId}
                  </span>
                ) : (
                  <span className="text-yellow-600">
                    <XCircle className="w-4 h-4" /> Nenhum conjunto ativo para tipo {typeId}
                  </span>
                )}
              </p>
            ))}
          </div>
        )}
        {selectedTeacherTypesLocal.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">Nenhum tipo de ensino selecionado</p>
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

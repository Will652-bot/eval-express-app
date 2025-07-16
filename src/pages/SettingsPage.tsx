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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ email: user?.email || '' });

  const { refetchSelectedTeacherTypes } = useSelectedTeacherTypes(user?.id || '');
  const [selectedTeacherTypesLocal, setSelectedTeacherTypesLocal] = useState<string[]>([]);
  const [validTeacherSelection, setValidTeacherSelection] = useState<boolean | null>(null);
  const [existingDemoTeachertypes, setExistingDemoTeachertypes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({ email: user.email || '' });
      fetchExistingDemoData();
    }
  }, [user]);

  const fetchExistingDemoData = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('demo_entities')
      .select('teachertype_id')
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao verificar dados de demonstração');
      console.error(error);
      return;
    }

    const demoTypes = data.map((row: any) => row.teachertype_id);
    setExistingDemoTeachertypes(demoTypes);
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error('O email é obrigatório');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: formData.email });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Email atualizado com sucesso!');
  };

  const handleSaveTeacherTypes = async () => {
    if (!user?.id) return;
    if (selectedTeacherTypesLocal.length === 0) {
      toast.error('Selecione ao menos um tipo');
      return;
    }

    await supabase.from('user_teachertypes').delete().eq('user_id', user.id);
    const inserts = selectedTeacherTypesLocal.map((typeId) => ({
      user_id: user.id,
      teachertype_id: typeId,
    }));
    const { error } = await supabase.from('user_teachertypes').insert(inserts);
    if (error) {
      toast.error('Erro ao salvar');
      return;
    }
    toast.success('Tipos salvos com sucesso');
    fetchExistingDemoData();
  };

  const handleCreateDemoData = async () => {
    if (!user?.id || !user?.email) return;
    const { error } = await supabase.rpc('generate_demo_data_by_type', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_teachertype_ids: selectedTeacherTypesLocal,
    });
    if (error) {
      toast.error('Erro ao criar dados');
      return;
    }
    toast.success('Dados criados com sucesso');
    fetchExistingDemoData();
  };

  const handleDeleteDemoData = async () => {
    if (!user?.id || !user?.email) return;
    const { error } = await supabase.rpc('delete_demo_data_by_type', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_teachertype_ids: selectedTeacherTypesLocal,
    });
    if (error) {
      toast.error('Erro ao excluir dados');
      return;
    }
    toast.success('Dados excluídos com sucesso');
    fetchExistingDemoData();
  };

  const canCreate = selectedTeacherTypesLocal.some(
    (id) => !existingDemoTeachertypes.includes(id)
  );

  const canDelete = selectedTeacherTypesLocal.some(
    (id) => existingDemoTeachertypes.includes(id)
  );

  return (
    <div className="p-4 space-y-6">
      <Card>
        <h2>Email</h2>
        <form onSubmit={handleEmailUpdate} className="flex gap-2">
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
        <h2>Tipo de ensino</h2>
        <TeacherTypeSelector
          userId={user?.id || ''}
          onSelectionChange={(types) => setSelectedTeacherTypesLocal(types)}
          onValidationChange={(isValid) => setValidTeacherSelection(isValid)}
        />
        <div className="mt-2">
          <Button onClick={handleSaveTeacherTypes}>
            <Save className="w-4 h-4 mr-2" /> Salvar tipos selecionados
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Dados de demonstração</h2>
        <div className="flex gap-4">
          <Button
            onClick={handleCreateDemoData}
            disabled={!canCreate || demoLoading || selectedTeacherTypesLocal.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" /> Criar um conjunto de dados de demonstração
          </Button>

          <Button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!canDelete || demoLoading || selectedTeacherTypesLocal.length === 0}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Excluir o conjunto de dados de demonstração
          </Button>
        </div>

        {selectedTeacherTypesLocal.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedTeacherTypesLocal.map((typeId) => (
              <p key={typeId} className="text-sm">
                {existingDemoTeachertypes.includes(typeId) ? (
                  <span className="text-green-600">✅ Conjunto ativo</span>
                ) : (
                  <span className="text-yellow-600">⚠️ Nenhum conjunto ativo</span>
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

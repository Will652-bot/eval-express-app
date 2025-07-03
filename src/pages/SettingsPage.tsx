import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordGenerator } from '../components/auth/PasswordGenerator';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, Trash2, Plus, Info, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
  const [checkingDemoStatus, setCheckingDemoStatus] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkDemoDataStatus();
  }, [user?.id]);

  const checkDemoDataStatus = async () => {
    if (!user?.id) return;
    try {
      setCheckingDemoStatus(true);
      const { data, error } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
      if (error) { throw error; }
      setHasDemoData(data);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
      setHasDemoData(false);
    } finally {
      setCheckingDemoStatus(false);
    }
  };

  const refetchDemoStatus = async () => {
    await checkDemoDataStatus();
  };

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
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
      toast.success('Email atualizado com sucesso! Por favor, verifique seu email para confirmar a alteração.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar email');
    } finally {
      setLoading(false);
    }
  };

  // ✅ =========================================================
  // ✅ FONCTION DE MISE À JOUR DU MOT DE PASSE CORRIGÉE
  // ✅ =========================================================
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validatePassword(formData.newPassword)) {
      toast.error('A nova senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    setFormData(prev => ({
      ...prev,
      newPassword: password,
      confirmPassword: password,
    }));
  };

  // ... (Toute votre logique de gestion des données de démo reste identique)
  const handleCreateDemoData = async () => { /* ... votre code existant ... */ };
  const handleDeleteDemoData = async () => { /* ... votre code existant ... */ };
  const getStatusMessage = () => { /* ... votre code existant ... */ };
  // ...

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Conta</h1>
        <p className="mt-1 text-gray-500">
          Gerencie suas informações de conta e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* La carte de gestion des données de démo reste identique */}
        <Card>{/* ... votre JSX pour les données de démo ... */}</Card>

        <Card>
          <form onSubmit={handleEmailUpdate} className="space-y-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Alterar Email</h2>
            <Input
              label="Novo Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <Button type="submit" isLoading={loading}>
              Atualizar Email
            </Button>
          </form>
        </Card>

        <Card>
          <form onSubmit={handlePasswordUpdate} className="space-y-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
            
            {/* ✅ CORRECTION: Le champ "Senha Atual" a été retiré car il est inutile */}

            <Input
              label="Nova Senha"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              fullWidth
            />
            <PasswordGenerator onGenerate={handlePasswordGenerate} />
            <Button type="submit" isLoading={loading}>
              Atualizar Senha
            </Button>
          </form>
        </Card>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Dados de Demonstração"
        message="Tem certeza que deseja excluir todos os dados de demonstração?&#10;Esta ação não pode ser desfeita."
        onConfirm={handleDeleteDemoData}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

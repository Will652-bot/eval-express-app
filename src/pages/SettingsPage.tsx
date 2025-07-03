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
    if (user?.id) {
      checkDemoDataStatus();
    }
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

  const handleCreateDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }
    setDemoLoading(true);
    try {
      const { data: hasData, error: checkError } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
      if (checkError) { throw checkError; }
      if (hasData === true) {
        toast.error('Conjunto de dados de demonstração já ativo');
        return;
      }
      const { error } = await supabase.rpc('generate_demo_data', { p_user_id: user.id, p_user_email: user.email });
      if (error) throw error;
      toast.success('✅ Dados de demonstração criados com sucesso');
      await refetchDemoStatus();
      localStorage.removeItem(`demo-banner-dismissed-${user.id}`);
    } catch (error: any) {
      toast.error('❌ Erro ao criar dados de demonstração: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDeleteDemoData = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }
    setDemoLoading(true);
    try {
      const { data: hasData, error: checkError } = await supabase.rpc('has_demo_data_to_delete', { p_user_id: user.id });
      if (checkError) { throw checkError; }
      if (hasData === false) {
        toast.error('Nenhum conjunto de dados de demonstração está ativo');
        return;
      }
      const { error } = await supabase.rpc('delete_demo_data', { p_user_id: user.id, p_user_email: user.email });
      if (error) {
        if (error.message?.includes('No demo data found for this user')) {
          toast.error('⚠️ Nenhum dado de demonstração encontrado para exclusão.');
          await refetchDemoStatus();
        } else {
          throw error;
        }
      } else {
        toast.success('✅ Dados de demonstração excluídos com sucesso');
        await refetchDemoStatus();
      }
    } catch (error: any) {
      toast.error('❌ Erro ao excluir dados de demonstração: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDemoLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusMessage = () => {
    if (checkingDemoStatus || hasDemoData === null) {
      return { message: '🔄 Verificando status dos dados de demonstração...', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800', icon: <Info className="h-4 w-4" /> };
    }
    if (hasDemoData) {
      return { message: '✅ Você possui dados de demonstração ativos em sua conta.', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> };
    }
    return { message: '💡 Nenhum conjunto de dados de demonstração está ativo. Crie um conjunto para explorar a plataforma.', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800', icon: <XCircle className="h-4 w-4 text-blue-600" /> };
  };

  const statusInfo = getStatusMessage();

  const getCreateTooltip = () => {
    if (hasDemoData) { return "Você já possui dados de demonstração ativos"; }
    return "Criar dados de exemplo para explorar todas as funcionalidades";
  };

  const getDeleteTooltip = () => {
    if (!hasDemoData) { return "Nenhum conjunto de dados de demonstração encontrado"; }
    return "Remover todos os dados de demonstração da sua conta";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Conta</h1>
        <p className="mt-1 text-gray-500">
          Gerencie suas informações de conta e preferências
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dados de Demonstração</h2>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Debug: {hasDemoData === null ? 'null' : hasDemo

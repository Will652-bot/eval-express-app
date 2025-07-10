import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, Trash2, Plus, Info, CheckCircle, XCircle } from 'lucide-react';
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

  const { selectedTeacherTypes, refetchSelectedTeacherTypes } = useSelectedTeacherTypes(user?.id || '');

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
    if (selectedTeacherTypes.length === 0 || selectedTeacherTypes.length > 2) {
      toast.error('Selecione 1 ou 2 tipos de ensino');
      return;
    }
    setDemoLoading(true);
    try {
      const { error } = await supabase.rpc('generate_demo_data_by_type', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_teachertype_ids: selectedTeacherTypes,
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
    if (selectedTeacherTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de ensino');
      return;
    }
    setDemoLoading(true);
    try {
      const { error } = await supabase.rpc('delete_demo_data_by_type', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_teachertype_ids: selectedTeacherTypes,
      });
      if (error) throw error;

      toast.success

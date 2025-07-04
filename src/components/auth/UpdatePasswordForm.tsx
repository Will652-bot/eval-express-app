import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const UpdatePasswordForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.newPassword)) {
      toast.error('A nova senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    setFormData({
      newPassword: password,
      confirmPassword: password,
    });
  };

  return (
    <form onSubmit={handlePasswordUpdate} className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
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
  );
};

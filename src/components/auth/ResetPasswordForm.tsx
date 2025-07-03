import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) {
      toast.error('A senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso! Você já pode fazer o login com sua nova senha.');
      
      await supabase.auth.signOut();
      navigate('/login');

    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao redefinir a senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    setFormData({
      password: password,
      confirmPassword: password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <Input
        label="Nova Senha"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
      <Button type="submit" isLoading={loading} className="w-full">
        Salvar Nova Senha
      </Button>
    </form>
  );
};

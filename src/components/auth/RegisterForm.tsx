import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getEmailRedirectUrl = () => {
    return `${window.location.origin}/verify`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

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
      const redirectUrl = getEmailRedirectUrl();
      sessionStorage.setItem('signup-email', formData.email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'teacher',
            subscription_plan: 'free'
          },
          emailRedirectTo: redirectUrl
        }
      });

      console.log('📬 [RegisterForm] signUp →', {
        email: formData.email,
        error: authError?.message || 'none',
        userId: authData.user?.id || 'none',
      });

      if (authError) {
        if (authError.message?.includes('user already registered')) {
          toast.error('Este email já está registrado. Verifique seu email.');
        } else if (authError.message?.includes('email_address_invalid')) {
          toast.error('Email inválido.');
        } else if (authError.message?.includes('over_email_send_rate_limit')) {
          toast.error('Limite de envio excedido. Tente mais tarde.');
        } else {
          toast.error('Erro durante o cadastro. Verifique seu email.');
        }
      } else {
        toast.success('Conta criada! Verifique seu email para confirmação.');

        try {
          if (authData.user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: formData.email,
                role: 'teacher',
                current_plan: 'free'
              });

            if (insertError && !insertError.message.includes('duplicate key')) {
              console.warn('⚠️ [RegisterForm] Erro ao inserir usuário:', insertError.message);
            } else {
              console.log('✅ [RegisterForm] Usuário inserido com sucesso na tabela users');
            }
          }
        } catch (insertErr: any) {
          console.error('⚠️ [RegisterForm] Exception ao inserir usuário:', insertErr.message);
        }
      }

      navigate('/check-email');
    } catch (err: any) {
      console.error('❌ [RegisterForm] Exception signup:', err.message);
      toast.error('Erro inesperado. Verifique seu email para continuar.');
      navigate('/check-email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        fullWidth
      />

      <div className="space-y-4">
        <Input
          label="Senha"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          fullWidth
        />

        <Input
          label="Confirmação de Senha"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          fullWidth
        />

        <PasswordGenerator onGenerate={handlePasswordGenerate} />
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={loading}
      >
        Criar Conta
      </Button>
    </form>
  );
};

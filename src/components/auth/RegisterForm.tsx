
// src/components/auth/RegisterForm.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator'; // Importe o gerador de senha
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // Campo para confirmação de senha
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... (restante da lógica de validação e submit)
    // A lógica de OTP é acionada aqui, APÓS a validação da senha
    // ...
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: 'teacher',
          subscription_plan: 'free'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message?.includes('user already registered')) {
        toast.error('Este e-mail já está registrado. Um código de verificação foi enviado para ele.');
        await supabase.auth.signInWithOtp({ email: formData.email });
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}&type=email`);
      } else if (signUpError.message?.includes('email_address_invalid')) {
        toast.error('E-mail inválido.');
      } else if (signUpError.message?.includes('over_email_send_rate_limit')) {
        toast.error('Limite de envio excedido. Por favor, tente novamente mais tarde.');
      } else {
        toast.error('Erro durante o cadastro. Por favor, verifique seu e-mail e tente novamente.');
      }
    } else {
      toast.success('Conta criada com sucesso! Por favor, insira o código de verificação enviado para seu e-mail.');
      // Lógica para inserir usuário na tabela 'users'
      try {
        if (data.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
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
        console.error('⚠️ [RegisterForm] Exceção ao inserir usuário:', insertErr.message);
      }
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}&type=email`);
    }
    setLoading(false);
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
        label="E-mail"
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

        {/* Componente para gerar senha forte */}
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

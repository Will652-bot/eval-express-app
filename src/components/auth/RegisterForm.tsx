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

  // ✅ PHASE 2: Configuration correcte de la redirection email
  const getEmailRedirectUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify`;
  };

  // ✅ PHASE 2: Flux d'enregistrement optimisé SANS latences artificielles
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
      
      console.log('📝 [RegisterForm] Début inscription:', {
        email: formData.email, 
        redirectTo: redirectUrl
      });

      // ✅ PHASE 2: Appel signUp IMMÉDIAT sans latence
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

      console.log('📊 [RegisterForm] Réponse Supabase:', {
        hasUser: !!authData.user,
        hasSession: !!authData.session,
        error: authError?.message || 'aucune'
      });

      // ✅ PHASE 2: REDIRECTION SYSTÉMATIQUE vers check-email
      // Même en cas d'erreur, car l'utilisateur a probablement été créé
      console.log('🔄 [RegisterForm] Redirection vers check-email');
      
      // Stocker l'email pour la page check-email
      sessionStorage.setItem('signup-email', formData.email);
      
      if (authError) {
        console.warn('⚠️ [RegisterForm] Erreur signUp mais redirection quand même:', authError.message);
        
        // Messages d'erreur spécifiques mais redirection quand même
        if (authError.message?.includes('already registered')) {
          toast.error('Este email já está registrado. Redirecionando...');
        } else if (authError.message?.includes('email_address_invalid')) {
          toast.error('Email inválido. Verifique o endereço.');
        } else if (authError.message?.includes('over_email_send_rate_limit')) {
          toast.error('Limite de envio excedido. Aguarde antes de tentar novamente.');
        } else {
          toast.error('Possível problema na criação. Verifique seu email para confirmação.');
        }
      } else {
        // Insérer dans la table users si pas d'erreur
        try {
          if (authData.user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: formData.email,
                role: 'teacher',
                subscription_plan: 'free'
              });

            if (insertError && !insertError.message.includes('duplicate key')) {
              console.warn('⚠️ [RegisterForm] Erreur insertion users:', insertError.message);
            }
          }
        } catch (insertErr: any) {
          console.warn('⚠️ [RegisterForm] Exception insertion users:', insertErr.message);
        }

        toast.success('Conta criada! Verifique seu email para confirmar.');
      }

      // ✅ REDIRECTION IMMÉDIATE dans tous les cas
      navigate('/check-email');

    } catch (error: any) {
      console.error('❌ [RegisterForm] Exception inscription:', error);
      
      // ✅ Même en cas d'exception, rediriger car l'utilisateur peut avoir été créé
      sessionStorage.setItem('signup-email', formData.email);
      toast.error('Erro durante o cadastro. Verifique seu email para confirmação.');
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
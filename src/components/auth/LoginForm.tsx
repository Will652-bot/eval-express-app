import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // ✅ PHASE 3: LoginForm optimisé SANS gestion de redirection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      console.log('🔐 [LoginForm] Tentative connexion:', formData.email);

      // ✅ PHASE 3: Utiliser signIn du contexte SANS redirection
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        console.error('❌ [LoginForm] Erreur connexion:', error.message);

        // ✅ Gestion spécifique des erreurs
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Email ou senha incorretos. Verifique seus dados.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Você precisa verificar seu e-mail antes de continuar.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
        } else if (error.message.includes('User not found')) {
          setLoginError('Usuário não encontrado. Verifique seu email ou crie uma conta.');
        } else {
          setLoginError('Email ou senha incorretos. Verifique seus dados.');
        }
        return;
      }

      console.log('✅ [LoginForm] Connexion réussie - AuthContext gère la redirection');
      toast.success('Login realizado com sucesso!');
      
      // ✅ PHASE 3: Nettoyer le formulaire seulement
      setFormData({ email: '', password: '' });
      
    } catch (error: any) {
      console.error('❌ [LoginForm] Exception connexion:', error);
      setLoginError('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Digite seu email antes de reenviar o link de verificação.');
      return;
    }

    if (resendLoading) {
      return; // Prevent multiple clicks
    }

    setResendLoading(true);

    try {
      console.log('📧 [LoginForm] Renvoi email vérification via Edge Function:', formData.email);

      const response = await fetch("https://xjguygjmwdjpdlursobr.supabase.co/functions/v1/resend-verification", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ [LoginForm] Erreur Edge Function:', data.error);
        toast.error("Erro ao reenviar email: " + (data.error || 'Erro desconhecido'));
        return;
      }

      console.log('✅ [LoginForm] Email reenviado via Edge Function');
      toast.success('📩 Email de verificação reenviado com sucesso! Verifique sua caixa de entrada.');
      
    } catch (error: any) {
      console.error('❌ [LoginForm] Exception Edge Function:', error);
      toast.error('Erro de conexão ao reenviar email. Tente novamente.');
    } finally {
      // Add a delay to prevent spam clicking
      setTimeout(() => {
        setResendLoading(false);
      }, 3000); // 3 seconds delay
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          fullWidth
          autoComplete="email"
        />

        <div className="space-y-2">
          <Input
            label="Senha"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
            autoComplete="current-password"
          />

          {/* ✅ Affichage des erreurs de connexion */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          <div className="text-right">
            <Link
              to="/request-password-reset"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={loading}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      {/* ✅ NOUVEAU: Lien de renvoi d'email de vérification */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resendLoading || !formData.email}
          className={`text-sm font-medium transition-colors ${
            resendLoading || !formData.email
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-orange-600 hover:text-orange-700 cursor-pointer'
          }`}
        >
          {resendLoading ? '📩 Enviando...' : '📩 Reenviar email de verificação'}
        </button>
        {!formData.email && (
          <p className="text-xs text-gray-500 mt-1">
            Digite seu email acima para reenviar a verificação
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Problemas para fazer login?
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Verifique se o email e senha estão corretos</li>
          <li>• Confirme seu email se ainda não o fez (verifique spam/lixo eletrônico)</li>
          <li>• Use "Esqueceu sua senha?" se não lembrar da senha</li>
          <li>• Certifique-se de ter uma conta registrada</li>
        </ul>
        
        <div className="mt-3 space-y-2">
          <Link
            to="/register"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium block"
          >
            Não tem uma conta? Registre-se aqui
          </Link>
        </div>
      </div>
    </div>
  );
};
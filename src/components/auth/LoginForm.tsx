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
  const [loginError, setLoginError] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      console.log('🔐 [LoginForm] Tentative connexion:', formData.email);

      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        console.error('❌ [LoginForm] Erreur connexion:', error.message);

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
      
      setFormData({ email: '', password: '' });
      
    } catch (error: any) {
      console.error('❌ [LoginForm] Exception connexion:', error);
      setLoginError('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Digite seu email primeiro');
      return;
    }

    try {
      console.log('📧 [LoginForm] Renvoi email vérification:', formData.email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`
        }
      });

      if (error) {
        console.error('❌ [LoginForm] Erreur renvoi email:', error.message);
        toast.error('Erro ao reenviar email de verificação');
        return;
      }

      console.log('✅ [LoginForm] Email renvoyé avec succès');
      toast.success('Email de verificação reenviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('❌ [LoginForm] Exception renvoi email:', error);
      toast.error('Erro ao reenviar email de verificação');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
            autoComplete="current-password"
          />

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
          
          <button
            type="button"
            onClick={handleResendVerification}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            disabled={loading}
          >
            Reenviar email de verificação
          </button>
        </div>
      </div>
    </div>
  );
};

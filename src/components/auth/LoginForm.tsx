import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
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
      console.log('🔐 [LoginForm] Tentando login para:', formData.email);

      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        console.warn('❌ [LoginForm] Erro ao fazer login:', error.message);

        if (error.message.includes('Invalid login credentials')) {
          setLoginError('E-mail ou senha incorretos. Verifique seus dados.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Seu e-mail ainda não foi verificado. Redirecionando para a página de verificação...');
          await supabase.auth.signInWithOtp({ email: formData.email });
          navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}&type=email`);
          return;
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Muitas tentativas. Por favor, aguarde alguns minutos e tente novamente.');
        } else if (error.message.includes('User not found')) {
          setLoginError('Usuário não encontrado. Verifique seu e-mail ou crie uma conta.');
        } else {
          setLoginError('Erro ao fazer login. Por favor, tente novamente.');
        }
        return;
      }

      toast.success('Login realizado com sucesso!');
      setFormData({ email: '', password: '' });
      console.log('✅ [LoginForm] Login bem-sucedido - redirecionamento via AuthContext');

    } catch (err: any) {
      console.error('❌ [LoginForm] Exceção:', err.message);
      setLoginError('Erro inesperado ao fazer login. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="E-mail"
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

      {/* Seção de ajuda atualizada para o fluxo OTP */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Problemas para fazer login?
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Verifique se o e-mail e a senha estão corretos.</li>
          <li>• Se você é um novo usuário ou seu e-mail não está confirmado, um código de verificação foi enviado (ou será enviado) para sua caixa de entrada. Use-o na página de verificação.</li>
          <li>• Use "Esqueceu sua senha?" para receber um novo código de acesso por e-mail.</li>
          <li>• Certifique-se de ter uma conta registrada.</li>
          <li>• Verifique também a pasta de spam/lixo eletrônico para o código.</li>
        </ul>
        
        {/* >>> DÉBUT DE LA CORRECTION : Ajout du lien "Não tem uma conta? Registre-se aqui" <<< */}
        <div className="mt-3 space-y-2">
          <Link
            to="/register"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium block"
          >
            Não tem uma conta? Registre-se aqui
          </Link>
        </div>
        {/* >>> FIN DE LA CORRECTION <<< */}
      </div>
    </div>
  );
};

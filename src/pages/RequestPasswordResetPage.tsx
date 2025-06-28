import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const RequestPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor, digite seu email');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, digite um email válido');
      return;
    }

    setLoading(true);

    try {
      // ✅ CORRECTION: Utiliser la bonne URL de redirection
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        
        if (error.message.includes('rate_limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        } else if (error.message.includes('email_not_confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada primeiro.');
        } else {
          toast.error('Erro ao enviar email de recuperação. Verifique se o email está correto.');
        }
        return;
      }

      setEmailSent(true);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Erro inesperado ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              Email Enviado!
            </h1>
            <p className="mt-2 text-gray-600">
              Enviamos um link de recuperação para <strong>{email}</strong>
            </p>
          </div>

          <Card>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Verifique sua caixa de entrada
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Clique no link no email para redefinir sua senha</li>
                        <li>O link expira em 1 hora por segurança</li>
                        <li>Verifique também a pasta de spam/lixo eletrônico</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                >
                  Enviar Novamente
                </Button>
                
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="w-full"
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Voltar ao Login
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-gray-600">
            Digite seu email para receber um link de recuperação de senha
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              placeholder="Digite seu email cadastrado"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao login</span>
          </button>
          
          <p className="text-xs text-gray-500">
            Não tem uma conta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Cadastre-se aqui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
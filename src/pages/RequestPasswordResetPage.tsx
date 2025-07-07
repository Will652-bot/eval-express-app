import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase'; // Verifique se o caminho está correto
import toast from 'react-hot-toast';

export const RequestPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  // Não precisamos mais de 'emailSent' para a tela de sucesso, pois redirecionaremos para /verify-otp
  // const [emailSent, setEmailSent] = useState(false); 

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor, digite seu e-mail.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, digite um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      // REMOVIDO: redirectTo, agora o Supabase enviará o OTP via template configurado
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        
        if (error.message.includes('rate_limit')) {
          toast.error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else if (error.message.includes('email_not_confirmed')) {
          // Se o e-mail não estiver confirmado, ainda podemos tentar enviar o OTP para que ele possa acessar
          toast.error('E-mail não confirmado. Um código de verificação foi enviado para ele.');
          navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=recovery`);
        } else {
          toast.error('Erro ao enviar código de recuperação. Verifique se o e-mail está correto.');
        }
        // Não retornamos aqui para permitir a navegação para verify-otp mesmo com alguns erros
      } else {
        toast.success('Código de recuperação enviado! Por favor, verifique seu e-mail.');
        // Redirecionar para a página de inserção de OTP, especificando o tipo 'recovery'
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=recovery`);
      }
      
    } catch (error: any) {
      console.error('❌ [RequestPasswordResetPage] Exceção na solicitação de redefinição:', error.message);
      toast.error('Ocorreu um erro inesperado. Por favor, tente novamente.');
      // Em caso de erro inesperado grave, redirecionar para a página de verificação se o e-mail foi enviado
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&type=recovery`);
    } finally {
      setLoading(false);
    }
  };

  // REMOVIDO: handleResendEmail e a renderização condicional de emailSent não são mais necessárias
  // porque a navegação para /verify-otp acontece diretamente e o reenviar está na página verify-otp.

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
            Digite seu e-mail para receber um código de verificação.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              placeholder="Digite seu e-mail cadastrado"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Código de Verificação'}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o Login</span>
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
        <p className="mt-4 text-center text-xs text-gray-500">
          Um código de verificação será enviado para o seu e-mail. Use-o para acessar sua conta e, em seguida, defina uma nova senha nas configurações.
        </p>
      </div>
    </div>
  );
};

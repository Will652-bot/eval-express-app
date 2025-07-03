// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email);

      if (error) {
        toast.error(error.message || 'Erro ao enviar o link de acesso.');
      } else {
        toast.success('Link de acesso enviado! Verifique seu email.');
        setEmail('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
          placeholder="seu.email@exemplo.com"
        />
        <Button
          type="submit"
          className="w-full"
          isLoading={loading}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Como funciona o acesso?
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Digite seu email e clique no botão acima.</li>
          <li>• Você receberá um email com um link de acesso seguro.</li>
          <li>• Clique no link para entrar na sua conta sem precisar de senha.</li>
        </ul>
        <div className="mt-3">
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

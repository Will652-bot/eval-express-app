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
        setEmail(''); // Vider le champ après l'envoi
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
    </div>
  );
};

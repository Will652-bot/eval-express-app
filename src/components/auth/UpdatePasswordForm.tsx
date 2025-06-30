import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UpdatePasswordFormProps {
  isResetFlow?: boolean;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({ 
  isResetFlow = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) {
      toast.error('A senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    // ✅ CORRECTION CRITIQUE: Ne pas exiger l'ancien mot de passe en mode récupération
    if (!isResetFlow && !formData.currentPassword) {
      toast.error('A senha atual é obrigatória');
      return;
    }

    setLoading(true);

    try {
      // Récupérer le code de l'URL si on est en mode reset
      let resetCode = null;
      if (isResetFlow) {
        const urlParams = new URLSearchParams(location.search);
        resetCode = urlParams.get('code');
        
        if (!resetCode) {
          toast.error('Código de redefinição não encontrado');
          setLoading(false);
          return;
        }
        
        // Utiliser verifyOtp pour réinitialiser le mot de passe
        const { error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token: resetCode,
          password: formData.password
        });
        
        if (error) {
          console.error('Error resetting password:', error);
          toast.error(error.message || 'Erro ao redefinir senha');
          setLoading(false);
          return;
        }
      } else {
        // Mode normal: vérifier l'ancien mot de passe d'abord
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          toast.error('Usuário não encontrado');
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword,
        });

        if (signInError) {
          toast.error('Senha atual incorreta');
          setLoading(false);
          return;
        }

        // Mettre à jour le mot de passe
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (error) throw error;
      }

      // ✅ CORRECTION: Messages et redirections adaptés au contexte
      if (isResetFlow) {
        toast.success('Senha redefinida com sucesso! Você pode agora fazer login com sua nova senha.');
        // Déconnecter l'utilisateur pour qu'il se reconnecte avec la nouvelle senha
        await supabase.auth.signOut();
        navigate('/login');
      } else {
        toast.success('Senha atualizada com sucesso!');
        // En mode normal, réinitialiser le formulaire
        setFormData({
          currentPassword: '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (isResetFlow) {
        toast.error('Erro ao redefinir senha. Tente solicitar um novo link de recuperação.');
      } else {
        toast.error(error.message || 'Erro ao atualizar senha');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* ✅ CORRECTION: Titre adaptatif selon le contexte */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isResetFlow ? 'Redefinir Senha' : 'Alterar Senha'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isResetFlow 
            ? 'Digite sua nova senha abaixo'
            : 'Digite sua senha atual e a nova senha'
          }
        </p>
      </div>

      {/* ✅ CORRECTION CRITIQUE: Campo senha atual SEULEMENT en mode normal */}
      {!isResetFlow && (
        <Input
          label="Senha Atual"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          required={!isResetFlow}
          fullWidth
        />
      )}

      <Input
        label="Nova Senha"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        fullWidth
      />

      <Input
        label="Confirmar Nova Senha"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        required
        fullWidth
      />

      <PasswordGenerator onGenerate={handlePasswordGenerate} />

      <Button type="submit" isLoading={loading} className="w-full">
        {isResetFlow ? 'Redefinir Senha' : 'Atualizar Senha'}
      </Button>

      {/* ✅ NOUVEAU: Lien de retour en mode récupération */}
      {isResetFlow && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Voltar ao login
          </button>
        </div>
      )}
    </form>
  );
};
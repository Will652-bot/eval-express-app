import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

/**
 * Ce composant gère la mise à jour du mot de passe pour un utilisateur déjà connecté.
 */
export const UpdatePasswordForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  /**
   * Valide la force du mot de passe.
   */
  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password);
    const isLongEnough = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  };

  /**
   * Gère la soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Valider que les nouveaux mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    // 2. Valider la force du mot de passe
    if (!validatePassword(formData.password)) {
      toast.error('A senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais');
      setLoading(false);
      return;
    }

    try {
      // 3. Appeler directement updateUser. C'est la seule étape nécessaire.
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      toast.success('Senha atualizada com sucesso!');
      
      // Vider les champs du formulaire
      setFormData({
        password: '',
        confirmPassword: '',
      });

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      // 4. Arrêter le chargement, quoi qu'il arrive
      setLoading(false);
    }
  };

  /**
   * Gère la génération d'un mot de passe fort.
   */
  const handlePasswordGenerate = (password: string) => {
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Alterar Senha
        </h2>
      </div>

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
        Atualizar Senha
      </Button>
    </form>
  );
};

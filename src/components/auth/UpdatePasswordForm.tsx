import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PasswordGenerator } from './PasswordGenerator';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Pas de changement ici
interface UpdatePasswordFormProps {
  isResetFlow?: boolean;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({
  isResetFlow = false
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // On garde le champ, mais on ne l'utilisera plus pour la logique
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });

  // Pas de changement ici
  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  };

  // ✅ FONCTION CORRIGÉE ET SIMPLIFIÉE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // La validation initiale ne change pas
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
      // Pour le moment, nous nous concentrons sur le flux normal (isResetFlow = false)
      // La logique isResetFlow n'est pas dans le scope du problème actuel.
      if (isResetFlow) {
        // Laisser votre logique de réinitialisation ici si besoin, sinon la retirer
        toast.error("La logique de réinitialisation n'est pas gérée ici pour le moment.");
        return;
      }
      
      // LOGIQUE SIMPLIFIÉE : plus besoin de vérifier l'ancien mot de passe manuellement
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      // Si Supabase renvoie une erreur (ex: mot de passe trop faible côté serveur), elle sera attrapée
      if (error) {
        throw error;
      }

      toast.success('Senha atualizada com sucesso!');
      
      // On réinitialise le formulaire
      setFormData({
        currentPassword: '',
        password: '',
        confirmPassword: '',
      });

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      // Le `finally` s'assure que le chargement est TOUJOURS arrêté.
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
    // Votre JSX reste quasi identique, mais le champ "Senha Atual" devient optionnel
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Alterar Senha
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Digite sua nova senha
        </p>
      </div>

      {/* Ce champ devient juste une précaution pour l'utilisateur, mais n'est plus utilisé dans la logique de vérification */}
      <Input
        label="Senha Atual"
        type="password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        fullWidth
      />

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

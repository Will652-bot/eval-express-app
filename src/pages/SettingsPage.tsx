// src/pages/SettingsPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import toast from 'react-hot-toast';
import { TeacherTypeSelector } from '@/features/teacherTypeSelector/TeacherTypeSelector';

export default function SettingsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // NOUVEAUX ÉTATS POUR LE MOT DE PASSE
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nouveau champ de confirmation
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [selectedTeacherTypes, setSelectedTeacherTypes] = useState<string[]>([]);
  const [savedTeacherTypes, setSavedTeacherTypes] = useState<string[]>([]);
  const [demoDataStatus, setDemoDataStatus] = useState<{ [key: string]: boolean }>({});

  const fetchTeacherTypes = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('users_teachertypes')
      .select('teachertype_id')
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
      toast.error('Erro ao carregar tipos de professor');
    } else {
      const ids = data.map((item) => item.teachertype_id);
      setSelectedTeacherTypes(ids);
      setSavedTeacherTypes(ids);
    }
  };

  useEffect(() => {
    fetchTeacherTypes();
    checkExistingDemoData();
  }, [user?.id]); // Ajout user?.id comme dépendance pour fetchTeacherTypes et checkExistingDemoData

  const handleSaveEmail = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      toast.error('Erro ao atualizar email');
    } else {
      toast.success('Email atualizado com sucesso');
    }
    setSaving(false);
  };

  // FONCTION MODIFIÉE POUR LE CHANGEMENT DE MOT DE PASSE AVEC CONFIRMATION
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor, preencha ambos os campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem. Por favor, verifique.');
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      // Supabase peut retourner des erreurs comme "Password should be at least 6 characters"
      toast.error(`Erro ao atualizar senha: ${error.message}`);
    } else {
      toast.success('Senha atualizada com sucesso!');
      setNewPassword(''); // Réinitialiser le champ après succès
      setConfirmPassword(''); // Réinitialiser le champ de confirmation
    }
    setPasswordSaving(false);
  };

  const handleSaveTeacherTypes = async () => {
    if (!user?.id) return;

    const deleteRes = await supabase
      .from('users_teachertypes')
      .delete()
      .eq('user_id', user.id);

    if (deleteRes.error) {
      toast.error('Erro ao limpar tipos antigos');
      return;
    }

    const inserts = selectedTeacherTypes.map((id) => ({
      user_id: user.id,
      teachertype_id: id,
    }));

    const insertRes = await supabase.from('users_teachertypes').insert(inserts);

    if (insertRes.error) {
      toast.error('Erro ao salvar tipos de professor');
    } else {
      toast.success('Tipos de professor atualizados');
      setSavedTeacherTypes([...selectedTeacherTypes]);
      checkExistingDemoData();
    }
  };

  const checkExistingDemoData = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('demo_entities')
      .select('teachertype_id')
      .eq('user_id', user.id);

    if (error) return;

    const status: { [key: string]: boolean } = {};
    data.forEach((e) => {
      status[e.teachertype_id] = true;
    });

    setDemoDataStatus(status);
  };

  // generateDemoFunctionByType est nécessaire car il y a des fonctions SQL distinctes par type.
  const generateDemoFunctionByType = (typeId: string) => {
    const mapping: { [key: string]: string } = {
      'faculdade': 'generate_demo_data_faculdade',
      'concurso': 'generate_demo_data_concurso',
      'criancas': 'generate_demo_data_criancas',
      'fundamental': 'generate_demo_data_fundamental',
      'medio': 'generate_demo_data_medio',
    };
    return mapping[typeId] || null;
  };

  const getTeachertypeKey = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('teachertypes')
      .select('teachertype')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const label = data.teachertype.toLowerCase();
    if (label.includes('faculdade')) return 'faculdade';
    if (label.includes('concurso')) return 'concurso';
    if (label.includes('infantil') || label.includes('criança')) return 'criancas';
    if (label.includes('fundamental')) return 'fundamental';
    if (label.includes('médio') || label.includes('medio')) return 'medio';
    return null;
  };

  const createDemoData = async () => {
    if (!user?.id || !user?.email) { // S'assurer que user.id et user.email sont disponibles
      toast.error('Informações de l\'utilisateur incomplètes.');
      return;
    }
    let allSucceeded = true; // Drapeau pour le succès global
    let createdCount = 0;   // Compteur des créations réussies

    for (const id of savedTeacherTypes) {
      if (!demoDataStatus[id]) { // Seulement si les données de démo n'existent pas encore pour ce type
        const key = await getTeachertypeKey(id);
        const fn = key && generateDemoFunctionByType(key); // Obtient le nom de la fonction SQL

        if (fn) { // Si un nom de fonction valide a été trouvé
          try {
            const res = await supabase.rpc(fn, {
              p_user_id: user.id,
              p_user_email: user.email,
              p_teachertype_id: id, // ID du type de professeur (UUID)
            });
            if (res.error) {
              allSucceeded = false; // Marquer l'échec
              console.error(`Erro ao gerar dados para ${key}:`, res.error);
              toast.error(`Erro ao gerar dados: ${key} (${res.error.message || res.error.details || 'erro desconhecido'})`); // Message d'erreur plus détaillé
            } else {
              createdCount++; // Incrémenter le compteur de succès
            }
          } catch (e: any) { // Attraper les erreurs réseau, etc.
            allSucceeded = false; // Marquer l'échec
            console.error(`Erro inesperado ao gerar dados para ${key}:`, e);
            toast.error(`Erro inesperado ao gerar dados: ${key} (${e.message || 'erro desconhecido'})`); // Message d'erreur plus détaillé
          }
        } else {
          allSucceeded = false; // Marquer l'échec si la fonction n'est pas trouvée
          toast.error(`Erro: Função de demonstração não encontrada para o tipo ${key || id}.`); // Si le mapping a échoué
        }
      }
    }

    // Messages de résumé global après la boucle
    if (allSucceeded && createdCount > 0) {
        toast.success(`Dados de demonstração criados com sucesso para ${createdCount} tipo(s)!`);
    } else if (!allSucceeded) {
        toast.error('O processo de geração de dados de demonstração foi concluído com erros.');
    } else { // createdCount est 0 et allSucceeded est true (aucun nouveau type à créer)
        toast.info('Nenhum dado de demonstração novo foi criado.');
    }
    checkExistingDemoData(); // Re-vérifier l'état des dados de démo après tout
  };

  const deleteDemoData = async () => {
    if (!user?.id || !user?.email) { // S'assurer que user.id et user.email sont disponibles
      toast.error('Informações de l\'utilisateur incomplètes pour l\'exclusion.');
      return;
    }
    let allSucceeded = true; // Drapeau pour le succès global
    let deletedCount = 0;   // Compteur des suppressions réussies

    // MODIFICATION CLÉ ICI : Itérer sur selectedTeacherTypes au lieu de savedTeacherTypes
    for (const id of selectedTeacherTypes) { 
      if (demoDataStatus[id]) { // Seulement si les données de démo existent pour ce type
        try {
          const res = await supabase.rpc('delete_demo_data_by_type', {
            p_user_id: user.id,
            p_user_email: user.email, 
            p_teachertype_id: id,
          });
          if (res.error) {
            allSucceeded = false; // Marquer l'échec
            console.error(`Erro ao excluir dados para tipo ${id}:`, res.error);
            toast.error(`Erro ao excluir dados: ${id} (${res.error.message || res.error.details || 'erro desconhecido'})`); // Message d'erreur plus détaillé
          } else {
            deletedCount++; // Incrémenter le compteur de succès
          }
        } catch (e: any) { // Attraper les erreurs réseau, etc.
          allSucceeded = false; // Marquer l'échec
          console.error(`Erro inesperado ao excluir dados para tipo ${id}:`, e);
          toast.error(`Erro inesperado ao excluir dados: ${id} (${e.message || 'erro desconhecido'})`); // Message d'erreur plus détaillé
        }
      }
    }
    
    // Messages de résumé global après la boucle
    if (allSucceeded && deletedCount > 0) {
        toast.success(`Dados de demonstração excluídos com sucesso para ${deletedCount} tipo(s)!`);
    } else if (!allSucceeded) {
        toast.error('O processo de exclusão de dados de demonstração foi concluído com erros.');
    } else { // deletedCount est 0 et allSucceeded est true (aucun type à supprimer)
        toast.info('Nenhum dado de demonstração foi excluído.');
    }
    checkExistingDemoData(); // Re-vérifier l'état das dados de démo après tout
  };

  const hasAnyDemo = savedTeacherTypes.some((id) => demoDataStatus[id]);
  const canCreateAnyDemo = savedTeacherTypes.some((id) => !demoDataStatus[id]);

  return (
    <div className="space-y-8">
      <div>
        <Label>Email</Label>
        <div className="flex gap-4">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleSaveEmail} disabled={saving}>Salvar</Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">Tipo de ensino</h2>
        <TeacherTypeSelector
          selectedTypes={selectedTeacherTypes}
          setSelectedTypes={(types) => {
            if (types.length <= 2) setSelectedTeacherTypes(types);
          }}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mt-6">Dados de demonstração</h2>
        <div className="flex gap-4 mt-2">
          <Button
            onClick={handleSaveTeacherTypes}
            disabled={selectedTeacherTypes.length === 0}
            className="bg-blue-600 text-white"
          >
            Tipos selecionados
          </Button>
          <Button
            onClick={createDemoData}
            disabled={!canCreateAnyDemo}
          >
            + Criar um conjunto de dados de demonstração
          </Button>
          <Button
            onClick={deleteDemoData}
            disabled={!hasAnyDemo}
            variant="ghost"
          >
            🗑️ Excluir o conjunto de dados de demonstração
          </Button>
        </div>
      </div>

      {/* NOUVELLE SECTION POUR LE CHANGEMENT DE MOT DE PASSE AVEC CONFIRMATION */}
      <div className="mt-8"> {/* Ajout de marge supérieure pour la séparation */}
        <h2 className="text-xl font-bold">Alterar Senha</h2>
        
        {/* Champ Nouvelle Senha */}
        <div className="mb-4"> {/* Ajout de marge inférieure pour espacer les champs */}
          <Label htmlFor="newPassword">Nova Senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite sua nova senha"
          />
        </div>

        {/* Champ Confirmer Nouvelle Senha */}
        <div className="mb-4">
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua nova senha"
          />
        </div>

        <Button 
          onClick={handleUpdatePassword} 
          disabled={passwordSaving || !newPassword || !confirmPassword} // Désactiver si les champs sont vides
        >
          {passwordSaving ? 'Salvando...' : 'Salvar Nova Senha'}
        </Button>
      </div>
    </div>
  );
}

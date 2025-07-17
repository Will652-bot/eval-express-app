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
      toast.error('Informations de l\'utilisateur incomplètes.');
      return;
    }
    for (const id of savedTeacherTypes) {
      if (!demoDataStatus[id]) { // Seulement si les données de démo n'existent pas encore pour ce type
        const key = await getTeachertypeKey(id);
        const fn = key && generateDemoFunctionByType(key); // Obtient le nom de la fonction SQL

        if (fn) { // Si un nom de fonction valide a été trouvé
          const res = await supabase.rpc(fn, {
            p_user_id: user.id,
            p_user_email: user.email,
            p_teachertype_id: id, // ID du type de professeur (UUID)
          });
          if (res.error) {
            console.error(`Erro ao gerar dados para ${key}:`, res.error);
            toast.error(`Erro ao gerar dados: ${key} (${res.error.message || 'erro desconhecido'})`); // Message d'erreur plus détaillé
          } else {
            toast.success(`Dados de demonstração para ${key} criados!`);
          }
        } else {
          toast.error(`Erro: Função de demonstração não encontrada para o tipo ${key || id}.`); // Si le mapping a échoué
        }
      }
    }
    toast.success('Dados de demonstração criados (processo concluído).'); // Message de succès global
    checkExistingDemoData(); // Re-vérifier l'état des données de démo
  };

  const deleteDemoData = async () => {
    if (!user?.id || !user?.email) { // S'assurer que user.id et user.email sont disponibles
      toast.error('Informations de l\'utilisateur incomplètes pour l\'exclusion.');
      return;
    }
    for (const id of savedTeacherTypes) {
      if (demoDataStatus[id]) { // Seulement si les données de démo existent pour ce type
        const res = await supabase.rpc('delete_demo_data_by_type', {
          p_user_id: user.id,
          p_user_email: user.email, // <-- AJOUTÉE : p_user_email pour la fonction de suppression
          p_teachertype_id: id,
        });
        if (res.error) {
          console.error(`Erro ao excluir dados para tipo ${id}:`, res.error);
          toast.error(`Erro ao excluir dados: ${id} (${res.error.message || 'erro desconhecido'})`); // Message d'erreur plus détaillé
        } else {
          toast.success(`Dados de demonstração para tipo ${id} excluídos!`);
        }
      }
    }
    toast.success('Dados de demonstração excluídos (processo concluído).'); // Message de succès global
    checkExistingDemoData(); // Re-vérifier l'état des données de démo
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
    </div>
  );
}

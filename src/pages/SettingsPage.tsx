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
  }, [user?.id]);

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

  const createDemoData = async () => {
    for (const id of savedTeacherTypes) {
      const res = await supabase.rpc('generate_demo_data_by_type', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_teachertype_ids: [id],
      });
      if (res.error) toast.error('Erro ao gerar dados');
    }
    toast.success('Dados de demonstração criados');
    checkExistingDemoData();
  };

  const deleteDemoData = async () => {
    for (const id of savedTeacherTypes) {
      const res = await supabase.rpc('delete_demo_data_by_type', {
        p_user_id: user.id,
        p_teachertype_ids: [id],
      });
      if (res.error) toast.error('Erro ao excluir dados');
    }
    toast.success('Dados de demonstração excluídos');
    checkExistingDemoData();
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
        <Button
          onClick={handleSaveTeacherTypes}
          className="mt-4"
        >
          Salvar tipos selecionados
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold mt-6">Dados de demonstração</h2>
        <div className="flex gap-4 mt-2">
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

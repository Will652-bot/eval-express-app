import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, Trash2, Plus, Info, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { UpdatePasswordForm } from '../components/auth/UpdatePasswordForm';
import { TeacherTypeSelector } from '../features/teacherTypeSelector/TeacherTypeSelector';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
    const [checkingDemoStatus, setCheckingDemoStatus] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        email: user?.email || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({ email: user.email || '' });
            checkDemoDataStatus();
        }
    }, [user]);

    const checkDemoDataStatus = async () => {
        if (!user?.id) return;
        try {
            setCheckingDemoStatus(true);
            const { data, error } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
            if (error) throw error;
            setHasDemoData(data);
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            setHasDemoData(false);
        } finally {
            setCheckingDemoStatus(false);
        }
    };

    const refetchDemoStatus = async () => {
        await checkDemoDataStatus();
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email.trim()) {
            toast.error('O email é obrigatório');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: formData.email });
            if (error) throw error;
            toast.success('Email atualizado com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar email');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDemoData = async () => {
        if (!user?.id || !user?.email) {
            toast.error('Usuário não autenticado');
            return;
        }
        setDemoLoading(true);
        try {
            const { data: hasData, error: checkError } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
            if (checkError) throw checkError;
            if (hasData === true) {
                toast.error('Conjunto de dados de demonstração já ativo');
                return;
            }
            const { error } = await supabase.rpc('generate_demo_data_for_user', {
                p_user_id: user.id,
                p_user_email: user.email,
            });
            if (error) throw error;
            toast.success('✅ Dados criados com sucesso');
            await refetchDemoStatus();
            localStorage.removeItem(`demo-banner-dismissed-${user.id}`);
        } catch (error: any) {
            toast.error('❌ Erro ao criar dados: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setDemoLoading(false);
        }
    };

    const handleDeleteDemoData = async () => {
        if (!user?.id || !user?.email) {
            toast.error('Usuário não autenticado');
            return;
        }
        setDemoLoading(true);
        try {
            const { data: hasData, error: checkError } = await supabase.rpc('has_demo_data_to_delete', { p_user_id: user.id });
            if (checkError) throw checkError;
            if (hasData === false) {
                toast.error('Nenhum conjunto de dados ativo');
                return;
            }
            const { error } = await supabase.rpc('delete_demo_data_for_user', {
                p_user_id: user.id,
                p_user_email: user.email,
            });
            if (error) throw error;
            toast.success('✅ Dados excluídos com sucesso');
            await refetchDemoStatus();
        } catch (error: any) {
            toast.error('❌ Erro ao excluir dados: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setDemoLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const statusInfo = hasDemoData === null ? {
        message: '🔄 Verificando status...',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        icon: <Info className="h-4 w-4" />
    } : hasDemoData ? {
        message: '✅ Você possui dados de demonstração ativos.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />
    } : {
        message: '💡 Nenhum conjunto de dados ativo.',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: <XCircle className="h-4 w-4 text-blue-600" />
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Conta</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Database className="h-6 w-6 text-primary-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Dados de Demonstração</h2>
                            </div>
                        </div>
                        <p className="text-gray-600">Gerencie os dados de demonstração para explorar as funcionalidades.</p>

                        <TeacherTypeSelector userId={user?.id || ''} />

                        <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-md p-4`}>
                            <div className="flex items-center space-x-2">
                                {statusInfo.icon}
                                <p className={`${statusInfo.textColor} text-sm font-medium`}>{statusInfo.message}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleCreateDemoData} isLoading={demoLoading} leftIcon={<Plus className="h-4 w-4" />} className="w-full" disabled={hasDemoData === true}>
                                Criar um conjunto
                            </Button>
                            <Button onClick={() => setShowDeleteConfirm(true)} isLoading={demoLoading} leftIcon={<Trash2 className="h-4 w-4" />} className="w-full" variant="outline" disabled={!hasDemoData}>
                                Excluir o conjunto
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <form onSubmit={handleEmailUpdate} className="space-y-6 p-6">
                        <h2 className="text-xl font-semibold text-gray-900">Alterar Email</h2>
                        <Input
                            label="Novo Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            fullWidth
                        />
                        <Button type="submit" isLoading={loading}>
                            Atualizar Email
                        </Button>
                    </form>
                </Card>

                <Card>
                    <UpdatePasswordForm />
                </Card>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Excluir Dados de Demonstração"
                message="Tem certeza que deseja excluir todos os dados?"
                onConfirm={handleDeleteDemoData}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmText="Confirmar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

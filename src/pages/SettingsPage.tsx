import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, Trash2, Plus, Info, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { UpdatePasswordForm } from '../components/auth/UpdatePasswordForm';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
    const [checkingDemoStatus, setCheckingDemoStatus] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // L'état initial est toujours basé sur l'utilisateur du contexte
    const [formData, setFormData] = useState({
        email: user?.email || '',
    });

    // ✅ CORRECTION DE LA FAILLE DE SÉCURITÉ :
    // Ce `useEffect` écoute les changements sur l'objet `user` du contexte.
    // Si l'utilisateur change (après une nouvelle connexion), il force la mise à jour
    // de l'état du formulaire avec le nouvel email.
    useEffect(() => {
        if (user) {
            setFormData(prevData => ({ ...prevData, email: user.email || '' }));
            checkDemoDataStatus();
        }
    }, [user]);

    const checkDemoDataStatus = async () => {
        if (!user?.id) return;
        try {
            setCheckingDemoStatus(true);
            const { data, error } = await supabase.rpc('has_demo_data', { p_user_id: user.id });
            if (error) { throw error; }
            setHasDemoData(data);
        } catch (error) {
            console.error('❌ Erreur lors de la vérification du statut:', error);
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
            toast.success('Email atualizado com sucesso! Por favor, verifique seu email para confirmar a alteração.');
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
            if (checkError) { throw checkError; }
            if (hasData === true) {
                toast.error('Conjunto de dados de demonstração já ativo');
                return;
            }
            const { error } = await supabase.rpc('generate_demo_data', { p_user_id: user.id, p_user_email: user.email });
            if (error) throw error;
            toast.success('✅ Dados de demonstração criados com sucesso');
            await refetchDemoStatus();
            localStorage.removeItem(`demo-banner-dismissed-${user.id}`);
        } catch (error: any) {
            toast.error('❌ Erro ao criar dados de demonstração: ' + (error.message || 'Erro desconhecido'));
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
            if (checkError) { throw checkError; }
            if (hasData === false) {
                toast.error('Nenhum conjunto de dados de demonstração está ativo');
                return;
            }
            const { error } = await supabase.rpc('delete_demo_data', { p_user_id: user.id, p_user_email: user.email });
            if (error) {
                if (error.message?.includes('No demo data found for this user')) {
                    toast.error('⚠️ Nenhum dado de demonstração encontrado para exclusão.');
                    await refetchDemoStatus();
                } else {
                    throw error;
                }
            } else {
                toast.success('✅ Dados de demonstração excluídos com sucesso');
                await refetchDemoStatus();
            }
        } catch (error: any) {
            toast.error('❌ Erro ao excluir dados de demonstração: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setDemoLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const getStatusMessage = () => {
        if (checkingDemoStatus || hasDemoData === null) {
            return { message: '🔄 Verificando status dos dados de demonstração...', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800', icon: <Info className="h-4 w-4" /> };
        }
        if (hasDemoData) {
            return { message: '✅ Você possui dados de demonstração ativos em sua conta.', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> };
        }
        return { message: '💡 Nenhum conjunto de dados de demonstração está ativo. Crie um conjunto para explorar a plataforma.', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800', icon: <XCircle className="h-4 w-4 text-blue-600" /> };
    };

    const statusInfo = getStatusMessage();

    const getCreateTooltip = () => {
        if (hasDemoData) { return "Você já possui dados de demonstração ativos"; }
        return "Criar dados de exemplo para explorar todas as funcionalidades";
    };

    const getDeleteTooltip = () => {
        if (!hasDemoData) { return "Nenhum conjunto de dados de demonstração encontrado"; }
        return "Remover todos os dados de demonstração da sua conta";
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações da Conta</h1>
                <p className="mt-1 text-gray-500">
                    Gerencie suas informações de conta e preferências
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Database className="h-6 w-6 text-primary-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Dados de Demonstração</h2>
                            </div>
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    Debug: {hasDemoData === null ? 'null' : hasDemoData.toString()}
                                </div>
                            )}
                        </div>
                        <p className="text-gray-600">
                            Gerencie os dados de demonstração para explorar todas as funcionalidades do EvalExpress.
                        </p>
                        <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-md p-4`}>
                            <div className="flex items-center space-x-2">
                                {statusInfo.icon}
                                <p className={`${statusInfo.textColor} text-sm font-medium`}>
                                    {statusInfo.message}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Button onClick={handleCreateDemoData} isLoading={demoLoading} leftIcon={<Plus className="h-4 w-4" />} className="w-full" disabled={hasDemoData === true || demoLoading || checkingDemoStatus} variant={hasDemoData !== true && !checkingDemoStatus ? "primary" : "outline"}>
                                    Criar um conjunto de dados de demonstração
                                </Button>
                                {(hasDemoData === true || checkingDemoStatus) && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        <div className="flex items-center space-x-1">
                                            <Info className="h-3 w-3" />
                                            <span>{getCreateTooltip()}</span>
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 relative group">
                                <Button onClick={() => setShowDeleteConfirm(true)} isLoading={demoLoading} variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} className="w-full" disabled={hasDemoData !== true || demoLoading || checkingDemoStatus}>
                                    Excluir o conjunto de dados de demonstração
                                </Button>
                                {(hasDemoData !== true || checkingDemoStatus) && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        <div className="flex items-center space-x-1">
                                            <Info className="h-3 w-3" />
                                            <span>{getDeleteTooltip()}</span>
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3">
                            <p className="font-medium mb-1">ℹ️ Informações importantes:</p>
                            <ul className="space-y-1 ml-4">
                                <li>• Os dados de demonstração incluem turmas, alunos, critérios e avaliações de exemplo</li>
                                <li>• Todas as ações são registradas para fins de auditoria</li>
                                <li>• A exclusão remove permanentemente todos os dados de demonstração</li>
                                <li>• Use os dados de demonstração para explorar todas as funcionalidades da plataforma</li>
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            <Button variant="ghost" size="sm" onClick={refetchDemoStatus} isLoading={checkingDemoStatus} leftIcon={<RefreshCw className="h-4 w-4" />}>
                                Atualizar Status
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <form onSubmit={handleEmailUpdate} className="space-y-6 p-6">
                        <h2 className="text-xl font-semibold text-gray-900">Alterar Email</h2>
                        <Input label="Novo Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required fullWidth />
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
                message="Tem certeza que deseja excluir todos os dados de demonstração?&#10;Esta ação não pode ser desfeita."
                onConfirm={handleDeleteDemoData}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmText="Confirmar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

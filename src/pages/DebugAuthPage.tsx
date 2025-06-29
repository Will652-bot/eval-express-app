import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bug, Trash2, Download, RefreshCw, ArrowLeft, User, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DebugLogger } from '../utils/debugLogger';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Vérifier si l'utilisateur peut accéder à cette page
  const canAccess = process.env.NODE_ENV === 'development' || 
                   user?.email === 'wilmic.panama@icloud.com';

  useEffect(() => {
    if (!canAccess) {
      navigate('/login');
      return;
    }
    
    loadData();
  }, [canAccess, navigate]);

  const loadData = async () => {
    setLoading(true);
    
    // Charger les logs depuis localStorage
    const storedLogs = DebugLogger.getLogs();
    setLogs(storedLogs);

    // Charger les informations utilisateur actuelles
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setCurrentUser(currentUser);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
    
    setLoading(false);
  };

  const clearLogs = () => {
    DebugLogger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    DebugLogger.exportLogs();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!canAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando dados de debug...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bug className="h-8 w-8 mr-3 text-yellow-600" />
                Debug de Autenticação
              </h1>
              <p className="text-gray-500">
                Página especial para debug do fluxo de criação de conta
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={loadData}
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Atualizar
            </Button>
            <Button
              onClick={exportLogs}
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              disabled={logs.length === 0}
            >
              Exportar Logs
            </Button>
            <Button
              onClick={clearLogs}
              variant="outline"
              leftIcon={<Trash2 className="h-4 w-4" />}
              disabled={logs.length === 0}
            >
              Limpar Logs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status do Usuário Atual */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Status do Usuário Atual
              </h2>
              
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">ID:</span>
                    <span className="text-sm text-gray-900 font-mono">{currentUser.id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900">{currentUser.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email Confirmado:</span>
                    <div className="flex items-center space-x-2">
                      {currentUser.email_confirmed_at ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Sim</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">Não</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Criado em:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(currentUser.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  {currentUser.email_confirmed_at && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Confirmado em:</span>
                      <span className="text-sm text-green-600">
                        {new Date(currentUser.email_confirmed_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Última atualização:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(currentUser.updated_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum usuário logado</p>
                </div>
              )}
            </div>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações de Teste</h2>
              
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full"
                  leftIcon={<User className="h-4 w-4" />}
                >
                  Testar Criação de Conta
                </Button>
                
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Testar Login
                </Button>
                
                <Button
                  onClick={() => navigate('/verify-email')}
                  variant="outline"
                  className="w-full"
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Testar Verificação de Email
                </Button>
                
                <Button
                  onClick={() => navigate('/request-password-reset')}
                  variant="outline"
                  className="w-full"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Testar Reset de Senha
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Informações do Ambiente:
                </h3>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>Modo: {process.env.NODE_ENV}</div>
                  <div>URL: {window.location.origin}</div>
                  <div>Timestamp: {new Date().toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Logs de Debug */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Bug className="h-5 w-5 mr-2" />
                Logs de Debug ({logs.length})
              </h2>
              
              <div className="text-sm text-gray-500">
                Últimos {Math.min(logs.length, 50)} logs
              </div>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum log de debug encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Execute ações de autenticação para ver os logs aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.slice().reverse().map((log, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getStatusColor(log.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium">{log.step}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    {log.email && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Email:</span> {log.email}
                      </div>
                    )}
                    
                    {log.error && (
                      <div className="text-sm text-red-600 bg-red-100 p-2 rounded mt-2">
                        <span className="font-medium">Erro:</span> {log.error}
                      </div>
                    )}
                    
                    {log.data && typeof log.data === 'object' && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer text-gray-600">
                          Dados adicionais
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SortAsc, Trash2, Edit, Upload, Eye, FileText, Download, CheckCircle, XCircle, AlertTriangle, Save, X, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatDateShort } from '../lib/utils';

interface EvaluationTitle {
  id: string;
  title: string;
  teacher_id: string;
  class_id?: string;
  class_name?: string;
  attachments?: EvaluationAttachment[];
  has_attachment?: boolean;
  created_at?: string;
  is_new?: boolean;
}

interface EvaluationAttachment {
  id: string;
  evaluation_title_id: string;
  teacher_id: string;
  class_id: string;
  file_path: string;
  created_at?: string;
  class?: {
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

interface EvaluationTitleItemProps {
  title: EvaluationTitle;
  classes: Class[];
  user: any;
  uploadingFile: string | null;
  uploadProgress: {[key: string]: number};
  uploadError: {[key: string]: string};
  onDelete: (titleId: string, titleName: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onFileUpload: (titleId: string, file: File, classId: string) => void;
  onViewPDF: (attachment: EvaluationAttachment) => void;
  onDownloadPDF: (attachment: EvaluationAttachment) => void;
  onClassUpdate: (titleId: string, classId: string) => void;
  onTitleUpdate: (titleId: string, newTitle: string) => void;
}

const EvaluationTitleItem: React.FC<EvaluationTitleItemProps> = ({
  title,
  classes,
  user,
  uploadingFile,
  uploadProgress,
  uploadError,
  onDelete,
  onDeleteAttachment,
  onFileUpload,
  onViewPDF,
  onDownloadPDF,
  onClassUpdate,
  onTitleUpdate
}) => {
  const [selectedClassId, setSelectedClassId] = useState(title.class_id || '');
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [hasUnsavedClassChanges, setHasUnsavedClassChanges] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title.title);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  // ✅ CORRECTION: Détection correcte du plan Pro
  const isPro = user?.current_plan === 'pro' || user?.pro_subscription_active === true;

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setHasUnsavedClassChanges(classId !== title.class_id);
  };

  const handleSaveClassChanges = async () => {
    if (!hasUnsavedClassChanges) return;
    
    setIsUpdatingClass(true);
    try {
      await onClassUpdate(title.id, selectedClassId);
      setHasUnsavedClassChanges(false);
      toast.success('Turma atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar turma');
    } finally {
      setIsUpdatingClass(false);
    }
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditedTitle(title.title);
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim() === title.title) {
      setIsEditingTitle(false);
      return;
    }

    if (!editedTitle.trim()) {
      toast.error('O título não pode estar vazio');
      return;
    }

    setIsUpdatingTitle(true);
    try {
      await onTitleUpdate(title.id, editedTitle.trim());
      setIsEditingTitle(false);
      toast.success('Título atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar título');
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle(title.title);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleFileUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ CORRECTION: Vérification du plan Pro
    if (!isPro) {
      toast.error('Funcionalidade exclusiva para usuários do plano Pro');
      return;
    }
    
    if (!selectedClassId) {
      toast.error('Selecione uma turma antes de anexar o arquivo');
      return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (file) {
        onFileUpload(title.id, file, selectedClassId);
      }
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  return (
    <div className="p-6 bg-white hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyPress}
                    className="text-lg font-medium bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleTitleSave}
                    isLoading={isUpdatingTitle}
                    leftIcon={<Save className="h-3 w-3" />}
                  >
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTitleCancel}
                    leftIcon={<X className="h-3 w-3" />}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 
                    className="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
                    onClick={handleTitleEdit}
                    title="Clique para editar o título"
                  >
                    {title.title}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTitleEdit}
                    leftIcon={<Edit className="h-3 w-3" />}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Editar
                  </Button>
                  {title.is_new && (
                    <Badge variant="success" className="text-xs">
                      Novo
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Criado em: {title.created_at ? formatDateShort(title.created_at) : 'N/A'}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {title.class_name ? (
                <Badge variant="primary" className="flex items-center space-x-1">
                  <span>📘 {title.class_name}</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>📘 Nenhuma turma</span>
                </Badge>
              )}
              
              {title.has_attachment ? (
                <Badge variant="success" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>📎 PDF anexado</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>📎 Sem anexo</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(title.id, title.title)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Excluir
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Configurar Turma e Anexar PDF</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Turma Associada
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 text-sm"
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={isUpdatingClass}
            >
              <option value="">Selecione uma turma</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {hasUnsavedClassChanges && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleSaveClassChanges}
                  isLoading={isUpdatingClass}
                  leftIcon={<Save className="h-3 w-3" />}
                >
                  Salvar alterações
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Anexar PDF {!isPro && <span className="text-orange-600">(Pro)</span>}
            </label>
            {isPro ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileUploadClick}
                disabled={uploadingFile === title.id || !selectedClassId}
                leftIcon={<Upload className="h-4 w-4" />}
                className="w-full"
              >
                {uploadingFile === title.id ? 'Enviando...' : 'Selecionar PDF'}
              </Button>
            ) : (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={true}
                  leftIcon={<Lock className="h-4 w-4" />}
                  className="w-full opacity-50 cursor-not-allowed"
                >
                  Selecionar PDF
                </Button>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-gray-500 bg-white px-2 rounded">
                    Plano Pro necessário
                  </span>
                </div>
              </div>
            )}
            {!selectedClassId && isPro && (
              <p className="text-xs text-orange-600 mt-1">Selecione uma turma primeiro</p>
            )}
            {!isPro && (
              <p className="text-xs text-blue-600 mt-1">
                Upgrade para o Plano Pro para anexar PDFs
              </p>
            )}
          </div>
        </div>
        
        {uploadProgress[title.id] > 0 && uploadProgress[title.id] < 100 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress[title.id]}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enviando: {uploadProgress[title.id]}%
            </p>
          </div>
        )}
        
        {uploadError[title.id] && (
          <div className="mt-2 text-error-600 text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {uploadError[title.id]}
          </div>
        )}
        
        {uploadingFile === title.id && uploadProgress[title.id] === 100 && (
          <div className="mt-2 text-success-600 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Arquivo enviado com sucesso!
          </div>
        )}
      </div>

      {title.attachments && title.attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Anexos</h4>
          {title.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {attachment.file_path.split('/').pop()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Turma: {attachment.class?.name}
                  </p>
                  {attachment.created_at && (
                    <p className="text-xs text-gray-400">
                      Adicionado em: {formatDateShort(attachment.created_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewPDF(attachment)}
                  leftIcon={<Eye className="h-4 w-4" />}
                >
                  Visualizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownloadPDF(attachment)}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Baixar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteAttachment(attachment.id)}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="text-red-600 hover:text-red-700"
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const EvaluationTitlesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [titles, setTitles] = useState<EvaluationTitle[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitleName, setNewTitleName] = useState('');
  const [selectedClassForNewTitle, setSelectedClassForNewTitle] = useState('');
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadError, setUploadError] = useState<{[key: string]: string}>({});
  const [creatingTitle, setCreatingTitle] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    titleId: '',
    titleName: '',
    attachmentId: '',
    isAttachment: false
  });

  // ✅ CORRECTION: Détection correcte du plan Pro
  const isPro = user?.current_plan === 'pro' || user?.pro_subscription_active === true;

  useEffect(() => {
    fetchData();
  }, [user, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ✅ CORRECTION: Fetch ALL evaluation titles for the teacher
      const { data: titlesData, error: titlesError } = await supabase
        .from('evaluation_titles')
        .select(`
          *,
          class:classes(id, name),
          evaluation_attachments (
            *,
            class:classes(name)
          )
        `)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (titlesError) throw titlesError;

      console.log('📊 Títulos carregados:', titlesData?.length || 0);

      // Process titles to add has_attachment flag and class info
      const processedTitles = (titlesData || []).map(title => ({
        ...title,
        class_id: title.class?.id || null,
        class_name: title.class?.name || null,
        has_attachment: title.evaluation_attachments && title.evaluation_attachments.length > 0,
        attachments: title.evaluation_attachments || []
      }));

      // Fetch classes for dropdown
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (classesError) throw classesError;

      setTitles(processedTitles);
      setClasses(classesData || []);
      
      console.log('✅ Dados carregados:', {
        titles: processedTitles.length,
        classes: classesData?.length || 0
      });
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitleName.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setCreatingTitle(true);
    try {
      const titleData = {
        title: newTitleName.trim(),
        teacher_id: user.id,
        class_id: selectedClassForNewTitle || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedData, error } = await supabase
        .from('evaluation_titles')
        .insert(titleData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        if (error.code === '23505') {
          toast.error('Já existe um título com este nome');
          return;
        }
        throw error;
      }

      if (!insertedData) {
        throw new Error('Nenhum dado retornado após inserção');
      }

      toast.success('Título criado com sucesso!');
      setNewTitleName('');
      setSelectedClassForNewTitle('');
      setShowCreateForm(false);
      
      // Mark as new and refresh data
      await fetchData();
      
      // Remove "new" badge after 5 seconds
      setTimeout(() => {
        setTitles(prev => prev.map(title => 
          title.id === insertedData.id ? { ...title, is_new: false } : title
        ));
      }, 5000);
      
    } catch (error: any) {
      console.error('Error saving title:', error);
      toast.error(`Erro ao salvar título: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setCreatingTitle(false);
    }
  };

  const handleTitleUpdate = async (titleId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_titles')
        .update({
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', titleId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      // Update local state
      setTitles(prev => prev.map(title => 
        title.id === titleId ? { ...title, title: newTitle } : title
      ));
    } catch (error) {
      console.error('Error updating title:', error);
      throw error;
    }
  };

  const handleClassUpdate = async (titleId: string, classId: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_titles')
        .update({
          class_id: classId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', titleId)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  };

  const handleFileUpload = async (titleId: string, file: File, classId: string) => {
    // ✅ CORRECTION: Vérification du plan Pro
    if (!isPro) {
      toast.error('Funcionalidade exclusiva para usuários do plano Pro');
      return;
    }

    if (!classId) {
      toast.error('Selecione uma turma para o anexo');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setUploadingFile(titleId);
      setUploadProgress({...uploadProgress, [titleId]: 0});
      setUploadError({...uploadError, [titleId]: ''});

      // Check if title already has an attachment for this class
      const { data: existingAttachment, error: checkError } = await supabase
        .from('evaluation_attachments')
        .select('*')
        .eq('evaluation_title_id', titleId)
        .eq('class_id', classId)
        .eq('teacher_id', user?.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const title = titles.find(t => t.id === titleId)?.title || 'document';
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${titleId}/${sanitizedTitle}_${timestamp}.${fileExt}`;

      // If attachment exists, delete the old file first
      if (existingAttachment) {
        const oldFilePath = existingAttachment.file_path;
        await supabase.storage
          .from('evaluation-attachments')
          .remove([oldFilePath]);
      }

      // Upload to Supabase Storage
      const { error: storageUploadError } = await supabase.storage
        .from('evaluation-attachments')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress({...uploadProgress, [titleId]: percent});
          }
        });

      if (storageUploadError) throw storageUploadError;

      // Save or update attachment record
      if (existingAttachment) {
        const { error: updateError } = await supabase
          .from('evaluation_attachments')
          .update({
            file_path: fileName,
            teacher_id: user?.id,
            class_id: classId
          })
          .eq('id', existingAttachment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('evaluation_attachments')
          .insert({
            evaluation_title_id: titleId,
            teacher_id: user?.id,
            class_id: classId,
            file_path: fileName
          });

        if (insertError) throw insertError;
      }

      toast.success('Arquivo anexado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError({...uploadError, [titleId]: error.message || 'Erro ao anexar arquivo'});
      toast.error('Erro ao anexar arquivo');
    } finally {
      setUploadingFile(null);
      setTimeout(() => {
        setUploadProgress({...uploadProgress, [titleId]: 0});
      }, 1000);
    }
  };

  const handleViewPDF = async (attachment: EvaluationAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('evaluation-attachments')
        .createSignedUrl(attachment.file_path, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        toast.error('Erro ao gerar link de visualização');
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.error('Não foi possível gerar o link para visualização');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Erro ao visualizar PDF');
    }
  };

  const handleDownloadPDF = async (attachment: EvaluationAttachment) => {
    try {
      toast.loading('Preparando download...');
      
      const { data, error } = await supabase.storage
        .from('evaluation-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_path.split('/').pop() || 'documento.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Download concluído');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Erro ao baixar PDF');
    }
  };

  const handleDeleteTitle = async () => {
    try {
      // First delete all attachments and their files
      const title = titles.find(t => t.id === confirmDialog.titleId);
      if (title?.attachments) {
        for (const attachment of title.attachments) {
          await supabase.storage
            .from('evaluation-attachments')
            .remove([attachment.file_path]);
        }
      }

      // Delete the title (attachments will be deleted by cascade)
      const { error } = await supabase
        .from('evaluation_titles')
        .delete()
        .eq('id', confirmDialog.titleId);

      if (error) throw error;

      toast.success('Título excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting title:', error);
      toast.error('Erro ao excluir título');
    } finally {
      setConfirmDialog({ isOpen: false, titleId: '', titleName: '', attachmentId: '', isAttachment: false });
    }
  };

  const handleDeleteAttachment = async () => {
    try {
      const attachment = titles
        .flatMap(t => t.attachments || [])
        .find(a => a.id === confirmDialog.attachmentId);

      if (attachment) {
        await supabase.storage
          .from('evaluation-attachments')
          .remove([attachment.file_path]);

        const { error } = await supabase
          .from('evaluation_attachments')
          .delete()
          .eq('id', confirmDialog.attachmentId);

        if (error) throw error;
      }

      toast.success('Anexo excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Erro ao excluir anexo');
    } finally {
      setConfirmDialog({ isOpen: false, titleId: '', titleName: '', attachmentId: '', isAttachment: false });
    }
  };

  const filteredTitles = titles.filter(title => 
    title.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const handleDeleteTitleClick = (titleId: string, titleName: string) => {
    setConfirmDialog({
      isOpen: true,
      titleId,
      titleName,
      attachmentId: '',
      isAttachment: false
    });
  };

  const handleDeleteAttachmentClick = (attachmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      titleId: '',
      titleName: '',
      attachmentId,
      isAttachment: true
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Títulos da Avaliação</h1>
          <p className="mt-1 text-gray-500">
            Gerencie os títulos das avaliações, associe turmas e anexe documentos PDF
            {!isPro && (
              <span className="block text-blue-600 text-sm mt-1">
                💡 Upgrade para o Plano Pro para anexar PDFs às avaliações
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateForm(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Criar novo Título
          </Button>
        </div>
      </div>

      {/* ✅ CORRECTION: Banner informatif pour les utilisateurs Free */}
      {!isPro && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Funcionalidade Premium: Anexos PDF
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Faça upgrade para o Plano Pro para anexar arquivos PDF às suas avaliações e ter acesso completo a todas as funcionalidades.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/plans')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <form onSubmit={handleCreateTitle} className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Novo Título</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Título"
                value={newTitleName}
                onChange={(e) => setNewTitleName(e.target.value)}
                required
                fullWidth
                placeholder="Ex: Prova Bimestral, Trabalho em Grupo..."
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Turma (Opcional)
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500"
                  value={selectedClassForNewTitle}
                  onChange={(e) => setSelectedClassForNewTitle(e.target.value)}
                >
                  <option value="">Selecione uma turma</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTitleName('');
                  setSelectedClassForNewTitle('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                isLoading={creatingTitle}
              >
                Criar Título
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar títulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              onClick={toggleSort}
              leftIcon={<SortAsc className="h-4 w-4" />}
            >
              {sortOrder === 'asc' ? 'Mais antigos' : 'Mais recentes'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando títulos...</p>
          </div>
        ) : filteredTitles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {titles.length === 0 ? 'Nenhum título encontrado' : 'Nenhum título corresponde à busca'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {titles.length === 0 ? 'Criar Primeiro Título' : 'Criar Novo Título'}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTitles.map((title) => (
              <div key={title.id} className="group">
                <EvaluationTitleItem
                  title={title}
                  classes={classes}
                  user={user}
                  uploadingFile={uploadingFile}
                  uploadProgress={uploadProgress}
                  uploadError={uploadError}
                  onDelete={handleDeleteTitleClick}
                  onDeleteAttachment={handleDeleteAttachmentClick}
                  onFileUpload={handleFileUpload}
                  onViewPDF={handleViewPDF}
                  onDownloadPDF={handleDownloadPDF}
                  onClassUpdate={handleClassUpdate}
                  onTitleUpdate={handleTitleUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isAttachment ? "Excluir Anexo" : "Excluir Título"}
        message={
          confirmDialog.isAttachment
            ? "Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita."
            : `Tem certeza que deseja excluir o título "${confirmDialog.titleName}"? Todos os anexos associados também serão excluídos.`
        }
        onConfirm={confirmDialog.isAttachment ? handleDeleteAttachment : handleDeleteTitle}
        onCancel={() => setConfirmDialog({ isOpen: false, titleId: '', titleName: '', attachmentId: '', isAttachment: false })}
      />
    </div>
  );
};
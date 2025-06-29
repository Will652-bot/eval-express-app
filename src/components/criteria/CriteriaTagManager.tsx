import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tag, Plus, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CriterionTag {
  id: string;
  name: string;
  description: string;
}

interface CriteriaTagManagerProps {
  criterionId: string;
  criterionName: string;
  onTagsUpdated?: () => void;
}

export const CriteriaTagManager: React.FC<CriteriaTagManagerProps> = ({
  criterionId,
  criterionName,
  onTagsUpdated
}) => {
  const { user } = useAuth();
  const [availableTags, setAvailableTags] = useState<CriterionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<CriterionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTagsData();
  }, [criterionId]);

  const fetchTagsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all available tags (public + user's private tags)
      const { data: allTags, error: tagsError } = await supabase
        .from('criterion_tags')
        .select('*')
        .order('name');

      if (tagsError) throw tagsError;

      // Fetch currently selected tags for this criterion
      const { data: selectedTagLinks, error: linksError } = await supabase
        .from('criterion_tag_links')
        .select(`
          tag:criterion_tags(*)
        `)
        .eq('criterion_id', criterionId);

      if (linksError) throw linksError;

      setAvailableTags(allTags || []);
      setSelectedTags(selectedTagLinks?.map(link => link.tag).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching tags data:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: CriterionTag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSaveTags = async () => {
    setSaving(true);
    try {
      // Delete existing tag links for this criterion
      const { error: deleteError } = await supabase
        .from('criterion_tag_links')
        .delete()
        .eq('criterion_id', criterionId);

      if (deleteError) throw deleteError;

      // Insert new tag links
      if (selectedTags.length > 0) {
        const newLinks = selectedTags.map(tag => ({
          criterion_id: criterionId,
          tag_id: tag.id
        }));

        const { error: insertError } = await supabase
          .from('criterion_tag_links')
          .insert(newLinks);

        if (insertError) throw insertError;
      }

      toast.success('Tags atualizadas com sucesso');
      if (onTagsUpdated) {
        onTagsUpdated();
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error('Erro ao salvar tags');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Carregando tags...</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Tags para "{criterionName}"
          </h4>
          <Button
            size="sm"
            onClick={handleSaveTags}
            isLoading={saving}
            leftIcon={<Save className="h-3 w-3" />}
          >
            Salvar
          </Button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Tags Selecionadas:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 cursor-pointer hover:bg-primary-200"
                  onClick={() => handleTagToggle(tag)}
                  title={tag.description}
                >
                  {tag.name}
                  <X className="h-3 w-3 ml-1" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Tags Disponíveis:</p>
          <div className="flex flex-wrap gap-1">
            {availableTags
              .filter(tag => !selectedTags.some(selected => selected.id === tag.id))
              .map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleTagToggle(tag)}
                  title={tag.description}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag.name}
                </span>
              ))}
          </div>
        </div>

        {availableTags.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-2">
            Nenhuma tag disponível
          </p>
        )}
      </div>
    </Card>
  );
};
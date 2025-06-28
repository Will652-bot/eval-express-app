import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SortAsc } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  class: {
    name: string;
  };
}

export const AllStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchStudents();
  }, [user, sortOrder]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(name)
        `)
        .order('first_name', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    `${student.first_name} ${student.last_name} ${student.class.name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Todos os Alunos</h1>
          <p className="mt-1 text-gray-500">
            Lista completa de todos os alunos
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar alunos..."
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
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando alunos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum aluno encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Turma: {student.class.name}
                  </p>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/classes/${student.class_id}/students/${student.id}/edit`)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
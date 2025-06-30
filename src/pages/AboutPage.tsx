import React from 'react';
import { Card } from '../components/ui/Card';
import { GraduationCap, Heart, Mail, Globe } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sobre o EvalExpress</h1>
        <p className="mt-1 text-gray-500">
          Conheça mais sobre nossa plataforma de avaliação
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <GraduationCap className="h-12 w-12 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nossa Missão</h2>
              <p className="mt-2 text-gray-600">
                O EvalExpress nasceu com a missão de simplificar o processo de avaliação para professores,
                permitindo que eles foquem mais no que realmente importa: o desenvolvimento dos alunos.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recursos Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Avaliações Simplificadas</h4>
                <p className="text-gray-600 mt-1">
                  Sistema intuitivo para criar e gerenciar avaliações
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Relatórios Detalhados</h4>
                <p className="text-gray-600 mt-1">
                  Visualize o progresso dos alunos com gráficos e análises
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Formatação Personalizada</h4>
                <p className="text-gray-600 mt-1">
                  Adapte as avaliações ao seu estilo de ensino
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Gestão de Turmas</h4>
                <p className="text-gray-600 mt-1">
                  Organize seus alunos e turmas de forma eficiente
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <a href="mailto:evalexpress@ainovita.com.br" className="text-primary-600 hover:text-primary-700">
                  evalexpress@ainovita.com.br
                </a>
              </div>
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-gray-400 mr-2" />
                <a href="https://www.evalexpress.com" className="text-primary-600 hover:text-primary-700">
                  www.evalexpress.com
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <div className="flex items-center justify-center text-gray-500">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              <p>Feito com amor para educadores</p>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              © {new Date().getFullYear()} EvalExpress. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { StandardReport } from '../components/reports/StandardReport';
import { CustomReport } from '../components/reports/CustomReport';
import { Button } from '../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'standard' | 'custom'>('standard');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-1 text-gray-500">
            Visualize e exporte relatórios de desempenho dos alunos
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            variant={reportType === 'standard' ? 'primary' : 'outline'}
            onClick={() => setReportType('standard')}
          >
            Relatório Padrão
          </Button>
          <Button
            variant={reportType === 'custom' ? 'primary' : 'outline'}
            onClick={() => setReportType('custom')}
          >
            Relatório Personalizado
          </Button>
        </div>
      </div>

      {reportType === 'standard' ? <StandardReport /> : <CustomReport />}
    </div>
  );
};
import React from 'react';
import { EvaluationCriteriaManager } from '../components/evaluation/EvaluationCriteriaManager';

export const EvaluationCriteriaPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in">
      <EvaluationCriteriaManager />
    </div>
  );
};
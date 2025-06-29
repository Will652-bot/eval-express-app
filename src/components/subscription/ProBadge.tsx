import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ProBadge: React.FC = () => {
  return (
    <Badge variant="success" className="flex items-center space-x-1">
      <Crown className="h-3 w-3" />
      <span>Plano Pro Ativo</span>
    </Badge>
  );
};
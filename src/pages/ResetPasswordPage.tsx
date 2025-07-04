import React from 'react';
import { GraduationCap } from 'lucide-react';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { Card } from '../components/ui/Card';

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Crie sua nova senha
          </h1>
          <p className="mt-2 text-gray-600">
            Digite e confirme sua nova senha de acesso abaixo.
          </p>
        </div>
        <Card>
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
};

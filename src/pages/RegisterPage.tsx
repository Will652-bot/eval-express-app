import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Card } from '../components/ui/Card';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Crie sua conta no EvalExpress
          </h1>
          <p className="mt-2 text-gray-600">
            Comece a gerenciar avaliações de forma eficiente
          </p>
        </div>

        <Card>
          <RegisterForm />
        </Card>

        <p className="text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};
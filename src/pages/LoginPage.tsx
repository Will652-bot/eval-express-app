import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { Card } from '../components/ui/Card';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Bem-vindo ao EvalExpress
          </h1>
          <p className="mt-2 text-gray-600">
            Entre para gerenciar suas avaliações
          </p>
        </div>

        <Card>
          <LoginForm />
        </Card>

        <p className="text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
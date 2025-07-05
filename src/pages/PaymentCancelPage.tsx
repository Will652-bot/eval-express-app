// src/pages/PaymentCancelPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard, Home, HelpCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PaymentCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600">
            EvalExpress - Plano Pro
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-orange-50 border-orange-200 p-8">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              Processo de Pagamento Cancelado
            </h2>
            <p className="text-base text-orange-700 mb-6">
              Seu pagamento não foi processado. Nenhum valor foi cobrado.
            </p>

            {/* Additional Info */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-orange-300 text-left">
              <h3 className="font-medium text-orange-800 mb-2">
                O que aconteceu?
              </h3>
              <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                <li>Você cancelou o processo de pagamento</li>
                <li>Nenhuma transação foi processada</li>
                <li>Sua conta permanece inalterada</li>
                <li>Você pode tentar novamente a qualquer momento</li>
              </ul>
            </div>

            {/* Reminder */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200 text-left">
              <h3 className="font-medium text-blue-800 mb-2">
                Lembrete: O Plano Pro oferece
              </h3>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>✨ Alunos ilimitados</li>
                <li>✨ Exportação em PDF e Excel</li>
                <li>✨ Anexos PDF às avaliações</li>
                <li>✨ Suporte prioritário</li>
                <li>✨ Apenas R$ 4,99/mês</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/plans"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Voltar aos Planos
          </Link>

          <Link
            to="/"
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <Home className="h-5 w-5 mr-2" />
            Ir para o Início
          </Link>

          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Continuar com o plano gratuito
          </Link>
        </div>

        {/* Help */}
        <Card className="bg-gray-100 p-4">
          <div className="flex items-center justify-center text-gray-600 mb-2">
            <HelpCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Precisa de ajuda?</span>
          </div>
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>Dúvidas sobre nossos planos ou processo de pagamento?</p>
            <a 
              href="mailto:support@evalexpress.com" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Entre em contato com nosso suporte
            </a>
          </div>
        </Card>

        {/* Stripe Security Note */}
        <div className="text-center text-xs text-gray-500 bg-gray-100 p-3 rounded">
          <p className="mb-1">🔒 Pagamentos seguros via Stripe</p>
          <p>Suas informações de pagamento são protegidas e nunca armazenadas em nossos servidores.</p>
        </div>

        {/* Debug (only dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
            <p>Debug Info:</p>
            <p>Page: PaymentCancelPage</p>
            <p>URL: {window.location.href}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCancelPage;

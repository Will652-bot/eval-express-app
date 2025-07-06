import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-4 text-center">
      <XCircle className="w-20 h-20 text-red-600 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Pagamento cancelado</h1>
      <p className="text-md mb-4">Você cancelou o processo de pagamento. Nenhuma cobrança foi efetuada.</p>
      <button
        onClick={() => navigate('/plans')}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Voltar aos Planos
      </button>
    </div>
  );
};

export default PaymentCancelPage;

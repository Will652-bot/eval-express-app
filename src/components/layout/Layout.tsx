import React from 'react';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 mr-2 text-primary-600" />
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} EvalExpress. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Termos</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacidade</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#374151',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
};
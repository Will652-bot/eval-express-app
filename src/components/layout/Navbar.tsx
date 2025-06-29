import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Users, LogOut, BookOpen, FileCheck, ListChecks, BarChart, Palette, CreditCard, Info, Settings, FileText, ClipboardList, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [planningMenuOpen, setPlanningMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const togglePlanningMenu = () => {
    setPlanningMenuOpen(!planningMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isPlanningRoute = (path: string) => {
    return ['/criteria', '/evaluation-titles', '/evaluation-criteria', '/formatting'].includes(path);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart className="h-4 w-4" /> },
    { name: 'Turmas', path: '/classes', icon: <BookOpen className="h-4 w-4" /> },
    // Planejamento is a dropdown, not a direct link
    { name: 'Avaliações', path: '/evaluations', icon: <FileCheck className="h-4 w-4" /> },
    { name: 'Relatórios', path: '/reports', icon: <BarChart className="h-4 w-4" /> },
    { name: 'Planos', path: '/plans', icon: <CreditCard className="h-4 w-4" /> },
    { name: 'Configurações', path: '/settings', icon: <Settings className="h-4 w-4" /> },
    { name: 'Sobre', path: '/about', icon: <Info className="h-4 w-4" /> },
  ];

  // CORRECTION 1: Assurer que "Associar Critérios" apparaît toujours
  const planningLinks = [
    { name: 'Critérios', path: '/criteria', icon: <ListChecks className="h-4 w-4" /> },
    { name: 'Títulos da Avaliação', path: '/evaluation-titles', icon: <FileText className="h-4 w-4" /> },
    { name: 'Associar Critérios', path: '/evaluation-criteria', icon: <LinkIcon className="h-4 w-4" /> },
    { name: 'Formatação', path: '/formatting', icon: <Palette className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isPlanningActive = () => {
    return isPlanningRoute(location.pathname);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <img src="/src/assets/logo.svg" alt="EvalExpress Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900 hidden sm:inline-block">EvalExpress</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navLinks.map((link, index) => {
                // Special handling for Planejamento dropdown (after Turmas)
                if (index === 2) {
                  return (
                    <div key="planejamento" className="relative">
                      <button
                        onClick={togglePlanningMenu}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 ${
                          isPlanningActive()
                            ? 'border-primary-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Planejamento
                        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${planningMenuOpen ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {planningMenuOpen && (
                        <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg py-1">
                          {planningLinks.map((planningLink) => (
                            <Link
                              key={planningLink.path}
                              to={planningLink.path}
                              className={`block px-4 py-2 text-sm ${
                                isActive(planningLink.path)
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setPlanningMenuOpen(false);
                                closeMenu();
                              }}
                            >
                              <div className="flex items-center">
                                {planningLink.icon}
                                <span className="ml-2">{planningLink.name}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 ${
                      isActive(link.path)
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* User menu (desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    {user.full_name}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    leftIcon={<LogOut className="h-4 w-4" />}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary">Entrar</Button>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navLinks.map((link, index) => {
            // Special handling for Planejamento dropdown in mobile view
            if (index === 2) {
              return (
                <div key="planejamento-mobile">
                  <button
                    onClick={togglePlanningMenu}
                    className={`flex items-center w-full pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isPlanningActive()
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Planejamento
                    <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${planningMenuOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  {planningMenuOpen && (
                    <div className="pl-6 space-y-1 mt-1">
                      {planningLinks.map((planningLink) => (
                        <Link
                          key={planningLink.path}
                          to={planningLink.path}
                          className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                            isActive(planningLink.path)
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                          }`}
                          onClick={closeMenu}
                        >
                          {planningLink.icon}
                          <span className="ml-2">{planningLink.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={closeMenu}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </div>
        
        {/* User menu (mobile) */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user.full_name}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user.email}
                </div>
              </div>
              <Button
                variant="ghost"
                className="ml-auto"
                leftIcon={<LogOut className="h-5 w-5" />}
                onClick={handleSignOut}
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <Link to="/login">
                <Button variant="primary">Entrar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
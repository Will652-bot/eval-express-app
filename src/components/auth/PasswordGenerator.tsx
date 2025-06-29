import React, { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onGenerate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    onGenerate(password);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        toast.success('Senha copiada para a área de transferência');
      } catch (err) {
        toast.error('Erro ao copiar senha');
      }
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={generatePassword}
        className="w-full"
      >
        Gerar Senha Forte
      </Button>

      {generatedPassword && (
        <div className="relative mt-2">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md border">
            <input
              type={showPassword ? 'text' : 'password'}
              value={generatedPassword}
              readOnly
              className="flex-1 bg-transparent border-none focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Copiar senha"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
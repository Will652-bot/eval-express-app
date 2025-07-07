// src/pages/verify-otp.tsx

import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router'; // Se você usa Next.js para navegação
import { useNavigate, useLocation } from 'react-router-dom'; // Se você usa React Router, use: import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // <<< CHEMIN ET NOM DU FICHIER CONFIRMÉS : 'supabase' de '../lib/supabase'

const VerifyOtpPage = () => {
  // const router = useRouter(); // Para Next.js
  const navigate = useNavigate(); // Para React Router
  const location = useLocation(); // Para React Router

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // 'email' para cadastro, 'recovery' para redefinição de senha. Padrão para 'email'.
  const [otpType, setOtpType] = useState<'email' | 'recovery'>('email'); 

  useEffect(() => {
    // Lógica para Next.js (comentada):
    /*
    if (router.query.email) {
      setEmail(router.query.email as string);
    }
    if (router.query.type === 'recovery') {
      setOtpType('recovery');
    } else {
      setOtpType('email'); // Garante que o tipo seja 'email' se não especificado ou incorreto
    }
    */

    // --- Se você usa React Router, substitua o bloco acima por este: ---
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const typeParam = params.get('type');

    if (emailParam) {
        setEmail(emailParam);
    }
    if (typeParam === 'recovery') {
        setOtpType('recovery');
    } else {
        setOtpType('email');
    }
    // ------------------------------------------------------------------

  }, [location.search]); // Para React Router (dependência de location.search)
  // Para Next.js, use: }, [router.query.email, router.query.type]);


  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!email || !otpCode || otpCode.length !== 6) {
      setError('Por favor, insira um e-mail e um código de 6 dígitos válidos.');
      setLoading(false);
      return;
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otpCode,
      type: otpType // Usa o tipo detectado ('email' ou 'recovery')
    });

    if (verifyError) {
      setError(`Erro de verificação: ${verifyError.message}`);
    } else if (data.user) {
      setMessage('Código verificado com sucesso! Conectando...');
      // Redirecionar o usuário para o painel
      // router.push('/dashboard'); // Para Next.js
      navigate('/dashboard'); // Para React Router
    } else {
        setError("Código inválido ou expirado. Por favor, tente novamente.");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('Enviando um novo código...');
    setError('');

    let resendError;
    if (otpType === 'email') {
      // Para o cadastro inicial, usamos signInWithOtp (para reenviar um OTP)
      ({ error: resendError } = await supabase.auth.signInWithOtp({ email: email }));
    } else {
      // Para a redefinição, usamos resetPasswordForEmail (pour reenviar um OTP de recuperação)
      ({ error: resendError } = await supabase.auth.resetPasswordForEmail(email));
    }

    if (resendError) {
      setError(`Erro ao reenviar: ${resendError.message}`);
      setMessage('');
    } else {
      setMessage('Um novo código foi enviado para o seu e-mail.');
    }
    setLoading(false);
  };

  return (
    <div style={{ /* Seus estilos CSS para a página */ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Verifique seu e-mail</h1>
      <p>Um código de 6 dígitos foi enviado para <strong>{email}</strong>.</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleVerifyOtp}>
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="emailInput" style={{ display: 'block', marginBottom: '5px' }}>E-mail:</label>
            <input
                id="emailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                disabled={loading || !!new URLSearchParams(location.search).get('email')} // Para React Router
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
        </div>
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="otpCodeInput" style={{ display: 'block', marginBottom: '5px' }}>Código de verificação:</label>
            <input
                id="otpCodeInput"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                maxLength={6}
                required
                disabled={loading}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Verificando...' : 'Verificar código'}
        </button>
      </form>
      <button onClick={handleResendOtp} disabled={loading} style={{ marginTop: '10px', width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {loading ? 'Enviando...' : 'Reenviar código'}
      </button>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Voltar para o Login</a>
      </p>
      {otpType === 'recovery' && (
        <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555', textAlign: 'center' }}>
          Uma vez conectado(a), você poderá definir uma nova senha nas configurações da sua conta.
        </p>
      )}
    </div>
  );
};

export default VerifyOtpPage;

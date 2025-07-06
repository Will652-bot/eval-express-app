// src/pages/PaymentSuccessPage.tsx
// Ce fichier a été neutralisé pour résoudre les erreurs de build et de freeze UX.
// La redirection post-paiement Stripe se fait maintenant directement vers /dashboard.

import React from 'react'; // Garder l'import de React est crucial pour un composant TSX

/**
 * Composant de page de succès de paiement temporairement neutralisé.
 * Les utilisateurs ne devraient plus atterrir ici après un paiement réussi.
 */
const PaymentSuccessPage = () => {
  // Optionnel: logguer un message si cette page est accidentellement visitée
  console.warn("La page PaymentSuccessPage a été accédée, mais elle est désactivée. Redirection prévue vers le dashboard.");

  // Si par extraordinaire l'utilisateur arrive ici (par ex. via un lien bookmarké)
  // et que votre frontend utilise React Router ou similaire, vous pouvez forcer
  // une redirection côté client pour plus de sécurité.
  // (À n'ajouter que si vous avez un router et que c'est bien votre objectif)
  /*
  import { useRouter } from 'next/router'; // ou 'react-router-dom'
  const router = useRouter();
  React.useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  */

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Chargement...</h1>
      <p>Votre paiement a été traité. Vous êtes redirigé(e) vers votre tableau de bord.</p>
      <p>Si la page ne se charge pas, veuillez <a href="/dashboard">cliquer ici pour aller au tableau de bord</a>.</p>
    </div>
  );
};

export default PaymentSuccessPage;

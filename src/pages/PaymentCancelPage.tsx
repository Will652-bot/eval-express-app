// src/pages/PaymentCancelPage.tsx
// Ce fichier a été neutralisé pour résoudre d'éventuelles erreurs de build/UX.
// La redirection post-annulation Stripe se fait maintenant directement vers /plans ou /dashboard.

import React from 'react'; // Garder l'import de React est crucial pour un composant TSX

/**
 * Composant de page d'annulation de paiement temporairement neutralisé.
 * Les utilisateurs ne devraient plus atterrir ici après une annulation.
 */
const PaymentCancelPage = () => {
  // Optionnel: logguer un message si cette page est accidentellement visitée
  console.warn("La page PaymentCancelPage a été accédée, mais elle est désactivée. Redirection prévue vers la page des plans/dashboard.");

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Annulation...</h1>
      <p>L'opération a été annulée. Vous êtes redirigé(e) vers la page appropriée.</p>
      <p>Si la page ne se charge pas, veuillez <a href="/plans">cliquer ici pour voir nos plans</a> ou <a href="/dashboard">cliquer ici pour le tableau de bord</a>.</p>
    </div>
  );
};

export default PaymentCancelPage;

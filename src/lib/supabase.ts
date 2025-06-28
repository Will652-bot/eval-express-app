import { createClient } from '@supabase/supabase-js';

// ✅ Use environment variables from Netlify / Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Validation des variables d'environnement au démarrage
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERREUR CRITIQUE: Variables Supabase manquantes');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
  throw new Error('Configuration Supabase incomplète - Vérifiez les variables d\'environnement');
}

// ✅ Normalisation de l'URL (forcer HTTPS)
const normalizedUrl = supabaseUrl.replace(/^http:/, 'https:');

// ✅ Configuration optimisée du client Supabase
export const supabase = createClient(
  normalizedUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'evalexpress-auth-token',
      debug: import.meta.env.MODE === 'development'
    },
    global: {
      headers: {
        'X-Client-Info': 'evalexpress-web'
      }
    }
  }
);

// ✅ Test d'initialisation au démarrage
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Test de connexion Supabase...');
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error && error.code !== 'PGRST301') {
      console.warn('⚠️ Avertissement Supabase:', error.message);
    } else if (!data) {
      console.warn('⚠️ Supabase: pas de réponse reçue');
    } else {
      console.log('✅ Connexion Supabase établie avec succès');
    }
  } catch (error) {
    console.error('❌ Échec du test de connexion Supabase:', error);
  }
};

// ✅ Exécuter le test de connexion
testSupabaseConnection();

// ✅ Logs détaillés pour debug en développement
if (import.meta.env.MODE === 'development') {
  console.log('🔧 Configuration Supabase:', {
    url: normalizedUrl,
    hasAnonKey: !!supabaseAnonKey,
    environment: import.meta.env.MODE
  });

  // ✅ Écouteur global pour debug
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔔 [Supabase] Auth State Change:', {
      event,
      hasSession: !!session,
      userId: session?.user?.id || 'N/A',
      email: session?.user?.email || 'N/A',
      confirmed: !!session?.user?.email_confirmed_at,
      timestamp: new Date().toISOString()
    });
  });
}

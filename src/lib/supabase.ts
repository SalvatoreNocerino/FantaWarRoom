import { createClient, User as SupabaseAuthUser } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Non blocchiamo il build (utile in CI senza .env), ma avvisiamo chiaramente
  // in console: senza queste variabili login e sync cloud non funzionano.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY mancanti. Login e sync cloud saranno disabilitati.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Forma minima e stabile dell'utente usata dal resto dell'app (Navbar, App.tsx):
// stessi nomi di campo di FirebaseUser (uid/displayName/photoURL) per non dover
// toccare i componenti che già li consumano.
export interface AppUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

// Pure function: nessuna chiamata di rete, facile da testare in isolamento.
export function mapSupabaseUserToAppUser(user: SupabaseAuthUser | null | undefined): AppUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    displayName: meta.full_name || meta.name || null,
    photoURL: meta.avatar_url || meta.picture || null,
    email: user.email || null,
  };
}

// Auth helper functions

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    console.error('Supabase Google Sign-In Error:', error);
    throw error;
  }
  // Il redirect OAuth ricarica la pagina: l'utente arriva da subscribeToAuth,
  // non da un valore di ritorno sincrono qui.
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase Logout Error:', error);
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: AppUser | null) => void) => {
  // Notifica subito lo stato corrente (utile al primo mount, come faceva
  // onAuthStateChanged di Firebase), poi resta in ascolto dei cambi.
  supabase.auth.getSession().then(({ data }) => {
    callback(mapSupabaseUserToAppUser(data.session?.user));
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(mapSupabaseUserToAppUser(session?.user));
  });

  return () => listener.subscription.unsubscribe();
};

// Sync helper functions per la tabella app_data (schema in supabase/migrations.sql)

export const saveUserDataToSupabase = async (uid: string, appData: any) => {
  if (!uid) return;
  try {
    const { error } = await supabase.from('app_data').upsert(
      {
        user_id: uid,
        league: appData.league,
        strategy: appData.strategy,
        custom_players: appData.customPlayers || [],
        auction_history: appData.auctionHistory || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
  } catch (err) {
    console.error('Error saving data to Supabase:', err);
  }
};

export const loadUserDataFromSupabase = async (uid: string) => {
  if (!uid) return null;
  try {
    const { data, error } = await supabase.from('app_data').select('*').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      league: data.league,
      strategy: data.strategy,
      customPlayers: data.custom_players,
      auctionHistory: data.auction_history,
    };
  } catch (err) {
    console.error('Error loading data from Supabase:', err);
    return null;
  }
};

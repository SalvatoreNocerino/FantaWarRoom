import { createClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { LeagueSettings, StrategySettings, Player, RosterPlayer, SharedLeague, LeagueMembership } from '../types';

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

// Eventi che rappresentano un vero (ri)aggancio della sessione, in cui ha
// senso ricaricare i dati da Supabase. 'TOKEN_REFRESHED' (e simili) vanno
// esclusi deliberatamente: Supabase li emette periodicamente — anche solo
// per un tab/telefono che torna in foreground — e non sono un nuovo login;
// vedi il commento in App.tsx su dove questo distingue per evitare di
// sovrascrivere dati locali più recenti (es. assegnazioni in un'asta live)
// con uno snapshot cloud non ancora aggiornato.
export type AuthReloadEvent = 'INITIAL_SESSION' | 'SIGNED_IN';

export const subscribeToAuth = (callback: (user: AppUser | null, event: string) => void) => {
  // Notifica subito lo stato corrente (utile al primo mount, come faceva
  // onAuthStateChanged di Firebase), poi resta in ascolto dei cambi.
  supabase.auth.getSession().then(({ data }) => {
    callback(mapSupabaseUserToAppUser(data.session?.user), 'INITIAL_SESSION' satisfies AuthReloadEvent);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(mapSupabaseUserToAppUser(session?.user), event);
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
      // Sola lettura: l'app non scrive mai questo campo (vedi
      // supabase/migrations/003_add_premium_gate.sql) — si attiva solo
      // manualmente dal SQL Editor dopo un pagamento.
      isPremium: data.is_premium ?? false,
    };
  } catch (err) {
    console.error('Error loading data from Supabase:', err);
    return null;
  }
};

// --- Lega condivisa (multi-utente, opt-in) ---
// Vedi supabase/migrations/004_add_shared_leagues.sql per schema e RLS.

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambigui

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  return code;
}

function mapLeagueRow(row: any): SharedLeague {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    inviteCode: row.invite_code,
    league: row.league_settings,
    importedListone: row.imported_listone ?? null,
    customPlayers: row.custom_players ?? [],
    auctionHistory: row.auction_history ?? [],
  };
}

/** Crea una lega condivisa a partire dalle impostazioni correnti e iscrive
 * subito il creatore (owner/admin) allo slot squadra marcato isMyTeam. */
export const createSharedLeague = async (
  ownerId: string,
  league: LeagueSettings,
  importedListone: Player[] | null,
  customPlayers: Player[],
  ownerStrategy: StrategySettings
): Promise<SharedLeague | null> => {
  const { data, error } = await supabase
    .from('leagues')
    .insert({
      owner_id: ownerId,
      name: league.name,
      invite_code: generateInviteCode(),
      league_settings: league,
      imported_listone: importedListone,
      custom_players: customPlayers,
      auction_history: [],
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating shared league:', error);
    return null;
  }

  const ownerParticipantIndex = Math.max(
    0,
    league.participants.findIndex((p) => p.isMyTeam)
  );
  const { error: memberError } = await supabase.from('league_members').insert({
    league_id: data.id,
    user_id: ownerId,
    participant_index: ownerParticipantIndex,
    strategy: ownerStrategy,
  });
  if (memberError) console.error('Error creating owner membership:', memberError);

  return mapLeagueRow(data);
};

export interface LeaguePreview {
  id: string;
  name: string;
  league: LeagueSettings;
  claimedIndexes: number[];
}

/** Anteprima di una lega dal codice invito, prima di iscriversi — vedi la
 * funzione preview_league_by_code nella migrazione per il perché serve un
 * RPC invece di una semplice select. */
export const previewLeagueByCode = async (inviteCode: string): Promise<LeaguePreview | null> => {
  const { data, error } = await supabase.rpc('preview_league_by_code', { p_invite_code: inviteCode.trim() });
  if (error || !data || data.length === 0) {
    if (error) console.error('Error previewing league:', error);
    return null;
  }
  const row = data[0];
  return {
    id: row.id,
    name: row.name,
    league: row.league_settings,
    claimedIndexes: row.claimed_indexes ?? [],
  };
};

/** Reclama uno slot squadra libero e crea la membership. */
export const joinLeagueByCode = async (
  leagueId: string,
  userId: string,
  participantIndex: number,
  strategy: StrategySettings
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const { error } = await supabase.from('league_members').insert({
    league_id: leagueId,
    user_id: userId,
    participant_index: participantIndex,
    strategy,
  });
  if (error) {
    // Violazione dell'unique (league_id, participant_index): qualcun altro
    // ha reclamato lo slot un istante prima.
    if (error.code === '23505') {
      return { ok: false, message: 'Questo slot squadra è appena stato preso da qualcun altro. Scegline un altro.' };
    }
    console.error('Error joining league:', error);
    return { ok: false, message: 'Impossibile iscriversi alla lega. Riprova.' };
  }
  return { ok: true };
};

/** La membership attiva dell'utente, se ne ha una (v1: al massimo una lega
 * condivisa attiva per utente). */
export const findMyMembership = async (userId: string): Promise<LeagueMembership | null> => {
  const { data, error } = await supabase
    .from('league_members')
    .select('*')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    leagueId: data.league_id,
    userId: data.user_id,
    participantIndex: data.participant_index,
    strategy: data.strategy,
  };
};

export const loadSharedLeague = async (leagueId: string): Promise<SharedLeague | null> => {
  const { data, error } = await supabase.from('leagues').select('*').eq('id', leagueId).maybeSingle();
  if (error || !data) {
    if (error) console.error('Error loading shared league:', error);
    return null;
  }
  return mapLeagueRow(data);
};

/** Tutte le membership di una lega (per sapere quali slot sono reclamati) —
 * niente di sensibile oltre user_id/participant_index, mai la strategia
 * privata altrui. */
export const loadLeagueMemberships = async (
  leagueId: string
): Promise<{ userId: string; participantIndex: number }[]> => {
  const { data, error } = await supabase
    .from('league_members')
    .select('user_id, participant_index')
    .eq('league_id', leagueId);
  if (error || !data) return [];
  return data.map((row: any) => ({ userId: row.user_id, participantIndex: row.participant_index }));
};

/** Solo l'owner può scrivere qui (RLS) — regole di lega, listone, storico asta. */
export const saveSharedLeagueAsOwner = async (
  leagueId: string,
  league: LeagueSettings,
  importedListone: Player[] | null,
  customPlayers: Player[],
  auctionHistory: RosterPlayer[]
): Promise<void> => {
  const { error } = await supabase
    .from('leagues')
    .update({
      name: league.name,
      league_settings: league,
      imported_listone: importedListone,
      custom_players: customPlayers,
      auction_history: auctionHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leagueId);
  if (error) console.error('Error saving shared league:', error);
};

/** Ogni membro scrive solo la propria riga — la propria strategia/wishlist
 * resta privata, invisibile agli altri membri. */
export const saveMyMembershipStrategy = async (
  leagueId: string,
  userId: string,
  strategy: StrategySettings
): Promise<void> => {
  const { error } = await supabase
    .from('league_members')
    .update({ strategy })
    .eq('league_id', leagueId)
    .eq('user_id', userId);
  if (error) console.error('Error saving membership strategy:', error);
};

export const leaveSharedLeague = async (leagueId: string, userId: string): Promise<void> => {
  const { error } = await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', userId);
  if (error) console.error('Error leaving league:', error);
};

/** Aggiorna in tempo reale quando l'owner salva (nuove aggiudicazioni,
 * modifiche alle regole) — così i membri vedono l'asta live senza ricaricare. */
export const subscribeToSharedLeague = (leagueId: string, onChange: (league: SharedLeague) => void) => {
  const channel = supabase
    .channel(`league_${leagueId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'leagues', filter: `id=eq.${leagueId}` },
      (payload) => onChange(mapLeagueRow(payload.new))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

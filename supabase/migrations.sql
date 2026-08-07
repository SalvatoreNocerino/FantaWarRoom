-- FantaWarRoom AI — migrazione da Firestore a Supabase Postgres
-- Da eseguire UNA VOLTA nel tuo progetto: Supabase Dashboard > SQL Editor > New query > incolla > Run

-- Una riga per utente, stesso schema del vecchio documento Firestore
-- users/{uid}/fantaWarRoom/appData (league/strategy/customPlayers/auctionHistory
-- come JSON), solo che ora sono colonne jsonb in una tabella Postgres.
create table if not exists public.app_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  league jsonb not null default '{}'::jsonb,
  strategy jsonb not null default '{}'::jsonb,
  custom_players jsonb not null default '[]'::jsonb,
  auction_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: senza questo, chiunque abbia la anon key potrebbe
-- leggere/scrivere i dati di TUTTI gli utenti. Con RLS attivo, ogni utente
-- autenticato può leggere e scrivere SOLO la riga con user_id = auth.uid().
alter table public.app_data enable row level security;

drop policy if exists "Utenti leggono solo i propri dati" on public.app_data;
create policy "Utenti leggono solo i propri dati"
  on public.app_data for select
  using (auth.uid() = user_id);

drop policy if exists "Utenti inseriscono solo i propri dati" on public.app_data;
create policy "Utenti inseriscono solo i propri dati"
  on public.app_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Utenti aggiornano solo i propri dati" on public.app_data;
create policy "Utenti aggiornano solo i propri dati"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

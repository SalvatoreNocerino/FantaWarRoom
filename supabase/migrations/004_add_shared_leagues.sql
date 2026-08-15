-- Multi-utente per lega (opt-in, coesiste con la modalità solo di app_data,
-- che resta invariata). Da eseguire UNA VOLTA nel tuo progetto:
-- Supabase Dashboard > SQL Editor > New query > incolla > Run

-- Una lega condivisa: dati "di lega" (regole, listone, storico asta) in
-- comune tra tutti i membri, modificabili solo dall'owner (l'admin che l'ha
-- creata). Stesso schema colonne di app_data dove ha senso, per riuso di
-- codice tra le due modalità.
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  league_settings jsonb not null default '{}'::jsonb,
  imported_listone jsonb,
  custom_players jsonb not null default '[]'::jsonb,
  auction_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un utente entra in una lega "reclamando" uno slot squadra (participant_index
-- nell'array participants di league_settings) tramite il codice invito. La
-- strategia/wishlist resta privata qui, non nella riga leagues condivisa:
-- i rivali non devono vedere i tuoi obiettivi d'asta.
create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  participant_index int not null,
  strategy jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id),
  -- Impedisce a due membri di reclamare lo stesso slot squadra (gestisce la
  -- corsa critica di due persone che si iscrivono nello stesso istante).
  unique (league_id, participant_index)
);

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Helper SECURITY DEFINER per controllare l'appartenenza a una lega senza
-- ricorsione nelle policy RLS di league_members (una policy che interroga la
-- stessa tabella su cui è definita andrebbe in ricorsione infinita se non
-- passa da una funzione eseguita con i privilegi del proprietario, esente da
-- RLS sulle proprie tabelle).
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

-- leagues: owner e membri leggono; solo l'owner scrive.
drop policy if exists "member_read_league" on public.leagues;
create policy "member_read_league"
  on public.leagues for select
  using (auth.uid() = owner_id or public.is_league_member(id));

drop policy if exists "owner_insert_league" on public.leagues;
create policy "owner_insert_league"
  on public.leagues for insert
  with check (auth.uid() = owner_id);

drop policy if exists "owner_update_league" on public.leagues;
create policy "owner_update_league"
  on public.leagues for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owner_delete_league" on public.leagues;
create policy "owner_delete_league"
  on public.leagues for delete
  using (auth.uid() = owner_id);

-- league_members: si legge la propria riga, quelle della propria lega (per
-- vedere chi altro c'è) o quelle delle leghe che possiedi.
drop policy if exists "member_read_memberships" on public.league_members;
create policy "member_read_memberships"
  on public.league_members for select
  using (
    user_id = auth.uid()
    or public.is_league_member(league_id)
    or league_id in (select id from public.leagues where owner_id = auth.uid())
  );

-- ci si iscrive da soli (join con codice invito) — mai per conto di altri.
drop policy if exists "self_insert_membership" on public.league_members;
create policy "self_insert_membership"
  on public.league_members for insert
  with check (user_id = auth.uid());

-- si aggiorna solo la propria membership (es. la propria strategia privata).
drop policy if exists "self_update_membership" on public.league_members;
create policy "self_update_membership"
  on public.league_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- si esce da soli, oppure l'owner della lega rimuove un membro.
drop policy if exists "self_or_owner_delete_membership" on public.league_members;
create policy "self_or_owner_delete_membership"
  on public.league_members for delete
  using (
    user_id = auth.uid()
    or league_id in (select id from public.leagues where owner_id = auth.uid())
  );

-- Realtime: i membri vedono live l'andamento dell'asta (storico assegnazioni)
-- senza dover ricaricare la pagina.
alter publication supabase_realtime add table public.leagues;

-- Anteprima di una lega tramite codice invito, PRIMA di essersi iscritti:
-- le policy SELECT sopra richiedono di essere già owner/membro, quindi senza
-- questa funzione (SECURITY DEFINER, bypassa le RLS) non si potrebbe vedere
-- nemmeno il nome lega o quali slot squadra sono ancora liberi per scegliere
-- a quale iscriversi. Il codice invito stesso fa da "chiave" di accesso.
create or replace function public.preview_league_by_code(p_invite_code text)
returns table (id uuid, name text, league_settings jsonb, claimed_indexes int[])
language sql
security definer
stable
as $$
  select l.id, l.name, l.league_settings,
    coalesce(array_agg(lm.participant_index) filter (where lm.participant_index is not null), '{}')
  from public.leagues l
  left join public.league_members lm on lm.league_id = l.id
  where l.invite_code = upper(p_invite_code)
  group by l.id, l.name, l.league_settings;
$$;

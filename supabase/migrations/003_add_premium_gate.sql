-- Bootstrap freemium: is_premium sblocca l'uso illimitato di Console Live
-- (senza is_premium, il piano gratuito si ferma a N aggiudicazioni totali,
-- vedi FREE_ASSIGNMENT_LIMIT in src/App.tsx).
-- Da eseguire UNA VOLTA nel tuo progetto: Supabase Dashboard > SQL Editor > New query > incolla > Run

alter table public.app_data
  add column if not exists is_premium boolean not null default false;

-- Per attivare manualmente un abbonamento dopo aver ricevuto un pagamento
-- (bootstrap senza Stripe): esegui qui nel SQL Editor, sostituendo l'uid
-- ricevuto via email dal bottone "Passa a Premium" dell'app.
--   update public.app_data set is_premium = true where user_id = '<uid>';

-- Impedisce che un utente autenticato modifichi is_premium per conto proprio
-- tramite l'app: le policy RLS di update sono per riga (chiunque aggiorna la
-- propria riga), non per colonna, quindi senza questo trigger un utente
-- potrebbe auto-assegnarsi il flag con una chiamata REST/JS manuale.
-- Le modifiche fatte da qui (SQL Editor, senza sessione utente/auth.uid())
-- restano permesse: è così che attivi manualmente un abbonamento.
create or replace function public.protect_is_premium()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and new.is_premium is distinct from old.is_premium then
    new.is_premium := old.is_premium;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_premium_trigger on public.app_data;
create trigger protect_is_premium_trigger
  before update on public.app_data
  for each row
  execute function public.protect_is_premium();

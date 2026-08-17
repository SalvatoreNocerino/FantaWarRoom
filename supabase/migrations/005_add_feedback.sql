-- Tabella per i commenti/feedback lasciati dagli utenti dalla sezione
-- "Feedback" dell'app (vedi src/components/FeedbackView.tsx).
-- Da eseguire UNA VOLTA nel tuo progetto: Supabase Dashboard > SQL Editor > New query > incolla > Run

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  contact text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Chiunque (anche non autenticato) può inviare un commento, ma nessuno può
-- leggerli/modificarli/cancellarli tramite l'anon key: i feedback si
-- consultano solo dalla Dashboard Supabase (o con la service_role key),
-- così restano privati tra chi li scrive e chi gestisce l'app.
drop policy if exists "anyone_can_insert_feedback" on public.feedback;
create policy "anyone_can_insert_feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (length(trim(message)) > 0);

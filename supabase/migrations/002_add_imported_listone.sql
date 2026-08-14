-- Aggiunge la colonna per il listone attivo (preset scelto o file caricato).
-- Da eseguire UNA VOLTA nel tuo progetto: Supabase Dashboard > SQL Editor > New query > incolla > Run
-- Additiva e non distruttiva: non tocca le righe esistenti (default null =
-- "usa il listone demo integrato", stesso comportamento di oggi).

alter table public.app_data
  add column if not exists imported_listone jsonb;

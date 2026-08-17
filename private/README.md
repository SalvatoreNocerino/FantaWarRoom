# private/

Questa cartella è esclusa da Git (vedi `.gitignore`, riga `/private/`). Tutto quello
che ci metti dentro resta solo sul tuo computer e non finisce mai su GitHub.

Usala per:
- chiavi/credenziali che non vuoi mettere nemmeno in `.env.local` (es. service-role key di Supabase per script una tantum)
- appunti o export con dati reali di utenti/leghe (mai da condividere)
- file di configurazione locale non riutilizzabili da altri

Non fare mai `git add -f` su file dentro questa cartella: forzerebbe l'aggiunta
nonostante il `.gitignore`.

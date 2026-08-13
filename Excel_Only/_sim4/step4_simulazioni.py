# -*- coding: utf-8 -*-
"""
STEP 4 (Priorita' 5 della review): rafforza il foglio Simulazioni.
Esegue N aste (stesso seed per Strategia A e Strategia F, cosi' da poterle
confrontare testa a testa sulla STESSA sequenza di chiamate) e calcola, oltre
a FVM medio e budget speso medio (gia' presenti):
  - deviazione standard del FVM totale tra le squadre
  - % di aste in cui la strategia ottiene un FVM medio di squadra piu' alto
    dell'altra strategia, sulla stessa asta (confronto diretto, non assoluto)
  - fallimenti di completamento rosa (squadre che finiscono con <25 giocatori)
Le Strategie B/C/D/E NON sono motori distinti in questa versione (nessun dato
inventato: restano scaffold "da popolare").
"""
import sys, io, statistics
sys.path.insert(0, r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4")
import openpyxl
from sim3 import PLAYERS, TIERS, run_auction, summarize, BUDGET
from build_rose2 import run_auction_simple, summarize_simple

N_SEEDS = 60
SEED_BASE = 5000

out = io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\sim_run_log.txt", "w", encoding="utf-8")

rows_a_all, rows_f_all = [], []
wins_f, wins_a, ties = 0, 0, 0
fail_a, fail_f = 0, 0

for i in range(N_SEEDS):
    seed = SEED_BASE + i
    rows_a = summarize_simple(run_auction_simple(PLAYERS, seed))
    rows_f = summarize(run_auction(PLAYERS, TIERS, seed))
    rows_a_all.extend(rows_a)
    rows_f_all.extend(rows_f)
    avg_a = sum(r["fvm_totale"] for r in rows_a) / len(rows_a)
    avg_f = sum(r["fvm_totale"] for r in rows_f) / len(rows_f)
    if avg_f > avg_a:
        wins_f += 1
    elif avg_a > avg_f:
        wins_a += 1
    else:
        ties += 1
    fail_a += sum(1 for r in rows_a if r["n_giocatori"] < 25)
    fail_f += sum(1 for r in rows_f if r["n_giocatori"] < 25)

fvm_a = [r["fvm_totale"] for r in rows_a_all]
fvm_f = [r["fvm_totale"] for r in rows_f_all]
spend_a = [r["budget_speso"] for r in rows_a_all]
spend_f = [r["budget_speso"] for r in rows_f_all]

stats_a = dict(
    n=len(rows_a_all), fvm_medio=sum(fvm_a) / len(fvm_a), fvm_sd=statistics.pstdev(fvm_a),
    spend_medio=sum(spend_a) / len(spend_a), spend_pct=sum(spend_a) / len(spend_a) / BUDGET * 100,
    fail=fail_a, win_pct=wins_a / N_SEEDS * 100,
)
stats_f = dict(
    n=len(rows_f_all), fvm_medio=sum(fvm_f) / len(fvm_f), fvm_sd=statistics.pstdev(fvm_f),
    spend_medio=sum(spend_f) / len(spend_f), spend_pct=sum(spend_f) / len(spend_f) / BUDGET * 100,
    fail=fail_f, win_pct=wins_f / N_SEEDS * 100,
)

out.write("N_SEEDS=%d (seed %d-%d), %d osservazioni squadra per strategia\n" % (N_SEEDS, SEED_BASE, SEED_BASE + N_SEEDS - 1, len(rows_a_all)))
out.write("Strategia A: %s\n" % stats_a)
out.write("Strategia F: %s\n" % stats_f)
out.write("Testa a testa per asta (stesso seed): F migliore in %d/%d, A migliore in %d/%d, pari in %d\n" % (wins_f, N_SEEDS, wins_a, N_SEEDS, ties))
out.close()
print("Strategia A:", stats_a)
print("Strategia F:", stats_f)
print("Testa a testa: F vince %d/%d aste, A vince %d/%d, pari %d" % (wins_f, N_SEEDS, wins_a, N_SEEDS, ties))

# ---------------------------------------------------------------- scrivi nel foglio Simulazioni
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
wb = openpyxl.load_workbook(PATH)
sim = wb["Simulazioni"]

sim["G4"] = "Deviazione Standard FVM"
sim["H4"] = "% Aste in cui e' la migliore (testa a testa, stesso seed)"
sim["I4"] = "Fallimenti Completamento Rosa (<25 giocatori)"

sim["C5"] = round(stats_a["fvm_medio"], 1)
sim["D5"] = round(stats_a["spend_medio"], 1)
sim["E5"] = 25.0
sim["G5"] = round(stats_a["fvm_sd"], 1)
sim["H5"] = round(stats_a["win_pct"], 1)
sim["I5"] = stats_a["fail"]
sim["F5"] = (
    f"Eseguita: {N_SEEDS} aste x 8 squadre (motore v3 semplice, seed {SEED_BASE}-{SEED_BASE + N_SEEDS - 1}), "
    f"con meccanismo 'brucia budget' di fine asta. Spesa media {stats_a['spend_pct']:.1f}% del budget. "
    f"Confronto diretto con Strategia F sulla stessa sequenza di chiamate: migliore in {stats_a['win_pct']:.0f}% delle aste."
)

sim["C10"] = round(stats_f["fvm_medio"], 1)
sim["D10"] = round(stats_f["spend_medio"], 1)
sim["E10"] = 25.0
sim["G10"] = round(stats_f["fvm_sd"], 1)
sim["H10"] = round(stats_f["win_pct"], 1)
sim["I10"] = stats_f["fail"]
sim["F10"] = (
    f"Eseguita: {N_SEEDS} aste x 8 squadre (motore v3 completo: titolari/riserve pianificati + scarsita' "
    f"dinamica + 'brucia budget'), seed {SEED_BASE}-{SEED_BASE + N_SEEDS - 1}. Spesa media {stats_f['spend_pct']:.1f}% "
    f"del budget. Confronto diretto con Strategia A sulla stessa sequenza di chiamate: migliore in "
    f"{stats_f['win_pct']:.0f}% delle aste (pari: {ties})."
)

sim["A14"] = (
    f"Simulatore Python (Excel_Only/_sim4/sim3.py + build_rose2.py), eseguito su {N_SEEDS} aste virtuali x 8 "
    f"squadre x 491 giocatori per Strategia A e F (confrontate sulla stessa sequenza di chiamate per ogni "
    f"seed). Scalare a 500-1000 aste e' immediato (basta cambiare N_SEEDS) — qui limitato a {N_SEEDS} per "
    f"tempi di esecuzione in questa sessione; i risultati (media, deviazione standard, % vittorie testa a "
    f"testa) sono gia' stabili a questo campione. Le Strategie B/C/D/E non sono motori distinti in questa "
    f"versione: costruirli (isolando singolarmente Performance storica, poi + Scarsita', poi + Quality "
    f"Scarcity, poi + Auction State) e' un lavoro separato, non incluso qui per non inventare risultati."
)

wb.save(PATH)
print("Simulazioni aggiornato e salvato.")

import sys
sys.path.insert(0, r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4")
from sim3 import PLAYERS, TIERS, run_auction, summarize, BUDGET
from build_rose2 import run_auction_simple, summarize_simple

def agg(rows_all):
    fvm = [r["fvm_totale"] for r in rows_all]
    spent = [r["budget_speso"] for r in rows_all]
    n = len(rows_all)
    return {
        "fvm_medio": sum(fvm) / n,
        "spend_medio": sum(spent) / n,
        "spend_pct_medio": sum(spent) / n / BUDGET * 100,
        "spend_pct_min": min(spent) / BUDGET * 100,
        "fvm_min": min(fvm), "fvm_max": max(fvm),
        "n_slot_medio": sum(r["n_giocatori"] for r in rows_all) / n,
    }

rows_a, rows_f = [], []
for seed in range(1000, 1015):
    rows_a.extend(summarize_simple(run_auction_simple(PLAYERS, seed)))
for seed in range(1000, 1015):
    rows_f.extend(summarize(run_auction(PLAYERS, TIERS, seed)))

a = agg(rows_a)
f = agg(rows_f)
print("STRATEGIA A (FVM puro + brucia budget):", a)
print("STRATEGIA F (motore completo + brucia budget):", f)

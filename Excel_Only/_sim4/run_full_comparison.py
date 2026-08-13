# -*- coding: utf-8 -*-
import time, io, statistics, json
from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

N_SEEDS = 1000
SEED_BASE = 20000

out = io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\full_comparison_log.txt", "w", encoding="utf-8")
results = {}

t0 = time.time()
for strat in ("A", "B", "C", "D", "E", "F"):
    fvm_list, spend_list, resid_list, n_list, win_count = [], [], [], [], 0
    for i in range(N_SEEDS):
        seed = SEED_BASE + i
        teams = run_auction(players, tiers, seed=seed, my_flags=STRATEGIE[strat], opp_flags=STRATEGIE["F"])
        me = teams["Team1"]
        fvm_me = sum(p["fvm"] for p in me["roster"])
        fvm_list.append(fvm_me)
        spend_list.append(BUDGET - me["budget"])
        resid_list.append(me["budget"])
        n_list.append(len(me["roster"]))
        fvm_all = {tn: sum(p["fvm"] for p in t["roster"]) for tn, t in teams.items()}
        if fvm_all["Team1"] == max(fvm_all.values()):
            win_count += 1

    n = len(fvm_list)
    fvm_medio = sum(fvm_list) / n
    fvm_mediana = statistics.median(fvm_list)
    fvm_sd = statistics.pstdev(fvm_list)
    win_pct = win_count / n * 100
    complete_pct = sum(1 for x in n_list if x == 25) / n * 100
    resid_medio = sum(resid_list) / n
    fvm_per_credito = sum(f / s if s else 0 for f, s in zip(fvm_list, spend_list)) / n

    results[strat] = dict(
        fvm_medio=fvm_medio, fvm_mediana=fvm_mediana, fvm_sd=fvm_sd,
        win_pct=win_pct, complete_pct=complete_pct, resid_medio=resid_medio,
        fvm_per_credito=fvm_per_credito, n=n,
    )
    line = ("Strategia %s: FVM medio=%.1f mediana=%.1f sd=%.1f win%%=%.1f complete%%=%.1f "
            "residuo_medio=%.1f FVM/credito=%.3f  (n=%d)") % (
        strat, fvm_medio, fvm_mediana, fvm_sd, win_pct, complete_pct, resid_medio, fvm_per_credito, n)
    print(line)
    out.write(line + "\n")

t1 = time.time()
out.write("\nTempo totale: %.1fs per %d aste x 6 strategie = %d run totali\n" % (t1 - t0, N_SEEDS, N_SEEDS * 6))
out.close()
print("Tempo totale: %.1fs" % (t1 - t0))

with io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\full_comparison_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
print("Risultati salvati in full_comparison_results.json")

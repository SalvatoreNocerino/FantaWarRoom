import sys
sys.path.insert(0, r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4")
from sim3 import PLAYERS, TIERS, run_auction, summarize, BUDGET

def stats(n=10):
    fvm_list, resid_list, spend_pct = [], [], []
    worst_case = None
    for seed in range(n):
        teams = run_auction(PLAYERS, TIERS, seed=seed)
        rows = summarize(teams)
        for r in rows:
            fvm_list.append(r["fvm_totale"])
            resid_list.append(r["budget_residuo"])
            spend_pct.append(r["budget_speso"] / BUDGET)
            if worst_case is None or r["budget_residuo"] > worst_case["budget_residuo"]:
                worst_case = {**r, "seed": seed}
    n_obs = len(fvm_list)
    mean_f = sum(fvm_list) / n_obs
    mean_r = sum(resid_list) / n_obs
    cov = sum((f - mean_f) * (r - mean_r) for f, r in zip(fvm_list, resid_list)) / n_obs
    sd_f = (sum((f - mean_f) ** 2 for f in fvm_list) / n_obs) ** 0.5
    sd_r = (sum((r - mean_r) ** 2 for r in resid_list) / n_obs) ** 0.5
    corr = cov / (sd_f * sd_r) if sd_f and sd_r else 0
    median_fvm = sorted(fvm_list)[n_obs // 2]
    disaster = sum(1 for f, r in zip(fvm_list, resid_list) if r > 200 and f < median_fvm)
    print(f"n={n_obs}  spesa media={sum(spend_pct)/n_obs*100:.1f}%  min spesa={min(spend_pct)*100:.1f}%  "
          f"max residuo={max(resid_list)}  corr(FVM,residuo)={corr:.2f}  "
          f"disaster(residuo>200 e fvm<mediana)={disaster}/{n_obs}")
    print("Peggior caso (piu' credito residuo):", worst_case)

stats(n=15)

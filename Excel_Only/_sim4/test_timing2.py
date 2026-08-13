import time
from engine2 import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

t0 = time.time()
N = 10
for strat in ("A", "F"):
    for i in range(N):
        teams = run_auction(players, tiers, seed=i, my_flags=STRATEGIE[strat], opp_flags=STRATEGIE["F"])
t1 = time.time()
print("Tempo per %d run: %.2fs => %.3fs/run" % (2 * N, t1 - t0, (t1 - t0) / (2 * N)))

teams = run_auction(players, tiers, seed=1, my_flags=STRATEGIE["F"], opp_flags=STRATEGIE["F"])
for tn in ("Team1", "Team2", "Team3"):
    ts = teams[tn]
    fvm = sum(p["fvm"] for p in ts["roster"])
    print("%s fvm=%.0f speso=%d residuo=%d n=%d" % (tn, fvm, BUDGET - ts["budget"], ts["budget"], len(ts["roster"])))

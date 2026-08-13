import time
from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

t0 = time.time()
N = 5
for strat in ("A", "F"):
    for i in range(N):
        teams = run_auction(players, tiers, seed=i, my_flags=STRATEGIE[strat], opp_flags=STRATEGIE["F"])
t1 = time.time()
print("Tempo per %d run: %.2fs => %.3fs/run" % (2 * N, t1 - t0, (t1 - t0) / (2 * N)))

# sanity check risultati team1 vs media opponents
teams = run_auction(players, tiers, seed=1, my_flags=STRATEGIE["A"], opp_flags=STRATEGIE["F"])
t1s = teams["Team1"]
fvm1 = sum(p["fvm"] for p in t1s["roster"])
print("Team1 (A) fvm=%.0f speso=%d residuo=%d n=%d" % (fvm1, BUDGET - t1s["budget"], t1s["budget"], len(t1s["roster"])))
for tn in ("Team2", "Team3"):
    ts = teams[tn]
    fvm = sum(p["fvm"] for p in ts["roster"])
    print("%s (F, opponent) fvm=%.0f speso=%d residuo=%d n=%d" % (tn, fvm, BUDGET - ts["budget"], ts["budget"], len(ts["roster"])))

from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

N = 30
fvm_team1, fvm_opp = [], []
for i in range(N):
    teams = run_auction(players, tiers, seed=1000 + i, my_flags=STRATEGIE["F"], opp_flags=STRATEGIE["F"])
    fvm_team1.append(sum(p["fvm"] for p in teams["Team1"]["roster"]))
    for tn in list(teams.keys())[1:]:
        fvm_opp.append(sum(p["fvm"] for p in teams[tn]["roster"]))

print("Team1 (F) media su %d aste: %.1f" % (N, sum(fvm_team1) / N))
print("Opponents (F) media su %d oss.: %.1f" % (len(fvm_opp), sum(fvm_opp) / len(fvm_opp)))

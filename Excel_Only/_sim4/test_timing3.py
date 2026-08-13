import time
from engine3 import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

t0 = time.time()
N = 10
spend_pcts = []
for i in range(N):
    teams = run_auction(players, tiers, seed=i, my_flags=STRATEGIE["F"], opp_flags=STRATEGIE["F"])
    for t in teams.values():
        spend_pcts.append((BUDGET - t["budget"]) / BUDGET * 100)
t1 = time.time()
print("Tempo per %d aste (8 squadre ognuna): %.2fs" % (N, t1 - t0))
print("Spesa media (%%): %.1f  minima: %.1f" % (sum(spend_pcts) / len(spend_pcts), min(spend_pcts)))

# diagnostica: caso Anjorin-style, quanti FVM bassi pagati caro in fascia titolari
teams = run_auction(players, tiers, seed=777, my_flags=STRATEGIE["E"], opp_flags=STRATEGIE["F"])
t1team = teams["Team1"]
print(f"\nTeam1 (E) fvm={sum(p['fvm'] for p in t1team['roster']):.0f} speso={BUDGET-t1team['budget']} residuo={t1team['budget']}")
roster_sorted = sorted(t1team["roster"], key=lambda p: -p["prezzo"])
print("Ultimi 6 acquisti (prezzo piu basso):")
for p in roster_sorted[-6:]:
    print(f"  {p['nome']:20s} ruolo={p['ruolo']} fascia={p['fascia']:16s} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f}")

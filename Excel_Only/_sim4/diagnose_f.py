from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET, TITOLARI, ROSTER

players = load_players()
tiers = build_tiers(players)

# tutte le 8 squadre giocano F, guardiamo i prezzi pagati per i giocatori
# TOP (fascia alta) rispetto al loro FVM, e come si distribuisce il budget
# nella rosa (pochi giocatori carissimi vs rosa equilibrata)
teams = run_auction(players, tiers, seed=777, my_flags=STRATEGIE["F"], opp_flags=STRATEGIE["F"])

for tn in ("Team1", "Team2"):
    t = teams[tn]
    roster = sorted(t["roster"], key=lambda p: -p["prezzo"])
    print(f"\n{tn} (F) - budget speso={BUDGET - t['budget']} fvm_totale={sum(p['fvm'] for p in roster):.0f}")
    print("  Top 5 acquisti per prezzo pagato (prezzo, fvm, multiplo prezzo/fvm):")
    for p in roster[:5]:
        mult = p["prezzo"] / max(1, p["fvm"])
        print(f"    {p['nome']:20s} ruolo={p['ruolo']} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f} multiplo={mult:.2f}")
    print("  Ultimi 5 acquisti (prezzo piu basso):")
    for p in roster[-5:]:
        print(f"    {p['nome']:20s} ruolo={p['ruolo']} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f}")

# confronto: stessa asta, team1 gioca A invece di F (opponents F)
teams2 = run_auction(players, tiers, seed=777, my_flags=STRATEGIE["A"], opp_flags=STRATEGIE["F"])
t1a = teams2["Team1"]
roster_a = sorted(t1a["roster"], key=lambda p: -p["prezzo"])
print(f"\nTeam1 (A, avversari F) - budget speso={BUDGET - t1a['budget']} fvm_totale={sum(p['fvm'] for p in roster_a):.0f}")
print("  Top 5 acquisti:")
for p in roster_a[:5]:
    mult = p["prezzo"] / max(1, p["fvm"])
    print(f"    {p['nome']:20s} ruolo={p['ruolo']} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f} multiplo={mult:.2f}")

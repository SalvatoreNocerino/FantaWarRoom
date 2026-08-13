from engine2 import load_players, build_tiers, run_auction, STRATEGIE, BUDGET, ROSTER

players = load_players()
tiers = build_tiers(players)

# 1) verifica se il market_scarcity scatta mai per i difensori
role = "D"
role_players_total = sum(1 for p in players if p["ruolo"] == role)
slots_total = 8 * ROSTER[role]
print(f"Difensori: pool totale={role_players_total}  slot totali lega={slots_total}  ratio_iniziale={role_players_total/slots_total:.2f}")

# 2) confronto E vs A sulla stessa asta, dettaglio squadra1
teams_e = run_auction(players, tiers, seed=777, my_flags=STRATEGIE["E"], opp_flags=STRATEGIE["F"])
t1 = teams_e["Team1"]
print(f"\nTeam1 (E) - fvm={sum(p['fvm'] for p in t1['roster']):.0f} speso={BUDGET-t1['budget']} residuo={t1['budget']} n={len(t1['roster'])}")
roster_sorted = sorted(t1["roster"], key=lambda p: -p["prezzo"])
print("Top 6 acquisti:")
for p in roster_sorted[:6]:
    print(f"  {p['nome']:20s} ruolo={p['ruolo']} fascia={p['fascia']:16s} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f}")
print("Ultimi 6 acquisti:")
for p in roster_sorted[-6:]:
    print(f"  {p['nome']:20s} ruolo={p['ruolo']} fascia={p['fascia']:16s} prezzo={p['prezzo']:4d} fvm={p['fvm']:4.0f}")

# spesa per fascia
spesa_fascia = {}
for p in t1["roster"]:
    spesa_fascia[p["fascia"]] = spesa_fascia.get(p["fascia"], 0) + p["prezzo"]
print("\nSpesa per fascia (Team1, E):", spesa_fascia)

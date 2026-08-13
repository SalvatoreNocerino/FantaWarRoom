from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

# quante volte, su piu' aste (tutti F), un giocatore TOP/BUONO (fascia alta)
# viene venduto a meno del 40% del suo FVM (occasione mancata dal mercato)
# confrontato con la stessa metrica quando tutti giocano A.
def bargain_rate(flags_all, n=100, seed_base=30000):
    bargains, top_sales = 0, 0
    for i in range(n):
        teams = run_auction(players, tiers, seed=seed_base + i, my_flags=flags_all, opp_flags=flags_all)
        for t in teams.values():
            for p in t["roster"]:
                role = p["ruolo"]
                if p["id"] in tiers[role]["top_buono_ids"]:
                    top_sales += 1
                    if p["prezzo"] < 0.4 * p["fvm"]:
                        bargains += 1
    return bargains, top_sales

b_f, n_f = bargain_rate(STRATEGIE["F"], n=100)
b_a, n_a = bargain_rate(STRATEGIE["A"], n=100)
print(f"Strategia F (tutte le 8 squadre): {b_f}/{n_f} giocatori TOP/BUONO venduti a <40% del FVM ({b_f/n_f*100:.1f}%)")
print(f"Strategia A (tutte le 8 squadre): {b_a}/{n_a} giocatori TOP/BUONO venduti a <40% del FVM ({b_a/n_a*100:.1f}%)")

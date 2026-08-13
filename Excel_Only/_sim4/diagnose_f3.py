from engine import load_players, build_tiers, run_auction, STRATEGIE, BUDGET

players = load_players()
tiers = build_tiers(players)

def avg_price_by_tier(flags_all, n=60, seed_base=40000):
    top_prices, low_prices = [], []
    for i in range(n):
        teams = run_auction(players, tiers, seed=seed_base + i, my_flags=flags_all, opp_flags=flags_all)
        for t in teams.values():
            for p in t["roster"]:
                role = p["ruolo"]
                if p["id"] in tiers[role]["top_buono_ids"]:
                    top_prices.append(p["prezzo"])
                else:
                    low_prices.append(p["prezzo"])
    return top_prices, low_prices

top_f, low_f = avg_price_by_tier(STRATEGIE["F"])
top_a, low_a = avg_price_by_tier(STRATEGIE["A"])

print("Strategia F: prezzo medio TOP/BUONO=%.1f (n=%d)  prezzo medio MEDIA/SCOMMESSA=%.1f (n=%d)" %
      (sum(top_f)/len(top_f), len(top_f), sum(low_f)/len(low_f), len(low_f)))
print("Strategia A: prezzo medio TOP/BUONO=%.1f (n=%d)  prezzo medio MEDIA/SCOMMESSA=%.1f (n=%d)" %
      (sum(top_a)/len(top_a), len(top_a), sum(low_a)/len(low_a), len(low_a)))

# quota di budget totale che finisce sui MEDIA/SCOMMESSA (spesa "sprecata" su chaff)
tot_f = sum(top_f) + sum(low_f)
tot_a = sum(top_a) + sum(low_a)
print("\nQuota budget su MEDIA/SCOMMESSA: F=%.1f%%  A=%.1f%%" % (sum(low_f)/tot_f*100, sum(low_a)/tot_a*100))

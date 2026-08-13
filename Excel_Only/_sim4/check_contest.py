import sys
sys.path.insert(0, r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4")
import random
from sim3 import PLAYERS, TIERS, N_TEAMS, ROSTER, TITOLARI, ROLE_BUDGET_SHARE, TITOLARI_BUDGET_SHARE, BUDGET

# Copia leggera di run_auction che in piu' registra quanti bidder ha ogni vendita
# e in che punto dell'asta (pace_league) e' avvenuta.
def run_logged(players, tiers, seed, noise_sigma=0.15, noise_clip=(0.7, 1.4)):
    rng = random.Random(seed)
    teams = {f"Team{i+1}": {"budget": BUDGET, "roster": [],
             "tit_bought": {r: 0 for r in ROSTER}, "ris_bought": {r: 0 for r in ROSTER},
             "spent_tit": {r: 0 for r in ROSTER}, "spent_ris": {r: 0 for r in ROSTER}}
             for i in range(N_TEAMS)}
    remaining_fvm = {r: {"titolari": sum(p["fvm"] for p in players if p["id"] in tiers[r]["titolari_ids"]),
                          "riserve": sum(p["fvm"] for p in players if p["id"] in tiers[r]["riserve_ids"])} for r in ROSTER}
    remaining_n = {r: {"titolari": len(tiers[r]["titolari_ids"]), "riserve": len(tiers[r]["riserve_ids"])} for r in ROSTER}
    order = players[:]
    rng.shuffle(order)
    league_slots_left = {r: N_TEAMS * ROSTER[r] for r in ROSTER}
    TOTAL_SLOTS_TEAM = sum(ROSTER.values())
    TOTAL_SLOTS_LEAGUE = TOTAL_SLOTS_TEAM * N_TEAMS
    slots_filled_league = 0
    log = []

    def player_tier(role, pid):
        if pid in tiers[role]["titolari_ids"]:
            return "titolari"
        if pid in tiers[role]["riserve_ids"]:
            return "riserve"
        return "floor"

    def bid_ceiling(team, role, pid, fvm, market_tier):
        t = team
        needs_tit = t["tit_bought"][role] < TITOLARI[role]
        use_tier = "titolari" if (needs_tit and market_tier != "floor") else "riserve"
        role_budget = ROLE_BUDGET_SHARE[role] * BUDGET
        if use_tier == "titolari":
            target = role_budget * TITOLARI_BUDGET_SHARE[role]
            spent = t["spent_tit"][role]
            slots_needed = TITOLARI[role] - t["tit_bought"][role]
            avg_fvm = (remaining_fvm[role]["titolari"] / remaining_n[role]["titolari"]) if remaining_n[role]["titolari"] > 0 else tiers[role]["titolari_fvm_avg"]
        else:
            target = role_budget * (1 - TITOLARI_BUDGET_SHARE[role])
            spent = t["spent_ris"][role]
            slots_needed = (ROSTER[role] - TITOLARI[role]) - t["ris_bought"][role]
            if market_tier == "floor":
                avg_fvm = max(1, tiers[role]["riserve_fvm_avg"] * 0.3)
            else:
                avg_fvm = (remaining_fvm[role]["riserve"] / remaining_n[role]["riserve"]) if remaining_n[role]["riserve"] > 0 else tiers[role]["riserve_fvm_avg"]
        if slots_needed <= 0:
            return None, use_tier
        remaining_target = max(1, target - spent)
        per_slot = remaining_target / slots_needed
        weight = fvm / max(1, avg_fvm) if avg_fvm else 1.0
        weight = max(0.15, min(4.0, weight))
        return per_slot * weight, use_tier

    for p in order:
        role = p["ruolo"]
        if league_slots_left[role] <= 0:
            continue
        market_tier = player_tier(role, p["id"])
        n_need_tit = sum(1 for t in teams.values() if t["tit_bought"][role] < TITOLARI[role])
        n_need_ris = sum(1 for t in teams.values() if (ROSTER[role] - TITOLARI[role]) - t["ris_bought"][role] > 0)
        scarcity_tit = min(2.5, max(0.6, n_need_tit / max(1, remaining_n[role]["titolari"])))
        scarcity_ris = min(2.5, max(0.6, n_need_ris / max(1, remaining_n[role]["riserve"] + 1)))
        bids, tiers_used = {}, {}
        pace_league = slots_filled_league / TOTAL_SLOTS_LEAGUE if TOTAL_SLOTS_LEAGUE else 0
        for tname, t in teams.items():
            slots_total_left = (TITOLARI[role] - t["tit_bought"][role]) + ((ROSTER[role] - TITOLARI[role]) - t["ris_bought"][role])
            if slots_total_left <= 0:
                continue
            other_open = sum((TITOLARI[r] - t["tit_bought"][r]) + ((ROSTER[r] - TITOLARI[r]) - t["ris_bought"][r]) for r in ROSTER if r != role)
            reserve = other_open + max(0, slots_total_left - 1)
            spendable = max(0, t["budget"] - reserve)
            if spendable <= 0:
                continue
            ceiling, use_tier = bid_ceiling(t, role, p["id"], p["fvm"], market_tier)
            if ceiling is None:
                continue
            scarcity_mult = scarcity_tit if use_tier == "titolari" else scarcity_ris
            ceiling_planned = ceiling * scarcity_mult
            own_slots_left_all = slots_total_left + other_open
            pace_factor = 0.35 + 1.15 * pace_league
            endgame_floor = (t["budget"] / max(1, own_slots_left_all)) * pace_factor
            ceiling_final = max(ceiling_planned, endgame_floor)
            noise = min(noise_clip[1], max(noise_clip[0], rng.lognormvariate(0, noise_sigma)))
            bid = min(ceiling_final * noise, spendable)
            if bid >= 1:
                bids[tname] = bid
                tiers_used[tname] = use_tier
        if not bids:
            continue
        winner = max(bids, key=bids.get)
        sorted_bids = sorted(bids.values(), reverse=True)
        price = int(round(sorted_bids[1])) if len(sorted_bids) > 1 else 1
        price = max(1, min(price, teams[winner]["budget"]))
        wt = teams[winner]
        use_tier = tiers_used[winner]
        wt["budget"] -= price
        if use_tier == "titolari":
            wt["tit_bought"][role] += 1; wt["spent_tit"][role] += price
        else:
            wt["ris_bought"][role] += 1; wt["spent_ris"][role] += price
        wt["roster"].append({**p, "prezzo": price, "tier": use_tier})
        log.append({"nome": p["nome"], "ruolo": role, "tier": use_tier, "market_tier": market_tier,
                     "n_bidder": len(bids), "prezzo": price, "pace": pace_league})
        league_slots_left[role] -= 1
        slots_filled_league += 1
        if market_tier != "floor":
            remaining_fvm[role][market_tier] -= p["fvm"]; remaining_n[role][market_tier] -= 1
    return log

log = run_logged(PLAYERS, TIERS, seed=42)
n = len(log)
first20 = log[: n // 5]
last20 = log[-n // 5:]

def stats(chunk, label):
    avg_bidder = sum(x["n_bidder"] for x in chunk) / len(chunk)
    uncontested = sum(1 for x in chunk if x["n_bidder"] == 1)
    avg_price = sum(x["prezzo"] for x in chunk) / len(chunk)
    riserve_avg_price = sum(x["prezzo"] for x in chunk if x["tier"] == "riserve") / max(1, sum(1 for x in chunk if x["tier"] == "riserve"))
    print(f"{label}: n_vendite={len(chunk)}  bidder_medi={avg_bidder:.2f}  incontrastate={uncontested}/{len(chunk)}  "
          f"prezzo_medio={avg_price:.1f}  prezzo_medio_riserve={riserve_avg_price:.1f}")

stats(first20, "PRIMO 20% dell'asta")
stats(last20, "ULTIMO 20% dell'asta")

# esempio concreto: ultime 10 vendite di riserva
print("\nUltime vendite di RISERVA (esempio):")
riserve_sales = [x for x in log if x["tier"] == "riserve"][-10:]
for x in riserve_sales:
    print(f"  {x['nome']:20s} ruolo={x['ruolo']} bidder={x['n_bidder']} prezzo={x['prezzo']} pace={x['pace']:.2f}")

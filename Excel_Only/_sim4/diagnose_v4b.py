# -*- coding: utf-8 -*-
"""
Diagnosi corretta (v4a aveva un bug: non aggiornava lo stato delle squadre,
quindi Team1 restava sempre "bloccato" su F1_titolari nel conteggio).
Qui rieseguiamo l'asta vera (stato aggiornato ad ogni acquisto) e
instrumentiamo solo il confronto floor-vs-ceiling per Team1, senza alterare
l'esito reale.
"""
import random
import engine4 as E

players = E.load_players()
tiers = E.build_tiers(players)


def run_instrumented(seed, my_flags, opp_flags):
    rng = random.Random(seed)
    fascia_names = {role: [f[0] for f in tiers[role]["fasce"]] for role in E.ROSTER}
    teams = {}
    for i in range(E.N_TEAMS):
        teams[f"Team{i+1}"] = dict(
            budget=E.BUDGET, roster=[],
            bought={r: {fn: 0 for fn in fascia_names[r]} for r in E.ROSTER},
            spent={r: {fn: 0 for fn in fascia_names[r]} for r in E.ROSTER},
            flags=(my_flags if i == 0 else opp_flags),
        )
    remaining_n = {r: {fn: len(tiers[r]["fascia_ids"][fn]["ids"]) for fn in fascia_names[r]} for r in E.ROSTER}
    remaining_fvm = {r: {fn: sum(p["fvm"] for p in players if p["id"] in tiers[r]["fascia_ids"][fn]["ids"]) for fn in fascia_names[r]} for r in E.ROSTER}
    remaining_fvm_role = {r: sum(p["fvm"] for p in players if p["ruolo"] == r) for r in E.ROSTER}
    remaining_n_role = {r: sum(1 for p in players if p["ruolo"] == r) for r in E.ROSTER}
    remaining_topbuono_role = {r: sum(1 for p in players if p["ruolo"] == r and p["id"] in tiers[r]["top_buono_ids"]) for r in E.ROSTER}

    order = players[:]
    rng.shuffle(order)
    league_slots_left = {r: E.N_TEAMS * E.ROSTER[r] for r in E.ROSTER}
    TOTAL_SLOTS_LEAGUE = sum(E.ROSTER.values()) * E.N_TEAMS
    slots_filled_league = 0

    stats = {"floor_wins": 0, "ceiling_wins": 0, "floor_by_fascia": {}, "total_by_fascia": {},
              "upgrade_triggered": 0, "upgrade_checked": 0}

    def team_slots_left(t, role):
        return sum(tiers[role]["fasce"][idx][1] - t["bought"][role][fn] for idx, (fn, cnt, sh) in enumerate(tiers[role]["fasce"]))

    def bid_ceiling(t, role, p, market_fascia, flags, pace_league, is_team1):
        role_budget = E.ROLE_BUDGET_SHARE[role] * E.BUDGET
        fasce = tiers[role]["fasce"]
        if flags["auction_state"]:
            use_fascia = None
            for fn, cnt, sh in fasce:
                if t["bought"][role][fn] < cnt:
                    use_fascia = fn
                    break
            if use_fascia is None:
                return None, None
            fn, cnt, sh = next(f for f in fasce if f[0] == use_fascia)
            target = role_budget * sh
            spent = t["spent"][role][use_fascia]
            slots_needed = cnt - t["bought"][role][use_fascia]
            avg_fvm = (remaining_fvm[role][use_fascia] / remaining_n[role][use_fascia]) if remaining_n[role].get(use_fascia, 0) > 0 else tiers[role]["fascia_ids"][use_fascia]["fvm_avg"]
        else:
            use_fascia = fasce[0][0] if market_fascia == "floor" else market_fascia
            target = role_budget
            spent = sum(t["spent"][role].values())
            slots_needed = E.ROSTER[role] - sum(t["bought"][role].values())
            avg_fvm = (remaining_fvm_role[role] / remaining_n_role[role]) if remaining_n_role[role] > 0 else 1
            if slots_needed <= 0:
                return None, use_fascia
        if slots_needed <= 0:
            return None, use_fascia

        remaining_target = max(1, target - spent)
        per_slot = remaining_target / slots_needed

        weight_cap = 4.0
        is_upgrade_case = False
        if flags["auction_state"] and market_fascia in [fn for fn, c, s in fasce]:
            fascia_order = [fn for fn, c, s in fasce]
            if fascia_order.index(market_fascia) < fascia_order.index(use_fascia):
                if is_team1:
                    stats["upgrade_checked"] += 1
                if p["fvm"] >= E.QUALITY_UPGRADE_SOGLIA * max(1, avg_fvm):
                    is_upgrade_case = True
                    market_avg_fvm = tiers[role]["fascia_ids"][market_fascia]["fvm_avg"]
                    avg_fvm = (avg_fvm + market_avg_fvm) / 2
                    weight_cap = E.QUALITY_UPGRADE_WEIGHT_CAP
                    if is_team1:
                        stats["upgrade_triggered"] += 1

        weight = p["fvm"] / max(1, avg_fvm) if avg_fvm else 1.0
        weight = max(0.15, min(weight_cap, weight))
        ceiling = per_slot * weight
        if flags["performance"]:
            ceiling *= p["perf_mult"]
        if flags["market_scarcity"]:
            avail_ratio = (remaining_n_role[role] / max(1, league_slots_left[role]))
            if avail_ratio < 1:
                mkt_mult = min(1.3, 1 + E.PESO_SCARSITA * (1 - avail_ratio))
                ceiling *= mkt_mult
        if flags["quality_tiers"] and p["id"] in tiers[role]["top_buono_ids"]:
            denom = (remaining_n[role].get("F1_titolari", 1) if flags["auction_state"] else max(1, league_slots_left[role]))
            q_ratio = remaining_topbuono_role[role] / max(1, denom)
            if q_ratio < 1:
                q_mult = min(1.5, 1 + 0.3 * (1 - q_ratio))
                ceiling *= q_mult
        if flags["competition_pressure"]:
            is_titolari = (use_fascia == "F1_titolari")
            apply_pressure = True
            if not is_titolari:
                avg_fascia = (remaining_fvm[role][use_fascia] / remaining_n[role][use_fascia]) if remaining_n[role].get(use_fascia, 0) > 0 else tiers[role]["fascia_ids"].get(use_fascia, {}).get("fvm_avg", 1)
                apply_pressure = p["fvm"] >= E.COMP_PRESSURE_RISERVA_SOGLIA * max(1, avg_fascia)
            if apply_pressure:
                n_need = sum(1 for tt in teams.values() if tt["bought"][role].get(use_fascia, 0) < next((c for fn, c, s in fasce if fn == use_fascia), 0))
                pool_left = max(1, remaining_n[role].get(use_fascia, 1))
                comp_mult = max(0.6, min(2.5, n_need / pool_left))
                ceiling *= comp_mult

        slots_total_left = team_slots_left(t, role)
        other_open = sum(team_slots_left(t, r) for r in E.ROSTER if r != role)
        own_slots_left_all = slots_total_left + other_open
        pace_factor = 0.35 + 1.15 * pace_league
        urgenza_base = E.FASCIA_URGENZA_BASE.get(use_fascia, 1.0) if flags["auction_state"] else 1.0
        urgenza_effettiva = max(urgenza_base, pace_league)
        endgame_floor = (t["budget"] / max(1, own_slots_left_all)) * pace_factor * urgenza_effettiva

        if is_team1 and flags["auction_state"]:
            stats["total_by_fascia"][use_fascia] = stats["total_by_fascia"].get(use_fascia, 0) + 1
            if endgame_floor > ceiling:
                stats["floor_wins"] += 1
                stats["floor_by_fascia"][use_fascia] = stats["floor_by_fascia"].get(use_fascia, 0) + 1
            else:
                stats["ceiling_wins"] += 1

        return max(ceiling, endgame_floor), use_fascia

    for p in order:
        role = p["ruolo"]
        if league_slots_left[role] <= 0:
            continue
        market_fascia = E.player_fascia(tiers, role, p["id"])
        pace_league = slots_filled_league / TOTAL_SLOTS_LEAGUE if TOTAL_SLOTS_LEAGUE else 0

        bids, fasce_used = {}, {}
        for tname, t in teams.items():
            slots_total_left = team_slots_left(t, role)
            if slots_total_left <= 0:
                continue
            other_open = sum(team_slots_left(t, r) for r in E.ROSTER if r != role)
            reserve = other_open + max(0, slots_total_left - 1)
            spendable = max(0, t["budget"] - reserve)
            if spendable <= 0:
                continue
            ceiling, use_fascia = bid_ceiling(t, role, p, market_fascia, t["flags"], pace_league, tname == "Team1")
            if ceiling is None:
                continue
            noise = min(1.4, max(0.7, rng.lognormvariate(0, 0.15)))
            bid = min(ceiling * noise, spendable)
            if bid >= 1:
                bids[tname] = bid
                fasce_used[tname] = use_fascia
        if not bids:
            continue
        winner = max(bids, key=bids.get)
        sorted_bids = sorted(bids.values(), reverse=True)
        price = int(round(sorted_bids[1])) if len(sorted_bids) > 1 else 1
        price = max(1, min(price, teams[winner]["budget"]))
        wt = teams[winner]
        use_fascia = fasce_used[winner]
        wt["budget"] -= price
        wt["bought"][role][use_fascia] = wt["bought"][role].get(use_fascia, 0) + 1
        wt["spent"][role][use_fascia] = wt["spent"][role].get(use_fascia, 0) + price
        wt["roster"].append({**p, "prezzo": price, "fascia": use_fascia})
        league_slots_left[role] -= 1
        slots_filled_league += 1
        if market_fascia != "floor" and market_fascia in remaining_n[role]:
            remaining_fvm[role][market_fascia] -= p["fvm"]
            remaining_n[role][market_fascia] -= 1
        remaining_fvm_role[role] -= p["fvm"]
        remaining_n_role[role] -= 1
        if p["id"] in tiers[role]["top_buono_ids"]:
            remaining_topbuono_role[role] -= 1

    return teams, stats


tot = {"floor_wins": 0, "ceiling_wins": 0, "upgrade_checked": 0, "upgrade_triggered": 0}
floor_by_fascia_tot = {}
N = 200
for i in range(N):
    teams, stats = run_instrumented(seed=30000 + i, my_flags=E.STRATEGIE["E"], opp_flags=E.STRATEGIE["F"])
    tot["floor_wins"] += stats["floor_wins"]
    tot["ceiling_wins"] += stats["ceiling_wins"]
    tot["upgrade_checked"] += stats["upgrade_checked"]
    tot["upgrade_triggered"] += stats["upgrade_triggered"]
    for k, v in stats["floor_by_fascia"].items():
        floor_by_fascia_tot[k] = floor_by_fascia_tot.get(k, 0) + v

print(f"Su {N} aste (Team1 = strategia E):")
print(f"  Decisioni totali Team1: {tot['floor_wins'] + tot['ceiling_wins']}")
print(f"  Floor vince (indifferente alla qualita'): {tot['floor_wins']} ({100*tot['floor_wins']/(tot['floor_wins']+tot['ceiling_wins']):.1f}%)")
print(f"  Ceiling di qualita' vince: {tot['ceiling_wins']} ({100*tot['ceiling_wins']/(tot['floor_wins']+tot['ceiling_wins']):.1f}%)")
print(f"  Floor vince per fascia: {floor_by_fascia_tot}")
print(f"  Casi 'upgrade' controllati (giocatore di fascia migliore in slot peggiore): {tot['upgrade_checked']}")
print(f"  Casi 'upgrade' effettivamente attivati (fvm >= soglia*avg): {tot['upgrade_triggered']}")

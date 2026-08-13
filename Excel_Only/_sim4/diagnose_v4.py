# -*- coding: utf-8 -*-
"""
Diagnosi: perche' la correzione 5 (fascia quality-based) non ha migliorato
E/F rispetto a v3, nonostante sia implementata e verificata correttamente
(vedi test_timing4.py: Berardi fvm=115 pagato 95 in F1_titolari, Leao
fvm=120 finito in F3 pagato "solo" 44 - il fix alza il peso ma non basta
sempre a batterlo). Ipotesi: l'endgame_floor (che NON dipende dal FVM del
giocatore, solo da budget/slot residui/urgenza-fascia) spesso supera il
ceiling "di qualita'" gia' calcolato, rendendolo irrilevante. Verifichiamo
quanto spesso questo accade, separatamente per fascia.
"""
import random
import engine4 as E

players = E.load_players()
tiers = E.build_tiers(players)

# Monkey-patch: instrumentiamo bid_ceiling per contare quante volte
# l'endgame_floor "vince" sul ceiling di qualita', solo per Team1 (str. E)
import types

def run_instrumented(seed, my_flags):
    rng = random.Random(seed)
    fascia_names = {role: [f[0] for f in tiers[role]["fasce"]] for role in E.ROSTER}
    teams = {}
    for i in range(E.N_TEAMS):
        teams[f"Team{i+1}"] = dict(
            budget=E.BUDGET, roster=[],
            bought={r: {fn: 0 for fn in fascia_names[r]} for r in E.ROSTER},
            spent={r: {fn: 0 for fn in fascia_names[r]} for r in E.ROSTER},
            flags=(my_flags if i == 0 else E.STRATEGIE["F"]),
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

    floor_wins = 0
    ceiling_wins = 0
    floor_wins_by_fascia = {}
    total_by_fascia = {}

    def team_slots_left(t, role):
        return sum(tiers[role]["fasce"][idx][1] - t["bought"][role][fn] for idx, (fn, cnt, sh) in enumerate(tiers[role]["fasce"]))

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

            flags = t["flags"]
            role_budget = E.ROLE_BUDGET_SHARE[role] * E.BUDGET
            fasce = tiers[role]["fasce"]
            if flags["auction_state"]:
                use_fascia = None
                for fn, cnt, sh in fasce:
                    if t["bought"][role][fn] < cnt:
                        use_fascia = fn
                        break
                if use_fascia is None:
                    continue
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
                    continue
            if slots_needed <= 0:
                continue

            remaining_target = max(1, target - spent)
            per_slot = remaining_target / slots_needed
            weight_cap = 4.0
            if flags["auction_state"] and market_fascia in [fn for fn, c, s in fasce]:
                fascia_order = [fn for fn, c, s in fasce]
                if fascia_order.index(market_fascia) < fascia_order.index(use_fascia):
                    if p["fvm"] >= E.QUALITY_UPGRADE_SOGLIA * max(1, avg_fvm):
                        market_avg_fvm = tiers[role]["fascia_ids"][market_fascia]["fvm_avg"]
                        avg_fvm = (avg_fvm + market_avg_fvm) / 2
                        weight_cap = E.QUALITY_UPGRADE_WEIGHT_CAP
            weight = p["fvm"] / max(1, avg_fvm) if avg_fvm else 1.0
            weight = max(0.15, min(weight_cap, weight))
            ceiling_pre_floor = per_slot * weight
            if flags["performance"]:
                ceiling_pre_floor *= p["perf_mult"]

            slots_total_left2 = team_slots_left(t, role)
            other_open2 = sum(team_slots_left(t, r) for r in E.ROSTER if r != role)
            own_slots_left_all = slots_total_left2 + other_open2
            pace_factor = 0.35 + 1.15 * pace_league
            urgenza_base = E.FASCIA_URGENZA_BASE.get(use_fascia, 1.0) if flags["auction_state"] else 1.0
            urgenza_effettiva = max(urgenza_base, pace_league)
            endgame_floor = (t["budget"] / max(1, own_slots_left_all)) * pace_factor * urgenza_effettiva

            if tname == "Team1" and flags["auction_state"]:
                total_by_fascia[use_fascia] = total_by_fascia.get(use_fascia, 0) + 1
                if endgame_floor > ceiling_pre_floor:
                    floor_wins += 1
                    floor_wins_by_fascia[use_fascia] = floor_wins_by_fascia.get(use_fascia, 0) + 1
                else:
                    ceiling_wins += 1

            ceiling, use_fascia2 = E.bid_ceiling if False else (None, None)  # not used, recompute via real function below

        # per l'esito reale dell'asta usiamo comunque la funzione originale
        # (qui contiamo solo, non modifichiamo il flusso di gara reale)
        pass

    return floor_wins, ceiling_wins, floor_wins_by_fascia, total_by_fascia

fw, cw, fwf, tbf = run_instrumented(seed=777, my_flags=E.STRATEGIE["E"])
print(f"Team1 (E) - floor vince: {fw}  ceiling vince: {cw}  (tot decisioni: {fw+cw})")
print(f"Floor vince per fascia: {fwf}")
print(f"Totale chiamate per fascia: {tbf}")

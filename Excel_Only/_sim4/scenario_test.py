import io
import win32com.client as win32
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
out = io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\scenario_test_out.txt", "w", encoding="utf-8")

app = win32.DispatchEx("Excel.Application")
app.Visible = False
app.DisplayAlerts = False
wb = app.Workbooks.Open(PATH)
try:
    il = wb.Worksheets("Info Lega")
    # imposta 8 nomi squadra e la mia squadra, se non gia' presenti
    team_names = ["Team1", "Team2", "Team3", "Team4", "Team5", "Team6", "Team7", "Team8"]
    for i, name in enumerate(team_names):
        il.Cells(9 + i, 2).Value = name
        il.Cells(9 + i, 4).Value = "Si"  # Attiva
    il.Cells(28, 2).Value = "Team1"  # La Mia Squadra

    wb.Application.CalculateFullRebuild()

    ou = wb.Worksheets("Output Utente")
    # assegna qualche giocatore a varie squadre con prezzi, per popolare lo stato asta
    # cerchiamo le prime N righe per ruolo A e D e assegniamo a rotazione
    assigned = 0
    r = 2
    targets = []
    while r <= 492 and assigned < 40:
        ruolo = ou.Cells(r, 2).Value
        if ruolo in ("A", "D", "C", "P"):
            targets.append(r)
            assigned += 1
        r += 1

    import random
    random.seed(1)
    for i, row in enumerate(targets):
        team = team_names[i % 8]
        fvm = ou.Cells(row, 15).Value or 10
        prezzo = max(1, int(round(fvm * random.uniform(0.5, 1.5))))
        ou.Cells(row, 4).Value = team          # Squadra Assegnata
        ou.Cells(row, 13).Value = prezzo        # Prezzo Pagato

    wb.Application.CalculateFullRebuild()
    wb.Application.CalculateUntilAsyncQueriesDone()

    # ---- controlli di errore su tutti i fogli
    errors = []
    for ws in wb.Worksheets:
        used = ws.UsedRange
        vals = used.Value
        if vals is None:
            continue
        rows = vals if isinstance(vals, tuple) else ((vals,),)
        r0 = used.Row
        c0 = used.Column
        for ri, rowv in enumerate(rows):
            if not isinstance(rowv, tuple):
                rowv = (rowv,)
            for ci, v in enumerate(rowv):
                if isinstance(v, str) and v.startswith("#") and v not in ("#",):
                    errors.append((ws.Name, ws.Cells(r0 + ri, c0 + ci).Address, v))
    out.write("Errori dopo assegnazioni: %d\n" % len(errors))
    for e in errors[:50]:
        out.write("  %s\n" % (e,))

    # ---- Max Bid Dinamica <= Budget Spendibile, nessun prezzo negativo
    bad_maxbid = []
    neg_price = []
    for r in range(2, 493):
        z = ou.Cells(r, 26).Value  # Budget Spendibile
        aa = ou.Cells(r, 27).Value  # Offerta Max Dinamica
        m = ou.Cells(r, 13).Value  # Prezzo Pagato
        if isinstance(aa, (int, float)) and isinstance(z, (int, float)) and aa > z + 0.01:
            bad_maxbid.append((r, aa, z))
        if isinstance(m, (int, float)) and m < 0:
            neg_price.append((r, m))
    out.write("\nMax Bid Dinamica > Budget Spendibile: %d casi\n" % len(bad_maxbid))
    for b in bad_maxbid[:10]:
        out.write("  %s\n" % (b,))
    out.write("Prezzi negativi: %d casi\n" % len(neg_price))

    # ---- stato asta / dashboard dopo assegnazioni
    sa = wb.Worksheets("Stato Asta")
    out.write("\nStato Asta dopo assegnazioni (Ruolo, TopRim, BuoniRim, TitResidui, RisResidue, QualityScarcity, PressioneAsta, PressioneRiserve):\n")
    for r in range(9, 13):
        out.write("  %s\n" % ([sa.Cells(r, c).Value for c in (1, 2, 3, 13, 14, 6, 7, 16)],))

    pc = wb.Worksheets("Pressione Competitiva")
    out.write("\nPressione Competitiva dopo assegnazioni (Ruolo, Bisognose, CandidateReali):\n")
    for r in range(3, 7):
        out.write("  %s\n" % ([pc.Cells(r, c).Value for c in (2, 3, 8)],))

    lmr = wb.Worksheets("La Mia Rosa")
    out.write("\nLa Mia Rosa - Budget Residuo (S2), Slot Residui (S3), FVM Totale (R6):\n")
    out.write("  %s %s %s\n" % (lmr.Cells(2, 19).Value, lmr.Cells(3, 19).Value, lmr.Cells(6, 18).Value))

    da = wb.Worksheets("Dashboard Asta")
    out.write("\nDashboard Asta riga A (Titolari Residui K10, Riserve Residue L10, Candidate Reali M10):\n")
    out.write("  %s %s %s\n" % (da.Cells(10, 11).Value, da.Cells(10, 12).Value, da.Cells(10, 13).Value))

    out.write("\nOK, nessun salvataggio del file di test (scenario scartato).\n")
finally:
    wb.Close(False)  # non salvare le assegnazioni di test
    app.Quit()
    out.close()
print("done")

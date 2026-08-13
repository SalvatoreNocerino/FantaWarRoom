import io
import win32com.client as win32
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
out = io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\verify_step123_out.txt", "w", encoding="utf-8")

app = win32.DispatchEx("Excel.Application")
app.Visible = False
app.DisplayAlerts = False
wb = app.Workbooks.Open(PATH)
try:
    wb.Application.CalculateFullRebuild()
    wb.Application.CalculateUntilAsyncQueriesDone()

    errors = []
    for ws in wb.Worksheets:
        used = ws.UsedRange
        vals = used.Value
        if vals is None:
            continue
        rows = vals if isinstance(vals, tuple) else ((vals,),)
        r0 = used.Row
        c0 = used.Column
        for ri, row in enumerate(rows):
            if not isinstance(row, tuple):
                row = (row,)
            for ci, v in enumerate(row):
                if isinstance(v, str) and v.startswith("#") and v not in ("#",):
                    errors.append((ws.Name, ws.Cells(r0 + ri, c0 + ci).Address, v))

    out.write("Errori: %d\n" % len(errors))
    for e in errors[:40]:
        out.write("  %s\n" % (e,))

    sa = wb.Worksheets("Stato Asta")
    out.write("\nStato Asta per ruolo (Ruolo, TitolariResidui, RiserveResidue, RapportoQualitaTit, PressioneAsta, RapportoRiserve, PressioneRiserve):\n")
    for r in range(9, 13):
        out.write("  %s\n" % ([sa.Cells(r, c).Value for c in (1, 13, 14, 6, 7, 15, 16)],))

    pc = wb.Worksheets("Pressione Competitiva")
    out.write("\nPressione Competitiva (Ruolo, Bisognose, CandidateReali, ValoreAtteso, PressioneCandReali):\n")
    for r in range(3, 7):
        out.write("  %s\n" % ([pc.Cells(r, c).Value for c in (2, 3, 8, 9, 10)],))

    pm = wb.Worksheets("Parametri Modello")
    out.write("\nParametri Modello G/H/I 57:60 (Ruolo, TitResidui, RisResidue, ValoreAtteso):\n")
    for r in range(57, 61):
        out.write("  %s\n" % ([pm.Cells(r, c).Value for c in (1, 7, 8, 9)],))

    ou = wb.Worksheets("Output Utente")
    out.write("\nOutput Utente esempio AE2:AF6 (Pressione Ruolo, Titolare/Riserva):\n")
    for r in range(2, 7):
        out.write("  %s\n" % ([ou.Cells(r, c).Value for c in (2, 3, 31, 32)],))

    wb.Save()
    out.write("\nSalvato OK.\n")
finally:
    wb.Close(False if False else True)
    app.Quit()
    out.close()
print("done")

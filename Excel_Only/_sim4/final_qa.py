import io
import win32com.client as win32
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\Strategia_Asta_FINAL_GPT.xlsx"
out = io.open(r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\final_qa_out.txt", "w", encoding="utf-8")

app = win32.DispatchEx("Excel.Application")
app.Visible = False
app.DisplayAlerts = False
wb = app.Workbooks.Open(PATH)
try:
    out.write("Fogli: %s\n" % [ws.Name for ws in wb.Worksheets])
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
        for ri, rowv in enumerate(rows):
            if not isinstance(rowv, tuple):
                rowv = (rowv,)
            for ci, v in enumerate(rowv):
                if isinstance(v, str) and v.startswith("#") and v not in ("#",):
                    errors.append((ws.Name, ws.Cells(r0 + ri, c0 + ci).Address, v))
    out.write("Errori: %d\n" % len(errors))
    for e in errors[:50]:
        out.write("  %s\n" % (e,))

    # verifica array formula "budget medio residuo" ancora presente
    sa = wb.Worksheets("Stato Asta")
    out.write("\nStato Asta C5 (budget medio residuo, array formula): %r\n" % sa.Cells(5, 3).Formula)
    out.write("Stato Asta M8:P12 headers+valori:\n")
    for r in range(8, 13):
        out.write("  %s\n" % ([sa.Cells(r, c).Value for c in range(13, 17)],))

    sim = wb.Worksheets("Simulazioni")
    out.write("\nSimulazioni riga 5 (A): %s\n" % [sim.Cells(5, c).Value for c in range(1, 10)])
    out.write("Simulazioni riga 10 (F): %s\n" % [sim.Cells(10, c).Value for c in range(1, 10)])

    an = wb.Worksheets("Analisi Asta Reale 2025")
    out.write("\nAnalisi Asta Reale 2025 A1: %s\n" % an.Cells(1, 1).Value)

    wb.Save()
    out.write("\nOK - QA finale completata sul file consegnato.\n")
finally:
    wb.Close(True)
    app.Quit()
    out.close()
print("done")

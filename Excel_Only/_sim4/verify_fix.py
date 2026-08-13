import win32com.client as win32
import os

PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\Rose_simulazione_1_FIX.xlsx"

app = win32.DispatchEx("Excel.Application")
app.Visible = False
app.DisplayAlerts = False
wb = app.Workbooks.Open(PATH)
wb.Application.CalculateFullRebuild()
wb.Application.CalculateUntilAsyncQueriesDone()

errors = []
for ws in wb.Worksheets:
    used = ws.UsedRange
    vals = used.Value
    if vals is None:
        continue
    rows = vals if isinstance(vals, tuple) else ((vals,),)
    for row in rows:
        if not isinstance(row, tuple):
            row = (row,)
        for v in row:
            if isinstance(v, str) and v.startswith("#") and ("!" in v or v.endswith("!") or "N/A" in v or "REF" in v or "DIV" in v or "VALUE" in v or "NAME" in v or "NULL" in v):
                errors.append(v)

print("Errori formula trovati:", len(errors), errors[:10])

for sn in ("Strategia A", "Strategia F"):
    ws = wb.Worksheets(sn)
    print(sn)
    for r in range(6, 14):
        team = ws.Cells(r, 1).Value
        fvm = ws.Cells(r, 2).Value
        spent = ws.Cells(r, 3).Value
        resid = ws.Cells(r, 4).Value
        print(" ", team, "FVM", fvm, "Speso", spent, "Residuo", resid)

wb.Save()
wb.Close()
app.Quit()
print("OK salvato e verificato.")

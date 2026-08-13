import sys
sys.path.insert(0, r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4")
import win32com.client as win32
import build_rose2 as b  # ricalcola le due aste (stampa i suoi print, ok)

ROLE_ORDER = {"P": 0, "D": 1, "C": 2, "A": 3}

app = win32.GetObject(Class="Excel.Application")
wb = None
for w in app.Workbooks:
    if w.Name == "Rose_simulazione_1.xlsx":
        wb = w
        break
if wb is None:
    raise SystemExit("Workbook non trovato tra quelli aperti")

def fill_sheet_com(ws, teams, note2):
    ws.Cells(2, 1).Value = note2
    r = 18
    for tname in sorted(teams.keys(), key=lambda x: int(x.replace("Team", ""))):
        t = teams[tname]
        roster_sorted = sorted(t["roster"], key=lambda p: (ROLE_ORDER.get(p["ruolo"], 9), -p["prezzo"]))
        for p in roster_sorted:
            ws.Cells(r, 1).Value = tname
            ws.Cells(r, 2).Value = p["ruolo"]
            ws.Cells(r, 3).Value = p["nome"]
            ws.Cells(r, 4).Value = p["prezzo"]
            ws.Cells(r, 5).Value = p["fvm"]
            r += 1
    return r - 1

ws_a = wb.Worksheets("Strategia A")
last_a = fill_sheet_com(
    ws_a, b.teams_a,
    "Strategia A = FVM puro (allocazione proporzionale al FVM per ruolo, nessuna suddivisione titolari/riserve, "
    "nessuna scarsita' dinamica). Include il meccanismo 'brucia budget' di fine asta (i crediti non spesi sono "
    "persi, quindi la spinta a spendere cresce col progredire dell'asta). Stessa asta (seed 42), 8 squadre, "
    "budget 1000, rosa 3P-8D-8C-6A."
)
ws_f = wb.Worksheets("Strategia F")
last_f = fill_sheet_com(
    ws_f, b.teams_f,
    "Strategia F = motore completo usato in Strategia_Asta_FINAL_Cowork.xlsx: titolari/riserve pianificati per "
    "ruolo + scarsita' dinamica + meccanismo 'brucia budget' di fine asta. Stessa asta (seed 42), 8 squadre, "
    "budget 1000, rosa 3P-8D-8C-6A."
)
print("Ultima riga scritta A:", last_a, " F:", last_f)

wb.Application.CalculateFullRebuild()
wb.Application.CalculateUntilAsyncQueriesDone()
wb.Save()
print("Salvato (workbook gia' aperto in Excel, aggiornato in place).")

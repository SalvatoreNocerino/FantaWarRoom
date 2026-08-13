import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")
wb = None
for w in app.Workbooks:
    if w.Name == "Strategia_Asta_FINAL_Cowork.xlsx":
        wb = w
        break
ws = wb.Worksheets("Simulazioni")

# Strategia A: FVM medio 747.8, spesa media 982.1 (98.2%), 25 slot, range FVM 280-1555
ws.Cells(5, 3).Value = 747.8
ws.Cells(5, 4).Value = 982.1
ws.Cells(5, 5).Value = 25.0
ws.Cells(5, 6).Value = ("Eseguita: 15 aste x 8 squadre (motore v3, seed 1000-1014), con meccanismo 'brucia budget' "
                         "di fine asta (i crediti non spesi sono persi, quindi ogni squadra tende a spendere quasi "
                         "tutto il budget entro l'ultimo slot). Spesa media 98.2% del budget (min 84.2%). Range FVM 280-1555.")

# Strategia F: FVM medio 812.2, spesa media 966.0 (96.6%), 25 slot, range FVM 414-1832
ws.Cells(10, 3).Value = 812.2
ws.Cells(10, 4).Value = 966.0
ws.Cells(10, 5).Value = 25.0
ws.Cells(10, 6).Value = ("Eseguita: 15 aste x 8 squadre (motore v3 completo: titolari/riserve pianificati per ruolo "
                          "+ scarsita' dinamica + 'brucia budget' di fine asta). Spesa media 96.6% del budget (min "
                          "74.6%). Range FVM 414-1832. +8.6% FVM medio e meno varianza (nessun 'disastro' con FVM "
                          "sotto 400) rispetto a Strategia A.")

wb.Application.CalculateFullRebuild()
wb.Application.CalculateUntilAsyncQueriesDone()
wb.Save()
print("Simulazioni aggiornata e salvata (workbook gia' aperto in Excel).")

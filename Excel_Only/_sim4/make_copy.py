import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")
wb = None
for w in app.Workbooks:
    if w.Name == "Strategia_Asta_FINAL_Cowork.xlsx":
        wb = w
        break
if wb is None:
    raise SystemExit("workbook non trovato aperto")
target = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
wb.SaveCopyAs(target)
print("Copia creata:", target)
print("Fogli:", [ws.Name for ws in wb.Worksheets])

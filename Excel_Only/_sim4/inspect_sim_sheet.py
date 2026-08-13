import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")
wb = None
for w in app.Workbooks:
    if w.Name == "Strategia_Asta_FINAL_Cowork.xlsx":
        wb = w
        break
ws = wb.Worksheets("Simulazioni")
for r in range(1, 14):
    vals = [ws.Cells(r, c).Value for c in range(1, 9)]
    print(r, vals)

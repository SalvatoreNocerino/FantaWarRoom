import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")
wb = None
for w in app.Workbooks:
    if w.Name == "Strategia_Asta_FINAL_Cowork.xlsx":
        wb = w
        break

for sn in ["TeamDetail", "Giocatori Liberi", "La Mia Rosa"]:
    ws = wb.Worksheets(sn)
    used = ws.UsedRange
    vals = used.Value
    r0 = used.Row
    c0 = used.Column
    rows = vals if isinstance(vals, tuple) else ((vals,),)
    for ri, row in enumerate(rows):
        if not isinstance(row, tuple):
            row = (row,)
        for ci, v in enumerate(row):
            if isinstance(v, str) and v == "#":
                cell = ws.Cells(r0 + ri, c0 + ci)
                print(sn, cell.Address, "value=", repr(v), "formula=", repr(cell.Formula))

import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")

def scan(wbname, sheets=None):
    wb = None
    for w in app.Workbooks:
        if w.Name == wbname:
            wb = w
            break
    if wb is None:
        print("NON TROVATO:", wbname)
        return
    errors = []
    ws_list = sheets or [ws.Name for ws in wb.Worksheets]
    for sn in ws_list:
        ws = wb.Worksheets(sn)
        used = ws.UsedRange
        vals = used.Value
        if vals is None:
            continue
        rows = vals if isinstance(vals, tuple) else ((vals,),)
        for row in rows:
            if not isinstance(row, tuple):
                row = (row,)
            for v in row:
                if isinstance(v, str) and v.startswith("#"):
                    errors.append((sn, v))
    print(wbname, "errori:", len(errors), errors[:15])

scan("Rose_simulazione_1.xlsx")
scan("Strategia_Asta_FINAL_Cowork.xlsx")

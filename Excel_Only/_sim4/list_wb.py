import win32com.client as win32
app = win32.GetObject(Class="Excel.Application")
for wb in app.Workbooks:
    print(wb.Name, wb.FullName)

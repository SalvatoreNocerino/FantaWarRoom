import openpyxl
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\Strategia_Asta_FINAL_GPT.xlsx"
wb = openpyxl.load_workbook(PATH)
an = wb["Analisi Asta Reale 2025"]
print("merged ranges:", list(an.merged_cells.ranges))

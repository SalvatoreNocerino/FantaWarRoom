# -*- coding: utf-8 -*-
"""
STEP 1 (Priorita' 1+2 della review):
- Parametri Modello: aggiunge Titolari Residui / Riserve Residue / Valore Atteso
  per Titolare per ogni ruolo (righe 57-60, colonne G/H/I), piu' una soglia
  configurabile per la "candidatura reale" nella Pressione Competitiva.
- Stato Asta: aggiunge le stesse due colonne (M/N) e CORREGGE il denominatore
  della Quality Scarcity (F9:F12) da "tutti gli slot residui" a "titolari
  residui" — questo e' il bug segnalato nella review. Aggiunge anche un
  segnale parallelo di pressione sulle riserve (O/P).
"""
import openpyxl

PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
wb = openpyxl.load_workbook(PATH)

# ---------------------------------------------------------------- Parametri Modello
pm = wb["Parametri Modello"]

pm["G56"] = "Titolari Residui (Lega)"
pm["H56"] = "Riserve Residue (Lega)"
pm["I56"] = "Valore Atteso per Titolare (crediti)"

# righe 57 (P) .. 60 (A) nel blocco titolari/riserve; righe 32-35 nel blocco slot
# totali (stesso ordine P,D,C,A, offset -25); righe 50-53 nel blocco % budget
# target storico (stesso ordine, offset -7).
row_map = {57: 32, 58: 33, 59: 34, 60: 35}
share_row = {57: 50, 58: 51, 59: 52, 60: 53}
for r, slot_row in row_map.items():
    pm[f"G{r}"] = (
        f"=$C{r}-COUNTIFS('Output Utente'!$B$2:$B$492,$A{r},"
        f"'Output Utente'!$D$2:$D$492,\"<>\",'Output Utente'!$AF$2:$AF$492,\"Titolare\")"
    )
    pm[f"H{r}"] = (
        f"=($B{slot_row}-$C{r})-COUNTIFS('Output Utente'!$B$2:$B$492,$A{r},"
        f"'Output Utente'!$D$2:$D$492,\"<>\",'Output Utente'!$AF$2:$AF$492,\"Riserva\")"
    )
    sr = share_row[r]
    pm[f"I{r}"] = f"=IFERROR(('Info Lega'!$B$3*'Info Lega'!$B$4*$B{sr}*$D{r})/$C{r},\"\")"

pm["A80"] = "Soglia Budget Minimo per Candidatura Reale (% Valore Atteso Titolare)"
pm["B80"] = 0.4
pm["C80"] = (
    "Usata in 'Pressione Competitiva': una squadra bisognosa di un titolare conta come "
    "'candidata reale' solo se il suo budget residuo e' almeno questa quota del Valore Atteso "
    "per Titolare del ruolo (colonna I qui sopra, righe 57-60). Filtra le squadre che sulla "
    "carta 'cercano ancora' un titolare ma non hanno piu' credito sufficiente per competere davvero."
)

# Correzione etichetta fonte benchmark reale (era: "8 squadre" - dato verificato: 6
# squadre-stagione, 2 nel 2023 + 4 nel 2025. Vedi foglio 'Analisi Asta Reale 2025'
# per il dettaglio della verifica.)
pm["C48"] = (
    "Fonte: Rose_fantalba 2023 (2 squadre: NapoletanaGas, Napoli 1926) + Rose_fantalba 2025 "
    "(4 squadre: NapoletanaGas, Napoli 1926, Aurora Ercolanese, PeppeNight) = 6 squadre-stagione "
    "totali, non 8 (corretto in questa revisione — vedi 'Analisi Asta Reale 2025' per la verifica "
    "completa e il confronto con una ricalibrazione indipendente). Sostituisce la distribuzione "
    "derivata dal solo FVM, che sovrastimava i difensori e sottostimava portieri e attaccanti."
)

# ---------------------------------------------------------------- Stato Asta
sa = wb["Stato Asta"]

sa["M8"] = "Titolari Residui (Lega)"
sa["N8"] = "Riserve Residue (Lega)"
sa["O8"] = "Rapporto Riserve (Media+Scommesse / Riserve Residue)"
sa["P8"] = "Pressione Riserve"

for r in range(9, 13):
    sa[f"M{r}"] = f"=IFERROR(INDEX('Parametri Modello'!$G$57:$G$60,MATCH($A{r},'Parametri Modello'!$A$57:$A$60,0)),\"\")"
    sa[f"N{r}"] = f"=IFERROR(INDEX('Parametri Modello'!$H$57:$H$60,MATCH($A{r},'Parametri Modello'!$A$57:$A$60,0)),\"\")"
    # CORREZIONE: la Quality Scarcity ora confronta TOP+BUONI residui con i
    # TITOLARI RESIDUI (M), non con tutti gli slot residui (titolari+riserve).
    sa[f"F{r}"] = f"=IFERROR($D{r}/$M{r},\"\")"
    sa[f"G{r}"] = (
        f'=IF($M{r}=0,IF($E{r}=0,"— (ruolo esaurito)","🟠 Titolari esauriti (solo riserve)"),'
        f'IF($F{r}>=\'Parametri Modello\'!$B$46,"🟢 Puoi aspettare",'
        f'IF($F{r}>=\'Parametri Modello\'!$B$47,"🟡 Attesa rischiosa","🔴 Non aspettare")))'
    )
    sa[f"O{r}"] = f"=IFERROR(($I{r}+$J{r})/$N{r},\"\")"
    sa[f"P{r}"] = (
        f'=IF($N{r}=0,"— (riserve esaurite)",'
        f'IF($O{r}>=\'Parametri Modello\'!$B$46,"🟢 Riserve abbondanti",'
        f'IF($O{r}>=\'Parametri Modello\'!$B$47,"🟡 Riserve nella norma","🔴 Riserve scarse")))'
    )

sa["F8"] = "Rapporto Qualita'/Titolari Residui (Quality Scarcity corretta)"

wb.save(PATH)
print("Step 1 salvato.")

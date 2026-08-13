# -*- coding: utf-8 -*-
"""
STEP 2 (Priorita' 3 della review):
- Output Utente: la colonna AE 'Pressione Ruolo' ora distingue se IL GIOCATORE
  chiamato e' lui stesso di fascia Titolare o Riserva (colonna AF), e usa il
  segnale di pressione corrispondente (titolari residui vs riserve residue).
  Prima usava sempre lo stesso segnale (titolari) per ogni giocatore, anche
  per le riserve.
- Pressione Competitiva: aggiunge "N Squadre Candidate Reali" = tra le squadre
  che cercano ancora un titolare di quel ruolo, quante hanno ANCHE un budget
  residuo sufficiente (>= soglia configurabile x Valore Atteso per Titolare).
  Questo e' il proxy di "quante squadre sono REALMENTE candidate" richiesto
  dalla review, costruito solo da dati gia' presenti (budget residuo, bisogno
  titolare), senza inventare interesse/preferenze delle altre squadre.
"""
import openpyxl

PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
wb = openpyxl.load_workbook(PATH)

# ---------------------------------------------------------------- Output Utente
ou = wb["Output Utente"]
MAXR = 492
for r in range(2, MAXR + 1):
    ou[f"AE{r}"] = (
        f"=IFERROR(IF($AF{r}=\"Titolare\","
        f"INDEX('Stato Asta'!$G$9:$G$12,MATCH($B{r},'Stato Asta'!$A$9:$A$12,0)),"
        f"INDEX('Stato Asta'!$P$9:$P$12,MATCH($B{r},'Stato Asta'!$A$9:$A$12,0))),\"\")"
    )

# ---------------------------------------------------------------- Pressione Competitiva
pc = wb["Pressione Competitiva"]
pc["H2"] = "N Squadre Candidate Reali (bisogno titolare + budget sufficiente)"
pc["I2"] = "Valore Atteso Titolare (rif., crediti)"
pc["J2"] = "Pressione Competitiva (su Candidate Reali)"

col_f = {3: "F", 4: "G", 5: "H", 6: "I"}  # colonna TeamDetail "Mancanti <ruolo> (titolare)" per riga Pressione Competitiva
pm_row = {3: 57, 4: 58, 5: 59, 6: 60}     # riga corrispondente in Parametri Modello G/H/I 57:60
for r in (3, 4, 5, 6):
    fcol = col_f[r]
    pmr = pm_row[r]
    pc[f"I{r}"] = f"='Parametri Modello'!$I${pmr}"
    pc[f"H{r}"] = (
        f"=SUMPRODUCT((TeamDetail!$D$2:$D$17=\"Si\")*(TeamDetail!$C$2:$C$17<>'Info Lega'!$B$28)*"
        f"(TeamDetail!${fcol}$2:${fcol}$17>0)*"
        f"(TeamDetail!$E$2:$E$17>='Parametri Modello'!$B$80*$I{r}))"
    )
    pc[f"J{r}"] = (
        f'=IF($H{r}=0,"🟢 Bassa",IF(AND($H{r}>=\'Parametri Modello\'!$B$78,'
        f"$D{r}/MAX(1,$C{r})>='Parametri Modello'!$B$79),\"🔴 Molto Alta\","
        f'IF($H{r}>=\'Parametri Modello\'!$B$78,"🟠 Alta","🟡 Media")))'
    )

pc["A8"] = (
    "Nota: 'N Squadre Bisognose' (C) conta chiunque non abbia ancora completato i titolari del "
    "ruolo. 'N Squadre Candidate Reali' (H) filtra ulteriormente per budget residuo sufficiente "
    "(soglia configurabile in Parametri Modello B80) — e' la stima piu' vicina a 'quante squadre "
    "competeranno davvero' richiedibile dai dati disponibili. Interesse specifico per il singolo "
    "giocatore e alternative future percepite da ogni avversaria NON sono modellati (richiederebbero "
    "dati sulle preferenze altrui che non abbiamo): la Quality Scarcity di lega resta il proxy "
    "migliore disponibile per 'alternative insufficienti'."
)

wb.save(PATH)
print("Step 2 salvato.")

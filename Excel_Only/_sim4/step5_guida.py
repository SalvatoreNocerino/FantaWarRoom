# -*- coding: utf-8 -*-
import openpyxl
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\_sim4\FINAL_GPT_work.xlsx"
wb = openpyxl.load_workbook(PATH)
g = wb["Guida"]

# Chiarisce la differenza tra le DUE scarsita' diverse presenti nel motore,
# cosi' da non confonderle (punto 4 della review era su Quality Scarcity,
# non su questo fattore di prezzo base).
g["A17"] = (
    "4. Scarsita' di ruolo (fattore di Prezzo Base): confronta giocatori liberi e slot ancora da "
    "riempire IN TUTTA LA LEGA (titolari+riserve) per modulare leggermente il prezzo base di mercato. "
    "E' un segnale diverso dalla Quality Scarcity di Stato Asta/Dashboard (vedi riga 47): qui l'obiettivo "
    "e' la liquidita' generale del mercato, non 'quanto e' rischioso aspettare per un titolare'."
)

g["A47"] = (
    "• Stato Asta mostra Top/Buoni/Media/Scommesse Rimasti, Titolari Residui e Riserve Residue "
    "(separati), e la Quality Scarcity = Top+Buoni rimasti / TITOLARI RESIDUI (non piu' tutti gli slot "
    "residui: corretto in questa revisione, era il bug principale segnalato in una review esterna). "
    "Mostra anche un segnale parallelo di Pressione sulle Riserve (Media+Scommesse / Riserve Residue) "
    "e la Quality Coverage (Top+Buoni / Totale disponibili) come indicatore secondario."
)

g["A49"] = (
    "• La Mia Rosa mostra ora Prezzo Pagato, Differenza FVM-Prezzo, Titolare/Riserva per ogni giocatore "
    "(classificato per rank FVM nel ruolo, non per prezzo pagato), FVM Totale Acquistato, Crediti Spesi, "
    "Efficienza, e copertura titolari per ruolo."
)

# Nuovo paragrafo su Pressione Ruolo differenziata titolare/riserva
g["A51"] = (
    "• Pressione Ruolo (Output Utente, colonna AE) ora distingue: se il giocatore chiamato e' lui stesso "
    "di fascia Titolare, usa la Pressione Asta basata sui titolari residui; se e' di fascia Riserva, usa "
    "la nuova Pressione Riserve basata sulle riserve residue. Prima usava sempre lo stesso segnale (basato "
    "sui titolari) anche per le riserve, sovrastimando l'urgenza su giocatori che contano poco."
)

# Nuova entry di changelog
g["A57"] = (
    "REVIEW TECNICA (v.GPT) — Correzioni: Quality Scarcity ora divide per Titolari Residui invece che per "
    "tutti gli slot residui (bug principale segnalato); aggiunte colonne esplicite Titolari Residui / "
    "Riserve Residue / Valore Atteso per Titolare (Parametri Modello, Stato Asta, Dashboard Asta); "
    "Pressione Ruolo distingue titolare/riserva; Pressione Competitiva aggiunge 'N Squadre Candidate "
    "Reali' (bisogno + budget sufficiente, oltre al conteggio grezzo); corretta l'etichetta errata '8 "
    "squadre' del benchmark reale in '6 squadre-stagione' (verificato riaprendo i file grezzi, con "
    "confronto trasparente a una ricalibrazione indipendente in 'Analisi Asta Reale 2025'); Simulazioni "
    "estese con deviazione standard, % vittorie testa a testa e fallimenti completamento rosa (60 aste x "
    "strategia). Confermato senza modifiche: Titolare/Riserva (mercato) era gia' basato sul rank FVM nel "
    "ruolo, non sul prezzo pagato — nessuna correzione necessaria su questo punto."
)

wb.save(PATH)
print("Guida aggiornata e salvata.")

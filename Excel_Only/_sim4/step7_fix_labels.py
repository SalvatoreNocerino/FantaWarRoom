# -*- coding: utf-8 -*-
import openpyxl
PATH = r"C:\Users\salva\Projects\FantaWarRoom\Excel_Only\Strategia_Asta_FINAL_GPT.xlsx"
wb = openpyxl.load_workbook(PATH)

pm = wb["Parametri Modello"]
pm["C48"] = (
    "Fonte: Rose_fantalba 2025 (8 squadre: NapoletanaGas, Napoli 1926, Aurora Ercolanese, PeppeNight, "
    "Oktoberfest Team, San Lorenzo, MYTHOS, eRasmus) + Rose_fantalba 2023 (2 squadre: NapoletanaGas, "
    "Napoli 1926, stagione precedente) = 10 squadre-stagione totali. Verificato con il dataset completo "
    "in 'Analisi Asta Reale 2025': tutti i ruoli entro 1.7 punti percentuali dai valori qui sotto — "
    "calibrazione confermata, non modificata. Sostituisce la distribuzione derivata dal solo FVM, che "
    "sovrastimava i difensori e sottostimava portieri e attaccanti."
)

g = wb["Guida"]
g["A57"] = (
    "REVIEW TECNICA (v.GPT) — Correzioni: Quality Scarcity ora divide per Titolari Residui invece che per "
    "tutti gli slot residui (bug principale segnalato); aggiunte colonne esplicite Titolari Residui / "
    "Riserve Residue / Valore Atteso per Titolare (Parametri Modello, Stato Asta, Dashboard Asta); "
    "Pressione Ruolo distingue titolare/riserva; Pressione Competitiva aggiunge 'N Squadre Candidate "
    "Reali' (bisogno + budget sufficiente, oltre al conteggio grezzo); Simulazioni estese con deviazione "
    "standard, % vittorie testa a testa e fallimenti completamento rosa (60 aste x strategia). Confermato "
    "senza modifiche: Titolare/Riserva (mercato) era gia' basato sul rank FVM nel ruolo, non sul prezzo "
    "pagato. CORREZIONE SUCCESSIVA: il file Rose_fantalba-2025.xlsx usato inizialmente era incompleto "
    "(solo 4 squadre su 8) — l'utente ha fornito il file originale corretto (8 squadre + Svincolati). "
    "L'etichetta '8 squadre' era giusta fin dall'inizio; la mia correzione a '6 squadre-stagione' era "
    "sbagliata, basata sul file incompleto. Foglio 'Analisi Asta Reale 2025' ricostruito da zero con il "
    "dataset completo (8 squadre 2025 + 2 squadre 2023 = 10 squadre-stagione)."
)

wb.save(PATH)
print("Etichette corrette e salvate.")

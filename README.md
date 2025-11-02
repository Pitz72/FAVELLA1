# FAVELLA 1

## Missione
FAVELLA 1 è un progetto per creare un linguaggio di programmazione per narrativa interattiva (IF) basato interamente sulla lingua italiana. L'obiettivo è permettere agli autori di creare mondi virtuali scrivendo frasi naturali, in modo dichiarativo e interattivo.

## Filosofia
- **Linguaggio Naturale:** Il codice è prosa. Esempio: `La biblioteca è una stanza.`
- **Author-Centric:** Massima semplicità per l'autore, la complessità è gestita dal compilatore e dall'interprete.
- **Sviluppo Iterativo:** Si parte da un sottoinsieme minimo della lingua per poi espanderlo.

## Stack Tecnologico
- **Linguaggio:** Python 3

## Stato Attuale: Progetto 0.0.6 (Avanzato)
Il progetto è stato profondamente rifattorizzato per includere un **motore ad azioni standard**, che lo rende più potente e scalabile. Il compilatore supporta la **Grammatica v0.5**.

- **Funzionalità Implementate:**
    - Definizione di Stanze, Oggetti, Proprietà e Regole.
    - **NUOVO: Descrizioni degli Oggetti.** È ora possibile definire descrizioni per gli oggetti (`La descrizione del libro è "..."`).
    - **NUOVO: Motore di Azioni Standard.** Il gioco ora comprende azioni di base con comportamenti di default.
    - **NUOVO: Azione `esaminare`.** Il motore implementa la sua prima azione standard. Eseguendo `esamina l'oggetto`, il gioco mostrerà la sua descrizione. L'azione risponde a molteplici verbi come `guarda`, `osserva`, `leggi`, etc.
    - Le regole "Invece di" possono sovrascrivere sia azioni standard sia verbi personalizzati.
    - Compilatore robusto che rileva errori di sintassi.

## Come Eseguire
Per compilare una storia e avviarla in modalità interattiva, eseguire il nuovo punto di ingresso `gioco.py`:
```sh
python gioco.py storia.fav
```
Una volta avviato, è possibile inserire comandi come `esamina il libro` o `leggi la pergamena`. Digitare `esci` per terminare.

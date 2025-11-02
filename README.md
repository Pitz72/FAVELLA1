# FAVELLA 1

## Missione
FAVELLA 1 è un progetto per creare un linguaggio di programmazione per narrativa interattiva (IF) basato interamente sulla lingua italiana. L'obiettivo è permettere agli autori di creare mondi virtuali scrivendo frasi naturali, in modo dichiarativo e interattivo.

## Filosofia
- **Linguaggio Naturale:** Il codice è prosa. Esempio: `La biblioteca è una stanza.`
- **Author-Centric:** Massima semplicità per l'autore, la complessità è gestita dal compilatore e dall'interprete.
- **Sviluppo Iterativo:** Si parte da un sottoinsieme minimo della lingua per poi espanderlo.

## Stack Tecnologico
- **Linguaggio:** Python 3

## Stato Attuale: Progetto 0.0.5 (Completato)
Il compilatore supporta la **Grammatica v0.4** e il progetto è ora un **motore di gioco interattivo**.

- **Funzionalità Implementate:**
    - **Definizione di Stanze e Oggetti.**
    - **Posizionamento di Oggetti nelle Stanze.**
    - **Descrizioni delle Stanze.**
    - **Assegnazione di Proprietà agli Oggetti.**
    - **NUOVO: Regole Interattive "Invece di".** Permettono di sovrascrivere le azioni del giocatore (es. `Invece di prendere la corona: dire "Non puoi!"`).
    - **Normalizzazione dei Nomi e Supporto per Commenti.**

## Come Eseguire
Per compilare una storia e avviarla in modalità interattiva, eseguire il nuovo punto di ingresso `gioco.py`:
```sh
python gioco.py storia.fav
```
Una volta avviato, è possibile inserire comandi come `prendi la corona` o `esamina il piedistallo`. Digitare `esci` per terminare.

# FAVELLA 1

## Missione
FAVELLA 1 è un progetto per creare un linguaggio di programmazione per narrativa interattiva (IF) basato interamente sulla lingua italiana. L'obiettivo è permettere agli autori di creare mondi virtuali scrivendo frasi naturali, in modo dichiarativo.

## Filosofia
- **Linguaggio Naturale:** Il codice è prosa. Esempio: `La biblioteca è una stanza.`
- **Author-Centric:** Massima semplicità per l'autore, la complessità è gestita dal compilatore.
- **Sviluppo Iterativo:** Si parte da un sottoinsieme minimo della lingua per poi espanderlo.

## Stack Tecnologico
- **Linguaggio:** Python 3

## Stato Attuale: Progetto 0.3 (Completato)
Il compilatore ora supporta la **Grammatica v0.3**.

- **Funzionalità Implementate:**
    - **Definizione di Stanze e Oggetti.**
    - **Posizionamento di Oggetti nelle Stanze.**
    - **Descrizioni delle Stanze.**
    - **NUOVO: Assegnazione di Proprietà agli Oggetti.** Esempio: `La mela è rossa.`
    - **Normalizzazione dei Nomi:** Il compilatore riconosce nomi con articoli diversi (es. "La cucina" e "cucina").
    - **Supporto per Commenti:** Il compilatore ignora le righe che iniziano con `#` e i commenti a fine riga.

## Come Eseguire
Per analizzare una storia, eseguire il compilatore:
```sh
python compilatore.py storia.fav
```

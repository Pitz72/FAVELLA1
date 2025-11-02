# FAVELLA 1

## Missione
FAVELLA 1 è un progetto per creare un linguaggio di programmazione per narrativa interattiva (IF) basato interamente sulla lingua italiana. L'obiettivo è permettere agli autori di creare mondi virtuali scrivendo frasi naturali, in modo dichiarativo.

## Filosofia
- **Linguaggio Naturale:** Il codice è prosa. Esempio: `La biblioteca è una stanza.`
- **Author-Centric:** Massima semplicità per l'autore, la complessità è gestita dal compilatore.
- **Sviluppo Iterativo:** Si parte da un sottoinsieme minimo della lingua per poi espanderlo.

## Stack Tecnologico
- **Linguaggio:** Python 3

## Stato Attuale: Progetto 0.2 (Completato)
Il compilatore ora supporta la Grammatica v0.2.

- **Funzionalità Implementate:**
    - **Definizione di Stanze e Oggetti.**
    - **Posizionamento di Oggetti nelle Stanze.**
    - **Normalizzazione dei Nomi:** Il compilatore riconosce nomi con articoli diversi (es. "La cucina" e "cucina").
    - **Descrizioni delle Stanze:** È possibile definire una descrizione testuale per ogni stanza.

## Come Eseguire
Per analizzare una storia, eseguire il compilatore:
```sh
python compilatore.py storia.fav
```

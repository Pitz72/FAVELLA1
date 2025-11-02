# FAVELLA 1

![Favella Banner](https://i.imgur.com/your-banner-image.png) <!-- Immagine placeholder, da sostituire -->

**FAVELLA 1 è un motore di gioco per narrativa interattiva (Interactive Fiction) che ti permette di creare mondi virtuali scrivendo semplici frasi in italiano.**

È un progetto sperimentale con una missione ambiziosa: rendere lo sviluppo di avventure testuali accessibile a tutti, specialmente a scrittori e game designer, usando la lingua italiana come un vero e proprio linguaggio di programmazione.

---

## ✨ Filosofia

-   **Il Codice è Prosa:** Dimentica la sintassi complessa. Se puoi descrivere una scena, puoi programmarla. Esempio: `La biblioteca è una stanza.`
-   **Semplicità per l'Autore:** L'obiettivo è massimizzare la semplicità per chi scrive. Tutta la complessità tecnica è nascosta e gestita dal compilatore e dall'interprete di FAVELLA.
-   **Sviluppo Iterativo:** Il linguaggio è in costante evoluzione. Partiamo da un piccolo sottoinsieme della lingua italiana per poi espanderlo passo dopo passo, aggiungendo nuove funzionalità a ogni versione.

---

## 🚀 Stato Attuale: v0.0.7 - Mondo Dinamico

FAVELLA 1 ha superato la fase di motore statico e ora supporta un mondo di gioco dinamico e interattivo. Il compilatore è basato sulla **Grammatica v0.6**.

### Funzionalità Chiave

-   **Definizione del Mondo:** Crea `Stanze` e `Oggetti` con una sintassi naturale.
-   **Descrizioni Dettagliate:** Arricchisci il tuo mondo con descrizioni per ogni entità (`La descrizione del libro è "..."`).
-   **Proprietà degli Oggetti:** Assegna attributi agli oggetti (`La spada è affilata.`).
-   **Motore ad Azioni Standard:** Il gioco comprende un set di azioni di base con comportamenti di default:
    -   `esaminare` (e alias come `guarda`, `leggi`, `osserva`...)
    -   `prendere` (e alias come `raccogli`, `afferra`...)
    -   `lasciare` (e alias come `molla`, `posa`...)
    -   `inventario` (e alias come `i`, `zaino`)
-   **Inventario del Giocatore:** Il giocatore può raccogliere e trasportare oggetti che sono stati definiti come `prendibili`.
-   **Regole Personalizzate:** Sovrascrivi qualsiasi azione standard per creare puzzle, interazioni uniche e ostacoli (`Invece di prendere la statua: dire "È troppo pesante."`).
-   **Compilatore Robusto:** Il sistema rileva errori di sintassi nel tuo file di storia e ti guida nella correzione.

---

## 🎮 Come Iniziare

Per provare FAVELLA 1, hai solo bisogno di Python 3. Non sono richieste altre dipendenze.

1.  **Clona il Repository:**
    ```sh
    git clone https://github.com/tuo-username/FAVELLA1.git
    cd FAVELLA1
    ```

2.  **Scrivi la tua Storia:**
    Apri il file `storia.fav` con un editor di testo e modificalo, oppure creane uno nuovo. La sintassi è semplice:
    ```
    # La mia prima stanza
    L'ingresso della grotta è una stanza.
    La descrizione dell'ingresso è "L'aria è umida e senti un'eco lontana.".

    # Un oggetto che si può prendere
    Una torcia è una cosa.
    La torcia è nell'ingresso della grotta.
    La torcia è prendibile.
    La descrizione della torcia è "Una semplice torcia di legno e pece.".
    ```

3.  **Esegui il Gioco:**
    Lancia il gioco dal terminale, passandogli il nome del tuo file di storia:
    ```sh
    python gioco.py storia.fav
    ```

    Apparirà il mondo che hai creato. Inserisci comandi come `prendi la torcia`, `inventario` o `esamina l'ingresso` e vedi la tua storia prendere vita. Per uscire, digita `esci`.

---

## 🗺️ Roadmap Futura

FAVELLA 1 è un progetto in crescita. Le prossime tappe includono:

-   [ ] **Movimento tra Stanze:** Collegare le stanze tra loro (`Il nord dalla biblioteca porta al giardino.`).
-   [ ] **Contenitori:** Oggetti che possono contenerne altri (`Il forziere è un contenitore.`).
-   [ ] **Interazioni Complesse:** Azioni che coinvolgono più oggetti (`usa la chiave con il forziere`).

---

## 🤝 Contribuire

Questo progetto è un esperimento aperto. Se l'idea ti affascina, sei invitato a contribuire in qualsiasi modo: segnalando bug, suggerendo nuove funzionalità grammaticali o scrivendo codice. Apri una issue o una pull request per iniziare!
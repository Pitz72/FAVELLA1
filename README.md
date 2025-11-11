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

## 🚀 Stato Attuale: v0.0.9.1 - Logica Condizionale e Puzzle (Stabile)

FAVELLA 1 è ora un motore di Interactive Fiction maturo con **logica condizionale** completamente funzionale. Il compilatore è basato sulla **Grammatica v0.8**, permettendo la creazione di puzzle complessi e narrativa dinamica basata sullo stato del mondo.

### Funzionalità Chiave

-   **Definizione del Mondo:** Crea `Stanze` e `Oggetti` con una sintassi naturale.
-   **Descrizioni Dettagliate:** Arricchisci il tuo mondo con descrizioni per ogni entità.
-   **Proprietà degli Oggetti:** Assegna attributi dinamici agli oggetti (`La porta è chiusa.`).
-   **Motore ad Azioni Standard:** Set completo di azioni con comportamenti personalizzabili:
    -   `esaminare`, `prendere`, `lasciare`, `inventario`
    -   `guarda`, `aiuto`, `usare`
    -   Movimento: `nord`, `sud`, `est`, `ovest` (e alias `n`, `s`, `e`, `o`)
-   **Inventario del Giocatore:** Sistema completo di raccolta e gestione oggetti.
-   **Regole Condizionali:** Crea puzzle complessi con logica basata su condizioni:
    -   `Invece di aprire la porta se il giocatore ha la chiave: dire "La porta si apre!".`
    -   `Invece di esaminare la porta se la porta è chiusa: dire "È chiusa a chiave.".`
-   **Sistema di Puzzle:** Meccaniche chiave-serratura e interazioni basate sullo stato del mondo.
-   **Compilatore Robusto:** Rilevamento errori con messaggi chiari e guida alla correzione.
-   **Output Ottimizzato:** Interfaccia testuale pulita e professionale.
-   **Movimento tra Stanze:** Esplorazione con connessioni bidirezionali automatiche.

---

## 🎮 Come Iniziare

Per provare FAVELLA 1, hai solo bisogno di Python 3. Non sono richieste altre dipendenze.

1.  **Clona il Repository:**
    ```sh
    git clone https://github.com/tuo-username/FAVELLA1.git
    cd FAVELLA1
    ```

2.  **Scrivi la tua Storia:**
    Apri il file `storia.fav` con un editor di testo e modificalo, oppure creane uno nuovo. Esempio con puzzle:
    ```
    # Definizione del mondo
    La prigione è una stanza.
    La descrizione della prigione è "Una cella umida con una porta di ferro a nord.".

    # Oggetti interattivi
    Una porta di ferro è una cosa.
    La porta di ferro è in prigione.
    La porta di ferro è chiusa.

    Una chiave arrugginita è una cosa.
    La chiave arrugginita è in prigione.
    La chiave arrugginita è prendibile.

    # Regole condizionali per creare un puzzle
    # IMPORTANTE: Usa sempre la forma imperativa (apri, non aprire)
    Invece di apri la porta di ferro: dire "È chiusa a chiave.".
    Invece di apri la porta di ferro se il giocatore ha la chiave arrugginita: dire "La porta si apre!".
    ```

3.  **Esegui il Gioco:**
    Lancia il gioco dal terminale, passandogli il nome del tuo file di storia:
    ```sh
    python gioco.py storia.fav
    ```

    Apparirà il mondo che hai creato. Inserisci comandi come:
    - `nord` o `n` per muoverti tra le stanze
    - `prendi la torcia` per raccogliere oggetti
    - `inventario` o `i` per vedere cosa possiedi
    - `esamina la torcia` per ispezionare oggetti
    - `guarda` per ristampare la descrizione della stanza
    - `aiuto` per vedere tutti i comandi disponibili
    
    Per uscire, digita `esci`.

---

## 🗺️ Roadmap Futura

FAVELLA 1 è un progetto in crescita. Le prossime tappe includono:

-   **Azioni a Due Oggetti:** Implementazione completa di `usa X con Y`
-   **Condizioni Composte:** Logica AND, OR, NOT per puzzle più complessi
-   **Contenitori:** Oggetti che possono contenerne altri
-   **Modifiche Dinamiche:** Cambiare proprietà degli oggetti durante il gioco
-   **Personaggi Non Giocanti (NPC):** Entità con cui dialogare
-   **Sistema di Dialoghi:** Conversazioni ramificate
-   **Eventi Temporali:** Azioni che si attivano dopo un certo numero di turni

---

## 📝 Note per gli Autori

### Convenzione Importante per le Regole:
Quando scrivi regole `Invece di`, usa sempre la **forma imperativa** del verbo (come la digiterebbe il giocatore):

✅ **CORRETTO:**
```
Invece di apri la porta: dire "È chiusa.".
Invece di prendi la spada: dire "È troppo pesante.".
Invece di esamina il libro: dire "Le pagine sono vuote.".
```

❌ **ERRATO:**
```
Invece di aprire la porta: dire "È chiusa.".
Invece di prendere la spada: dire "È troppo pesante.".
Invece di esaminare il libro: dire "Le pagine sono vuote.".
```

---

## 🤝 Contribuire

Questo progetto è un esperimento aperto. Se l'idea ti affascina, sei invitato a contribuire in qualsiasi modo: segnalando bug, suggerendo nuove funzionalità grammaticali o scrivendo codice. Apri una issue o una pull request per iniziare!
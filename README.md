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

## 🚀 Stato Attuale: v0.5.0 - Linguaggio Robusto (Alpha)

La v0.5.0 apre la **roadmap evolutiva del linguaggio** (un piano a 6 livelli) con il **Livello 1 — Consolidamento e Robustezza**. Obiettivo: impedire all'autore di scrivere una storia "rotta" senza alcun feedback. Le fondamenta introdotte nella v0.4.0 (parser formale EBNF con **Lark**/AST e **FAVELLA STUDIO**, l'IDE grafico premium) restano il cuore del progetto.

### Novità del Linguaggio (v0.5.0)
- **Posizione iniziale esplicita:** nuova primitiva `Il giocatore comincia in [stanza].` — basta affidarsi all'ordine di scrittura per decidere dove parte il giocatore.
- **Diagnostica d'autore:** avvisi non bloccanti per i **refusi nelle proprietà** (es. `chuisa`), per i **verbi sconosciuti** nelle regole, e per le condizioni sempre false.
- **Grammatica disambiguata:** priorità di regola esplicite + **suite di test del linguaggio** (`python test_linguaggio.py`) come garanzia anti-regressione.
- **Stringhe con escape:** ora puoi inserire virgolette dentro le battute (`dire "Disse \"ciao\".".`).
- **Tolleranza tipografica:** apostrofi e virgolette "curve" da copia-incolla vengono normalizzate automaticamente.

### Novità: FAVELLA STUDIO (IDE Premium v0.4.0)
- **Design System Premium "Cyber-Scrittore":** Una splendida Dark Mode con stili coordinati per menu, toolbar, schede (tab) e finestre di dialogo, ottimizzando la leggibilità della prosa.
- **Rendering Asincrono della Mappa:** Visualizza il grafo delle stanze e delle connessioni in tempo reale. Il calcolo delle posizioni dei nodi è delegato ad un thread secondario (`QThread`) eliminando ogni freeze dell'interfaccia.
- **Marker Visivi degli Errori Sintattici:** Evidenziazione visiva automatica in rosso scuro soffuso della riga d'errore Lark per assistere l'autore nel debug del codice.
- **Console di Gioco Ottimizzata:** Cattura l'output del gioco eliminando spazi e righe vuote duplicate e fornendo un feedback visivo immediato se il gioco non è attivo.

### Core del Linguaggio (Grammatica v0.4.0)
- **Conservazione dell'Estetica Originale:** I nomi di stanze e oggetti conservano gli articoli e la capitalizzazione originali scritti dall'autore (es. `"Una keycard magnetica"`, `"La cella di contenimento"`), pur mantenendo l'ID normalizzato per la logica.
- **Preposizioni Tolleranti:** Tolleranza ed eliminazione del problema *"guess-the-preposition"* nei comandi a due oggetti (es. `usa la keycard con la porta` si mappa automaticamente a `usa la keycard su la porta`).
- **Conseguenze Dinamiche:** Regole che modificano il mondo (`... e adesso la porta è aperta`).
- **Interazioni a Due Oggetti:** Supporto per comandi come `usa chiave con porta`.
- **Logica Condizionale:** Supporto completo per regole `Invece di ... se ...`.
- **Mondo Dinamico:** Stanze, oggetti, contenitori e proprietà.

---

## 🎮 Come Iniziare

Puoi usare FAVELLA in due modi: tramite il nuovo IDE grafico o da riga di comando.

### Opzione A: FAVELLA STUDIO (Consigliata)

1.  **Installa le dipendenze:**
    ```bash
    pip install PySide6 networkx matplotlib
    ```

2.  **Avvia l'IDE:**
    ```bash
    python favella_studio.py
    ```

3.  **Divertiti:**
    - Apri un file `.fav` (es. `storia.fav`).
    - Premi **"Compila & Verifica"** per vedere la mappa.
    - Premi **"Gioca"** per testare la tua avventura.

### Opzione B: Riga di Comando (Legacy)

Per i puristi del terminale, l'interprete classico è sempre disponibile:

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
    - `prendi chiave` per raccogliere oggetti
    - `inventario` o `i` per vedere cosa possiedi
    - `esamina porta` per ispezionare oggetti
    - `apri porta` per interagire (le regole condizionali reagiranno al contesto!)
    - `guarda` per ristampare la descrizione della stanza
    - `aiuto` per vedere tutti i comandi disponibili
    
    Per uscire, digita `esci`.

4.  **Esempio di Gameplay:**
    ```
    > apri porta
    È chiusa a chiave.
    
    > prendi chiave
    Preso: chiave arrugginita.
    
    > apri porta
    Usi la chiave arrugginita. La serratura scatta e la porta si apre!
    ```
    
    Le regole condizionali reagiscono automaticamente allo stato del gioco!

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
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

## 🚀 Stato Attuale: v0.7.0 - Disambiguazione Strutturale (Alpha)

Il progetto segue una **roadmap evolutiva del linguaggio** in 6 livelli. La v0.7.0 completa il **Livello 2.5 — Disambiguazione strutturale**: la grammatica di FAVELLA è ora **non ambigua per costruzione**. Il compilatore è stato riscritto in **due passate** (symbol-table → parsing **LALR(1)** con i nomi come token chiusi), eliminando alla radice l'ambiguità formale `[G1]` che prima era solo *mitigata* da priorità di regola.

### Novità del Linguaggio (v0.7.0 — Livello 2.5)
- **Grammatica non ambigua per costruzione:** parser **LALR(1)** + entità risolte da una symbol-table (longest-match). Un corpus che prima generava fino a 7 alberi per frase ora ne produce **uno solo** (guardia anti-ambiguità permanente nei test).
- **Errori d'autore chiari:** un'entità mai dichiarata dà *«Entità sconosciuta: "porta" non è mai stata dichiarata…»* (con suggerimento del nome corretto in caso di refuso), non più un parse error criptico.
- **Nomi con parole-chiave finalmente usabili:** `via est`, `cosa preziosa`, `porta di ferro`.
- **Nota:** le **proprietà** di stato sono ora **monoparola** (`è chiusa`); i **nomi multiparola** restano supportati per le **entità** (`cella di contenimento`).

### Dal Livello 2 (v0.6.0 — Logica Composita)
- **Condizioni AND / OR:** `se la porta è chiusa e il giocatore ha la chiave`, `se la cassa è chiusa oppure è sigillata`. Precedenza `OR < AND < atomo`, con parentesi per raggruppare. (Si usa `oppure`, non `o`, riservato a *ovest*.)
- **Negazione:** `se il giocatore non ha la chiave`, `se la porta non è aperta`.
- **Conseguenze multiple:** `... e adesso la porta è aperta e adesso la chiave è nel nulla`.

### Già presenti dal Livello 1 (v0.5.0)
- **Posizione iniziale esplicita:** `Il giocatore comincia in [stanza].`
- **Diagnostica d'autore:** avvisi su refusi nelle proprietà, verbi sconosciuti, condizioni sempre false.
- **Grammatica disambiguata** + **suite di test** (`python test_linguaggio.py`), **stringhe con escape**, **tolleranza tipografica**.

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

IDE desktop ufficiale (Electron + React) con editor a syntax highlighting,
diagnostica in tempo reale e console di gioco integrata. Vive in `studio/`.

1.  **Installa le dipendenze** (Node.js 20+ e una `.venv` Python con `lark`):
    ```bash
    cd studio
    npm install
    ```

2.  **Avvia l'IDE:**
    ```bash
    npm run dev
    ```

3.  **Divertiti:**
    - Apri la cartella del progetto e seleziona un file `.fav` (es. `storia.fav`).
    - La **diagnostica** è continua: errori e avvisi nel pannello Problemi.
    - Premi **▶ Gioca** (o **F5**) per testare la tua avventura nella console integrata.

> Dettagli, build e packaging: [`studio/README.md`](studio/README.md).

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
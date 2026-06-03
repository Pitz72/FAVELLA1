# FAVELLA 1

<p align="center">
  <img src="assets/banner.png" alt="FAVELLA 1 — Programmare storie interattive in linguaggio naturale italiano" width="840">
</p>

**FAVELLA 1 è un motore di gioco per narrativa interattiva (Interactive Fiction) che ti permette di creare mondi virtuali scrivendo semplici frasi in italiano.**

È un progetto sperimentale con una missione ambiziosa: rendere lo sviluppo di avventure testuali accessibile a tutti, specialmente a scrittori e game designer, usando la lingua italiana come un vero e proprio linguaggio di programmazione.

---

## ✨ Filosofia

-   **Il Codice è Prosa:** Dimentica la sintassi complessa. Se puoi descrivere una scena, puoi programmarla. Esempio: `La biblioteca è una stanza.`
-   **Semplicità per l'Autore:** L'obiettivo è massimizzare la semplicità per chi scrive. Tutta la complessità tecnica è nascosta e gestita dal compilatore e dall'interprete di FAVELLA.
-   **Sviluppo Iterativo:** Il linguaggio è in costante evoluzione. Partiamo da un piccolo sottoinsieme della lingua italiana per poi espanderlo passo dopo passo, aggiungendo nuove funzionalità a ogni versione.

---

## 🚀 Stato Attuale: v0.18.0 — Consolidamento del linguaggio

Il linguaggio FAVELLA è ora **completo ed eccellente allo stato attuale**: i Livelli 1-8 della roadmap sono chiusi e la v0.18.0 ha colmato ogni buco e asimmetria emersi scrivendo le demo, **senza più workaround nelle storie**. La grammatica resta **LALR(1) non ambigua per costruzione** (parser a due passate: symbol-table → LALR con i nomi come token chiusi). Suite di **446 test** verdi. Spec tecnica: [`documentazione/grammatica-0.18.0.md`](documentazione/grammatica-0.18.0.md).

### Novità del Linguaggio (v0.18.0 — Consolidamento)
- **Regole a due oggetti con `se`:** `Invece di usa X su Y se [condizione]: …` ora valuta davvero la condizione (più esiti per la stessa combinazione).
- **Italiano più ricco e corretto:** copula plurale (`Le tacche sono una cosa`), genitivo `dei` (`la descrizione dei pilastri`), preposizioni articolate (`usa la batteria sul pannello`), accenti affidabili nei nomi (`comò`).
- **Più potere espressivo:** condizione e teletrasporto sulla posizione del giocatore (`se il giocatore è in X`, `e adesso il giocatore è in X`); testo d'esito personalizzato (`… e adesso vinci "Sei libero!"`); confronti `al massimo N` (≤) e `non è N` (≠) sui contatori; negazione di gruppi `non ( A e B )`; verbi personalizzati multi-parola (`"fai scattare" è un comando.`).

Storia completa in [CHANGELOG.md](CHANGELOG.md). Le sezioni seguenti documentano le tappe precedenti della roadmap.

### 📌 Versioni (linea unica)

Dalla v0.18.0 il progetto adotta **un unico numero di versione** per tutto il linguaggio: non esiste più uno schema separato «Grammatica vX». Motore, compilatore e specifica della grammatica avanzano insieme.

| Componente | Versione | Riferimento |
|---|---|---|
| Motore / interprete (`gioco.py`) | **0.18.0** | header di modulo |
| Compilatore (`compilatore.py`) | **0.18.0** | header di modulo |
| Strutture dati (`strutture.py`) | **0.18.0** | header + `Mondo.__str__` |
| Libreria azioni (`libreria_azioni.py`) | **0.18.0** | header di modulo |
| Specifica formale della grammatica | **0.18.0** | [`documentazione/grammatica-0.18.0.md`](documentazione/grammatica-0.18.0.md) |
| Suite di test (`test_linguaggio.py`) | **0.18.0** | 446 test verdi |
| Sidecar di compilazione (`favella_server.py`) | `VERSIONE_MOTORE` 0.18.0 | — |

> Le etichette di versione più vecchie che compaiono nelle sezioni storiche qui sotto (es. «Grammatica v0.4.0», «v0.7.0») sono **conservate come cronaca** delle tappe e non riflettono lo stato attuale, che è **v0.18.0** su tutta la linea. Il manuale d'autore (`documentazione/manuale/`) sarà rigenerato sulla v0.18.0 in una prossima iterazione.

---

## Stato storico: v0.7.0 — Disambiguazione Strutturale (Alpha)

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

### Core del Linguaggio (storico — etichettato all'epoca «Grammatica v0.4.0»)
- **Conservazione dell'Estetica Originale:** I nomi di stanze e oggetti conservano gli articoli e la capitalizzazione originali scritti dall'autore (es. `"Una keycard magnetica"`, `"La cella di contenimento"`), pur mantenendo l'ID normalizzato per la logica.
- **Preposizioni Tolleranti:** Tolleranza ed eliminazione del problema *"guess-the-preposition"* nei comandi a due oggetti (es. `usa la keycard con la porta` si mappa automaticamente a `usa la keycard su la porta`).
- **Conseguenze Dinamiche:** Regole che modificano il mondo (`... e adesso la porta è aperta`).
- **Interazioni a Due Oggetti:** Supporto per comandi come `usa chiave con porta`.
- **Logica Condizionale:** Supporto completo per regole `Invece di ... se ...`.
- **Mondo Dinamico:** Stanze, oggetti, contenitori e proprietà.

---

## 🎮 Come Iniziare

FAVELLA si usa da riga di comando: il compilatore e l'interprete sono in Python
puro (unica dipendenza: `lark`). Esempi pronti in [`esempi/`](esempi/) — su tutti
la **demo ufficiale** «Il Relitto Silente» in
[`esempi/demo/relitto-silente/`](esempi/demo/relitto-silente/) e una storia con un
errore voluto in `esempi/test debug/storia-con-errore.fav`.

1.  **Clona il Repository:**
    ```sh
    git clone https://github.com/Pitz72/FAVELLA1.git
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
    python gioco.py esempi/demo/relitto-silente/relitto.fav
    ```

    Apparirà il mondo che hai creato (o la demo ufficiale, se lanci quella).
    Inserisci comandi come:
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

## 🗺️ Roadmap

I **Livelli 1-8** della roadmap del linguaggio sono **chiusi** e la v0.18.0 ha
consolidato il tutto: il linguaggio FAVELLA è completo ed eccellente allo stato
attuale delle conoscenze. Sono già disponibili azioni a due oggetti (`usa X su Y`,
ora con clausola `se`), condizioni composte (AND/OR/NOT con parentesi),
contenitori e supporti, modifiche dinamiche del mondo (`e adesso …`), stati e
contatori, NPC con dialoghi ramificati, eventi a turni e demoni (eventi
condizionali). Il percorso completo è documentato in [CHANGELOG.md](CHANGELOG.md)
e nei documenti per-versione in [`documentazione/`](documentazione/).

Le prossime tappe non riguardano nuove primitive del linguaggio, ma il suo
contorno:

-   **Manuale d'autore completo**, rigenerato sulla v0.18.0 (con la demo come guida).
-   **Eventuale internazionalizzazione** e valutazione di una **1.0.0** «linguaggio
    maturo» quando l'esperienza d'uso lo confermerà.

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
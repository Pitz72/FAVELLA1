# FAVELLA 1

<p align="center">
  <img src="assets/banner.png" alt="FAVELLA 1 — versione 1.0.0 — L'italiano è il linguaggio di programmazione" width="880">
</p>

**FAVELLA 1 è un motore di gioco per narrativa interattiva (Interactive Fiction) che ti permette di creare mondi virtuali scrivendo semplici frasi in italiano.**

È un progetto sperimentale con una missione ambiziosa: rendere lo sviluppo di avventure testuali accessibile a tutti, specialmente a scrittori e game designer, usando la lingua italiana come un vero e proprio linguaggio di programmazione.

---

## ✨ Filosofia

-   **Il Codice è Prosa:** Dimentica la sintassi complessa. Se puoi descrivere una scena, puoi programmarla. Esempio: `La biblioteca è una stanza.`
-   **Semplicità per l'Autore:** L'obiettivo è massimizzare la semplicità per chi scrive. Tutta la complessità tecnica è nascosta e gestita dal compilatore e dall'interprete di FAVELLA.
-   **Sviluppo Iterativo:** Il linguaggio è in costante evoluzione. Partiamo da un piccolo sottoinsieme della lingua italiana per poi espanderlo passo dopo passo, aggiungendo nuove funzionalità a ogni versione.

---

## 📦 Installazione

Dalla **v0.29.0** FAVELLA è distribuita come **installer multipiattaforma**: scarica quello del tuo sistema dall'ultima [Release](https://github.com/Pitz72/FAVELLA1/releases) — **non serve clonare il repo né installare Python**.

| Sistema | File | Note |
|---------|------|------|
| Windows | `favella1-setup-*-windows-x64.exe` | installer; crea le scorciatoie nel Menu Start |
| macOS (Apple Silicon) | `favella1-*-macos-arm64.dmg` | trascina la cartella in Applicazioni |
| Linux | `favella1-*-linux-x86_64.AppImage` | rendi eseguibile e lancia |

Dopo l'installazione:

```sh
favella1 gioca storia.fav        # gioca una storia
favella1 playground              # editor + motore nel browser (offline)
favella1 collaudo storia.fav     # collaudatore statico
favella1 compila storia.fav      # solo diagnostica
favella1 esporta storia.fav      # genera un .html giocabile e condivisibile
```

> Gli eseguibili non sono firmati: al primo avvio accetta l'avviso di SmartScreen (Windows) o Gatekeeper (macOS). Dettagli e procedura di rilascio in [PACKAGING.md](PACKAGING.md).

---

## 🚀 Stato Attuale: v0.29.0 — Distribuzione multipiattaforma (Asse A completo + Revisione totale)

Il linguaggio FAVELLA è **completo ed eccellente allo stato attuale**. Sono chiusi i Livelli 1-8 della roadmap, il **Consolidamento** (v0.18.0) e l'intero **Asse A — «Il mondo vivo»** (v0.19.0→v0.26.0: pronomi/anafora, ANNULLA/ANCORA, varietà nelle descrizioni, buio e luce, movimento degli NPC, sinonimi di verbo, verbi intransitivi, inventario iniziale, tick silenziosi). Le versioni **v0.27.0 e v0.28.0** sono una **revisione totale di solidità** (caccia a difetti e debiti, non nuove feature) prima del manuale.

La grammatica resta **LALR(1) non ambigua per costruzione** (parser a due passate: symbol-table → LALR con i nomi come token chiusi), con una guardia anti-ambiguità nella suite. Suite di **582 test** del linguaggio + **43 test** del collaudatore statico, tutti verdi. Spec tecnica: [`documentazione/grammatica-0.28.0.md`](documentazione/grammatica-0.28.0.md).

### Novità della Revisione totale (v0.27.0 + v0.28.0)
- **Correttezza (Lotto 1):** copula plurale sugli stati/contatori (`Le vite sono un contatore`, `Le vite partono da 3`); `accesa`/`spenta` opposte di default; `lascia` bloccato al buio come gli altri verbi; nomi propri preservati negli annunci (`La Guardia Reale` non diventa più `La guardia reale`).
- **Robustezza (Lotto 2):** aggettivi che iniziano con una preposizione ora ammessi (`La lapide è incisa.`); **turno atomico** (un'eccezione in una conseguenza fa rollback, niente stato a metà); una conversazione è un solo passo di **ANNULLA**; rete di test rinforzata (anti-drift della spec sui blocchi EBNF, collaudo su vittoria via evento/demone).
- **Perf & pulizia (Lotto 3):** cache dei parser LALR (≈40 ms → trascurabile sulle ricostruzioni identiche); `guarda` e l'ingresso in stanza condividono ora la stessa resa (uscite incluse).

### Capacità del linguaggio (panoramica)
- **Italiano ricco:** copula plurale, genitivi/partitivi, preposizioni articolate, accenti affidabili (NFC) nei nomi.
- **Espressività:** condizione e teletrasporto sulla posizione del giocatore; testo d'esito personalizzato (`vinci "Sei libero!"`); confronti sui contatori (`almeno`/`al massimo`/`non è`); negazione di gruppi `non ( A e B )`; verbi personalizzati anche multi-parola; sinonimi di verbo.
- **Mondo vivo:** stati e contatori, eventi a tempo, **demoni** (if-then autonomi), buio/luce, NPC che si muovono, dialoghi ramificati, pronomi/anafora, ANNULLA/ANCORA.

Storia completa in [CHANGELOG.md](CHANGELOG.md). Le sezioni seguenti documentano le tappe precedenti della roadmap.

### 📌 Versioni (linea unica)

Dalla v0.18.0 il progetto adotta **un unico numero di versione** per tutto il linguaggio: non esiste più uno schema separato «Grammatica vX». Motore, compilatore e specifica della grammatica avanzano insieme (fonte di verità: `strutture.VERSIONE_MOTORE`).

| Componente | Versione | Riferimento |
|---|---|---|
| Motore / interprete (`gioco.py`) | **0.28.1** | header di modulo |
| Compilatore (`compilatore.py`) | **0.28.1** | header di modulo |
| Strutture dati (`strutture.py`) | **0.28.1** | `VERSIONE_MOTORE` + `Mondo.__str__` |
| Libreria azioni (`libreria_azioni.py`) | **0.28.1** | header di modulo |
| Collaudatore statico (`collaudo.py`) | **0.28.1** | usa `VERSIONE_MOTORE` |
| Specifica formale della grammatica | **0.28.0** | [`documentazione/grammatica-0.28.0.md`](documentazione/grammatica-0.28.0.md) — *grammatica invariata in 0.28.1* |
| Suite di test | **0.28.1** | 582 test linguaggio + 43 collaudo |
| Sidecar di compilazione (`favella_server.py`) | `VERSIONE_MOTORE` 0.28.1 | — |

> La 0.28.1 è una patch di perf/documentazione/pulizia: la **grammatica è invariata** rispetto alla 0.28.0, quindi la spec EBNF resta `grammatica-0.28.0.md` (come per la v0.14.0, che mantenne la spec 0.13.0). Le etichette di versione più vecchie nelle sezioni storiche qui sotto (es. «Grammatica v0.4.0», «v0.7.0») sono **conservate come cronaca** e non riflettono lo stato attuale, che è **v0.28.1** su tutta la linea. Il manuale d'autore completo, in PDF tipografico, è in [`documentazione/manuale/`](documentazione/manuale/) ([manuale.pdf](documentazione/manuale/manuale.pdf)) — sarà rigenerato sul linguaggio finale.

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

I **Livelli 1-8**, il **Consolidamento** (v0.18.0) e l'intero **Asse A — «Il mondo
vivo»** (v0.19.0→v0.26.0) sono **chiusi**; le v0.27.0–v0.28.0 hanno aggiunto una
**revisione totale di solidità**. Il linguaggio FAVELLA è completo ed eccellente
allo stato attuale delle conoscenze. Sono disponibili azioni a due oggetti (`usa X
su Y`, con clausola `se`), condizioni composte (AND/OR/NOT con parentesi),
contenitori e supporti, modifiche dinamiche del mondo (`e adesso …`), stati e
contatori, NPC con dialoghi ramificati e movimento, eventi a turni e demoni,
buio/luce, pronomi/anafora e ANNULLA. Il percorso completo è in
[CHANGELOG.md](CHANGELOG.md) e nei documenti per-versione in [`documentazione/`](documentazione/).

Le prossime tappe non riguardano nuove primitive del linguaggio, ma il suo
contorno:

-   📘 **Manuale d'autore completo rigenerato** sul linguaggio finale (Asse A
    completo + revisione), con «La Casa di Via Stradivari» / «Il Relitto Silente»
    come esempi guida. Il manuale attuale in PDF è in [`documentazione/manuale/`](documentazione/manuale/)
    (allineato alla v0.18.0, da aggiornare).
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
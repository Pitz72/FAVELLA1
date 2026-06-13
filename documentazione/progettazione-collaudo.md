# FAVELLA 1 — Progettazione di «collaudo» (B1: il giocatore-robot)

> Documento di progettazione, 2026-06-13. Spec della feature **B1** dell'Asse B di
> `progettazione-oltre-0.18.md`: un **collaudatore automatico** di storie `.fav`.
> Nessun codice ancora: questo file è il piano che la sessione di implementazione
> dedicata seguirà. Decisioni di architettura concordate con Simone (vedi §4).

## 1. Obiettivo e contesto

**Il problema.** Verificare che una storia sia *vincibile* e che tutto il
contenuto sia *raggiungibile* oggi richiede playthrough manuali (fatti a mano per
«La Casa», «Il Relitto Silente» e la demo di guida). Nessun motore IF amatoriale
offre un collaudo automatico: è il **differenziatore tecnico più forte** di
FAVELLA.

**La fortuna.** Due release recenti hanno già posato le fondamenta:
- **`Mondo.cattura_stato()` / `ripristina_stato()`** (v0.21.0 / A3): istantanee
  profonde dello stato mutabile del mondo. Il robot le usa per **esplorare rami
  alternativi** (è la stessa meccanica dell'ANNULLA).
- **`Mondo.rng` con seme fisso** (v0.22.0 / A2): l'esecuzione è **deterministica**
  → un comando, dato uno stato, produce sempre lo stesso esito → walkthrough
  riproducibili.
- **`FavellaTransformer.analisi_statica`** (linter, v0.12.0): già individua stanze
  irraggiungibili, oggetti orfani, regole morte, stati/contatori inutilizzati. Il
  Livello 1 lo estende invece di reinventarlo.

**Il modulo.** Nuovo file `collaudo.py`, indipendente dal loop interattivo.
- CLI: `python collaudo.py storia.fav` → esegue entrambi i livelli, stampa il report.
- API: `analizza_vincibilita(mondo)` (statico) e `esplora(mondo, budget)` (dinamico),
  entrambe restituiscono un dizionario-report (riusabile dal sidecar/IDE).

## 2. Livello 1 — Analisi statica (la «catena della vittoria»)

Analisi **a ritroso** sul Mondo compilato, senza giocare.

1. **Sorgenti di vittoria.** Raccogli ogni `ConseguenzaFinePartita` con esito
   `vinta` ovunque viva: regole, eventi, demoni, opzioni di dialogo.
2. **Risalita delle dipendenze.** Per ogni sorgente, l'elemento che la contiene
   (regola/demone/…) ha una *condizione di sblocco* (la sua `condizione`, più, per
   le regole, il verbo+oggetto da digitare). Scomponi la condizione in atomi
   (possesso, stato, contatore, proprietà, posizione) e per ciascun atomo trova
   **quale conseguenza, da qualche parte, lo può rendere vero**. Ripeti a ritroso
   fino a chiudere sullo stato iniziale.
3. **Output:**
   - **catena della vittoria**: la sequenza di prerequisiti necessari;
   - **oggetti orfani** (mai citati da regole/condizioni/conseguenze);
   - **regole irraggiungibili** (condizione mai soddisfacibile da nessuna conseguenza);
   - **stanze isolate** (non connesse alla stanza di partenza nel grafo `collega`);
   - **stati/contatori inutilizzati** (riuso del linter esistente).

**Limite onesto, da dichiarare nel report.** La statica **non dimostra** la
vincibilità: le condizioni sono AND/OR/NOT su contatori con aritmetica → la
soddisfacibilità è indecidibile in generale. Il Livello 1 fornisce **condizioni
necessarie + euristiche**: «non trovo staticamente un percorso a `vinci`» è un
*avviso*, non una sentenza. La parola definitiva spetta al Livello 2.

## 3. Livello 2 — Il robot (esplorazione dinamica)

Ricerca in **ampiezza (BFS)** sullo spazio degli stati, con potatura per stato già
visto. L'output autorevole: **vincibile sì/no + walkthrough minimo**.

### 3.1 Il ciclo

```
frontiera = [ (stato_iniziale, percorso=[]) ]
visti = { chiave_stato(iniziale) }
mentre frontiera non vuota e dentro i budget:
    (stato, percorso) = frontiera.pop()      # BFS: coda FIFO
    ripristina il mondo a 'stato'
    per ogni comando in enumera_comandi(mondo):
        ripristina il mondo a 'stato'         # ogni comando parte dallo stesso stato
        esegui_silenzioso(mondo, comando)     # stdout soppresso
        se mondo.stato_partita == "vinta":
            ritorna VINCIBILE, percorso+[comando]
        k = chiave_stato(mondo)
        se k non in visti e mondo non è in stato terminale:
            visti.add(k); frontiera.append( (cattura_stato(mondo), percorso+[comando]) )
        registra: regole scattate, eventuali morti (persa/terminata)
ritorna NON-TROVATO (entro i budget) + copertura + morti
```

- **Branching**: `cattura_stato` (deepcopy) per ogni stato di frontiera;
  `ripristina_stato` prima di provare ogni comando. Costo memoria O(stati × mondo),
  limitato dai budget.
- **Output silenzioso**: durante l'esplorazione `sys.stdout` è rediretto (gli
  esiti si leggono da `mondo.stato_partita`, non dal testo).
- **Rilevamento morti/vicoli ciechi**: `stato_partita ∈ {persa, terminata}` →
  ramo morto (registrato, non espanso); frontiera vuota senza vittoria → la storia
  potrebbe non essere vincibile (entro i budget).

### 3.2 La chiave di stato (potatura) — DECISIONE §4.1

`chiave_stato(mondo)` è una **serializzazione canonica leggera** (NON la deepcopy)
dello stato *rilevante per la logica*:
- `posizione_giocatore`;
- `frozenset(inventario)`;
- `frozenset(variabili.items())` (stati + contatori);
- per ogni oggetto: posizione + `frozenset(proprieta)`;
- `tuple(demone.era_vera …)` (fronti di salita già scattati);
- `stato_partita`;
- **firma temporale** (vedi sotto), solo se servono gli eventi a tempo.

**Esclusi dalla chiave** (non influenzano la vincibilità): `rng`, gli indici delle
`VariantiDescrizione` (cosmetici), `turno_corrente` grezzo, `_storia_stati`,
`ultimo_comando`.

**Firma temporale (correttezza con potatura).** Il `turno_corrente` grezzo
renderebbe ogni stato unico → niente potatura → esplosione. Ma se la storia ha
`Evento` a tempo, due stati con turno diverso NON sono equivalenti. Soluzione: se
`mondo.eventi` è non vuoto, includi nella chiave una **firma compatta**:
- per ogni `Al turno N`: il bit `turno_corrente >= N` (già scattato o no);
- per ogni `Ogni N turni`: `turno_corrente % N` (la fase).

Due stati con la stessa firma temporale si comportano identicamente sui futuri
eventi → si possono fondere senza errore. Se non ci sono eventi a tempo, la firma
è vuota e la potatura è massima.

### 3.3 Enumerazione dei comandi — DECISIONE §4.2 (IBRIDA)

«Testare quanto più possibile», in due passate:

- **Passata 1 — guidata dalle regole** (veloce, per trovare un walkthrough):
  solo le combinazioni *verbo+oggetto per cui l'autore ha scritto una regola*
  (`Invece di …`), più i movimenti verso le uscite, più `prendi`/`esamina` su
  tutto il raggiungibile, più i verbi intransitivi dichiarati. Segue l'intenzione
  del designer e pota l'inutile.
- **Passata 2 — esaustiva entro budget** (massima copertura): tutti i verbi noti ×
  tutti gli oggetti raggiungibili, incluse le combinazioni a due oggetti
  (`usa X con Y`), per scovare regole mai scattate, morti nascoste, vicoli ciechi.

Il report unisce le due: la Passata 1 dà il walkthrough; la Passata 2 dà la
**copertura delle regole** e i percorsi-limite. Entrambe rispettano i budget e
**dichiarano cosa è stato troncato** (mai spacciare per «coperto tutto» un tetto
raggiunto).

### 3.4 Budget e determinismo

- `max_profondita`, `max_stati`, `max_secondi` — con default sensati; il report
  segnala sempre quale budget ha fermato l'esplorazione.
- Determinismo dal seme di A2: ri-eseguire `collaudo` sulla stessa storia dà lo
  stesso walkthrough. Il robot **resetta `mondo.rng` al seme** all'avvio, così
  l'esplorazione non dipende da run precedenti.

### 3.5 Limiti noti di v1 (da dichiarare)

- **Dialoghi**: `parla con X` apre una conversazione modale (scelte per numero).
  In v1 il robot enumera le opzioni del nodo come «comandi» dentro la conversazione,
  ma con profondità limitata; alberi di dialogo molto ramificati possono restare
  parzialmente esplorati (segnalato nel report).
- **Spazio infinito da contatori liberi**: un contatore che cresce senza soffitto
  genera stati sempre nuovi; i budget sono la rete di sicurezza.

## 4. Decisioni di architettura (fissate)

1. **Chiave di stato**: turno escluso di default; **firma temporale** compatta
   inclusa solo se la storia ha eventi a tempo (§3.2). *Massima potatura dove si
   può, correttezza dove serve.*
2. **Enumerazione**: **ibrida** — passata guidata dalle regole + passata esaustiva
   entro budget (§3.3). *Onora «testare quanto più possibile».*
3. **Ordine di costruzione**: **Livello 1 statico prima**, poi il robot (§6).
   *Autocontenuto, fa da impalcatura, i suoi output nutrono il robot.*

## 5. Integrazione

- **CLI**: `python collaudo.py storia.fav [--max-stati N] [--max-secondi S]`.
- **Report**: un dizionario strutturato (per il sidecar/IDE) + un rendering
  testuale leggibile (per la CLI).
- **Sidecar** (seconda battuta): op `collaudo.run` che restituisce il report;
  l'IDE mostrerà la catena di vincibilità sulla mappa (lavoro lato Studio, fuori
  da questo repo).

## 6. Piano a fasi

| Fase | Contenuto | Stima |
|---|---|---|
| **B1.1** | Livello 1 statico (catena vittoria + orfani/irraggiungibili/isolate) sopra il linter esistente; report testuale; test | ~1 sessione |
| **B1.2** | Livello 2 robot: `chiave_stato` + firma temporale, BFS con `cattura_stato`, enumerazione ibrida, budget, walkthrough + copertura + morti; test su «La Casa»/«Relitto»/«Salerno-Reggio» | 1–2 sessioni |
| **B1.3** | Integrazione sidecar `collaudo.run` + rendering IDE | seconda battuta |

Ogni fase: implementazione additiva (nessuna regressione ai test del linguaggio) +
test dedicati + voce di CHANGELOG. `collaudo.py` non tocca la grammatica né il loop
di gioco: è un consumatore del Mondo compilato e delle primitive di stato.

## 7. Rischi e mitigazioni

- **Esplosione dello spazio** → chiave di stato con firma temporale + budget +
  potatura aggressiva; report onesto del troncamento.
- **Costo della deepcopy per ramo** → limitato dai budget; possibile ottimizzazione
  futura (snapshot incrementali) solo se misurata necessaria.
- **Falsa sicurezza** → distinzione netta nel report fra «vincibile (walkthrough
  trovato)», «non vincibile entro i budget» (≠ «non vincibile») e gli avvisi
  statici (necessari, non sufficienti).

# FAVELLA 1 — Progettazione «oltre la 0.18»

> Documento di progettazione, 2026-06-11. Stato del motore alla stesura:
> **v0.18.0, 446 test verdi**, linguaggio completo rispetto al design (Livelli
> 1–8 + consolidamento). Questo documento NON descrive buchi da chiudere: il
> backlog dei debiti è vuoto. Descrive come **alzare il tetto** — del
> linguaggio, della toolchain per gli autori, dell'ecosistema.
>
> Il documento gemello per l'IDE è `PROGETTAZIONE.md` nella repo privata
> `favella-studio`.

## Princìpi non negoziabili (valgono per ogni proposta)

1. **L'italiano È il codice.** Ogni nuovo costrutto deve leggersi come una
   frase italiana corretta, non come una sintassi travestita.
2. **LALR(1) a zero ambiguità.** Nessuna aggiunta che richieda lookahead
   illimitato o introduca conflitti. Se serve, si chiude il terminale
   (symbol-table, come per ENTITA e VERBO_MULTI).
3. **Integrare, non aggirare.** Se un pattern ricorre nelle storie, diventa
   una primitiva del linguaggio, non un workaround documentato.
4. **Additività.** Ogni feature non deve regredire i 446 test né cambiare la
   semantica delle storie esistenti. Le demo devono continuare a vincere
   end-to-end senza modifiche.
5. **Una feature, una sessione.** Implementazione + test + spec + voce di
   CHANGELOG, atomica e committabile.

---

## ASSE A — Il linguaggio: la naturalezza che manca al GIOCATORE

Le proposte sono ordinate per rapporto valore/costo. Riferimento di confronto:
i motori IF maturi (Inform 7, TADS) e le aspettative consolidate del genere.

### A1. Pronomi e anafora (`prendila`, `esaminalo`) — ⭐ priorità massima

**Problema.** `esamina la torcia` seguito da `prendila` oggi fallisce. È la
singola mancanza che più fa sembrare «stupido» il parser a un giocatore
italiano, perché l'anafora è il cuore della lingua parlata.

**Proposta.** Il motore ricorda **l'ultimo oggetto riferito** (per genere e
numero): l'oggetto bersaglio dell'ultimo comando riuscito, o l'ultimo nominato
in una risposta del motore. Il parser dei comandi (runtime, NON la grammatica
Lark del sorgente) riconosce:
- pronomi clitici suffissi: `prendila`, `aprilo`, `esaminale`, `usali`;
- pronomi tonici: `prendi quella`, `apri quello`;
- `lo/la/li/le` con concordanza: se l'ultimo riferito è «la torcia» (femm.
  sing.), `prendilo` risponde «Cosa vorresti prendere?» (mismatch di genere =
  nessun riferente).

**Architettura.** Tutto in `gioco.py` (runtime): registro
`mondo.ultimo_riferito = {"m_sing": id, "f_sing": id, "m_plur": id,
"f_plur": id}` aggiornato da `elabora_comando` dopo ogni azione riuscita;
risoluzione del clitico PRIMA di `risolvi_nome_oggetto`. Il genere/numero è
già inferito dagli articoli (`utils.py`). La grammatica del sorgente .fav non
cambia: zero rischio LALR.

**Casi limite da decidere in progettazione fine:**
- comando fallito: aggiorna il riferito? (proposta: no);
- più oggetti nella stessa risposta: vince l'ultimo nominato;
- riferito non più raggiungibile (oggetto preso da un demone): «Non la vedi
  più.»

**Test attesi:** ~15 (clitici per i 4 generi/numeri, mismatch, riferito
scaduto, interazione con verbi custom).

### A2. Varietà nelle risposte (descrizioni alternate)

**Problema.** Le risposte fisse sono la cosa che più «data» un gioco testuale:
alla terza volta che esamini il mare e leggi la stessa frase, l'illusione
cade.

**Proposta sintattica.**
```fav
La descrizione del mare è una di:
  "Onde lente si rincorrono verso la riva.",
  "Il mare è una lastra di peltro sotto il cielo.",
  "Un gabbiano taglia l'orizzonte in due.".
```
Due politiche, dichiarabili: `una di` (casuale senza ripetizione immediata) e
`in sequenza` (rotazione: utile per descrizioni che «si consumano», l'ultima
resta).

**Architettura.** Grammatica: nuova produzione di `def_descrizione` con
lookahead su `una`/`in` dopo `è` (verificare assenza di conflitto con la
descrizione semplice `è "testo"` — il token successivo discrimina: TESTO_QUOTATO
vs parola riservata). `strutture.py`: la descrizione diventa
`str | ListaDescrizioni(testi, politica, indice)`. Runtime: `gioco.py` pesca
secondo la politica. NB: la casualità rende i playthrough non deterministici —
il giocatore-robot (B1) e i `.favsave` (command-log) devono poter fissare un
seed.

**Test attesi:** ~10 (parsing delle due forme, rotazione, no-ripetizione,
seed deterministico).

### A3. Comandi di servizio del giocatore: `ANNULLA`, `ANCORA`, `TRASCRIZIONE`

**Problema.** Standard del genere dal 1985 (Infocom). La loro assenza è
percepita come incompletezza dal pubblico IF.

**Proposta.**
- `ANNULLA` — disfa l'ultimo turno. Implementazione a costo quasi zero grazie
  ai salvataggi command-log: ricompila il mondo e rigioca n−1 comandi (mutato
  dal meccanismo `.favsave` esistente). Per storie enormi valutare uno
  snapshot ogni K turni. Va reso deterministico rispetto ad A2 (seed).
- `ANCORA` (e alias `G`) — ripete l'ultimo comando del giocatore.
- `TRASCRIZIONE` — apre/chiude il log della partita su file di testo.

Nessun impatto sulla grammatica del sorgente: sono verbi di runtime in
`libreria_azioni.py`. L'autore può disattivarli (`ANNULLA non è permesso.`?
da decidere — forse meglio una dichiarazione di storia tipo
`Questa storia non permette di annullare.`).

**Test attesi:** ~12.

### A4. Buio e luce come primitiva

**Problema.** Il pattern «stanza buia finché non hai una luce» è così
universale nell'IF che simularlo con regole è un esercizio, non una scelta.

**Proposta sintattica.**
```fav
La cantina è buia.
La torcia illumina.            (proprietà speciale: fonte di luce)
```
Semantica: in una stanza buia senza fonte di luce accesa raggiungibile, il
motore mostra «È buio pesto.» e blocca esamina/prendi (le uscite restano
percorribili — convenzione IF). `illumina` interagisce con le proprietà
opposte esistenti (`accesa/spenta`): una torcia spenta non illumina.

**Architettura.** `Stanza.buia: bool`; check di visibilità centralizzato in
`gioco.py` (un solo punto: la stessa funzione che oggi decide la
raggiungibilità). Grammatica: `buia/buio` parola riservata in
`def_proprieta_stanza`; `illumina` come dichiarazione di capacità (analoga a
`può contenere`).

**Test attesi:** ~14 (buio blocca, luce accesa sblocca, luce in contenitore
chiuso NON illumina, demone che spegne la luce a metà partita…).

### A5. Movimento degli NPC

**Problema.** I personaggi sono statici: il mondo sembra un museo. I demoni
(Livello 8) forniscono già il QUANDO; manca solo la conseguenza di movimento
per un PG.

**Proposta sintattica.**
```fav
Ogni 3 turni: il gatto va in una stanza adiacente.
Quando l'allarme è attivo: la guardia va nel corridoio.
```
Due conseguenze nuove: `va in [stanza]` (deterministica — riusa il
teletrasporto B2 della 0.18 applicato a un PG invece che al giocatore) e
`va in una stanza adiacente` (casuale fra le uscite; rispetta il seed di A2).
Il motore annuncia l'evento se avviene nella stanza del giocatore («Il gatto
se ne va verso nord.» / «La guardia entra.»).

**Test attesi:** ~12.

### A6 (minore). Sinonimi di verbo dichiarabili

`"afferra" è come prendi.` — oggi un verbo custom richiede una regola per ogni
oggetto; un sinonimo rimappa al verbo di libreria. Piccolo, chiude un pattern
ricorrente. ~6 test.

---

## ASSE B — La toolchain: strumenti per gli AUTORI

### B1. Il giocatore-robot (playtester automatico) — ⭐ il differenziatore

**Problema.** Verificare che una storia sia vincibile e che tutto il contenuto
sia raggiungibile oggi richiede playthrough manuali (fatti a mano per
entrambe le demo). Nessun motore IF amatoriale offre questo: è il
differenziatore tecnico più forte di FAVELLA.

**Proposta.** Un modulo `collaudo.py` (nome comando: da decidere, es.
`python collaudo.py storia.fav`) con due livelli:

1. **Analisi statica (grafo di vincibilità).** Costruisce il grafo delle
   dipendenze leggendo il Mondo compilato: per vincere serve la conseguenza
   `vinci`, che sta nella regola R, che richiede la condizione C, che dipende
   dallo stato S, modificato dalla regola R2 sull'oggetto O, che è nella
   stanza Z, raggiungibile se… Output: catena della vittoria, **oggetti
   orfani** (mai citati da regole), **regole irraggiungibili** (condizione
   mai soddisfacibile), **stanze isolate**.
2. **Esplorazione dinamica (il robot).** BFS/euristica sullo spazio degli
   stati: a ogni passo enumera i comandi sensati (verbi × oggetti
   raggiungibili + uscite), esegue su una copia del mondo, registra gli stati
   visitati (hash dello stato del Mondo per potare i cicli). Output:
   **vittoria raggiungibile sì/no + walkthrough minimo trovato**, **copertura
   delle regole** (quali non sono mai scattate), **morti/vicoli ciechi**.

**Vincoli tecnici già noti:** serve che il Mondo sia copiabile a basso costo
(deepcopy o snapshot/restore dedicato) e che il runtime sia deterministico
(seed di A2). Lo spazio degli stati esplode con i contatori: servono limiti
dichiarabili (profondità massima, budget di tempo) e potatura furba.

**Integrazione IDE:** il sidecar espone `collaudo.run` e l'IDE mostra il
report (e in prospettiva il grafo di vincibilità sulla mappa — vedi
PROGETTAZIONE.md della repo privata).

**Stima:** è il progetto più grosso del documento (2–4 sessioni). Vale da
solo una release minor (0.19 o 0.20).

### B2. `pip install favella`

**Problema.** Oggi il motore si usa clonando il repo. Un pacchetto PyPI dà
legittimità open-core e abilita l'uso del motore come libreria
(`from favella import compila, gioca`).

**Proposta.** `pyproject.toml` con layout src (`favella/` package:
`compilatore`, `strutture`, `gioco`, `libreria_azioni`, `utils`), entry point
console `favella` (`favella gioca storia.fav`, `favella collauda storia.fav`,
`favella esporta storia.fav`). Attenzione: il refactor dei nomi modulo
(`compilatore` → `favella.compilatore`) tocca gli import del sidecar e
dell'export HTML — va fatto con shim di compatibilità. Versione dalla
costante `VERSIONE_MOTORE`.

**Stima:** 1 sessione (più la decisione sulla licenza, ancora aperta — vedi
memoria strategia-rilascio).

### B3. Libreria standard di moduli `Includi`-bili

**Problema.** Ogni autore reinventa il commerciante, il lucchetto a
combinazione, il meteo. I moduli pronti insegnano i pattern E accelerano.

**Proposta.** Cartella `libreria/` nella repo pubblica: moduli `.fav`
parametrizzabili per convenzione (nomi-segnaposto documentati in testa al
file), ciascuno con README ed esempio minimo. Primi candidati: lucchetto a
codice, baratto con NPC, ciclo giorno/notte (demoni + contatore), lampada a
batteria (consumo), biblioteca consultabile (TRADUCI-like). Ogni modulo deve
compilare da solo E dentro una storia ospite (test dedicati).

**Stima:** incrementale, 1 modulo = mezza sessione. Ottimo materiale anche
per il corso della landing.

---

## ASSE C — L'ecosistema: dove l'export HTML diventa strategia

### C1. Galleria delle storie sulla landing

**Problema/opportunità.** L'export HTML autoportante esiste (0.18 / Fase 7
IDE). Il passo che lo trasforma in strategia è la **pubblicazione**: «scrivi
in italiano, condividi un link».

**Proposta a fasi.**
- **Fase 1 (zero backend):** sezione «Galleria» sulla landing con le storie
  ufficiali (La Casa, Il Relitto Silente) giocabili nel browser + istruzioni
  per gli autori su come auto-ospitare il proprio HTML (itch.io, GitHub
  Pages).
- **Fase 2 (curata):** submission via mail/form a Simone, che pubblica le
  migliori nella galleria. Costo ~zero, qualità controllata.
- **Fase 3 (eventuale, da valutare solo se la community cresce):** upload
  self-service con backend. NON prima che esista la domanda.

La Fase 1 è fattibile subito ed è sinergica col corso già pubblicato.

### C2. Estensione VS Code (evidenziatore + diagnostica)

Per gli autori che non comprano l'IDE: una piccola estensione VS Code con
grammatica TextMate per `.fav` (riusa il lessico del Monarch tokenizer di
Monaco) e, in seconda battuta, diagnostica via il sidecar in modalità LSP.
Doppio ruolo: utilità pubblica + canale di marketing verso Favella Studio
(«vuoi gli editor visuali? c'è Studio»). **Decisione di posizionamento da
prendere con calma:** non deve cannibalizzare l'IDE a pagamento — la linea
proposta è: testo+diagnostica gratis, tutto il visuale (mappa, editor,
debugger, export) solo in Studio.

---

## Sequenza consigliata

| Ordine | Cosa | Perché prima |
|---|---|---|
| 1 | **A1 pronomi** | massimo impatto percepito, zero rischio grammatica |
| 2 | **A3 ANNULLA/ANCORA** | aspettativa di genere, costo basso (command-log esistente) |
| 3 | **A2 varietà** (col seed) | prerequisito di determinismo per il robot |
| 4 | **B1 giocatore-robot** | il differenziatore; richiede il seed di A2 |
| 5 | **A4 buio** + **A5 movimento NPC** + **A6 sinonimi** | completano l'espressività |
| 6 | **B2 PyPI** + **C1 galleria fase 1** | distribuzione, in parallelo |
| 7 | **B3 libreria standard** | incrementale, per sempre |
| 8 | **C2 VS Code** | dopo la decisione di posizionamento |

Un possibile raggruppamento in release: **0.19 «Il giocatore»** (A1+A2+A3),
**0.20 «Il collaudo»** (B1 + seed), **0.21 «Il mondo vivo»** (A4+A5+A6),
**1.0** quando PyPI + galleria + manuale aggiornato sono allineati.

Ogni feature, prima dell'implementazione, passa per il rito consolidato:
proposta di sintassi → verifica LALR su prototipo di grammatica → decisione
con Simone (AskUserQuestion sui punti di design) → implementazione additiva →
test → spec → CHANGELOG.

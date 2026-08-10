# Favella Studio — Revisione UX/IA degli editor visuali

**Tipo:** documento di analisi e visione (Fase 1-3) + traccia di esecuzione (Fase 4).
**Stato: ✅ COMPLETATA.** Tutte le tappe T1-T7 sono implementate e pushate (IDE 0.9.25→0.9.27,
repo privato `favella-studio`); i 6 principi della visione sono tutti applicati. Solo
renderer: motore, backend e round-trip `.fav` invariati. Vedi `CHANGELOG.md` per il dettaglio
per-versione.
**Vincolo:** nessuna riga di codice toccata finché la visione non è approvata. Motore e round-trip
testo↔visuale restano invarianti (681+43 test, undo nativo Monaco, byte-stabilità).

L'autore-tipo che immaginiamo: **uno scrittore, non un programmatore.** Sa cosa vuole che succeda nella
storia, ma non ragiona in termini di `op`, `span`, `operando`, `varEq`. Ogni scelta qui sotto si misura
su di lui.

---

## FASE 1 — Inventario sintetico (cosa fa oggi ogni editor)

L'IDE espone **9 schede** nella titlebar, che aprono un **dock destro** ridimensionabile (320–900px).
Sei sono editor del sorgente, tre leggono la partita in corso.

| # | Scheda | Componente | Cosa modifica | Forma |
|---|--------|-----------|---------------|-------|
| 1 | 🗺 Mappa | `MapView` | stanze + connessioni (topologia) | grafo + modale direzione |
| 2 | 🏠 Stanze | `RoomEditor` | descrizione, stanza iniziale | lista + form |
| 3 | 📦 Oggetti | `ObjectsEditor` | oggetti/contenitori/supporti/PNG, posizione, proprietà, alias, capacità | lista + form + modale crea |
| 4 | ⚙ Regole | `RulesEditor`+`RuleForm` | regole, eventi, demoni | lista read-only + **modale ampia** |
| 5 | ⚖ Stati | `VariablesEditor` | stati e contatori + valori iniziali | lista card + modale crea |
| 6 | 💬 Dialoghi | `DialoguesEditor`+`DialogueForms` | personaggi, nodi, opzioni | **copione in-place** + modali |
| 7 | 🔎 Stato | `StateInspector` | — (sola lettura partita) | inspector |
| 8 | 🐞 Debug | `DebugPanel` | — (timeline turni) | timeline |
| 9 | ▶ Gioca | `GamePanel`/finestra | — (esecuzione) | console |

**Cuore condiviso** = `logicBuilder.tsx`: i costruttori di **condizioni** (`CondGroup`, `CondAtomRow`) e
**conseguenze** (`ConsRow`, `OperandoInput`, `PickValuesInput`), usati identici da Regole e Dialoghi.
È il punto più denso e il vero baricentro di questa revisione.

Round-trip: ogni editor legge via RPC (`world.outline/rules/variables/dialogues`) e scrive frasi `.fav`
canoniche via `outline.serialize`, applicate con splice in Monaco (undo nativo). Copertura completa:
nessun `op:'unknown'` residuo; «✎ testo» resta solo per condizioni booleane troppo annidate.

---

## FASE 2 — Valutazione euristica (dove l'autore si perde)

I problemi raggruppati per gravità. Cito etichette reali.

### 🔴 Critici (toccano comprensibilità o sicurezza percepita)

1. **Il menu «+ conseguenza» ha 10 voci, alcune in gergo travestito.**
   `prop, var, count, move, teleport, end, varCopy, pick, dark, movePNG` →
   «proprietà di un oggetto», «valore di uno stato», «contatore», «sposta un oggetto», «sposta il
   giocatore», «fine partita», «copia uno stato in un altro», «sorteggia il valore di uno stato»,
   «buio di una stanza», «sposta un personaggio». Dieci voci piatte in un unico `<select>`, senza
   raggruppamento, mescolano l'80% dei casi quotidiani con primitive rare dei Temi. L'autore deve
   leggerle tutte ogni volta. È il singolo punto più affollato dell'IDE.

2. **Atomi di condizione: 7 tipi, etichette tecniche.**
   `«il giocatore ha…», «il giocatore è in…», «un oggetto è…», «uno stato è…», «un contatore…»,
   «uno stato è come un altro…», «càpita (probabilità)…»`. L'ultima riga, `chance`, si rende come
   `càpita ( [n] su [m] )` — corretto nel linguaggio ma criptico fuori contesto. «uno stato è come un
   altro» è indirezione fra variabili: concetto da programmatore, non da narratore.

3. **«Stato» vs «Stati»: due schede quasi omografe.**
   `🔎 Stato` = ispettore della partita (sola lettura). `⚖ Stati` = editor degli stati/contatori del
   mondo. Nomi a un carattere di distanza, ruoli opposti (osservare vs definire). Inevitabile
   confonderli.

4. **La modifica della Mappa è l'unica «a interruttore», e l'interruttore è nascosto.**
   Tutti gli altri editor sono sempre attivi; la Mappa richiede di aprire il dock *e poi* premere
   «✏️ Modifica» nella sua toolbar interna. Due gesti per un'azione, e un modello mentale diverso dagli
   altri cinque editor.

### 🟡 Importanti (attrito, incoerenze fra editor)

5. **Terminologia delle intestazioni non uniforme.** Regole: «Quando il giocatore fa…», «Di' al
   giocatore», «E adesso…». Opzioni di dialogo: «Cosa fa», «Mostrala solo se…», «E adesso…». Nodo:
   «Chi parla». Tre dialetti per gli stessi tre concetti (innesco · condizione · effetto).

6. **Default incoerenti fra form gemelle.** La prima conseguenza proposta è `prop` in `RuleForm` ma
   `var` in `DialogueForms`. Stesso widget, due comportamenti.

7. **`fine partita` offerta dentro le opzioni di dialogo.** Semanticamente quasi sempre fuori posto
   in mezzo a una conversazione, ma compare nelle stesse 10 voci.

8. **Ordine delle schede diverso fra titlebar e dock.** Titlebar: Mappa→Stanze→Oggetti→Regole→Stati→
   Dialoghi→Stato→Debug→Gioca. Dock `TITOLI`: gioca→mappa→stanze→stato→debug→oggetti→regole→stati→
   dialoghi. Nessun raggruppamento «definisci il mondo» vs «osserva la partita».

9. **Feedback degli errori solo globale.** Un fallimento di serializzazione in «Oggetti» finisce in un
   toast globale (`gameNotice`), non accanto al campo che l'ha causato.

10. **Azioni di lista non uniformi.** Oggetti e Stati hanno ✕ (elimina), Stanze no; Oggetti ha modale
    di creazione, Stanze si creano solo dalla Mappa, Stati hanno modale piena. Tre pattern per «lista
    + dettaglio».

### 🟢 Minori (rifiniture)

11. Campo «Posizione» in Oggetti: 3 optgroup in un select nativo, scomodo con molti oggetti.
12. In Oggetti, sezione che cambia nome «Contenuto» / «Sopra (contenuto)» a seconda del tipo.
13. Valore iniziale degli stati impostato da clic implicito sul chip (★), senza affordance.
14. Nodo di dialogo «(senza battuta)» visivamente ambiguo; i rami `dest→nodo` non sono visualizzati.
15. `dockWidth` non persiste tra sessioni; le posizioni mappa sì (localStorage). Persistenza disomogenea.
16. Naming interno Mappa `editable` (prop) vs `editMode` (stato): solo leggibilità del codice.

---

## FASE 3 — Visione e architettura dell'informazione

Una sola idea-guida: **dare all'IDE lo stesso linguaggio della storia.** L'autore scrive «Invece di
prendere la torcia, di'…»; l'IDE deve parlargli con gli stessi verbi, non con `op`/`prop`/`varEq`.

### Principio 1 — Un unico vocabolario «da autore», ovunque

Fissare tre etichette canoniche e usarle identiche in Regole, Eventi, Demoni e Dialoghi:

- **QUANDO** (l'innesco: l'azione, il turno, la battuta scelta)
- **SE** (la condizione, sempre opzionale tranne nei demoni)
- **ALLORA** (la risposta + gli effetti)

Sostituire «E adesso…», «Cosa fa», «Mostrala solo se…», «Di' al giocatore» con questo trio. Una sola
mappa mentale per tutta la logica del gioco.

### Principio 2 — Progressive disclosure sul menu conseguenze (il fix più importante)

Spezzare le 10 voci piatte in **gruppi con un “comune” in cima e un “avanzato” richiudibile**, riusando
`<optgroup>` (zero costo, nessun nuovo widget):

```
Effetti comuni
  • cambia una proprietà di un oggetto       (prop)
  • cambia il valore di uno stato            (var)
  • aumenta / diminuisci un contatore        (count)
  • sposta un oggetto                        (move)
  • sposta il giocatore                      (teleport)
  • fine partita                             (end)        ← nascosta nelle opzioni di dialogo
Mondo che cambia
  • una stanza diventa buia / si illumina    (dark)
  • sposta un personaggio                    (movePNG)
Il caso e gli stati che si parlano
  • sorteggia il valore di uno stato         (pick)
  • copia uno stato in un altro              (varCopy)
```

Stesso identico schema per i **7 atomi di condizione**: i quattro quotidiani (ha / è in / oggetto è /
stato è) in cima; contatore, «stato come stato», «càpita» in un gruppo «Avanzate». L'80% dei casi resta
a colpo d'occhio; il resto è a un gesto.

### Principio 3 — Un solo pattern «lista + dettaglio», dichiarato

Allineare Oggetti, Stanze, Stati allo stesso scheletro: **lista a sinistra del dock, dettaglio sotto,
✕ per eliminare ovunque, ➕ per creare ovunque** (anche le Stanze, oggi creabili solo dalla Mappa —
la Mappa resta la via grafica, ma non l'unica). Una nota fissa «la rinomina si fa nel testo» dove serve,
così il read-only non sembra un bug.

### Principio 4 — Raggruppare le schede per intenzione

Riordinare titlebar **e** dock con lo stesso ordine e un separatore semantico:

```
COSTRUISCI IL MONDO   🗺 Mappa · 🏠 Stanze · 📦 Oggetti · 💬 Dialoghi · ⚖ Stati · ⚙ Regole
  ───────────────
PROVA E OSSERVA       ▶ Gioca · 🔎 Stato · 🐞 Debug
```

E risolvere l'omografia: `🔎 Stato` → **«🔎 Partita»** o **«🔎 Osserva»** (è l'istantanea del gioco
vivo), lasciando `⚖ Stati` all'editor. Un nome, un ruolo.

### Principio 5 — La Mappa come gli altri

Togliere l'interruttore «✏️ Modifica»: la Mappa nel dock è **sempre editabile** (come Oggetti o Stati);
resta read-only solo nella finestra di gioco, dove già lo è per prop separata. Un modello mentale unico
per tutti gli editor del mondo.

### Principio 6 — Feedback dove nasce l'azione

Gli errori di serializzazione di un editor compaiono **nel pannello/modale che li ha generati** (riga
rossa accanto al campo), non solo nel toast globale. Reversibilità già garantita dall'undo Monaco: va
solo resa visibile («Annullato» / Ctrl+Z funziona).

### Cosa NON tocchiamo (per scelta, non per inerzia)

- Il **copione in-place** dei dialoghi: è una buona UX, confermata da Simone. Lo allineiamo solo al
  vocabolario QUANDO/SE/ALLORA e ai gruppi di conseguenze.
- La **modale ampia** per la logica complessa: il dock stretto era inusabile, la modale è la risposta
  giusta. Resta.
- Il ripiego su **«✎ testo»** per le condizioni iper-annidate: scelta di design, non un buco.

---

## Piano a tappe (post-approvazione — Fase 4)

Ogni tappa: typecheck+build verdi, round-trip verificato (serializza→compila), commit+push su **entrambi**
i repo dove serve, versione+CHANGELOG+README IDE aggiornati. Quasi tutto è **frontend-only** (renderer
privato); il backend si tocca solo se serve un dato in più (additivo).

| Tappa | Contenuto | Rischio | Repo |
|-------|-----------|---------|------|
| **T1** | Vocabolario unico QUANDO/SE/ALLORA + etichette atomi/conseguenze più narrative (solo stringhe) | basso | privato |
| **T2** | Raggruppare in `<optgroup>` il menu conseguenze e gli atomi di condizione (Principio 2) | basso | privato |
| **T3** | Riordino schede + separatore + rinomina «🔎 Stato»→«Partita» (Principio 4) | basso | privato |
| **T4** | Uniformare il pattern lista+dettaglio: ✕/➕ ovunque, creazione stanze dal dock (Principio 3) | medio | privato |
| **T5** | Mappa sempre editabile nel dock (Principio 5) | medio | privato |
| **T6** | Feedback locale degli errori + default coerenti fra form gemelle (Principi 6 e fix #6/#7) | basso | privato |
| **T7** | Rifiniture minori (#11–#16) secondo budget | basso | privato |

T1–T3 danno il **grosso del beneficio percepito** con rischio minimo (sono prevalentemente etichette e
ordinamento): consigliato partire da lì e fermarsi per un test visivo di Simone prima di T4–T5, che
toccano la struttura.

---

## Domande aperte per Simone (gate)

1. Il vocabolario **QUANDO / SE / ALLORA** ti convince come standard unico, o preferisci un altro trio
   (es. «Quando… / Solo se… / Allora…»)?
2. «🔎 Stato» → preferisci **«Partita»**, **«Osserva»** o altro?
3. Procediamo **incrementale** (T1→T3, stop, test visivo, poi il resto) o vuoi vedere l'intero blocco
   prima di toccare?

# Scouting degli engine di narrativa interattiva (2026)

> **Che cos'è questo documento.** Una ricognizione *esterna* e indipendente del
> panorama mondiale degli strumenti di narrativa interattiva (interactive
> fiction, IF), fatta per rispondere a una sola domanda: **quali idee di design
> — del linguaggio d'autore o dell'esperienza — vale la pena catturare in
> FAVELLA?** Non è un lavoro di implementazione: non tocca il motore, non
> propone codice. È materiale di decisione per la sessione madre.
>
> **Metodo.** Ricerca sul web (ottobre 2026) su documentazione ufficiale, wiki e
> fonti primarie; ogni affermazione non ovvia è linkata. Giudizio onesto: dove un
> sistema non aggiunge nulla a FAVELLA, è detto.
>
> **Avvertenza di scoperta.** FAVELLA è molto più completa di quanto l'elenco
> «cose da non riproporre» lasci intendere. Ha già stati calcolati, varianti
> testuali (casuali e in sequenza), testo condizionale annidato `[se]…[fine]`,
> demoni `Quando … (diventa vera) (per la prima volta)`, arrivi in stanza,
> aritmetica fra contatori con `resta fra A e B`, salvataggio/caricamento,
> ANNULLA/ANCORA, pulsanti-verbo, casualità d'autore. **Il risultato dello
> scouting non sono grandi pilastri mancanti, ma raffinamenti mirati.** La sola
> frontiera grande è già assegnata (relazioni di prima classe, da Inform 7).
> Questa onestà è il risultato principale.

---

## I paletti di FAVELLA (criterio di giudizio, non negoziabili)

Ogni idea è pesata contro questi vincoli. Sono il filtro, non una cornice.

1. **L'italiano È il codice** — niente internazionalizzazione.
2. **Parser LALR(1) a zero ambiguità** — niente sinonimia all'infinito, niente grammatica estendibile a piacere.
3. **Motore proprio** — niente backend esterno (no compilazione a Z-code, no Prolog, no runtime di terzi).
4. **Solo aggiunte** — ogni frase valida oggi resta valida e invariata.
5. **Niente plurali/quantità automatiche né template di entità con ereditarietà** — la semplicità d'autore è una feature (già deciso NO-GO, Temi 5a/5b).
6. **Niente choice-based / drag-drop come *default* di gioco** — il parser è il modo primario.
7. **Scatola di vetro** — il `.fav` leggibile è sempre la fonte di verità.

**Legenda compatibilità:** ✅ catturabile · ⚖️ da pesare · ⛔ collide.

---

## Tabella comparativa

| Sistema | Tipo | Cosa lo rende notevole (una riga) | Idea migliore per FAVELLA | Compat. |
|---|---|---|---|---|
| **Inform 7** | parser, regole in linguaggio naturale | lo standard di fatto: regole, relazioni, **scene**, tabelle | **Scene / tempo drammaturgico nominato**; tabelle di dati | ⚖️ |
| **TADS 3** | parser, OO tipo C++ | simulazione profonda (sense-passing), parser disambiguante | Disambiguazione a runtime («quale intendi?») | ⚖️ |
| **Dialog** | parser, logica tipo Prolog | libreria scritta nella stessa lingua, leggibile e modificabile | Conferma la «scatola di vetro»; esporre di più la libreria in `.fav` | ⚖️ |
| **Alan** | parser dichiarativo | nessuna libreria standard: tutto esplicito | Quasi nulla di nuovo | ⛔/— |
| **Hugo** | parser ibrido | grammatica in file, storico multimediale | Nulla di distintivo | — |
| **ADRIFT** | parser, autoring a moduli | editor a mappa grafica, no-code | **Vista-mappa read-only in Favella Studio** | ✅ (strumento) |
| **Quest** | ibrido parser/scelta | GUI sopra uno scripting, export mobile/web | Nulla oltre ADRIFT | ⛔/— |
| **Twine** (Harlowe/SugarCube/Chapbook) | ipertesto a scelte | i «formati storia» come dialetti con presentazione propria | Testo temporizzato (presentazione); tema di export separabile | ⚖️ |
| **Ink / inklewriter** | flusso narrativo scriptato | **testo vivo** (sequenze, cicli, once-only), tunnel, thread | **Testo vivo inline a conteggio visite**; **procedure/tunnel** | ✅ |
| **ChoiceScript** | CYOA a statistiche | **fairmath**, quadro statistiche dichiarativo | «Aumenta equamente» (aritmetica limitata asintotica) | ⚖️ |
| **Yarn Spinner** | dialogo a nodi | agnostico al motore, ponte verso codice host | Markup/tag di riga per gli strumenti | ⛔ (host-code) |
| **Ren'Py** | visual novel | screen language, ATL, **rollback**, salvataggi robusti | Rollback e slot — **già coperti** (SALVA/CARICA, ANNULLA) | — (già presente) |
| **Adventuron** | parser web | illustrazione per stanza, play-as-you-code | Immagine opzionale per stanza nell'export | ⚖️ |
| **Gruescript** | parser-less «che sa di parser» | click su verbi/nomi, mobile, feel da Zork | Conferma i pulsanti-verbo; nomi cliccabili nel testo | ⚖️ (già coperto) |
| **Texture** | drag verbo-su-nome | trascini un verbo sulla parola nel testo | Input alternativo touch (non default) | ⛔ (default) |
| **Squiffy** | scelte in Markdown | sezioni + passaggi, compila a HTML | Nulla di nuovo | ⛔/— |
| **Dendry / StoryNexus** | **QBN** (storylet) | contenuti atomici con prerequisiti/effetti | **Eventi salienti** (kernel di selezione) | ⚖️ |
| **Elm Narrative Engine** | QBN/salience, schemaless | regole scelte per miglior-corrispondenza | Tie-break per salienza fra eventi concorrenti | ⚖️ |
| **Curveship** | generazione narrativa | separa *storia* da *racconto* (tempo/persona/focalizzazione) | Solo nota di ricerca | ⛔ (costo) |
| **Windrift** | ipertesto mutevole | parole che si riscrivono *sul posto* | Contro il modello a trascrizione | ⛔ |
| **GameFic** | framework Ruby | libreria tipo Inform, build web | Nulla di nuovo | — |
| **Decker** | multimedia tipo HyperCard | carte, scripting Lil, **dati tabellari** | Conferma «tabelle di dati» | ⚖️ |
| **Bitsy** | mini-engine a stanze | vincolo radicale come estetica | Filosofia del vincolo | — |
| **Monogatari / Raconteur / Fractive** | VN web / layer su Undum / ipertesto Markdown | nicchie JS | Nulla di distintivo | — |
| **Strand** | *non identificato* | nessun engine IF notevole con questo nome | — | — |
| **Approcci LLM** (AI Dungeon, STORY2GAME, LPLH, GenQuest) | generazione a modello | mondo/azioni generati dal LLM | **«Forse intendevi…»** (locale, deterministico, NO LLM) | ✅ (solo il kernel) · ⛔ (runtime LLM) |

---

## Schede per sistema

Per ciascuno: **(a)** cos'è / cosa lo rende notevole · **(b)** 1–3 idee concrete
per FAVELLA · **(c)** compatibilità coi paletti.

### Famiglia parser «classica»

#### Inform 7
**(a)** Lo standard di fatto della IF a parser: si scrive in frasi di italiano…
pardon, di inglese, raccolte in *rulebook*; il manuale *Writing with Inform* ha
capitoli dedicati a **scene** (cap. 10), **relazioni** (13), **tabelle** (16),
**understanding** (17), **attività** (18) e **rulebook** (19)
([indice del manuale](https://eblong.com/zarf/i7index/index.html)).

**(b)**
- **Scene / tempo drammaturgico nominato.** Una *scena* è una porzione di gioco
  con una condizione d'inizio e una di fine: `Guard-evasion is a scene.
  Guard-evasion begins when the security guard is suspicious. Guard-evasion ends
  when the player is in the Bank Vault for the first time.`; non la si avvia
  «dichiarando» che parte, l'avvio è una *condizione*; di default una scena
  accade una volta sola ([Inform 7 Handbook, cap. 8 — Scenes](https://inform-7-handbook.readthedocs.io/en/v2.0/chapter_8_time_%26_scenes/scenes/)).
  Questo è l'oggetto-concetto che FAVELLA **non** ha: ha i mattoni (demoni
  `Quando … diventa vera`, `per la prima volta`, arrivi, stati calcolati) ma non
  un *periodo di tempo narrativo* con nome, memoria, `durante la scena X` come
  condizione e ganci `quando la scena comincia/finisce`.
- **Tabelle di dati.** Griglie dichiarative riga/colonna come strutture di prima
  classe, per presentare dati in modo sistematico ([Writing with Inform §16.1](https://ganelson.github.io/inform-website/book/WI_16_1.html)).
  FAVELLA ha contatori isolati ma nessuna *tabella* su cui leggere valori che
  variano per riga.
- **Attività** (hook attorno a procedure di sistema, non alle azioni): generalizza
  le regole `Prima/Invece/Dopo` alle *procedure di narrazione* (come stampare il
  nome di un oggetto).

**(c)** Scene ⚖️ (additiva, dichiarativa, italianizzabile — ma va progettata per
non essere mero zucchero sui demoni). Tabelle ⚖️ (non è ereditarietà, quindi non
viola il paletto 5; ma sfiora la linea «la semplicità è una feature»). Attività
⚖️. *Understand* estendibile e sinonimia illimitata ⛔ (paletto 2: FAVELLA ha già
alias/sinonimi **chiusi**).

#### TADS 3
**(a)** Linguaggio IF orientato agli oggetti, sintassi vicino a C/C++/Java, con
simulazione profonda: **sense-passing** (luce, suono, odore che si propagano tra
contenitori trasparenti/opachi) e un parser inglese potente ed estensibile
([IFWiki: T3](https://www.ifwiki.org/T3); [TADS Overview: The Language](https://tads.org/ov_lang.htm)).

**(b)**
- **Disambiguazione a runtime** («Which do you mean, the red or the blue door?»):
  quando un verbo+nome combacia con due entità presenti, chiedere invece di
  indovinare. In FAVELLA la grammatica è 0-ambigua *a compile-time*, ma
  l'ambiguità *di riferimento* a runtime (due oggetti che matchano lo stesso
  nome/alias) è UX, non grammatica.
- **Modello sensoriale** (buio già c'è in FAVELLA; propagazione di suono/odore è
  oltre).

**(c)** Disambiguazione ⚖️ (UX a runtime, compatibile, ma da verificare se nasce
mai il caso con i terminali chiusi di FAVELLA). Sense-passing ⚖️/⛔ (pesante,
contro la semplicità). Template/ereditarietà ⛔ (paletto 5).

#### Dialog (Linus Åkesson)
**(a)** Linguaggio IF della famiglia *logic programming* (ispirato a Inform 7 e
Prolog), primo rilascio 2018; il world-model e il parser sono una **libreria
standard scritta nello stesso linguaggio**, che l'autore può leggere e modificare;
compila a Z-code e alla Å-machine ([docs: intro](https://linusakesson.net/dialog/docs/intro.html)).

**(b)**
- **Scatola di vetro radicale.** L'idea forte è che *anche la libreria* sia
  leggibile dall'autore. FAVELLA è scatola di vetro per il `.fav`, ma il motore è
  Python (opaco). Spunto: esporre più «regole standard» come `.fav` ispezionabile,
  così l'autore vede davvero *tutto*.

**(c)** Filosofia ⚖️ (conferma un valore di FAVELLA). Backtracking/predicati,
aritmetica 0–16383, compilazione a Z-code/Å-machine ⛔ (paletto 3, motore proprio).

#### Alan · Hugo · Quest · GameFic
**(a)** Alan: linguaggio IF dichiarativo senza libreria standard (tutto
esplicito) ([alan3 review](https://notimetoplay.org/engines/alan3-review.html)).
Hugo: linguaggio IF ibrido, grammatica in file, storico multimediale
([IFWiki: Hugo](https://www.ifwiki.org/Hugo)). Quest: GUI sopra uno scripting,
ibrido parser/scelta, export mobile ([saashub](https://www.saashub.com/compare-questjs-vs-adrift)).
GameFic: framework Ruby con libreria standard «tipo Inform» e build web
([Gamefic SDK](https://www.rubydoc.info/gems/gamefic-sdk/2.3.3)).

**(b)** Onestamente: **niente di nuovo per FAVELLA**. Alan ha la libertà
d'ordine delle dichiarazioni (FAVELLA è già sostanzialmente ordine-indipendente).
Gli altri ripetono idee presenti altrove in questa lista con meno forza.

**(c)** — / ⛔ (Quest è ibrido a scelte di default).

### Famiglia autoring no-code

#### ADRIFT
**(a)** Sistema a moduli, form-based, con **editor a mappa grafica**: si disegnano
le stanze e i collegamenti, si aggiungono oggetti e personaggi col mouse
([IFWiki: ADRIFT](https://www.ifwiki.org/ADRIFT)).

**(b)**
- **Vista-mappa read-only in Favella Studio.** *Invertendo* l'idea per non violare
  i paletti: non un editor grafico che genera il gioco, ma una **vista** della
  mappa (stanze + uscite + uscite condizionali) *generata dal `.fav`*, che resta
  la fonte di verità. Ottimo per orientarsi in storie grandi (Il Viaggiatore, Il
  Relitto).

**(c)** ✅ come **strumento d'autore** (il testo resta sorgente; la mappa è una
vista). Autoring a form *al posto* del testo ⛔ (paletto 7).

### Famiglia choice-based / ipertesto

#### Twine (Harlowe / SugarCube / Chapbook)
**(a)** Il sistema dominante per l'ipertesto a scelte; i «formati storia» sono
*dialetti* con macro e presentazione propria (Harlowe facile, SugarCube potente,
Chapbook amichevole con *insert*/*modifier*) ([Twine Cookbook: story formats](https://twinery.org/cookbook/introduction/story_formats.html)).

**(b)**
- **Testo temporizzato** (Chapbook/SugarCube: rivelare testo dopo un ritardo,
  effetto macchina da scrivere): una tecnica di *presentazione* che potrebbe
  essere un'opzione d'autore nell'export HTML.
- **Presentazione separabile** (il «formato storia» come strato tematico
  intercambiabile): temi di export per FAVELLA.

**(c)** Testo temporizzato ⚖️ (presentazione, bassa priorità). Macro a scelte
come default ⛔ (paletto 6).

#### Ink (inkle) / inklewriter
**(a)** Linguaggio di *flusso narrativo* di inkle, open source: facile da
imparare ma con strutture avanzate; versione 1.0 (feb 2021) ha aggiunto flussi
paralleli a stato condiviso ([ink version 1](https://www.inklestudios.com/2021/02/22/ink-version-1.html)).
Celebre per il **testo vivo**.

**(b)**
- **Testo vivo inline a conteggio visite.** Alternative tra graffe `{…|…}` dentro
  la prosa, con quattro politiche: **sequenza** (mostra il prossimo a ogni
  visita, poi resta sull'ultimo), **ciclo** `&` (torna in loop), **once-only**
  `!` (ciascuno una volta, poi nulla), **shuffle** `~` (ordine casuale)
  ([Writing with ink — alternatives](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md)).
  **FAVELLA ha già** le varianti a livello di *descrizione* (`una di: …` casuale,
  `in sequenza: …`). Ciò che manca è l'**inline** (un frammento che cambia a
  metà frase, come già fa `[se]…[fine]`) e due politiche nuove: **ciclo che
  ripete** e **una-volta-sola-poi-silenzio**.
- **Tunnel = procedure narrative.** Un blocco richiamabile da più punti che
  *ritorna* al chiamante: risponde al bisogno «procedure/macro». In FAVELLA
  diventerebbe un blocco di conseguenze/testo con un nome, invocabile da più
  regole/eventi.
- **LISTs** (variabili a stati enumerati con `+`/`-`/appartenenza): modella stati
  multipli con operazioni d'insieme; FAVELLA ha stati *mono-valore* calcolati — un
  «insieme di stati» è un'estensione possibile (ma vedi rischio sotto).

**(c)** Testo vivo inline ✅ (additivo, italiano, estende la macchina
d'interpolazione/`[se]` già presente, scatola di vetro). Tunnel/procedure ⚖️
(aggiunge chiamata/ritorno — tenerlo *piatto*, senza ricorsione, per restare
semplice e LALR-pulito). LISTs ⚖️ (rischio di sovrapposizione con stati e con la
frontiera relazioni). Thread/flussi paralleli ⛔ (contro il modello a parser).

#### ChoiceScript
**(a)** CYOA guidato da **statistiche**; celebre per il **fairmath**, operatori
`%+`/`%-` che tengono una percentuale tra 0 e 100 con rendimenti decrescenti:
aggiungere 20 a 90 dà 92, toglierne 20 dà 72
([Important ChoiceScript Commands and Techniques](https://choiceofgames.com/make-your-own-games/important-choicescript-commands-and-techniques)).

**(b)**
- **«Aumenta equamente» / aritmetica limitata asintotica.** Un operatore di
  contatore che non sfora e dà rendimenti decrescenti, utile per statistiche di
  relazione/abilità che devono restare «eque». FAVELLA ha già il *clamp* (`resta
  fra A e B`), ma non la curva asintotica del fairmath.
- **Quadro statistiche dichiarativo** (barre, coppie opposte): è presentazione;
  FAVELLA ha la riga di stato.

**(c)** Fairmath ⚖️ (aggiunta piccola ed elegante, bassa priorità). Scelte come
default e `*selectable_if` ⛔ (paletto 6).

#### Yarn Spinner
**(a)** Linguaggio di dialogo a **nodi**, agnostico al motore (forte in
Unity/Godot); ponte verso il codice host via `<<command>>` e funzioni; ha markup
di riga e tag ([Yarn Spinner docs](https://docs.yarnspinner.dev/2.4/using-yarnspinner-with-unity/creating-commands-functions)).

**(b)**
- **Markup / tag di riga** (`#tag`, `[b]…[/b]`): metadati su una battuta utili
  agli *strumenti* (collaudo, futuro doppiaggio come già in Il Viaggiatore).
  Marginale.

**(c)** Comandi verso codice host ⛔ (motore proprio, scatola di vetro). Il grosso
di Yarn è integrazione con engine di terzi: fuori modello.

### Famiglia visual novel

#### Ren'Py (e Monogatari)
**(a)** Il motore VN dominante (Python sotto): *screen language*, ATL per
animazioni, **rollback** per riavvolgere la storia, salvataggi robusti con slot,
transizioni ([Wikipedia: Ren'Py](https://en.wikipedia.org/wiki/Ren%27Py)).
Monogatari è l'equivalente nativo-web, MIT ([itch.io](https://hyuchia.itch.io/monogatari)).

**(b)**
- **Rollback a più passi + salvataggi con slot.** Onestamente: **FAVELLA ha già**
  SALVA/CARICA (v1.2.0) e ANNULLA/ANCORA (0.21.0). L'unico spunto residuo è
  *verificare che i salvataggi persistano nell'export HTML a file unico*
  (localStorage) e, se non lo fanno, aggiungerlo; e magari *slot nominati*.

**(c)** Rollback/salvataggi — (già presente); verifica export ⚖️. Screen
language/ATL/sprite ⛔ (contro l'identità testuale).

### Famiglia ibrida parser↔scelta

#### Adventuron
**(a)** Parser IF nel browser, con **illustrazione per stanza** e play-as-you-code;
noto proprio per la grafica ([IFWiki: Adventuron](https://www.ifwiki.org/Adventuron);
[forum: four cheers](https://intfiction.org/t/four-cheers-for-adventuron-with-a-soupcon-of-off-season-at-the-dream-factory-postmortem/53513)).

**(b)**
- **Immagine opzionale per stanza** nell'export HTML: un'aggiunta estetica
  facoltativa (il testo resta la verità).

**(c)** ⚖️ (facoltativa; attenzione a non intaccare l'identità testuale e il peso
del file unico). Play-as-you-code è già in Favella Studio («Prova»).

#### Gruescript (Robin Johnson)
**(a)** Strumento *parser-less* che però **sa di parser**: si gioca cliccando
verbi e nomi, mobile-friendly, feel da Zork senza digitare; editor ispirato a
Bitsy/Puzzlescript, output HTML, MIT
([itch.io devlog](https://versificator.itch.io/gruescript/devlog/284374/gruescript-is-now-in-open-beta-release);
[IFWiki: Gruescript](https://www.ifwiki.org/Gruescript)).

**(b)**
- **Nomi cliccabili nel testo** che, combinati col verbo scelto, compongono il
  comando: una variante dei pulsanti-verbo SCUMM *dentro la prosa*. FAVELLA ha
  già i pulsanti-verbo (1.4.0): questo ne è un raffinamento di interfaccia.

**(c)** ⚖️ (per lo più **già coperto** dai pulsanti-verbo).

#### Texture
**(a)** Interazione per **trascinamento**: si prende un verbo dal fondo e lo si
trascina su una parola evidenziata nel testo; pensato per il touch
([Texture review](https://notimetoplay.org/engines/texture-review.html)).

**(b)** Input touch alternativo — interessante, ma è una modalità *di scelta* e
drag-drop.

**(c)** ⛔ come *default* (paletti 6); eventualmente ⚖️ come input alternativo su
mobile, ma a basso valore.

#### Squiffy
**(a)** IF a scelte scritta in **Markdown**, compila a HTML/CSS/JS; due unità:
*section* e *passage* ([IFWiki: Squiffy](https://ifwiki.org/Squiffy)).

**(b)** Nulla di nuovo per FAVELLA.

**(c)** ⛔/— (scelte, Markdown; FAVELLA è già prosa + parser).

### Famiglia quality-based / storylet / salience

#### Dendry · StoryNexus (QBN) · Elm Narrative Engine
**(a)** La grande famiglia di design **non ramificata**: il contenuto è spezzato
in **storylet** — unità atomiche con *prerequisiti* (condizioni sullo stato) ed
*effetti* (che cambiano lo stato) — e il sistema offre o sceglie quelli le cui
condizioni combaciano. **QBN** (Quality-Based Narrative, Failbetter/StoryNexus):
le *qualità* sono variabili numeriche (inventario, abilità, progresso) che
sbloccano storylet. **SBN** (Salience-Based): il sistema *sceglie* il contenuto
che meglio combacia con lo stato, con pareggio casuale. L'Elm Narrative Engine ha
un world-model *schemaless* e un matching regole per salienza
([Emily Short — Beyond Branching](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/);
[Kreminski — Sketching a Map of the Storylets Design Space](https://mkremins.github.io/publications/Storylets_SketchingAMap.pdf);
[Elm Narrative Engine 5.0](https://intfiction.org/t/announcing-elm-narrative-engine-version-5-0-release/44152)).

**(b)**
- **Eventi salienti (kernel di selezione).** FAVELLA ha già metà del quadro: i
  demoni `Quando … diventa vera (per la prima volta)` *sono* condizione→effetto
  atomici; arrivi e stati calcolati completano. Ciò che manca è la **selezione
  per salienza** quando più eventi sono eleggibili lo stesso turno: invece di
  farli scattare tutti o in ordine arbitrario, **scegliere il più specifico** (o
  un peso d'autore). È il nucleo catturabile della famiglia QBN/SBN.
- Il *menu di storylet offerti al giocatore* ⛔ (è choice-based).

**(c)** ⚖️. Alto valore narrativo, ma: (1) **si sovrappone** molto alle macchine
esistenti (demoni, arrivi) e alla **frontiera relazioni** già assegnata all'altra
sessione; (2) va pesato *insieme* a quella, non in parallelo. Raccomando solo il
*tie-break per salienza*, non un sistema di storylet pieno.

### Famiglia narratologica / sperimentale

#### Curveship (Nick Montfort)
**(a)** Framework (Python, poi Curveship-js) che separa la **storia** dal
**racconto**: può ri-narrare gli stessi eventi cambiando ordine, tempo verbale,
persona, focalizzazione ([Montfort, FDG 2011](https://www.nickm.com/if/montfort_fdg_2011.pdf)).

**(b)** Affascinante, ma: alto costo, resa incerta per il tipo di storie di
FAVELLA, e contro la semplicità. Lo tengo come **nota di ricerca**, non proposta.

**(c)** ⛔ (costo/rischio sproporzionati al valore).

#### Windrift (Liza Daly)
**(a)** Framework JS per **narrazioni mutevoli**: parole già scritte si
**riscrivono sul posto** al cambiare dello stato; niente parser, niente
world-model ([GitHub: windrift](https://github.com/lizadaly/windrift)).

**(b)** La prosa mutevole è bella ma è un modello a ipertesto, non a trascrizione:
FAVELLA ha già il testo condizionale `[se]…[fine]` che *ri-renderizza* la
descrizione.

**(c)** ⛔ (contro il modello a trascrizione/parser).

### Famiglia minimalista / altro medium

#### Decker · Bitsy
**(a)** Decker: piattaforma multimediale tipo HyperCard, scripting *Lil*, capisce
i **dati tabellari** ([Decker — Obsidian note](https://publish.obsidian.md/taniynquest/05+The+Garden/Video+Game+Creation+Resources/Decker)).
Bitsy: mini-engine a stanze pixel con dialoghi, vincolo radicale come estetica
([Bitsy overview](https://make.bitsy.org/docs/introduction/overview/index.html)).

**(b)** Decker conferma l'idea «tabelle di dati» (vedi Inform 7). Bitsy ricorda
che *il vincolo è una feature* — valore che FAVELLA già abbraccia (NO-GO su
plurali/template).

**(c)** — (altro medium; il solo spunto, le tabelle, viene da Inform).

#### Strand
**(a)** **Non identificato** come engine IF notevole. Esiste un linguaggio
*Strand* di programmazione parallela degli anni '80 (logic programming), non di
IF; e giochi/parole-crociate omonimi non pertinenti. Lo dico per onestà: se la
sessione madre aveva in mente un progetto specifico, va ripassato il nome.

**(c)** —

### Approcci LLM alla IF (2023–2026)
**(a)** Filone di ricerca vivace: **STORY2GAME** (mag 2025) usa un LLM per
generare storia, popolare il mondo e scrivere il *codice delle azioni*
([emergentmind](https://www.emergentmind.com/papers/2505.03547)); **LPLH** (mag
2025) dà a un LLM zero-shot una mappa a grafo, un insieme crescente di comandi
verbo-oggetto validi e una memoria di esperienze, con grossi salti su Zork1 e
Detective ([arXiv 2505.12439](https://arxiv.org/pdf/2505.12439)); **GenQuest**
(ott 2025) è un'avventura CYOA per studenti di lingua su GPT-4o/Claude
([arXiv 2510.04498](https://arxiv.org/abs/2510.04498)); progetti hobbistici usano
un LLM *come parser* di avventure classiche
([intfiction forum](https://intfiction.org/t/old-time-text-adventure-powered-by-a-llm/76617)).

**(b)**
- **«Forse intendevi…»: recupero gentile del parser** — *ispirato* ai punti di
  dolore dell'LLM-as-parser e alla disambiguazione di TADS, ma realizzato **in
  locale, deterministico, senza alcun LLM**: quando l'input non viene capito (o
  un nome manca/è ambiguo), suggerire il verbo/nome noto più vicino, usando la
  distanza fra stringhe sui *terminali chiusi che il compilatore già conosce*.
  Risolve attriti **documentati sul campo** (Matthia/Pietro: `usa X` vs `usa X su
  Y`; `l`/`look` non riconosciuti) nello spirito «integrare, non aggirare».

**(c)** «Forse intendevi…» ✅ (runtime/parser UX, deterministico, offline,
scatola di vetro). **LLM a runtime** ⛔ (viola i paletti 2, 3, 7, il determinismo
e l'offline del file unico). L'assistenza LLM *in fase di scrittura* è già ciò che
Simone fa con Claude: non è una feature del linguaggio.

---

## Shortlist prioritizzata «da catturare»

Ordinata per **valore / (costo × rischio)** incrociato con la compatibilità ai
paletti. Per ciascuna: *perché* e *rischio*.

### 1 — Scene / tempo drammaturgico nominato  ·  ✅/⚖️  ·  da Inform 7
**Perché.** È l'unica *aggiunta organizzatrice* grande e compatibile: dà all'autore
un'unità di **tempo narrativo** con nome — `La scena «tempesta» comincia quando …;
finisce quando …; quando comincia: …; quando finisce: …` — più `durante la scena
«tempesta»` come condizione e la memoria di quali scene sono accadute. Raccoglie
in un concetto leggibile la drammaturgia che oggi l'autore deve montare a mano con
demoni + stati calcolati. Esplicitamente richiesto («scene/tempo drammaturgico»).
**Rischio.** Medio: si sovrappone ai demoni e agli stati calcolati; va progettata
per *aggiungere* valore vero (il `durante`, la memoria, il «una volta sola»,
l'ordinamento inizio/fine) e non essere zucchero. Nodo LALR da verificare (parte
da un nome di scena nuovo → nuovo terminale, come già si fa per ENTITÀ/VARIABILE).

### 2 — Testo vivo inline a conteggio visite  ·  ✅  ·  da Ink
**Perché.** Resa narrativa altissima a costo basso: frammenti che cambiano a metà
frase per numero di visite, con due politiche nuove (**ciclo che ripete**,
**una-volta-sola-poi-silenzio**) che le varianti di descrizione attuali (`una di`,
`in sequenza`) non coprono. Si innesta sulla macchina d'interpolazione già
esistente, accanto a `[se]…[fine]`.
**Rischio.** Basso-medio: deve entrare nel lexer dei testi come fa `[se]`
(annidabile), e la sintassi va scelta in italiano (es. `[a turno …]`, `[una volta
…]`) senza collidere con `[nome]`/`[se]`. Nessun conflitto coi paletti.

### 3 — «Forse intendevi…»: recupero gentile del parser  ·  ✅  ·  sintesi (TADS + anti-LLM)
**Perché.** Colpisce attriti **reali e documentati** dai collaudi sul campo, a
costo e rischio bassi, tutto locale e deterministico. Migliora l'esperienza del
giocatore esattamente dove FAVELLA oggi dice solo «non capisco», senza tradire
alcun paletto; anzi incarna «integrare, non aggirare».
**Rischio.** Basso: va calibrato per non suggerire sciocchezze (soglia di
distanza), e tenuto distinto dalla diagnostica *d'autore* (già chiusa). Nessun
nuovo costrutto di grammatica.

### 4 — Tabelle di dati minime (sola lettura)  ·  ⚖️  ·  da Inform 7 / Decker
**Perché.** Abilita contenuti *data-driven* oggi scomodi (prezzi, descrizioni che
variano per riga, bottini): una `Tabella` dichiarativa riga/colonna da cui leggere.
**Rischio.** Medio: può gonfiarsi e sfiora la linea «la semplicità è una feature»
che ha già bocciato template e quantità. Raccomando **solo** una forma minima di
*lookup* in sola lettura (nessuna mutazione di righe, nessuna ereditarietà), o di
rimandarla se non c'è una storia che la chiede.

### 5 — Procedure/macro narrative riutilizzabili  ·  ⚖️  ·  da Ink (tunnel)
**Perché.** Risponde al bisogno «procedure/macro»: un blocco di conseguenze/testo
con un nome, invocabile da più regole/eventi, per non ripetersi (DRY d'autore).
**Rischio.** Medio: introduce *chiamata e ritorno*. Va tenuto **piatto** (nessuna
ricorsione, nessun parametro o parametri minimi) per restare semplice e
LALR-pulito; altrimenti diventa «programmazione» e tradisce lo spirito.

### Sotto la linea (nice-to-have, bassa priorità)
- **Tie-break per salienza fra eventi concorrenti** (QBN/SBN) ⚖️ — *solo* se e
  quando si affronta la frontiera relazioni, con cui va pesato insieme.
- **Vista-mappa read-only in Favella Studio** (ADRIFT) ✅ — strumento, non
  linguaggio; rischio bassissimo (è una vista del `.fav`).
- **«Aumenta equamente» / fairmath** (ChoiceScript) ⚖️ — operatore di contatore
  asintotico; piccolo, elegante, di nicchia.
- **Accessibilità dell'export HTML** (norme IF: trascrizione in `aria-live`, riga
  di stato leggibile dagli screen reader, alt-text se mai arriveranno immagini)
  ✅ — coerente con la cura PDF/UA che Simone ha già
  ([intfiction: accessible IF](https://intfiction.org/t/accessible-interactive-fiction/61668)).
- **Testo temporizzato / immagine per stanza** (Twine/Adventuron) ⚖️ —
  presentazione opzionale nell'export; valore estetico, non strutturale.

---

## Scartate, e perché

Raggruppate per paletto violato. Non sono «cattive idee»: sono buone idee *per
altri progetti*, incompatibili con l'identità di FAVELLA.

- **Internazionalizzazione / multilingua** (Alan, Monogatari, Yarn, quasi tutti) →
  **paletto 1**. L'italiano *è* il codice.
- **Template / ereditarietà di entità, *kinds*, quantità e plurali automatici**
  (Inform *kinds*, TADS *object templates*) → **paletto 5**. Già bocciati da
  FAVELLA stessa (Temi 5a/5b, NO-GO) in nome della semplicità.
- **Scelte / menu / drag-drop come *default*** (Twine macro, Texture drag,
  ChoiceScript `*choice`, Squiffy, Quest ibrido, *menu di storylet offerti*) →
  **paletto 6**. Il parser è il modo primario; i pulsanti-verbo bastano come
  alternativa.
- **Backend / compilazione esterni, logica Prolog, Z-code/Å-machine, comandi verso
  codice host** (Dialog, Hugo target, Yarn `<<command>>`) → **paletto 3**. Motore
  proprio.
- **Grammatica estendibile all'infinito / *Understand* ridefinibile / sinonimia
  illimitata** (Inform) → **paletto 2**. FAVELLA ha già alias e sinonimi
  **chiusi** e 0-ambigui; aprirli romperebbe l'invariante LALR(1).
- **LLM a runtime** (AI Dungeon-like, STORY2GAME, LLM-as-parser) → **paletti 2, 3,
  7** + determinismo + offline del file unico. (L'assistenza LLM *in scrittura* è
  già ciò che Simone fa con Claude; non è una feature del linguaggio.)
- **Narrazione variabile alla Curveship** (tempo/persona/focalizzazione) → costo e
  rischio sproporzionati; solo nota di ricerca.
- **Prosa mutevole sul posto** (Windrift) → contro il modello a trascrizione/parser;
  `[se]…[fine]` copre già la ri-resa condizionale.
- **Screen language / ATL / sprite** (Ren'Py, Monogatari) → contro l'identità
  testuale. (Salvataggi e rollback che Ren'Py vende come punti forti FAVELLA li ha
  **già**: SALVA/CARICA, ANNULLA/ANCORA.)
- **Carte tipo HyperCard** (Decker), **stanze pixel** (Bitsy), **VN web**
  (Monogatari), **layer su Undum** (Raconteur), **ipertesto Markdown** (Fractive,
  Squiffy) → altro medium o idee già presenti con più forza altrove.
- **Alan / Hugo / GameFic** → nessuna idea distintiva non già coperta.
- **«Strand»** → non identificato come engine IF notevole (vedi scheda); da
  ripassare col nome esatto se la sessione madre aveva un progetto preciso.

---

## Resoconto finale — le idee che consiglierei davvero

Premessa onesta: **FAVELLA è già un motore maturo e insolitamente completo.** Lo
scouting globale non ha trovato pilastri mancanti (la sola frontiera grande,
le *relazioni di prima classe*, è già in lavorazione nell'altra sessione). Quello
che ho trovato sono **raffinamenti**, non rivoluzioni — e questo è di per sé un
risultato da riferire.

Le tre che catturerei per prime, in ordine:

1. **Scene / tempo drammaturgico nominato** (da Inform 7). L'unica aggiunta
   *organizzatrice* grande e compatibile: dà un'unità di tempo narrativo con nome,
   `durante`, memoria e ganci inizio/fine. Raccoglie in un concetto leggibile la
   drammaturgia che oggi si monta a mano. *Rischio medio* (va progettata per non
   duplicare demoni e stati calcolati).

2. **Testo vivo inline a conteggio visite** (da Ink). Massima resa narrativa per
   minimo costo: frammenti che cambiano a metà frase, con *ciclo* e
   *una-volta-sola*. Si innesta sulla macchina di `[se]…[fine]` già esistente.
   *Rischio basso.*

3. **«Forse intendevi…»: recupero gentile del parser** (sintesi TADS + anti-LLM,
   tutto locale e deterministico). Colpisce attriti già documentati sul campo,
   nello spirito «integrare, non aggirare». *Rischio basso.*

Due da tenere pronte se c'è appetito, con più cautela:

4. **Tabelle di dati minime in sola lettura** (Inform/Decker) — utile per
   contenuti data-driven, ma solo in forma minima per non tradire la semplicità.
5. **Procedure/macro riutilizzabili** (tunnel di Ink) — contro la ripetizione
   d'autore, ma da tenere *piatte* per non diventare «programmazione».

E un avvertimento di metodo: il **tie-break per salienza fra eventi** (famiglia
QBN/SBN) non va deciso qui ma **insieme** alla frontiera relazioni, perché le due
cose si toccano.

---

### Fonti principali

- Emily Short — [Beyond Branching: Quality-Based, Salience-Based, and Waypoint Narrative Structures](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/) · [Storylets: You Want Them](https://emshort.blog/2019/11/29/storylets-you-want-them/)
- Max Kreminski — [Sketching a Map of the Storylets Design Space (ICIDS 2018)](https://mkremins.github.io/publications/Storylets_SketchingAMap.pdf)
- Inform 7 — [indice del manuale](https://eblong.com/zarf/i7index/index.html) · [Handbook cap. 8 (Scenes)](https://inform-7-handbook.readthedocs.io/en/v2.0/chapter_8_time_%26_scenes/scenes/) · [Writing with Inform §16.1 (Tables)](https://ganelson.github.io/inform-website/book/WI_16_1.html)
- inkle — [Writing with ink (documentazione)](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md) · [ink version 1](https://www.inklestudios.com/2021/02/22/ink-version-1.html)
- Choice of Games — [Important ChoiceScript Commands and Techniques (fairmath)](https://choiceofgames.com/make-your-own-games/important-choicescript-commands-and-techniques)
- Dialog — [documentazione ufficiale (intro)](https://linusakesson.net/dialog/docs/intro.html)
- TADS — [Overview: The Language](https://tads.org/ov_lang.htm) · [IFWiki: T3](https://www.ifwiki.org/T3)
- Alan — [alan3 review](https://notimetoplay.org/engines/alan3-review.html) · Hugo — [IFWiki](https://www.ifwiki.org/Hugo)
- ADRIFT — [IFWiki](https://www.ifwiki.org/ADRIFT) · Adventuron — [IFWiki](https://www.ifwiki.org/Adventuron)
- Twine — [Cookbook: story formats](https://twinery.org/cookbook/introduction/story_formats.html)
- Yarn Spinner — [docs (commands & functions)](https://docs.yarnspinner.dev/2.4/using-yarnspinner-with-unity/creating-commands-functions)
- Ren'Py — [Wikipedia](https://en.wikipedia.org/wiki/Ren%27Py) · Monogatari — [itch.io](https://hyuchia.itch.io/monogatari)
- Gruescript — [devlog](https://versificator.itch.io/gruescript/devlog/284374/gruescript-is-now-in-open-beta-release) · [IFWiki](https://www.ifwiki.org/Gruescript) · Texture — [review](https://notimetoplay.org/engines/texture-review.html) · Squiffy — [IFWiki](https://ifwiki.org/Squiffy)
- Windrift — [GitHub](https://github.com/lizadaly/windrift) · Elm Narrative Engine — [annuncio 5.0](https://intfiction.org/t/announcing-elm-narrative-engine-version-5-0-release/44152) · Curveship — [Montfort, FDG 2011](https://www.nickm.com/if/montfort_fdg_2011.pdf) · GameFic — [SDK](https://www.rubydoc.info/gems/gamefic-sdk/2.3.3)
- Decker — [nota](https://publish.obsidian.md/taniynquest/05+The+Garden/Video+Game+Creation+Resources/Decker) · Bitsy — [overview](https://make.bitsy.org/docs/introduction/overview/index.html)
- Approcci LLM — [STORY2GAME](https://www.emergentmind.com/papers/2505.03547) · [LPLH (arXiv 2505.12439)](https://arxiv.org/pdf/2505.12439) · [GenQuest (arXiv 2510.04498)](https://arxiv.org/abs/2510.04498) · [LLM-as-parser (forum)](https://intfiction.org/t/old-time-text-adventure-powered-by-a-llm/76617)
- Accessibilità IF — [intfiction: accessible IF](https://intfiction.org/t/accessible-interactive-fiction/61668)
- Strumenti italiani — [IF Italia](https://simonezanella.it/ifitalia/scrivereif.htm) · [Roberto Grassi — strumenti](https://www.robertograssi.net/narrativainterattiva/strumenti)

> *Documento di scouting prodotto il 2026-10-24 da una sessione di ricerca
> dedicata. Non modifica il motore; è materiale di decisione per la sessione
> madre. L'integrazione delle idee è una scelta separata.*

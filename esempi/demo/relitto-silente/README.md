# Il Relitto Silente — demo ufficiale di FAVELLA 1

> Porting in linguaggio `.fav` dell'avventura testuale **«Il Relitto Silente»** di
> Simone (Pitz72). Pensata come vetrina **esaustiva** del motore FAVELLA 1
> (v0.17.0): esercita ogni primitiva del linguaggio, dai Livelli 1 agli 8.

Sei il pilota solitario della nave da carico **Santa Maria**. Intercetti
un'anomalia alla deriva: un'antica nave stellare aliena, silenziosa e morta. La
bordi, ne esplori le 15 stanze, raccogli tre artefatti-chiave — il **Seme
Vivente**, la **Stele del Ricordo**, il **Nucleo di Memoria** — ripristini
l'energia, apri la Grande Porta, raggiungi il Santuario e parli con l'**Anziano**.
Scoprirai chi erano i K'tharr, e chi sei tu.

## Come si gioca

```bash
python gioco.py esempi/demo/relitto-silente/relitto.fav
```

Comandi base: direzioni (`nord/sud/est/ovest` + quelle custom mostrate da
`Uscite:`), `esamina`, `prendi`, `apri`, `usa X su Y`, `inventario`, `guarda`,
`esci`. Verbi speciali della demo: **`analizza`** (scanner), **`traduci`**
(legge i testi alieni, tanto più quanto è avanzata la matrice), **`sintonizza`**
(ascolta gli echi col Sintonizzatore), **`incidi`** (lascia un tuo segno),
**`tocca`**, **`indossa`**, **`parla con l'anziano`**.

## Struttura modulare

| File | Contenuto | Primitive in vetrina |
|------|-----------|----------------------|
| `relitto.fav` | Orchestratore: stati, contatori, direzioni, topologia, eventi, **demoni** | Livelli 1, 3, 4, 6, 8 |
| `stanze.fav` | Le 15 stanze con **descrizioni condizionali** | Stanze, descrizioni a stato [L5] |
| `oggetti.fav` | Oggetti, **alias**, **contenitore** (kit), **proprietà opposte**, verbi custom | L1, L3, L4 |
| `regole.fav` | Gating del movimento, catena enigmi, `incidi`/`tocca`/`analizza` | Regole `Invece di`, condizioni AND/OR/NOT, due oggetti, conseguenze |
| `traduci.fav` | Matrice di traduzione 0→100% con letture a **soglie** (18/75/100) | Contatore, condizioni composte, interpolazione `[var]` |
| `echi.fav` | Il Sintonizzatore: 11 echi di superficie + 4 profondi | Stati, contatori, condizioni multiple, ordine |
| `dialoghi.fav` | L'Anziano: monologo ramificato → epilogo → `vinci` | NPC e dialoghi [L5b] |

## Mappa (15 stanze)

```
              Plancia ──O── Stiva
                              │ fuori
                           Scafo Esterno
                              │ varco (taglia la crepa)
                        Camera di Compensazione
                              │ soglia (alimenta il pannello)
  Santuario ──── Corridoio Principale ──laterale── Alloggi
   del Silenzio    │ N    │ S    │ basso   └ portale (3 chiavi) ── Ponte
      │ O          │      │      Laboratori                          │ avanti
  Scriptorium   (hub)  Serra Morente                            Anticamera
      │ N                 │ O                                        │ oltre
  Arca Memoria        Arca Biologica                          Santuario Centrale
```

Le direzioni di transito gated/a senso unico (`fuori`, `varco`, `soglia`,
`portale`, `avanti`, `oltre`) sono **uniche per stanza d'origine**: così le
regole `Invece di vai X` non sono mai ambigue.

## Catena degli enigmi (spoiler)

1. **Stiva** — `apri kit` → prendi taglierina + batteria; `prendi tuta`, `indossa tuta`.
2. **Scafo** — `usa taglierina su crepa`, poi `varco` per entrare.
3. **Camera** — `usa batteria su pannello`, `apri porta interna`, poi `soglia`.
4. **Tre chiavi** (dall'hub):
   - *Seme* (Serra): `prendi tavoletta` → `usa tavoletta su teca` → `prendi seme vivente`.
   - *Stele* (Scriptorium→Santuario): `prendi disco` → `usa disco su altare` → `prendi stele`.
   - *Nucleo* (Arca Memoria): `usa taglierina su terminale` → `prendi nucleo`.
5. **Energia** (Arca Biologica→Laboratori): `prendi dispositivo medico` e `prendi cristallo` → `usa dispositivo medico su cristallo` → `prendi sintonizzatore` → `usa cristallo su generatore`.
6. **Grande Porta**: `usa seme vivente su grande porta`, `usa stele su grande porta`, `usa nucleo su grande porta` (un demone apre alla terza).
7. **Ponte**: `usa postazione` → `analizza mappa stellare` → `tocca le punte` → `avanti`.
8. **Santuario**: `oltre`, poi `parla con l'anziano` e scegli fino all'epilogo.

La matrice di traduzione (`analizza` di lastra/cilindro/stele/nucleo: 4/18/75/100%)
e gli echi del Sintonizzatore sono **opzionali** ma arricchiscono enormemente la
lettura: prova a `traduci` i bassorilievi o a `sintonizza` gli oggetti silenziosi
a diversi livelli di traduzione.

## Note tecniche (per chi studia il sorgente)

- **Direzioni per il gating**: una direzione usata in una regola `Invece di vai`
  deve esistere in una sola stanza, perché non c'è una condizione «se il
  giocatore è nella stanza X».
- **Regole a due oggetti** (`usa X su Y`): nel motore v0.17.0 la clausola `se`
  non viene valutata per queste regole (vince la prima dichiarata). Perciò ogni
  combinazione è **una sola** regola di successo; le guardie condizionali le
  fanno le regole a **un** oggetto (`prendi`/`apri`/`vai`), dove il `se`
  funziona. L'idempotenza è garantita dal consumo dell'oggetto o dallo stato.
- **Echi delle stanze sigillate**: plancia, stiva e camera restano alle spalle
  del giocatore; i loro echi vengono catturati **retroattivamente** in un colpo
  solo `sintonizza`ndo le pareti del Corridoio.

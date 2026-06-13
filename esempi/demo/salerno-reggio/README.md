# Salerno-Reggio Calabria — un simulatore di guida testuale

> Una demo *fuori dagli schemi* per **FAVELLA 1** (motore v0.19.0).
> Dimostra che il linguaggio regge un genere che, a prima vista, «non è da Favella».
>
> **Nota storica.** Questa demo è nata come *stress-test di genere*: provare a
> costruire qualcosa per cui Favella «non è fatta». I punti d'attrito incontrati
> sono diventati tre primitive del linguaggio nella **v0.19.0** — verbi
> intransitivi, inventario iniziale, «tick» silenziosi — e la demo è poi stata
> riscritta in forma pienamente idiomatica. La sfida ha migliorato il motore.

## L'idea

Non un'avventura nel senso classico, ma un **viaggio in macchina** lungo la
vecchia A3, dal casello di Salerno fino allo Stretto di Reggio. Si guida
`avanti` di tratto in tratto; ogni tratto si racconta. Ma la strada è anche un
**nastro di memoria**: con la musicassetta puoi riavvolgere il tempo e rivivere
lo stesso luogo nell'infanzia, sul sedile di dietro, con papà alla guida.

Due epoche sovrapposte sullo stesso asfalto — è il cuore emotivo, e il cuore
tecnico, della demo.

## Come si gioca

```
python gioco.py esempi/demo/salerno-reggio/salerno-reggio.fav
```

**Scopo:** arrivare a Reggio prima che finisca la benzina o ti chiuda gli occhi
la stanchezza.

| Comando | Effetto |
|---|---|
| `avanti` / `indietro` | guidi al tratto successivo / precedente |
| `ricorda` | **riavvolgi il tempo**: salti tra *oggi* (2021) e *infanzia* |
| `guarda` | rivedi il tratto (nell'epoca corrente) |
| `accelera` / `rallenta` | il piede sull'acceleratore (atmosfera; ogni gesto è un turno) |
| `accosta` | tiri il fiato in piazzola: scarichi la stanchezza |
| `fai benzina` | fai il pieno (solo all'autogrill di Lagonegro) |
| `esamina lo specchietto` | chi guida, e in che tempo |
| `inventario`, `aiuto` | comandi di servizio |

Dopo aver dato `ricorda`, fai `guarda` per rivedere il tratto nell'altra epoca.

## Perché è interessante (note di design)

Il modello profondo di Favella — *«ci si sposta tra luoghi; ogni luogo si
racconta secondo lo stato del mondo»* — è **isomorfo a un viaggio in strada**.
Una strada è solo un grafo di luoghi percorso quasi linearmente. Il motore non
distingue tra un labirinto e un'autostrada: cambia la *forma* del grafo, non il
motore.

I salti d'epoca **non sono un trucco da costruire**: sono il meccanismo nativo
delle *descrizioni condizionali* + uno *stato*, usato per quello che sa già fare.

Costrutti del linguaggio esercitati:

- **Direzioni custom** (`avanti`/`indietro`) per modellare la strada.
- **Stato** `epoca` + **descrizioni condizionali** `… se l'epoca è infanzia …`
  → lo stesso luogo, due tempi. *(È il cuore.)*
- **Contatori con valore iniziale** (`carburante`, `stanchezza`) come risorse.
- **Verbi intransitivi** [0.19.0/A7] (`ricorda`, `accelera`, `accosta`, e il
  multi-parola `fai benzina`): i gesti di guida sono comandi nudi, regole
  **globali** condizionali sullo stato o sulla **posizione** (`se il giocatore è
  in lo svincolo di Lagonegro`).
- **Inventario iniziale** [0.19.0/A8]: `Il giocatore ha lo specchietto.`.
- **Tick silenziosi** [0.19.0/A9]: il consumo di benzina/stanchezza muta lo
  stato senza stampare nulla (`Ogni 3 turni: diminuisci il carburante.`).
- **Demoni** (spia benzina; sconfitta per benzina/sonno; **vittoria** all'arrivo
  via `Quando il giocatore è in lo Stretto di Reggio`).

### Come questa demo ha migliorato il linguaggio (v0.19.0)

La **prima** versione di questa demo (sul motore 0.18.0) dovette aggirare tre
limiti: i gesti di guida furono piegati su oggetti-pretesto (`usa la
musicassetta` per «ricordare»), l'inventario iniziale fu caricato con un evento
`Al turno 1`, e ogni consumo di risorsa dovette portarsi dietro una riga di
testo. Quei tre attriti sono diventati altrettante primitive:

| Attrito (0.18.0) | Primitiva (0.19.0) |
|---|---|
| Verbi custom solo transitivi | **A7** `"accelera" è un comando senza oggetto.` |
| Niente inventario iniziale dichiarativo | **A8** `Il giocatore ha lo specchietto.` |
| `dire` obbligatorio in eventi/demoni | **A9** `Ogni 3 turni: diminuisci il carburante.` |

## File

| File | Contenuto |
|---|---|
| `salerno-reggio.fav` | orchestratore: stato, risorse, strada, inventario iniziale, tick, demoni, `Includi` |
| `strada.fav` | i sei tratti, ciascuno con le sue due epoche |
| `oggetti.fav` | l'unico oggetto: lo specchietto |
| `guida.fav` | le regole dei gesti di guida (verbi intransitivi) |

## Come estenderla

Il modo giusto di crescere (consiglio per chi parte): **prima la spina dorsale a
una sola epoca** (più tratti reali + i gesti di guida), e *solo dopo* lo strato
delle epoche sui tratti che contano davvero. Non tutta la strada in tutte le
epoche — gli affioramenti di memoria là dove pesano. Idee: il meteo come stato
(nebbia in Appennino), un autostop, la radio che cambia canzone, lo Stretto in
traghetto come finale alternativo.

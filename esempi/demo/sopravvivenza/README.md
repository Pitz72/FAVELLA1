# La Notte Lunga — un gioco di sopravvivenza

> Stress-test di genere per **FAVELLA 1** (motore v0.29.0).
> Un genere lontano dall'avventura testuale classica: niente enigma da
> risolvere, solo **risorse che si svuotano** e un orologio che corre.

## L'idea

Sei nel bosco al tramonto. Devi arrivare all'**alba** (turno 14) vivo,
gestendo quattro risorse vitali — **fame, sete, caldo, salute** — mentre il
freddo della notte ti aggredisce. Accendi un fuoco, trova riparo, mangia, bevi.
Le mani portano solo **3 oggetti**: ogni viaggio al boschetto o al ruscello è
una scelta su cosa sacrificare. La morte è **definitiva**.

## Come si gioca

```
python gioco.py esempi/demo/sopravvivenza/la-notte-lunga.fav
```

| Comando | Effetto |
|---|---|
| `nord`/`sud`/`est`/`ovest` | muoversi (boschetto · grotta · ruscello) |
| `prendi X` / `lascia X` | raccogliere / posare (max 3 in mano) |
| `mangia le bacche` / `bevi l'acqua` | azzerare fame / sete (consuma l'oggetto) |
| `usa la pietra focaia su la legna` | **accendere il fuoco** (brucia la legna) |
| `esamina X`, `inventario`, `guarda` | servizio |

**La ricetta della sopravvivenza:** raccogli legna + pietra focaia, accendi il
fuoco (ti scalda per tutta la notte), tieni a portata bacche e acqua. La grotta
ripara dal freddo ma è **buia**: per prendere la coperta serve la torcia — e la
torcia occupa una delle tre mani.

Tre esiti verificati: vittoria con gioco competente, **morte per assideramento
se resti immobile**, e la coperta nella grotta irraggiungibile senza torcia.

## Cosa esercita (e dove tiene)

- **Risorse multiple con permadeath**: quattro contatori, demoni di danno a
  soglia, `perdi` con epilogo. Il modello regge benissimo: è il pane dei demoni.
- **Inventario a capacità** (Livello 7): `Il giocatore può portare 3 oggetti.`
  trasforma la raccolta in dilemma. Funziona esattamente come promesso.
- **Buio statico + luce portata** (A4): la grotta `è buia`, la `torcia illumina`.
  Pulito e immediato.
- **Crafting come consumo**: `usa X su Y` che *brucia* un ingrediente è naturale.

## Dove si piega — attrito → primitiva mancante

| # | Attrito incontrato | Workaround usato nella demo | Primitiva che lo sbloccherebbe |
|---|---|---|---|
| S1 | **Il buio non è dinamico.** Il giorno/notte vorrebbe spegnere la luce delle stanze al tramonto, ma `è buia` è una proprietà **statica**: una conseguenza `e adesso la radura è buia` è **rifiutata** (le conseguenze agiscono su oggetti, non su stanze). | Buio del cielo modellato con lo stato `momento` + descrizioni condizionali; il buio «vero» del motore resta confinato alla grotta. | Proprietà di stanza mutabili a runtime: `e adesso la radura diventa buia` / un `momento` globale che il motore lega alla luce. |
| S2 | **Il crafting non può creare oggetti nuovi.** `usa X su Y` sposta oggetti **già esistenti**; non può far nascere un oggetto che prima non c'era. Combinare due bastoni in *una torcia nuova* non è esprimibile. | Il fuoco è uno **stato** (`acceso`/`spento`), non un oggetto creato; gli oggetti craftabili andrebbero pre-collocati «nel nulla» e poi rivelati. | Una conseguenza di **creazione**: `e adesso crea una torcia in inventario.`. |
| S3 | **I contatori non hanno pavimento né tetto.** Il `caldo` scende sotto zero; nessun modo per dichiarare un intervallo `0..10`. | Confronti `al massimo 0` per il danno; il valore può andare negativo senza conseguenze visibili. | Contatori con limiti dichiarati: `Il caldo va da 0 a 10.`. |
| S4 | **I contatori non si parlano** (stesso limite di D2/D3 della guida). Vorrei che il danno da freddo crescesse *quanto* il caldo è sotto zero, o che la sete consumasse la salute in proporzione. | Danno fisso di 1 a ogni soglia. | Contatore come operando: `diminuisci la salute di [freddo]`. |
| S5 | **`dire` obbligatorio nelle regole** (stesso limite di D7). `mangia`/`bevi`/crafting devono sempre «dire» qualcosa, anche quando l'effetto sarebbe muto. | Una battuta per ogni regola (qui va bene narrativamente). | `dire` opzionale nelle regole con ≥1 conseguenza (simmetria con i tick A9). |
| S6 | **Niente quantità/scorte.** «3 razioni d'acqua» non è un numero su un oggetto: ogni razione sarebbe un oggetto separato. | Un solo oggetto `acqua` che, bevuto, sparisce. | Oggetti con quantità: `Il giocatore ha 3 razioni d'acqua.` + `consuma una razione`. |

### Lettura d'insieme

**S1** (buio dinamico) è il limite più caratteristico di questo genere: il
ciclo giorno/notte è il battito di un survival, e il motore lega la luce solo a
proprietà statiche. **S2** (creazione di oggetti) è l'altra metà del crafting.
**S4** è — di nuovo — la lacuna «i contatori sono celle isolate» già vista nella
guida e che rivedremo nel GDR. Tutto **cassetto B**: vedi
[`documentazione/espansione-oltre-0.29.md`](../../../documentazione/espansione-oltre-0.29.md).

## File

| File | Contenuto |
|---|---|
| `la-notte-lunga.fav` | tutto: risorse, bosco (con grotta buia), oggetti, nutrirsi/dissetarsi, crafting del fuoco, ciclo del giorno, freddo, danno e permadeath, alba |

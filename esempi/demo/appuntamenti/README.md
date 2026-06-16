# Cuori al Caffè — un simulatore di appuntamenti

> Stress-test di genere per **FAVELLA 1** (motore v0.29.0).
> Il genere che — come previsto — colpisce più duramente il punto debole di
> FAVELLA: lo **stato-per-personaggio** e l'impossibilità di confrontare due
> grandezze fra loro.

## L'idea

Una serata al caffè, due persone da conquistare: **Anna** (libraia schiva) e
**Bea** (alpinista solare). Ognuna ha un'**affinità** che sale parlando dei
suoi argomenti e — soprattutto — col **regalo giusto**. Porta l'affinità di una
delle due a 4 e falla dire di sì prima della chiusura (turno 18). Ma il caffè è
piccolo: corteggiarle **entrambe** ti fa beccare, e allora due di picche da
tutte e due.

## Come si gioca

```
python gioco.py esempi/demo/appuntamenti/cuori-al-caffe.fav
```

| Comando | Effetto |
|---|---|
| `parla con Anna` / `parla con Bea` | apri il dialogo (scelte numerate) |
| `usa il romanzo su Anna` | **fai un regalo** (giusto = grande slancio; consuma l'oggetto) |
| `prendi X`, `esamina X` | servizio |

**La strategia:** dai il regalo *giusto* (il romanzo ad Anna, la piccozza a
Bea), assecondala nei dialoghi per arrivare ad affinità 4, e **non** fare la
corte all'altra. Esiti verificati: appuntamento con Anna, due di picche per
doppio gioco, sconfitta alla chiusura.

## Cosa esercita (e dove tiene)

- **Affinità per personaggio**: un contatore con nome composto (`L'affinità di
  Anna è un contatore.`) funziona benissimo, anche interpolato dal vivo nel
  dialogo (`(Affinità: [affinità di Anna])`).
- **Dialoghi a opzioni gated**: `l'opzione "Usciamo?" se l'affinità di Anna è
  almeno 4 … conduce al nodo "anna_si"` — l'opzione appare solo quando te la sei
  guadagnata. Il sistema di dialogo della v0.11.0 regge un dating sim di slancio.
- **Scelte che muovono la relazione**: `conduce al nodo … e adesso aumenta
  l'affinità` — ogni battuta giusta pesa.
- **Agenda**: `Al turno 18: … perdi` chiude la serata.

## Dove si piega — attrito → primitiva mancante

| # | Attrito incontrato | Workaround usato nella demo | Primitiva che lo sbloccherebbe |
|---|---|---|---|
| A1 | **⭐ Niente confronto fra grandezze.** La gelosia *vera* sarebbe «si ingelosisce chi dei due hai trascurato di più»: `se l'affinità di Bea è più di l'affinità di Anna`. **Non esiste**: i contatori si confrontano solo con numeri letterali. | Rilevo solo il caso grezzo «corteggiate entrambe» con due **soglie fisse in AND** (`è almeno 2 e … è almeno 2`). Molto più rozzo del dovuto. | Confronto grandezza↔grandezza: `se l'affinità di Bea è più di l'affinità di Anna`. |
| A2 | **Niente assegnazione stato↔stato.** Non posso «ricordare la persona preferita» copiando un valore: `il corteggiato diventa il nome di Anna`. (Già emerso col tester reale Pietro.) | Stato-bandiera `doppiogioco` impostato a mano. | Assegnazione indiretta: `e adesso il corteggiato diventa [chi-ha-l-affinità-più-alta]`. |
| A3 | **La battuta di un nodo non ha varianti `se`.** `… al nodo "x" dice "…" se [cond]` è **rifiutato** (a differenza delle descrizioni di oggetti/stanze, che le hanno). | Sdoppio l'**opzione**: stessa etichetta, due condizioni, due nodi-destinazione (`anna_si` vs `anna_no`). | `dice "…" se [cond]` sui nodi di dialogo (parità con le descrizioni condizionali). |
| A4 | **Nessun «modello di personaggio».** Ogni personaggio = un blocco di righe ricopiate (affinità, dialogo, regali). Una terza persona raddoppia il codice. | Copia-incolla disciplinato di Anna→Bea. | Un costrutto di template/collezione: `Ogni pretendente ha un'affinità.` o parametrizzazione. |
| A5 | **Niente «nodo già visitato».** Non posso impedire di rifare due volte lo stesso argomento per spremere affinità. | Affinità sale poco per battuta; il limite di tempo fa da freno. | Flag automatico di visita per nodo, o `una volta sola`. |

### Lettura d'insieme

**A1** è la conferma sul campo della previsione: il dating sim *vive* di
affinità **relative** (preferenze, gelosie, triangoli), e FAVELLA sa solo
confrontare con costanti. È **lo stesso identico limite** di D2/D3 (guida) e S4
(sopravvivenza) — «i contatori sono celle isolate» — ma qui fa più male perché è
il cuore del genere. **A2** (assegnazione stato↔stato) è la sua faccia gemella,
già segnalata dal tester reale Pietro. **A3** e **A4** sono specifici del genere
sociale. Tutto **cassetto B**: vedi
[`documentazione/espansione-oltre-0.29.md`](../../../documentazione/espansione-oltre-0.29.md).

## File

| File | Contenuto |
|---|---|
| `cuori-al-caffe.fav` | tutto: affinità, caffè, personaggi, regali giusti/sbagliati, due alberi di dialogo gated, gelosia (doppiogioco), agenda |

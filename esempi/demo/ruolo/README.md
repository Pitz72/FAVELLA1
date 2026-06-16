# La Cripta del Lich — un piccolo gioco di ruolo

> Stress-test di genere per **FAVELLA 1** (motore v0.29.0).
> Il banco di prova più severo, e il più rivelatore: **statistiche, mercante,
> combattimento a turni, crescita di livello**. È qui che FAVELLA scricchiola di
> più — ed è quindi qui che si vede meglio la più piccola aggiunta che la
> sbloccherebbe.

## L'idea

Un ciclo da GDR in miniatura, ma completo: **compra** la spada dal mercante
Gorbal → **abbatti** il troll nella cripta → l'esperienza ti fa **salire di
livello** → col vigore nuovo affronti il **Lich** nella sala → prendi la
**Corona**. Senza la spada e senza il livello, il Lich ti fa a pezzi:
l'economia e la crescita non sono decorazione, sono *la strategia*.

## Come si gioca

```
python gioco.py esempi/demo/ruolo/la-cripta-del-lich.fav
```

| Comando | Effetto |
|---|---|
| `scheda` | mostra Vita · Forza · Oro · Esperienza · Livello |
| `parla con Gorbal` | apri la bottega (compra/vendi: scelte numerate) |
| `attacca il troll` / `attacca il lich` | colpisci (con la spada fai più danno) |
| `bevi la pozione` | curi 6 punti vita |
| `nord`/`sud`, `prendi X`, `esamina X` | esplorazione |

Esiti verificati end-to-end: **vittoria** col ciclo completo (spada → troll →
livello 2 → lich → corona), **morte** se affronti il Lich a mani nude e senza
livello, e il collaudo statico conferma la catena di vittoria.

## Cosa esercita (e dove tiene)

- **Statistiche e progressione**: contatori per vita/forza/oro/XP/livello;
  `Quando l'esperienza è almeno 10: …` come fronte di salita è *esattamente* la
  primitiva giusta per il level-up. Regge benissimo.
- **Economia via dialogo**: l'acquisto è un'opzione gated su `se l'oro è almeno
  6 e il giocatore non ha la spada`, con conseguenza `diminuisci l'oro … e
  adesso la spada è in inventario`. Vendere è il movimento inverso. Pulito e
  idiomatico.
- **Combattimento «a presenza»**: il nemico colpisce con un demone `Ogni turno
  se il giocatore è in la sala e la vita del lich è più di 0: …`. Fuggire a sud
  ti sottrae ai colpi — la ritirata tattica emerge gratis dal modello.
- **Morte overshoot-safe**: `Quando la vita del lich è al massimo 0` (≤) regge
  il danno che «sfonda» lo zero, dove `è 0` (=) fallirebbe. *Lezione idiomatica.*

## Dove si piega — attrito → primitiva mancante

Questo è il genere che produce la lista più lunga. È un bene: concentra in un
posto solo quasi tutti i limiti emersi negli altri tre stress-test.

| # | Attrito incontrato | Workaround usato nella demo | Primitiva che lo sbloccherebbe |
|---|---|---|---|
| R1 | **⭐ Niente casualità d'autore.** Un combattimento senza dadi non è un combattimento: nessun colpo critico, nessun mancato, nessuna varianza. | Danno **fisso**. | Estrazione casuale seedata: `diminuisci la vita del lich di un numero fra 2 e 6.` (riuso l'RNG riproducibile di A2/0.22.0). |
| R2 | **⭐ Il danno non scala con la statistica** (e i contatori non fanno aritmetica fra loro). Vorrei `diminuisci la vita del lich di [forza]`. Non esiste: `di N` è una costante. La `forza` è un numero che mostro nella scheda ma che **non guida il colpo**. | La «spada che potenzia l'attacco» è simulata con **due regole a danno fisso** scelte dalla presenza dell'arma. La crescita di `forza` al level-up è puramente cosmetica. | Contatore come operando: `diminuisci la vita del lich di [forza]`. |
| R3 | **I contatori si confrontano solo con numeri letterali.** `se la vita del troll è meno di la mia vita` è impossibile. | Soglie fisse. | Confronto grandezza↔grandezza. |
| R4 | **Soglie di livello fisse, scritte a mano.** Niente «ogni 10 XP»: ogni livello è un demone separato con la sua costante. | Un `Quando l'esperienza è almeno N` per livello (10, 30, …). | Soglie ricorrenti, o aritmetica sul «prossimo livello». |
| R5 | **Nessun modello di mostro/personaggio.** Ogni nemico = un blocco di contatori e regole ricopiato. Dieci goblin = dieci copie. | Troll e Lich scritti a mano, separati. | Template/istanze: `Un goblin è un nemico con vita 4 e danno 1.`. |
| R6 | **Niente quantità/scorte.** «3 pozioni» non è un numero: la pozione è un singolo oggetto, ricomprabile solo dopo averlo bevuto. | Un solo oggetto `pozione`, gating `se … non ha la pozione`. | Oggetti con quantità: `Il giocatore ha 3 pozioni.` + `consuma una pozione`. |
| R7 | **Prezzi costanti.** Nessun prezzo variabile o calcolato (`vale [x] oro`): i prezzi sono numeri cablati nelle frasi del dialogo. | Prezzi fissi nelle opzioni di Gorbal. | Prezzi come espressione/contatore. |
| R8 | **⭐ Robustezza: un carattere fuori da Windows-1252 nel testo stampato fa CRASHARE il gioco** con un traceback fatale sulla console Windows (scoperto con `★` e `─` nei messaggi). La logica era corretta: a cadere è solo la stampa. | Sostituiti i caratteri «fantasia» con ASCII (`>>`, `===`). | **Cassetto A (diagnostica/robustezza):** la stampa dovrebbe degradare con `errors="replace"` invece di terminare il gioco. Riguarda OGNI storia, non solo questa. |

### Lettura d'insieme

**R1** (casualità) e **R2** (aritmetica/scaling) sono i due assi su cui si regge
*qualunque* sistema di gioco numerico, e FAVELLA non ha né l'uno né l'altro: il
danno non può variare né dipendere da una statistica. **R2/R3** sono — ancora —
la lacuna «i contatori sono celle isolate» vista in TUTTI e quattro gli
stress-test (D2/D3 guida, S4 sopravvivenza, A1 appuntamenti): è il limite
strutturale numero uno del linguaggio. **R5/R6** (template, quantità) sono di
scala. **R8** è un debito di **robustezza** trasversale e ad alto valore: vedi
[`debiti-motore-da-integrare`] in memoria. Tutto raccolto e ragionato in
[`documentazione/espansione-oltre-0.29.md`](../../../documentazione/espansione-oltre-0.29.md).

## File

| File | Contenuto |
|---|---|
| `la-cripta-del-lich.fav` | scheda eroe, mondo, nemici, combattimento, cura, morte nemici, level-up, esiti, `scheda` |
| `bottega.fav` | il banco di Gorbal: compra/vendi via dialogo (incluso dal file principale) |

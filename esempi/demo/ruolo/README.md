# La Cripta del Lich — un piccolo gioco di ruolo

> Stress-test di genere per **FAVELLA 1** (nato sul motore v0.29.0; il
> combattimento è stato aggiornato a **v0.31.0** per usare il danno «di [forza]»).
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
| `attacca il troll` / `attacca il lich` | colpisci **«di [forza]»** (a mani nude) o **«di [forza] + 2»** (con la spada): il danno scala con la statistica (v0.31.0) |
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
| R1 | **⭐ Casualità d'autore — ✅ estrazione numerica risolta (v0.31.0).** Un combattimento senza dadi non è un combattimento. Ora l'estrazione numerica seedata esiste: `diminuisci la vita del lich di un numero fra 2 e 6.` (riusa l'RNG riproducibile e ANNULLA-safe di A2/0.22.0). Restano per dopo `diventa uno fra X, Y, Z` e `càpita (1 su N)`. | (storico) danno fisso. | ✅ `un numero fra A e B` come operando. |
| R2 | **⭐ Il danno non scala con la statistica — ✅ RISOLTO (v0.31.0, Tema 1a).** Ora `diminuisci la vita del lich di [forza]` esiste: il contatore è un **operando**. Nella demo le mani nude fanno `di [forza]`, la spada `di [forza] + 2`: al livello 1 i numeri sono identici a prima, ma ora salire di livello (forza ↑) **rende il colpo più forte davvero**. | (storico) due regole a danno fisso; la crescita di `forza` era cosmetica. | ✅ Contatore come operando: `… di [forza]`. |
| R3 | **Confronto grandezza↔grandezza — ✅ RISOLTO (v0.31.0, Tema 1b).** `se la vita del troll è meno di [la mia vita]` è ora esprimibile: il termine di confronto può essere un `[contatore]`. | (storico) soglie fisse. | ✅ `se X è meno di [Y]`. |
| R4 | **Soglie di livello fisse, scritte a mano.** Niente «ogni 10 XP»: ogni livello è un demone separato con la sua costante. | Un `Quando l'esperienza è almeno N` per livello (10, 30, …). | Soglie ricorrenti, o aritmetica sul «prossimo livello». |
| R5 | **Nessun modello di mostro/personaggio.** Ogni nemico = un blocco di contatori e regole ricopiato. Dieci goblin = dieci copie. | Troll e Lich scritti a mano, separati. | Template/istanze: `Un goblin è un nemico con vita 4 e danno 1.`. |
| R6 | **Niente quantità/scorte.** «3 pozioni» non è un numero: la pozione è un singolo oggetto, ricomprabile solo dopo averlo bevuto. | Un solo oggetto `pozione`, gating `se … non ha la pozione`. | Oggetti con quantità: `Il giocatore ha 3 pozioni.` + `consuma una pozione`. |
| R7 | **Prezzi costanti.** Nessun prezzo variabile o calcolato (`vale [x] oro`): i prezzi sono numeri cablati nelle frasi del dialogo. | Prezzi fissi nelle opzioni di Gorbal. | Prezzi come espressione/contatore. |
| R8 | **⭐ Robustezza: un carattere fuori da Windows-1252 nel testo stampato fa CRASHARE il gioco** con un traceback fatale sulla console Windows (scoperto con `★` e `─` nei messaggi). La logica era corretta: a cadere è solo la stampa. | Sostituiti i caratteri «fantasia» con ASCII (`>>`, `===`). | **Cassetto A (diagnostica/robustezza):** la stampa dovrebbe degradare con `errors="replace"` invece di terminare il gioco. Riguarda OGNI storia, non solo questa. |

### Lettura d'insieme

**R1** (casualità) e **R2** (aritmetica/scaling) erano i due assi su cui si regge
*qualunque* sistema di gioco numerico, e fino alla 0.30.0 FAVELLA non aveva né
l'uno né l'altro. **La v0.31.0 (Tema 1) li ha colmati:** il danno ora scala con
una statistica (`di [forza]`, R2), i contatori si confrontano fra loro
(`è meno di [soglia]`, R3) e l'estrazione numerica casuale esiste
(`un numero fra A e B`, parte di R1). Era — fino a ieri — la lacuna «i contatori
sono celle isolate» vista in TUTTI e quattro gli stress-test (D2/D3 guida, S4
sopravvivenza, A1 appuntamenti): il limite strutturale numero uno del linguaggio,
ora il salto di espressività più grande oltre la 0.29. **R5/R6** (template,
quantità) restano di scala (cassetto B, da pesare). **R8** (robustezza cp1252) è
stato chiuso in 0.29.1. Tutto raccolto e ragionato in
[`documentazione/espansione-oltre-0.29.md`](../../../documentazione/espansione-oltre-0.29.md).

## File

| File | Contenuto |
|---|---|
| `la-cripta-del-lich.fav` | scheda eroe, mondo, nemici, combattimento, cura, morte nemici, level-up, esiti, `scheda` |
| `bottega.fav` | il banco di Gorbal: compra/vendi via dialogo (incluso dal file principale) |

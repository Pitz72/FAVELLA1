### **Azione 1: Creazione del Manuale Utente v0.1**

Ho preparato un documento Markdown che funge da "Manuale di Riferimento Rapido" per FAVELLA 1, basato su tutte le funzionalità che abbiamo implementato fino alla versione 0.0.9.2 (Grammatica v0.8).

È scritto pensando a un nuovo autore che scopre FAVELLA per la prima volta: linguaggio semplice, esempi chiari e focus sulla creazione di una storia.

Ecco il documento. Puoi salvarlo come `MANUALE.md` nella directory principale del tuo progetto o in una cartella `documentazione`.

---

```markdown
# Manuale di Riferimento per FAVELLA 1 (v0.0.9)

Benvenuto in FAVELLA 1, il linguaggio di programmazione per creare narrativa interattiva in italiano. Questa guida ti mostrerà come usare la grammatica attuale per costruire il tuo primo mondo di gioco.

La filosofia di FAVELLA è semplice: **il tuo codice è una storia**. Scriverai frasi in italiano per descrivere luoghi, oggetti e regole, e il compilatore si occuperà di trasformare le tue parole in un mondo giocabile.

---

## 1. Concetti di Base

### Commenti
Per aggiungere note al tuo codice che il compilatore ignorerà, usa il simbolo `#`. Tutto ciò che segue il `#` su una riga non verrà eseguito.

```favella
# Questa è la mia prima storia.
La foresta incantata è una stanza. # Questa riga verrà eseguita.
```

### Struttura delle Frasi
Ogni istruzione in FAVELLA è una frase che deve terminare con un **punto `.`**.

---

## 2. Definire il Mondo di Gioco

Il tuo mondo è composto da **stanze** e **oggetti**.

### Creare le Stanze
Ogni gioco ha bisogno di almeno un luogo. Per definire una stanza, usa questa sintassi:

**Sintassi:** `[NOME DELLA STANZA] è una stanza.`

**Esempio:**
```favella
Il castello è una stanza.
La piazza del mercato è una stanza.
```

### Dare una Descrizione alle Stanze
Per descrivere cosa vede il giocatore quando entra in una stanza.

**Sintassi:** `La descrizione di [NOME STANZA] è "[TESTO]".`

**Esempio:**
```favella
La descrizione del castello è "Un'enorme sala del trono. Un tappeto rosso consunto conduce verso un imponente trono di pietra.".
```

### Collegare le Stanze
Per permettere al giocatore di muoversi, devi collegare le stanze tra loro. FAVELLA creerà automaticamente il collegamento di ritorno.

**Sintassi:** `[NOME STANZA 1] collega [DIREZIONE] a [NOME STANZA 2].`
*   **Direzioni valide:** `nord`, `sud`, `est`, `ovest`.

**Esempio:**
```favella
# Se il castello è a nord della piazza, la piazza sarà automaticamente a sud del castello.
La piazza del mercato collega nord a il castello.
```

---

## 3. Popolare il Mondo con Oggetti

Gli oggetti sono gli elementi con cui il giocatore può interagire.

### Creare un Oggetto
Per creare un oggetto, devi dichiarare che è "una cosa".

**Sintassi:** `[NOME OGGETTO] è una cosa.`

**Esempio:**
```favella
Una spada lucente è una cosa.
Una vecchia pergamena è una cosa.
```

### Posizionare un Oggetto
Un oggetto, una volta creato, deve essere collocato in una stanza.

**Sintassi:** `[NOME OGGETTO] è in [NOME STANZA].`
*   Puoi usare anche preposizioni articolate come `nel`, `nella`, `sul`, `sulla`, etc.

**Esempio:**
```favella
La spada lucente è nella sala del trono.
La vecchia pergamena è sul tavolo di legno.
```

### Descrivere un Oggetto
Per dare dettagli su un oggetto quando il giocatore lo esamina.

**Sintassi:** `La descrizione di [NOME OGGETTO] è "[TESTO]".`

**Esempio:**
```favella
La descrizione della spada lucente è "Un'elsa finemente decorata e una lama che brilla di luce propria.".
```

---

## 4. Definire le Proprietà degli Oggetti

Le proprietà descrivono lo stato di un oggetto e sono la base per creare i puzzle.

### Assegnare una Proprietà
Una proprietà è un aggettivo che definisce lo stato di un oggetto.

**Sintassi:** `[NOME OGGETTO] è [PROPRIETÀ].`

**Esempio:**
```favella
La porta di legno è chiusa.
Il calice d'oro è pesante.
```

### Rendere un Oggetto "Prendibile"
Di default, gli oggetti non possono essere raccolti. Devi dichiararli esplicitamente come "prendibili".

**Sintassi:** `[NOME OGGETTO] è prendibile.`

**Esempio:**
```favella
La chiave arrugginita è prendibile.
```

---

## 5. Creare l'Interattività: Le Regole

Le regole ti permettono di personalizzare il comportamento del gioco e creare i puzzle.

### La Regola "Invece di" (Semplice)
Questa regola intercetta un'azione del giocatore e la sostituisce con un messaggio personalizzato. Funziona come un "blocco" o un "fallback".

**Sintassi:** `Invece di [VERBO ALL'IMPERATIVO] [NOME OGGETTO]: dire "[TESTO]".`

**Esempio:**
```favella
# Questa regola impedirà sempre al giocatore di prendere la statua.
Invece di prendi la statua di marmo: dire "È troppo pesante per essere sollevata.".
```

### Le Regole Condizionali (Avanzate)
Questa è la regola più potente di FAVELLA. Si attiva solo se una certa condizione è vera, permettendoti di creare la logica dei puzzle.

**Sintassi:** `Invece di [AZIONE] se [CONDIZIONE]: dire "[TESTO]".`

#### Tipi di Condizione:

1.  **Se il giocatore ha un oggetto:** `se il giocatore ha [NOME OGGETTO]`
    
    **Esempio:**
    ```favella
    # Questa regola si attiva solo se il giocatore ha la chiave.
    Invece di apri la porta di ferro se il giocatore ha la chiave arrugginita: dire "La chiave gira nella serratura e la porta si apre!".
    ```

2.  **Se un oggetto ha una proprietà:** `se [NOME OGGETTO] è [PROPRIETÀ]`
    
    **Esempio:**
    ```favella
    # Questa regola si attiva solo se la porta ha la proprietà "chiusa".
    Invece di esamina la porta di ferro se la porta di ferro è chiusa: dire "La porta è sbarrata da una serratura complessa.".
    ```

**Importante:** Le regole condizionali hanno sempre la **priorità** sulle regole semplici. Questo ti permette di definire un comportamento di fallback e uno specifico che lo sovrascrive quando le condizioni cambiano.
```

---

Questo documento copre tutte le funzionalità attuali. È sintetico ma completo. Una volta che lo avrai salvato, possiamo passare al punto 2: la progettazione della logica del sito web.
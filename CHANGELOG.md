# Registro delle Versioni (Changelog) - FAVELLA 1

Tutti i cambiamenti significativi a questo progetto saranno documentati in questo file.

---

## [0.2.1] - 2026-05-21
### Risolto (Criticità Gravissime)
- **Normalizzazione dell'input dell'utente:** Risolto il bug gravissimo che impediva la risoluzione degli oggetti in scope quando digitati con articoli (es. `prendi la keycard` falliva mentre `prendi keycard` funzionava). Ora l'input dell'utente viene normalizzato tramite `normalizza_nome` prima del confronto in `risolvi_nome_oggetto`.
- **Risoluzione movimenti con direzioni abbreviate:** 
  - Risolto il blocco della navigazione quando le connessioni erano definite con abbreviazioni nel file `.fav` (es. `collega n a il corridoio`). Ora vengono normalizzate a compile-time a nomi interi (`nord`, `sud`, etc.).
  - Abilitato il supporto per direzioni abbreviate inserite con il verbo `vai` (es. `vai n` o `vai s` ora si risolvono correttamente a `nord` e `sud`).

---

## [0.3.0] - 2026-05-21
### Risolto (Criticità Gravi)
- **Conservazione del nome visualizzato originale:** Ristrutturazione delle classi `Oggetto` e `Stanza` in `strutture.py` e della logica del transformer in `compilatore.py` per preservare la capitalizzazione e gli articoli originali scritti dall'autore (es. `"Una keycard magnetica"`, `"La cella di contenimento"`), mantenendo gli ID normalizzati in minuscolo solo per la logica interna del gioco. Aggiornato l'interprete in `gioco.py` e le azioni in `libreria_azioni.py` per visualizzare questi bellissimi nomi originali.
- **Corrispondenza flessibile delle preposizioni nelle regole a due oggetti:** Implementazione di una logica di tolleranza e fallback in `gioco.py` (`elabora_comando`, FASE 0): se non si trova una corrispondenza esatta con la preposizione specificata nella regola (es. `usa chiave su porta`), il motore tenta un fallback tollerante ignorando la preposizione (es. accettando `usa chiave con porta`) a patto che i due oggetti coincidano univocamente con la regola.

---

## [0.4.0] - 2026-05-21
### Aggiunto & Ottimizzato (Criticità Medie)
- **Rendering asincrono e ottimizzato della mappa:** Spostato il calcolo pesante delle posizioni dei nodi del grafo (`nx.spring_layout`) all'interno di un thread secondario dedicato (`LayoutWorker` ereditato da `QThread`) in `favella_studio.py`. In questo modo si previene efficacemente il congelamento (UI freeze) dell'intera interfaccia utente di PySide6 durante la compilazione di storie di grandi dimensioni. Lo sfondo della figura Matplotlib si armonizza ora con la Dark Mode.
- **Design System Premium "Cyber-Scrittore" (Dark Mode):** Sviluppato e applicato un foglio di stile QSS completo, scuro e moderno (`CYBER_STYLESHEET`) per tutta l'interfaccia dell'IDE. Coinvolge menu, toolbar, splitter, schede (tab), barre di scorrimento, bottoni e dialoghi `QMessageBox`, curando la tipografia monospazio e i feedback di hover.
- **Marker visivi degli errori di sintassi nell'editor:** Integrato un sistema dinamico che, al fallimento della compilazione di Lark, estrae tramite regex la riga d'errore dal log, evidenzia con uno sfondo rosso scuro soffuso (`#4a1515`) la riga esatta nell'editor sfruttando `QTextEdit.ExtraSelection` e posiziona automaticamente il cursore per agevolare il debug.

### Risolto (Criticità Lievi)
- **Generazione di righe vuote superflue nella console:** Ottimizzato l'intercettore di standard output in `GameSession` filtrando le stringhe che, dopo la rimozione dei caratteri di spaziatura finali (`.rstrip()`), risultano vuote, risolvendo il problema dei doppi a capo fastidiosi nella console dell'IDE.
- **Feedback visivo se il gioco non è avviato:** Aggiornata la gestione dell'input in `on_console_input` di `FavellaStudio` per visualizzare un messaggio informativo elegante e colorato direttamente nella console di gioco se l'utente tenta di inviare comandi quando non c'è una sessione attiva.

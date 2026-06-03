# gioco.py
# Interprete Interattivo per FAVELLA 1 (v0.15.0)

import sys
import traceback
from compilatore import analizza_file
from strutture import Mondo
from utils import normalizza_nome, rendi_testo, frase_indeterminativa
from libreria_azioni import LIBRERIA_AZIONI, muovi_logica_default # Importa anche muovi_logica_default

def mostra_stanza(mondo: Mondo):
    """Stampa la descrizione completa della stanza corrente del giocatore."""
    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        print("[ERRORE INTERNO] La posizione del giocatore non corrisponde a nessuna stanza!")
        return

    print(f"\n--- {stanza_corrente.nome_visualizzato.capitalize()} ---")
    print(rendi_testo(mondo, stanza_corrente.descrizione_attuale(mondo)))

    oggetti_nella_stanza = list(stanza_corrente.oggetti.values())
    if oggetti_nella_stanza:
        # [Livello 5] Articolo indeterminativo concordato (genere/numero inferiti
        # dal nome dichiarato): "Puoi vedere qui: una torcia, un tavolo.".
        nomi_oggetti = [frase_indeterminativa(ogg.nome_visualizzato) for ogg in oggetti_nella_stanza]
        print(f"Puoi vedere qui: {', '.join(nomi_oggetti)}.")

    # Mostra le uscite disponibili
    if stanza_corrente.uscite:
        uscite_str = ", ".join([f"{d.capitalize()} ({mondo.trova_stanza(id_s).nome_visualizzato.capitalize()})" for d, id_s in stanza_corrente.uscite.items()])
        print(f"Uscite: {uscite_str}.")

def risolvi_nome_oggetto(mondo: Mondo, nome_parziale: str) -> str | None:
    """Cerca di risolvere un nome parziale in un ID oggetto univoco nello scope attuale."""
    if not nome_parziale:
        return None

    stanza_corrente = mondo.trova_stanza(mondo.posizione_giocatore)
    if not stanza_corrente:
        return None

    # [Livello 4 / M1] Lo scope include il contenuto dei contenitori aperti e dei
    # supporti raggiungibili, non solo gli oggetti direttamente nella stanza.
    oggetti_in_scope = list(mondo.oggetti_raggiungibili())

    # Priorità 0: Direzioni (anche con "a " davanti). [Livello 4 / L1] La mappa
    # forma->canonica vive sul mondo (base + personalizzate).
    nome_pulito = nome_parziale.strip().lower()
    if nome_pulito.startswith("a ") and len(nome_pulito) > 2:
        nome_pulito = nome_pulito[2:].strip()

    if nome_pulito in mondo.direzioni:
        return mondo.direzioni[nome_pulito]

    # Normalizza l'input per trovare gli oggetti del gioco
    nome_normalizzato = normalizza_nome(nome_parziale)

    # [Livello 4] Risoluzione alias: un nome alternativo dichiarato dall'autore
    # ('La torcia si chiama anche "lanterna".') rimanda all'id canonico. Il nome
    # proprio dell'oggetto ha comunque la precedenza (controllato dopo).
    alias = getattr(mondo, "alias", {})
    nome_risolto = alias.get(nome_normalizzato, nome_normalizzato)

    # Priorità 1: Corrispondenza esatta (sul nome, poi sull'alias risolto)
    if nome_normalizzato in oggetti_in_scope:
        return nome_normalizzato
    if nome_risolto in oggetti_in_scope:
        return nome_risolto

    # Priorità 2: Corrispondenza parziale univoca. Il pool di candidati include
    # gli id in scope e gli alias (parziali) che rimandano a oggetti in scope.
    candidati = [id_ogg for id_ogg in oggetti_in_scope if nome_normalizzato in id_ogg]
    for ali, canonico in alias.items():
        if canonico in oggetti_in_scope and nome_normalizzato in ali and canonico not in candidati:
            candidati.append(canonico)

    if len(candidati) == 1:
        return candidati[0]
    elif len(candidati) > 1:
        print(f"Quale intendi di preciso? ({', '.join(candidati)})")
        return "<ambiguo>"
    else:
        return None


PREPOSIZIONI = ["su", "con", "contro", "in"]


def partita_finita(mondo: Mondo) -> bool:
    """[Livello 3] Controlla lo stato della partita dopo l'esecuzione delle
    conseguenze. Se una conseguenza di fine partita l'ha terminata, stampa
    l'esito e restituisce True (il loop di gioco deve fermarsi)."""
    stato = getattr(mondo, "stato_partita", "in_corso")
    if stato == "in_corso":
        return False
    if stato == "vinta":
        print("\n*** HAI VINTO! ***")
    elif stato == "persa":
        print("\n*** HAI PERSO. ***")
    else:
        print("\n*** La partita è terminata. ***")
    return True

def avanza_turno_e_processa(mondo: Mondo) -> bool:
    """[Livello 3] Avanza il contatore dei turni di un'unità e attiva gli eventi
    temporali che scattano a quel turno. [Livello 8] Poi valuta i DEMONI (eventi
    condizionali). Restituisce True se un evento/demone ha terminato la partita
    (il loop deve fermarsi)."""
    mondo.turno_corrente += 1
    t = mondo.turno_corrente
    # Prima gli eventi a TEMPO: così un 'Ogni turno: aumenta tensione' è già
    # applicato quando i demoni valutano le loro condizioni in questo stesso turno.
    for evento in mondo.eventi:
        if evento.scatta_a(t):
            print(rendi_testo(mondo, evento.risposta))
            evento.esegui_conseguenze(mondo)
            if partita_finita(mondo):
                return True
    return _processa_demoni(mondo)


def _processa_demoni(mondo: Mondo) -> bool:
    """[Livello 8] Valuta i demoni (eventi condizionali) UNA volta per turno, in
    un SOLO passaggio in ordine di dichiarazione. Un demone che scatta può mutare
    lo stato e quindi influenzare i demoni SUCCESSIVI nello stesso passaggio
    (cascata deterministica e utile), ma nessuno viene ri-valutato: i loop infiniti
    sono impossibili per costruzione («un demone, una valutazione per turno»).
    Restituisce True se un demone ha terminato la partita."""
    for demone in mondo.demoni:
        ora_vera = demone.condizione.valuta(mondo)
        if demone.tipo == "ogni_turno":
            # A LIVELLO: scatta a OGNI turno in cui la condizione è vera.
            scatta = ora_vera
        else:
            # 'quando': sul FRONTE di salita (falso -> vero), una sola volta.
            scatta = ora_vera and not demone.era_vera
        demone.era_vera = ora_vera
        if scatta:
            print(rendi_testo(mondo, demone.risposta))
            demone.esegui_conseguenze(mondo)
            if partita_finita(mondo):
                return True
    return False


def elabora_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """
    Esegue un singolo comando di gioco e, se il comando rappresenta un turno,
    avanza il contatore dei turni elaborando gli eventi temporali (Livello 3).
    Restituisce True se il gioco deve continuare, False se deve terminare
    (uscita del giocatore, fine partita o evento terminale).
    """
    comando_pulito = comando_grezzo.strip().lower()
    if not comando_pulito:
        return True
    # [Livello 5b] Durante una conversazione 'esci' chiude il dialogo (gestito in
    # _esegui_comando), NON il gioco: l'uscita dal gioco vale solo fuori dialogo.
    era_in_dialogo = mondo.in_dialogo()
    if not era_in_dialogo and comando_pulito in ["esci", "quit"]:
        print("A presto!")
        return False

    continua = _esegui_comando(mondo, comando_grezzo)
    if not continua:
        return False
    # [Livello 5b] Le interazioni di dialogo (avvio, scelte, uscita) non consumano
    # un turno di gioco: il tempo del mondo non avanza mentre si conversa.
    if era_in_dialogo or mondo.in_dialogo():
        return True
    if avanza_turno_e_processa(mondo):
        return False
    return True


# [Livello 5b] Parole che, durante una conversazione, la concludono comunque.
USCITE_DIALOGO = ("esci", "basta", "addio", "arrivederci", "smetti")


def _opzioni_disponibili(mondo: Mondo, nodo):
    """Opzioni del nodo attualmente proponibili (filtrate per condizione)."""
    return [o for o in nodo.opzioni if o.disponibile(mondo)]


def _mostra_nodo(mondo: Mondo):
    """Stampa la battuta dell'NPC al nodo corrente e l'elenco numerato delle
    opzioni disponibili. Un nodo senza opzioni chiude la conversazione."""
    npc = mondo.trova_oggetto(mondo.dialogo_attivo)
    nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
    if nodo is None:
        mondo.termina_dialogo()
        return
    nome = npc.nome_visualizzato.capitalize() if npc else "?"
    if nodo.battuta:
        print(f"\n{nome}: {rendi_testo(mondo, nodo.battuta)}")
    opzioni = _opzioni_disponibili(mondo, nodo)
    if not opzioni:
        print("(La conversazione si chiude.)")
        mondo.termina_dialogo()
        return
    for i, opz in enumerate(opzioni, 1):
        print(f"  {i}. {rendi_testo(mondo, opz.testo)}")


def _avvia_dialogo(mondo: Mondo, bersaglio_grezzo: str) -> bool:
    """Avvia una conversazione con un NPC raggiungibile, posizionandosi sul suo
    nodo d'ingresso. Restituisce sempre True (il gioco continua)."""
    if not bersaglio_grezzo:
        print("Con chi vuoi parlare?")
        return True
    id_npc = risolvi_nome_oggetto(mondo, bersaglio_grezzo)
    if not id_npc or id_npc == "<ambiguo>":
        if id_npc is None:
            print(f"Non vedo '{bersaglio_grezzo}' qui.")
        return True
    npc = mondo.trova_oggetto(id_npc)
    if not npc or not npc.is_personaggio:
        print("Non puoi parlarci.")
        return True
    if not npc.dialogo_iniziale or npc.dialogo_iniziale not in mondo.dialogo_nodi:
        print(f"{npc.nome_visualizzato.capitalize()} non ha nulla da dire.")
        return True
    mondo.dialogo_attivo = id_npc
    mondo.nodo_dialogo = npc.dialogo_iniziale
    _mostra_nodo(mondo)
    return True


def _seleziona_opzione(comando: str, opzioni):
    """Risolve il comando del giocatore in un'opzione: per numero, poi per testo
    esatto, infine per corrispondenza parziale univoca. None se nessuna combacia."""
    if comando.isdigit():
        idx = int(comando)
        if 1 <= idx <= len(opzioni):
            return opzioni[idx - 1]
        return None
    for opz in opzioni:
        if opz.testo.strip().lower() == comando:
            return opz
    parziali = [o for o in opzioni if comando in o.testo.strip().lower()]
    return parziali[0] if len(parziali) == 1 else None


def _gestisci_scelta_dialogo(mondo: Mondo, comando: str) -> bool:
    """Gestisce un comando mentre è in corso una conversazione: seleziona
    un'opzione, ne esegue le conseguenze e transita al nodo successivo, oppure
    chiude il dialogo. Restituisce False solo se una conseguenza termina la partita."""
    if comando in USCITE_DIALOGO:
        print("Concludi la conversazione.")
        mondo.termina_dialogo()
        return True

    nodo = mondo.dialogo_nodi.get(mondo.nodo_dialogo)
    if nodo is None:
        mondo.termina_dialogo()
        return True

    opzioni = _opzioni_disponibili(mondo, nodo)
    scelta = _seleziona_opzione(comando, opzioni)
    if scelta is None:
        print("Non è una scelta valida. Indica il numero di un'opzione (o 'esci').")
        return True

    # Conseguenze della scelta (riuso della coda del Livello 3), poi transizione.
    for conseguenza in scelta.conseguenze:
        conseguenza.esegui(mondo)
    if partita_finita(mondo):
        mondo.termina_dialogo()
        return False

    if scelta.chiude or not scelta.destinazione:
        mondo.termina_dialogo()
        print("(Fine della conversazione.)")
        return True

    if scelta.destinazione not in mondo.dialogo_nodi:
        # Nodo successivo inesistente: chiudi con grazia (già segnalato a compile-time).
        mondo.termina_dialogo()
        return True

    mondo.nodo_dialogo = scelta.destinazione
    _mostra_nodo(mondo)
    return True


def _esegui_comando(mondo: Mondo, comando_grezzo: str) -> bool:
    """Elabora un singolo comando (parsing + applicazione di regole/azioni),
    senza gestire l'avanzamento dei turni. Restituisce True per continuare."""
    try:
        comando_pulito = comando_grezzo.strip().lower()
        if not comando_pulito:
            return True

        # [Livello 5b] Se è in corso una conversazione, il comando è una scelta di
        # dialogo (numero o testo dell'opzione, oppure un'uscita): instradalo lì.
        if mondo.in_dialogo():
            return _gestisci_scelta_dialogo(mondo, comando_pulito)

        if comando_pulito in ["esci", "quit"]:
            print("A presto!")
            return False

        # --- PARSING INTELLIGENTE v0.2 ---
        # Cerchiamo preposizioni per spezzare il comando
        verbo_giocatore = ""
        argomento_sx = ""
        preposizione_trovata = None
        argomento_dx = ""

        # Tokenizzazione semplice
        parole = comando_pulito.split()
        if not parole:
            return True

        verbo_giocatore = parole[0]

        # [Livello 5b] 'parla con X' (o 'parla X') avvia un dialogo con un NPC.
        if verbo_giocatore in ("parla", "parlare", "conversa", "conversare"):
            bersaglio = " ".join(p for p in parole[1:] if p != "con")
            return _avvia_dialogo(mondo, bersaglio)
        
        # Cerca la prima preposizione nota
        indice_prep = -1
        for i, parola in enumerate(parole):
            if parola in PREPOSIZIONI:
                indice_prep = i
                preposizione_trovata = parola
                break
        
        if indice_prep > 0: # Trovata preposizione (non come prima parola)
            # Ricostruisci le parti
            # Esempio: "usa chiave con porta" -> verbo="usa", arg_sx="chiave", prep="con", arg_dx="porta"
            argomento_sx = " ".join(parole[1:indice_prep])
            argomento_dx = " ".join(parole[indice_prep+1:])
        else:
            # Parsing classico SVO (Verbo + Oggetto)
            argomento_sx = " ".join(parole[1:])

        # --- Gestione Movimento ---
        # [Livello 4 / L1] La mappa forma->canonica vive sul mondo (base + custom).
        direzione_normalizzata = mondo.direzioni.get(verbo_giocatore)
        if direzione_normalizzata:
            # Check per regole "Invece di vai a [direzione]"
            # Simuliamo un'azione "vai" con oggetto "direzione"
            regola_movimento_applicata = False
            
            # FASE 1: Regole Condizionali
            for regola in mondo.regole:
                if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                    if regola.condizione and regola.condizione.valuta(mondo):
                        print(rendi_testo(mondo, regola.risposta))
                        regola.esegui_conseguenze(mondo)
                        regola_movimento_applicata = True
                        break
            
            # FASE 2: Regole Semplici
            if not regola_movimento_applicata:
                for regola in mondo.regole:
                    if (regola.verbo == "vai" and regola.id_oggetto_bersaglio == direzione_normalizzata):
                        if not regola.condizione:
                            print(rendi_testo(mondo, regola.risposta))
                            regola.esegui_conseguenze(mondo)
                            regola_movimento_applicata = True
                            break

            if regola_movimento_applicata:
                if partita_finita(mondo):
                    return False
                return True

            vecchia_posizione = mondo.posizione_giocatore
            muovi_logica_default(mondo, direzione_normalizzata)
            if mondo.posizione_giocatore != vecchia_posizione: # Se il movimento è avvenuto
                mostra_stanza(mondo)
            return True

        # --- Gestione Azioni Standard ---
        nome_azione = mondo.mappa_verbi_giocatore.get(verbo_giocatore)
        if not nome_azione:
            print("Non capisco questo verbo.")
            return True
        azione = mondo.azioni[nome_azione]

        id_oggetto1 = None
        id_oggetto2 = None

        if azione.richiede_oggetto:
            if not argomento_sx:
                print(f"Cosa vorresti {verbo_giocatore}?")
                return True
            
            id_oggetto1 = risolvi_nome_oggetto(mondo, argomento_sx)
            if not id_oggetto1 or id_oggetto1 == "<ambiguo>":
                if id_oggetto1 is None:
                    print(f"Non vedo '{argomento_sx}' qui.")
                return True
            
            if preposizione_trovata and argomento_dx:
                id_oggetto2 = risolvi_nome_oggetto(mondo, argomento_dx)
                if not id_oggetto2 or id_oggetto2 == "<ambiguo>":
                    if id_oggetto2 is None:
                        print(f"Non vedo '{argomento_dx}' qui.")
                    return True

        # --- MOTORE DI GIOCO v0.9.5 (Supporto 2 Oggetti) ---
        regola_applicata = False
        regola_da_eseguire = None # Memorizza la regola trovata per eseguirne la conseguenza
        
        if azione.richiede_oggetto:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            
            # FASE 0: Regole a DUE OGGETTI (Priorità Massima)
            if id_oggetto2:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.preposizione == preposizione_trovata and
                        regola.id_oggetto_secondario == id_oggetto2):
                        
                        print(rendi_testo(mondo, regola.risposta))
                        regola_applicata = True
                        regola_da_eseguire = regola
                        break
                
                # FALLBACK tollerante per le preposizioni nelle regole a due oggetti
                if not regola_applicata:
                    for regola in mondo.regole:
                        if (regola.verbo in verbi_da_controllare and 
                            regola.id_oggetto_bersaglio == id_oggetto1 and
                            regola.id_oggetto_secondario == id_oggetto2):
                            
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 1: Regole Condizionali (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None): # Importante: solo regole a 1 oggetto
                        
                        if regola.condizione and regola.condizione.valuta(mondo):
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break
            
            # FASE 2: Regole Semplici (1 Oggetto)
            if not regola_applicata:
                for regola in mondo.regole:
                    if (regola.verbo in verbi_da_controllare and 
                        regola.id_oggetto_bersaglio == id_oggetto1 and
                        regola.id_oggetto_secondario is None):
                        
                        if not regola.condizione:
                            print(rendi_testo(mondo, regola.risposta))
                            regola_applicata = True
                            regola_da_eseguire = regola
                            break

        # FASE GLOBALE: Regole senza oggetto bersaglio (Livello 5). Scattano sul
        # solo verbo, se la loro condizione è soddisfatta, quando nessuna regola
        # specifica si è attivata. Valgono anche per le azioni che NON richiedono
        # un oggetto (es. 'Invece di guarda se il punteggio è almeno 3: ...'), per
        # cui le fasi 0–2 sopra non vengono nemmeno eseguite. Una regola specifica
        # ha sempre la precedenza su una globale (questa fase viene dopo).
        if not regola_applicata:
            verbi_da_controllare = {verbo_giocatore, nome_azione}
            for regola in mondo.regole:
                if (regola.id_oggetto_bersaglio is None
                        and regola.verbo in verbi_da_controllare):
                    if regola.condizione is None or regola.condizione.valuta(mondo):
                        print(rendi_testo(mondo, regola.risposta))
                        regola_applicata = True
                        regola_da_eseguire = regola
                        break

        if regola_applicata:
            if regola_da_eseguire:
                regola_da_eseguire.esegui_conseguenze(mondo)
                if partita_finita(mondo):
                    return False
            return True

        # 2. Esecuzione Logica di Default
        if azione.logica_di_default is None:
            # [Livello 4] Verbo personalizzato senza alcuna regola applicabile:
            # non esiste una logica di default, quindi un messaggio neutro.
            print("Non succede nulla di particolare.")
        elif azione.richiede_oggetto:
            # Passiamo anche il secondo oggetto se presente (la logica dell'azione deve supportarlo)
            try:
                azione.logica_di_default(mondo, id_oggetto1, id_oggetto2)
            except TypeError:
                # Fallback per azioni che non accettano il secondo argomento
                azione.logica_di_default(mondo, id_oggetto1)
        else:
            azione.logica_di_default(mondo)
        
        # Se l'azione era "guarda" o "aiuto", la descrizione è già stata stampata dalla logica di default
        # Altrimenti, se l'azione ha modificato lo stato del mondo (es. prendi/lascia), ristampa la stanza
        if nome_azione not in ["guarda", "aiuto", "esaminare", "prendere", "usare", "inventario", "_personalizzata", "mettere"]:
            mostra_stanza(mondo)
        
        return True
    except Exception as e:
        print(f"[ERRORE CRITICO] Si è verificato un errore durante l'esecuzione del comando: {e}")
        traceback.print_exc()
        return True # Non crashare il gioco, continua


def gioca(mondo: Mondo):
    """Avvia il ciclo di gioco interattivo."""
    mondo.carica_azioni(LIBRERIA_AZIONI)
    mondo.imposta_posizione_iniziale()
    
    if not mondo.posizione_giocatore:
        print("[ERRORE FATALE] Nessuna stanza definita. Impossibile avviare il gioco.")
        return

    print("\n--- BENVENUTO IN FAVELLA 1 ---")
    print("Scrivi 'esci' per terminare.")
    mostra_stanza(mondo)
    
    while True:
        print("")
        try:
            comando_grezzo = input("> ")
        except EOFError:
            print("\nA presto!"); break
            
        if not elabora_comando(mondo, comando_grezzo):
            break


def main():
    if len(sys.argv) != 2:
        print("Uso: python gioco.py <percorso_file.fav>")
        sys.exit(1)
    percorso_file = sys.argv[1]
    try:
        print(f"[FAVELLA 1] Compilazione di '{percorso_file}' in corso...")
        mondo_compilato = analizza_file(percorso_file)
        if mondo_compilato is None:
            print("\n[FAVELLA 1] Compilazione fallita. Correggi gli errori e riprova.")
            sys.exit(1)
        print(str(mondo_compilato))
        gioca(mondo_compilato)
    except FileNotFoundError:
        print(f"[ERRORE FATALE] Il file '{percorso_file}' non è stato trovato.")
    except Exception as e:
        print(f"[ERRORE FATALE] Si è verificato un errore imprevisto: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
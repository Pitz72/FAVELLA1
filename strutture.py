# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1 (v1.1.0)
from typing import Callable, List, Dict, Set, Optional
from utils import DIREZIONI_BASE, DIREZIONI_OPPOSTE_BASE

class Mondo: # Forward declaration per i type hint
    pass

# --- NUOVA Gerarchia delle Condizioni e Conseguenze ---
class Condizione:
    """Classe base astratta per tutte le condizioni."""
    def valuta(self, mondo: 'Mondo') -> bool:
        raise NotImplementedError("La valutazione deve essere implementata da una sottoclasse.")

class CondizionePossesso(Condizione):
    """Rappresenta la condizione 'se il giocatore ha [oggetto]'."""
    def __init__(self, id_oggetto: str):
        self.id_oggetto = id_oggetto
    
    def valuta(self, mondo: 'Mondo') -> bool:
        return self.id_oggetto in mondo.inventario

class CondizioneProprieta(Condizione):
    """Rappresenta la condizione 'se [oggetto] è [proprietà]'."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta

    def valuta(self, mondo: 'Mondo') -> bool:
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        return oggetto is not None and self.proprieta in oggetto.proprieta

class CondizioneVariabile(Condizione):
    """[Livello 3] 'se [stato] è [valore]'. Uno 'stato' è una variabile globale
    del mondo che contiene una parola-stato (enum-like); la condizione è vera se
    il valore corrente coincide con quello atteso. Una variabile mai impostata
    vale None e quindi non coincide con nessun valore."""
    def __init__(self, nome: str, valore: str):
        self.nome = nome
        self.valore = valore

    def valuta(self, mondo: 'Mondo') -> bool:
        return mondo.variabili.get(self.nome) == self.valore

class CondizioneContatore(Condizione):
    """[Livello 3] Confronto numerico su un contatore: 'se [contatore] è almeno
    N', '... è più di N', '... è meno di N', '... è N' (uguaglianza).
    Un contatore vale 0 di default; un valore non numerico è trattato come 0."""
    def __init__(self, nome: str, operatore: str, valore: int):
        self.nome = nome
        self.operatore = operatore   # uno di: '==', '>=', '>', '<'
        self.valore = valore

    def valuta(self, mondo: 'Mondo') -> bool:
        v = mondo.variabili.get(self.nome)
        if not isinstance(v, int):
            v = 0
        if self.operatore == "==":
            return v == self.valore
        if self.operatore == ">=":
            return v >= self.valore
        if self.operatore == ">":
            return v > self.valore
        if self.operatore == "<":
            return v < self.valore
        return False

# --- Condizioni composite (logica booleana, v0.6.0) ---
class CondizioneNot(Condizione):
    """Negazione: 'se il giocatore non ha X', 'se X non è Y'."""
    def __init__(self, condizione: Condizione):
        self.condizione = condizione

    def valuta(self, mondo: 'Mondo') -> bool:
        return not self.condizione.valuta(mondo)

class CondizioneAnd(Condizione):
    """Congiunzione: vera solo se TUTTE le sotto-condizioni sono vere ('... e ...')."""
    def __init__(self, condizioni: List[Condizione]):
        self.condizioni = condizioni

    def valuta(self, mondo: 'Mondo') -> bool:
        return all(c.valuta(mondo) for c in self.condizioni)

class CondizioneOr(Condizione):
    """Disgiunzione: vera se ALMENO UNA sotto-condizione è vera ('... oppure ...')."""
    def __init__(self, condizioni: List[Condizione]):
        self.condizioni = condizioni

    def valuta(self, mondo: 'Mondo') -> bool:
        return any(c.valuta(mondo) for c in self.condizioni)

class Conseguenza:
    """Classe base astratta per tutte le conseguenze."""
    def esegui(self, mondo: 'Mondo'):
        raise NotImplementedError("L'esecuzione deve essere implementata da una sottoclasse.")

class ConseguenzaProprieta(Conseguenza):
    """Rappresenta un cambio di proprietà (es. 'la porta è aperta')."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta

    def esegui(self, mondo: 'Mondo'):
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if oggetto:
            oggetto.aggiungi_proprieta(self.proprieta)
            # [Livello 3 / M5] Le proprietà opposte si escludono a vicenda.
            # Le coppie sono dichiarabili dall'autore ('Aperta e chiusa sono
            # opposte.') e raccolte in mondo.opposti; aperta↔chiusa è precaricata
            # come default. Assegnare una proprietà rimuove tutte le sue opposte.
            for opposta in mondo.opposti.get(self.proprieta, ()):
                oggetto.proprieta.discard(opposta)

class ConseguenzaVariabile(Conseguenza):
    """[Livello 3] Imposta il valore di uno 'stato' globale (es. 'e adesso il
    semaforo è verde')."""
    def __init__(self, nome: str, valore: str):
        self.nome = nome
        self.valore = valore

    def esegui(self, mondo: 'Mondo'):
        mondo.variabili[self.nome] = self.valore

class ConseguenzaContatore(Conseguenza):
    """[Livello 3] Mutazione di un contatore: 'aumenta X (di N)', 'diminuisci X
    (di N)', 'X diventa N'. Il delta predefinito di aumenta/diminuisci è 1."""
    def __init__(self, nome: str, modo: str, valore: int = 1):
        self.nome = nome
        self.modo = modo   # uno di: 'aumenta', 'diminuisci', 'diventa'
        self.valore = valore

    def esegui(self, mondo: 'Mondo'):
        attuale = mondo.variabili.get(self.nome)
        if not isinstance(attuale, int):
            attuale = 0
        if self.modo == "aumenta":
            mondo.variabili[self.nome] = attuale + self.valore
        elif self.modo == "diminuisci":
            mondo.variabili[self.nome] = attuale - self.valore
        else:  # diventa
            mondo.variabili[self.nome] = self.valore

class ConseguenzaFinePartita(Conseguenza):
    """[Livello 3] Termina la partita con un esito ('vinta', 'persa',
    'terminata'). Non agisce su un oggetto: si limita a impostare lo stato
    globale del mondo, che il loop di gioco controlla dopo ogni comando."""
    ESITI = ("vinta", "persa", "terminata")

    def __init__(self, esito: str):
        self.esito = esito

    def esegui(self, mondo: 'Mondo'):
        mondo.stato_partita = self.esito

class ConseguenzaSpostamento(Conseguenza):
    """Rappresenta uno spostamento di un oggetto (es. verso l'inventario, una stanza o il nulla)."""
    def __init__(self, id_oggetto: str, destinazione: str):
        self.id_oggetto = id_oggetto
        self.destinazione = destinazione

    def esegui(self, mondo: 'Mondo'):
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if not oggetto:
            return

        # Rimozione dalla posizione precedente (stanza, inventario o
        # contenitore/supporto). [Livello 4 / M1] centralizzata in rimuovi_da_posizione.
        mondo.rimuovi_da_posizione(oggetto)

        if self.destinazione == "nulla":
            oggetto.posizione = None
        elif self.destinazione == "inventario":
            mondo.inventario.add(self.id_oggetto)
            oggetto.posizione = "inventario"
        else:
            stanza_dest = mondo.trova_stanza(self.destinazione)
            if stanza_dest:
                stanza_dest.oggetti[self.id_oggetto] = oggetto
                oggetto.posizione = self.destinazione
            else:
                # [Livello 4 / M1] Destinazione = contenitore/supporto.
                contenitore = mondo.trova_oggetto(self.destinazione)
                if contenitore and (contenitore.is_contenitore or contenitore.is_supporto):
                    contenitore.contenuto.add(self.id_oggetto)
                    oggetto.posizione = self.destinazione

# --- Classi Esistenti (con modifiche) ---

class Azione:
    """Rappresenta un'azione standard, la sua logica e se richiede un oggetto."""
    def __init__(self, nomi: List[str], logica: Callable[..., None], richiede_oggetto: bool = True):
        self.nomi = nomi
        self.logica_di_default = logica
        self.richiede_oggetto = richiede_oggetto

class Regola:
    """Rappresenta una regola 'Invece di', con supporto per due oggetti,
    condizioni booleane composite e conseguenze multiple (v0.6.0)."""
    def __init__(self, verbo: str, id_oggetto_bersaglio: str, risposta: str,
                 condizione: Optional[Condizione] = None,
                 preposizione: Optional[str] = None,
                 id_oggetto_secondario: Optional[str] = None,
                 conseguenze: Optional[List[Conseguenza]] = None):
        self.verbo = verbo
        self.id_oggetto_bersaglio = id_oggetto_bersaglio
        self.risposta = risposta
        self.condizione = condizione
        self.preposizione = preposizione
        self.id_oggetto_secondario = id_oggetto_secondario
        # Lista (eventualmente vuota) di conseguenze da eseguire in ordine.
        self.conseguenze: List[Conseguenza] = conseguenze or []

    def esegui_conseguenze(self, mondo: 'Mondo'):
        """Esegue in ordine tutte le conseguenze associate alla regola."""
        for conseguenza in self.conseguenze:
            conseguenza.esegui(mondo)

class Evento:
    """[Livello 3] Evento temporale: scatta in base al contatore dei turni.
    Tipo 'al' -> una sola volta al turno N; tipo 'ogni' -> a ogni multiplo di N.
    Riusa la stessa coda di conseguenze delle regole."""
    def __init__(self, tipo: str, n: int, risposta: str,
                 conseguenze: Optional[List[Conseguenza]] = None):
        self.tipo = tipo            # 'al' oppure 'ogni'
        self.n = n
        self.risposta = risposta
        self.conseguenze: List[Conseguenza] = conseguenze or []

    def scatta_a(self, turno: int) -> bool:
        """Vero se l'evento deve attivarsi al turno dato."""
        if self.n <= 0:
            return False
        if self.tipo == "al":
            return turno == self.n
        return turno % self.n == 0   # 'ogni'

    def esegui_conseguenze(self, mondo: 'Mondo'):
        for conseguenza in self.conseguenze:
            conseguenza.esegui(mondo)

def _descrizione_attuale(entita, mondo: 'Mondo') -> str:
    """[Livello 5] Sceglie la descrizione da mostrare: la prima descrizione
    condizionale la cui condizione è vera (in ordine di dichiarazione), altrimenti
    la descrizione di base (fallback). Condiviso da Stanza e Oggetto."""
    for condizione, testo in entita.descrizioni_condizionali:
        if condizione.valuta(mondo):
            return testo
    return entita.descrizione

# --- [Livello 5b] NPC e dialoghi ramificati ---
#
# Un dialogo è un grafo di NODI (etichettati). Ogni nodo ha una BATTUTA (ciò che
# l'NPC dice) e una lista di OPZIONI del giocatore. Ogni opzione può: portare a un
# altro nodo, oppure chiudere il dialogo; eseguire conseguenze (Livello 3, riuso);
# essere subordinata a una condizione (mostrata solo se vera). Le etichette dei
# nodi e i testi delle opzioni sono VOCABOLARIO NUOVO -> introdotti tra virgolette
# (come alias/verbi del Livello 4), così non riaprono l'ambiguità grammaticale.

class OpzioneDialogo:
    """Una scelta del giocatore all'interno di un nodo di dialogo."""
    def __init__(self, testo: str, destinazione: Optional[str] = None,
                 chiude: bool = False, conseguenze: Optional[List['Conseguenza']] = None,
                 condizione: Optional['Condizione'] = None):
        self.testo = testo                  # ciò che il giocatore può scegliere
        self.destinazione = destinazione    # etichetta del nodo successivo (o None)
        self.chiude = chiude                # True se l'opzione termina il dialogo
        self.conseguenze: List['Conseguenza'] = conseguenze or []
        self.condizione = condizione        # disponibile solo se vera (None = sempre)

    def disponibile(self, mondo: 'Mondo') -> bool:
        return self.condizione is None or self.condizione.valuta(mondo)

class NodoDialogo:
    """Un nodo del grafo di dialogo: la battuta dell'NPC più le opzioni offerte."""
    def __init__(self, etichetta: str):
        self.etichetta = etichetta
        self.battuta: str = ""
        self.opzioni: List[OpzioneDialogo] = []

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome  # ID normalizzato (es. "cella di contenimento")
        self.nome_visualizzato = nome  # Nome originale visualizzabile (es. "La cella di contenimento")
        self.descrizione = descrizione
        # [Livello 5] Descrizioni condizionali: lista di (Condizione, testo)
        # valutate in ordine; la prima vera vince, altrimenti vale 'descrizione'.
        self.descrizioni_condizionali: List = []
        self.oggetti: Dict[str, 'Oggetto'] = {}
        self.uscite: Dict[str, str] = {}

    def descrizione_attuale(self, mondo: 'Mondo') -> str:
        return _descrizione_attuale(self, mondo)

class Oggetto:
    """Rappresenta un oggetto nel mondo di gioco."""
    def __init__(self, nome: str, posizione: str = None):
        self.nome = nome  # ID normalizzato (es. "keycard magnetica")
        self.nome_visualizzato = nome  # Nome originale visualizzabile (es. "Una keycard magnetica")
        self.posizione = posizione
        self.proprieta: Set[str] = set()
        self.descrizione: str = "È un oggetto come tanti."
        # [Livello 5] Descrizioni condizionali (vedi Stanza).
        self.descrizioni_condizionali: List = []
        self.prendibile: bool = False
        # [Livello 4 / M1] Contenitori e supporti. Un contenitore può contenere
        # altri oggetti *dentro* (visibili solo se aperto); un supporto li regge
        # *sopra* (sempre visibili). 'contenuto' raccoglie gli id degli oggetti
        # collocati in/su questo oggetto. Il loro 'posizione' punta a questo id.
        self.is_contenitore: bool = False
        self.is_supporto: bool = False
        self.contenuto: Set[str] = set()
        # [Livello 5b] NPC: un personaggio con cui il giocatore può 'parlare'.
        # 'dialogo_iniziale' è l'etichetta del nodo di partenza della conversazione.
        self.is_personaggio: bool = False
        self.dialogo_iniziale: Optional[str] = None

    def aggiungi_proprieta(self, prop: str):
        """Aggiunge una proprietà (aggettivo) all'oggetto."""
        self.proprieta.add(prop)

    def descrizione_attuale(self, mondo: 'Mondo') -> str:
        return _descrizione_attuale(self, mondo)

    def concordanza(self):
        """[Livello 5] (genere, numero) inferiti dall'articolo del nome dichiarato
        (es. 'La torcia' -> ('f','s')). Vedi utils.genere_numero."""
        from utils import genere_numero
        return genere_numero(self.nome_visualizzato)

class Mondo:
    """Contenitore per l'intero stato del mondo di gioco."""
    def __init__(self):
        self.stanze: Dict[str, Stanza] = {}
        self.oggetti: Dict[str, Oggetto] = {}
        self.regole: List[Regola] = []
        self.azioni: Dict[str, Azione] = {}
        self.mappa_verbi_giocatore: Dict[str, str] = {}
        self.posizione_giocatore: str | None = None
        # ID della stanza di partenza dichiarata esplicitamente dall'autore
        # tramite "Il giocatore comincia in [stanza].". None se non dichiarata.
        self.posizione_iniziale: str | None = None
        self.inventario: Set[str] = set()
        # [Livello 3] Stato della partita: "in_corso" finché una conseguenza di
        # fine partita non lo porta a "vinta"/"persa"/"terminata". Il loop di
        # gioco lo controlla dopo ogni comando per fermarsi.
        self.stato_partita: str = "in_corso"
        # [Livello 3] Eventi temporali e contatore dei turni di gioco.
        self.eventi: List['Evento'] = []
        self.turno_corrente: int = 0
        # [Livello 3 / G3] Stato astratto del mondo: variabili con nome ('stati')
        # che contengono una parola-stato. Dichiarate con 'X è uno stato.';
        # valore None finché non assegnate. Sono lo stato non legato a un oggetto.
        self.variabili: Dict[str, Optional[str]] = {}
        # [Livello 3 / M5] Coppie di proprietà che si escludono a vicenda.
        # Mappa simmetrica proprietà -> insieme delle sue opposte. La coppia
        # aperta↔chiusa è precaricata come default storico; l'autore può
        # aggiungerne altre con 'X e Y sono opposte.'.
        self.opposti: Dict[str, Set[str]] = {
            "aperta": {"chiusa"},
            "chiusa": {"aperta"},
        }
        # [Livello 4] Alias/sinonimi degli oggetti: mappa nome-alternativo (già
        # normalizzato) -> id canonico dell'oggetto. Dichiarati dall'autore con
        # 'La torcia si chiama anche "lanterna".'. Servono a risolvere l'input
        # del giocatore: un alias rimanda all'oggetto canonico in fase di parsing
        # del comando (vedi gioco.risolvi_nome_oggetto). Non sono token-ENTITA,
        # quindi non sono usabili nelle regole d'autore (lì vale il nome canonico).
        self.alias: Dict[str, str] = {}
        # [Livello 4] Verbi personalizzati dichiarati dall'autore ('"spingi" è un
        # comando.'). Sono parole-comando aggiuntive che il giocatore può digitare
        # e usare nelle regole 'Invece di'; agiscono su un oggetto bersaglio come
        # gli altri verbi. carica_azioni() li instrada a un'azione generica.
        self.verbi_personalizzati: Set[str] = set()
        # [Livello 4 / L1] Topologia data-driven. 'direzioni' mappa ogni FORMA
        # accettata (canonica o abbreviazione) -> direzione canonica;
        # 'opposte_direzioni' mappa canonica -> canonica opposta (per l'auto-
        # ritorno delle connessioni). Precaricate con le direzioni di base; le
        # direzioni personalizzate ('Alto e basso sono direzioni opposte.') si
        # aggiungono sempre in coppia opposta.
        self.direzioni: Dict[str, str] = {}
        self.opposte_direzioni: Dict[str, str] = {}
        self._inizializza_direzioni_base()
        # [Livello 5b] Dialoghi. 'dialogo_nodi' è il registro GLOBALE dei nodi
        # (etichetta -> NodoDialogo); le etichette sono uniche nel gioco. Ogni NPC
        # punta al proprio nodo d'ingresso via Oggetto.dialogo_iniziale. Lo stato
        # della conversazione in corso è runtime: 'dialogo_attivo' = id dell'NPC con
        # cui si sta parlando (o None), 'nodo_dialogo' = etichetta del nodo corrente.
        self.dialogo_nodi: Dict[str, 'NodoDialogo'] = {}
        self.dialogo_attivo: Optional[str] = None
        self.nodo_dialogo: Optional[str] = None

    def nodo_dialogo_di(self, etichetta: str) -> 'NodoDialogo':
        """Restituisce il nodo con quell'etichetta, creandolo se non esiste."""
        nodo = self.dialogo_nodi.get(etichetta)
        if nodo is None:
            nodo = NodoDialogo(etichetta)
            self.dialogo_nodi[etichetta] = nodo
        return nodo

    def in_dialogo(self) -> bool:
        """Vero se è in corso una conversazione con un NPC."""
        return self.dialogo_attivo is not None

    def termina_dialogo(self):
        self.dialogo_attivo = None
        self.nodo_dialogo = None

    def dichiara_variabile(self, nome: str):
        """Dichiara uno 'stato' globale (valore iniziale None se non già presente)."""
        self.variabili.setdefault(nome, None)

    def dichiara_contatore(self, nome: str):
        """Dichiara un contatore numerico (valore iniziale 0 se non già presente)."""
        self.variabili.setdefault(nome, 0)

    def dichiara_opposte(self, prop_a: str, prop_b: str):
        """Registra che due proprietà sono opposte (relazione simmetrica)."""
        self.opposti.setdefault(prop_a, set()).add(prop_b)
        self.opposti.setdefault(prop_b, set()).add(prop_a)

    def dichiara_alias(self, alias: str, id_canonico: str):
        """[Livello 4] Registra un nome alternativo per un oggetto. Entrambi gli
        argomenti sono già normalizzati. L'ultimo che vince in caso di collisione."""
        self.alias[alias] = id_canonico

    def dichiara_verbo(self, verbo: str):
        """[Livello 4] Registra un verbo personalizzato (parola-comando)."""
        self.verbi_personalizzati.add(verbo)

    def _inizializza_direzioni_base(self):
        """[Livello 4 / L1] Precarica le direzioni di base (fonte unica in utils)."""
        for canonica, forme in DIREZIONI_BASE.items():
            for forma in forme:
                self.direzioni[forma] = canonica
        self.opposte_direzioni.update(DIREZIONI_OPPOSTE_BASE)

    def dichiara_direzione_opposta(self, dir_a: str, dir_b: str):
        """[Livello 4 / L1] Registra una coppia di direzioni personalizzate,
        l'una opposta all'altra (relazione simmetrica). Ogni nome è anche la
        propria forma d'input (le direzioni custom non hanno abbreviazioni)."""
        self.direzioni[dir_a] = dir_a
        self.direzioni[dir_b] = dir_b
        self.opposte_direzioni[dir_a] = dir_b
        self.opposte_direzioni[dir_b] = dir_a

    def direzione_canonica(self, forma: str) -> Optional[str]:
        """Forma d'input -> direzione canonica (None se non è una direzione)."""
        return self.direzioni.get(forma)

    def opposta_di(self, canonica: str) -> Optional[str]:
        """Direzione canonica -> sua opposta (None se non registrata)."""
        return self.opposte_direzioni.get(canonica)

    def imposta_posizione_iniziale(self):
        """Imposta la posizione iniziale del giocatore.

        Usa la stanza dichiarata esplicitamente dall'autore ('Il giocatore
        comincia in X.'); in mancanza, ripiega sulla prima stanza definita.
        """
        if self.posizione_iniziale and self.posizione_iniziale in self.stanze:
            self.posizione_giocatore = self.posizione_iniziale
        elif self.stanze:
            self.posizione_giocatore = list(self.stanze.keys())[0]

    def carica_azioni(self, libreria: Dict[str, Azione]):
        """Carica la libreria di azioni e costruisce la mappa di ricerca inversa."""
        self.azioni = libreria
        for nome_azione, azione_obj in libreria.items():
            for verbo in azione_obj.nomi:
                self.mappa_verbi_giocatore[verbo] = nome_azione

        # [Livello 4] Instrada i verbi personalizzati a un'azione generica priva
        # di logica di default (logica=None): il runtime, se nessuna regola
        # 'Invece di' si attiva, stampa un messaggio neutro. setdefault: un verbo
        # custom non scavalca mai un verbo della libreria standard.
        if self.verbi_personalizzati:
            self.azioni["_personalizzata"] = Azione(
                nomi=sorted(self.verbi_personalizzati),
                logica=None, richiede_oggetto=True)
            for verbo in self.verbi_personalizzati:
                self.mappa_verbi_giocatore.setdefault(verbo, "_personalizzata")

    def aggiungi_regola(self, regola: Regola):
        self.regole.append(regola)

    def aggiungi_evento(self, evento: 'Evento'):
        self.eventi.append(evento)

    def aggiungi_stanza(self, stanza: Stanza):
        self.stanze[stanza.nome] = stanza

    def aggiungi_oggetto(self, oggetto: Oggetto):
        self.oggetti[oggetto.nome] = oggetto

    def trova_stanza(self, nome: str) -> Stanza | None:
        return self.stanze.get(nome)

    def trova_oggetto(self, nome: str) -> Oggetto | None:
        return self.oggetti.get(nome)

    # --- [Livello 4 / M1] Contenitori e supporti: raggiungibilità ---

    def contenitore_aperto(self, oggetto: 'Oggetto') -> bool:
        """Un contenitore è aperto (contenuto visibile) finché non è 'chiusa'."""
        return "chiusa" not in oggetto.proprieta

    def oggetto_raggiungibile(self, id_oggetto: str, _visti: Set[str] = None) -> bool:
        """Vero se l'oggetto è alla portata del giocatore: nella stanza corrente,
        nell'inventario, oppure dentro/sopra un contenitore/supporto a sua volta
        raggiungibile (un contenitore deve essere aperto). Risolve la catena di
        contenimento; il set _visti previene cicli patologici."""
        if _visti is None:
            _visti = set()
        if id_oggetto in _visti:
            return False
        _visti.add(id_oggetto)
        oggetto = self.trova_oggetto(id_oggetto)
        if not oggetto:
            return False
        if id_oggetto in self.inventario:
            return True
        pos = oggetto.posizione
        if pos == self.posizione_giocatore:
            return True
        if not pos or pos == "inventario":
            return pos == "inventario"
        contenitore = self.trova_oggetto(pos)
        if not contenitore:
            return False  # pos è una stanza diversa da quella corrente
        if contenitore.is_supporto:
            return self.oggetto_raggiungibile(pos, _visti)
        if contenitore.is_contenitore:
            return self.contenitore_aperto(contenitore) and self.oggetto_raggiungibile(pos, _visti)
        return False

    def oggetti_raggiungibili(self) -> Set[str]:
        """Insieme degli id di tutti gli oggetti alla portata del giocatore,
        incluso il contenuto (ricorsivo) dei contenitori aperti e dei supporti
        presenti nella stanza o nell'inventario."""
        risultato: Set[str] = set()
        coda = list(self.inventario)
        stanza = self.trova_stanza(self.posizione_giocatore)
        if stanza:
            coda += list(stanza.oggetti.keys())
        while coda:
            id_ogg = coda.pop()
            if id_ogg in risultato:
                continue
            risultato.add(id_ogg)
            ogg = self.trova_oggetto(id_ogg)
            if not ogg:
                continue
            if ogg.is_supporto or (ogg.is_contenitore and self.contenitore_aperto(ogg)):
                coda += [c for c in ogg.contenuto if c not in risultato]
        return risultato

    def rimuovi_da_posizione(self, oggetto: 'Oggetto'):
        """Rimuove l'oggetto dalla posizione attuale (stanza, inventario o
        contenitore/supporto) senza riposizionarlo."""
        pos = oggetto.posizione
        if pos == "inventario" or oggetto.nome in self.inventario:
            self.inventario.discard(oggetto.nome)
        elif pos and pos in self.stanze:
            self.stanze[pos].oggetti.pop(oggetto.nome, None)
        elif pos:
            contenitore = self.trova_oggetto(pos)
            if contenitore:
                contenitore.contenuto.discard(oggetto.nome)

    def __str__(self) -> str:
        n_personaggi = sum(1 for o in self.oggetti.values() if o.is_personaggio)
        report = (
            f"[FAVELLA 1] Report di compilazione (v1.1.0):\n"
            f"  - Stanze: {len(self.stanze)}\n"
            f"  - Oggetti: {len(self.oggetti)}\n"
            f"  - Personaggi: {n_personaggi} (nodi di dialogo: {len(self.dialogo_nodi)})\n"
            f"  - Stati: {len(self.variabili)}\n"
            f"  - Regole: {len(self.regole)}\n"
            f"  - Eventi: {len(self.eventi)}\n"
        )
        if self.posizione_giocatore:
            report += f"  - Posizione iniziale: '{self.posizione_giocatore}'"
        return report

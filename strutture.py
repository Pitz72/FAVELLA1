# strutture.py
# Modulo per le strutture dati di base di FAVELLA 1
import copy
import hashlib
import json
import random
from typing import Callable, List, Dict, Set, Optional
from favella_utils import DIREZIONI_BASE, DIREZIONI_OPPOSTE_BASE, radice_proprieta, prima_maiuscola

# [0.22.0 / A2] Seme predefinito del generatore casuale del mondo. Fisso: le
# partite sono riproducibili di default (utile per i test, per il futuro
# giocatore-robot e perché ANNULLA possa riavvolgere anche la casualità).
SEME_CASUALE_DEFAULT = 1972

# Unico punto di verità della versione del motore: gli altri moduli (sidecar,
# report di compilazione) la importano da qui invece di cablarla in proprio.
VERSIONE_MOTORE = "1.6.0"

class Mondo: # Forward declaration per i type hint
    pass

# --- OPERANDO-QUANTITÀ (Tema 1a + estrazione casuale, v0.31.0) ---
# Un «operando» è ciò che produce un INTERO al momento dell'uso: il secondo
# membro di 'di …' (aumenta/diminuisci/diventa) e il termine di confronto dei
# contatori ('è più di …', 'è meno di …', …). Tre forme:
#   - NUMERO letterale            -> OperandoNumero      ('di 3')
#   - valore di un contatore      -> OperandoVariabile   ('di [forza]')
#   - estrazione casuale          -> OperandoCasuale     ('di un numero fra 2 e 6')
# La forma [contatore] rispecchia l'interpolazione [nome] dei testi: in entrambi
# i casi [x] significa «il valore corrente di x». L'estrazione casuale usa il
# generatore seedato del mondo (mondo.rng), quindi è riproducibile e ANNULLA la
# riavvolge (lo stato dell'RNG è catturato dalle istantanee, come per A2/A5).
class Operando:
    """Classe base astratta: produce un intero dato il mondo."""
    def valore(self, mondo: 'Mondo') -> int:
        raise NotImplementedError("Da implementare nella sottoclasse.")

class OperandoNumero(Operando):
    """Un intero letterale ('di 3')."""
    def __init__(self, n: int):
        self.n = int(n)

    def valore(self, mondo: 'Mondo') -> int:
        return self.n

    def __str__(self):
        return str(self.n)

# [1.3.0 / M-7] 'il turno' si legge come un contatore (condizioni, operandi,
# testi) ma non si dichiara e non si assegna: è il numero del turno corrente.
TURNO = "turno"


def valore_numerico(mondo: 'Mondo', nome: str) -> int:
    """Il valore di un contatore; 'turno' è il turno corrente. Un contatore mai
    impostato, o uno stato non numerico, vale 0."""
    if nome == TURNO and nome not in mondo.variabili:
        return int(getattr(mondo, "turno_corrente", 0))
    v = mondo.variabili.get(nome)
    return v if isinstance(v, int) else 0


class OperandoVariabile(Operando):
    """Il valore corrente di un contatore ('di [forza]'). Un contatore mai
    impostato, o uno 'stato' non numerico, vale 0 (stessa tolleranza di
    CondizioneContatore)."""
    def __init__(self, nome: str):
        self.nome = nome

    def valore(self, mondo: 'Mondo') -> int:
        return valore_numerico(mondo, self.nome)

    def __str__(self):
        return f"[{self.nome}]"

class OperandoCasuale(Operando):
    """Un'estrazione casuale uniforme nell'intervallo CHIUSO [minimo, massimo]
    ('di un numero fra 2 e 6'), pescata da mondo.rng (riproducibile e
    ANNULLA-safe). Se l'autore inverte gli estremi (fra 6 e 2) li riordina, così
    l'intervallo è sempre valido."""
    def __init__(self, minimo: int, massimo: int):
        self.minimo = int(minimo)
        self.massimo = int(massimo)

    def valore(self, mondo: 'Mondo') -> int:
        lo, hi = self.minimo, self.massimo
        if lo > hi:
            lo, hi = hi, lo
        return mondo.rng.randint(lo, hi)

    def __str__(self):
        return f"un numero fra {self.minimo} e {self.massimo}"

def _come_operando(valore) -> Operando:
    """Normalizza un valore grezzo a Operando: un int diventa OperandoNumero
    (retrocompatibilità con i costruttori che passavano un intero); un Operando
    resta tale."""
    return valore if isinstance(valore, Operando) else OperandoNumero(valore)

# --- NUOVA Gerarchia delle Condizioni e Conseguenze ---
class Condizione:
    """Classe base astratta per tutte le condizioni."""
    def valuta(self, mondo: 'Mondo') -> bool:
        raise NotImplementedError("La valutazione deve essere implementata da una sottoclasse.")

class CondizionePossesso(Condizione):
    """Rappresenta la condizione 'se il giocatore ha [oggetto]'. [1.2.2] Vera
    anche se l'oggetto è dentro o sopra qualcosa che il giocatore porta (la
    chiave nello zaino): vedi Mondo.giocatore_possiede."""
    def __init__(self, id_oggetto: str):
        self.id_oggetto = id_oggetto

    def valuta(self, mondo: 'Mondo') -> bool:
        return mondo.giocatore_possiede(self.id_oggetto)

class CondizioneScorta(Condizione):
    """[1.6.0 / B1] Quantità di un oggetto CONTABILE che il giocatore ha in
    inventario, confrontata con una soglia: 'se il giocatore ha almeno 2 pozioni'
    (>=), '… ha 2 pozioni' (==), '… ha più di 2 …' (>), '… ha meno di 2 …' (<).
    'se le pozioni sono finite' è il caso ==0. Un oggetto non contabile o mai
    posseduto vale 0 copie."""
    def __init__(self, id_oggetto: str, operatore: str, soglia: int):
        self.id_oggetto = id_oggetto
        self.operatore = operatore   # '==' | '>=' | '>' | '<'
        self.soglia = int(soglia)

    def valuta(self, mondo: 'Mondo') -> bool:
        n = mondo.quantita_posseduta(self.id_oggetto)
        if self.operatore == "==":
            return n == self.soglia
        if self.operatore == ">=":
            return n >= self.soglia
        if self.operatore == ">":
            return n > self.soglia
        if self.operatore == "<":
            return n < self.soglia
        return False

class CondizioneProprieta(Condizione):
    """Rappresenta la condizione 'se [oggetto] è [proprietà]'."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta

    def valuta(self, mondo: 'Mondo') -> bool:
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if oggetto is None:
            return False
        # [1.3.0 / M-2] 'prendibile' non vive fra le proprietà ma in un campo:
        # 'se la mela è prendibile' era sempre falsa.
        if self.proprieta == "prendibile":
            return bool(oggetto.prendibile)
        # [Concordanza] Confronto per RADICE: «è aperto» combacia con «aperta» e
        # viceversa (genere/numero ignorati). I refusi veri cambiano la radice.
        r = radice_proprieta(self.proprieta)
        return any(radice_proprieta(p) == r for p in oggetto.proprieta)

class CondizioneVariabile(Condizione):
    """[Livello 3] 'se [stato] è [valore]'. Uno 'stato' è una variabile globale
    del mondo che contiene una parola-stato (enum-like); la condizione è vera se
    il valore corrente coincide con quello atteso. Una variabile mai impostata
    vale None e quindi non coincide con nessun valore."""
    def __init__(self, nome: str, valore: str):
        self.nome = nome
        self.valore = valore

    def valuta(self, mondo: 'Mondo') -> bool:
        return mondo.valore_variabile(self.nome) == self.valore

class CondizioneVariabileUguali(Condizione):
    """[0.34.0 / Tema 3] Confronto stato↔stato per INDIREZIONE: 'se il corteggiato
    è il preferito'. Vera quando i DUE stati contengono lo stesso valore simbolico
    corrente — non un letterale, ma il contenuto di un'altra cella. Distinta da
    CondizioneVariabile (confronto con un valore letterale) e da CondizioneContatore
    (confronto numerico): qui entrambi gli operandi sono nomi di STATO, risolti a
    runtime. Due stati entrambi non ancora impostati (None) sono considerati uguali.
    Il confronto numerico fra grandezze resta a CondizioneContatore ('è più di
    [forza]', Tema 1b); il mismatch stato↔contatore è intercettato a compile-time."""
    def __init__(self, nome: str, altro: str):
        self.nome = nome
        self.altro = altro

    def valuta(self, mondo: 'Mondo') -> bool:
        return mondo.valore_variabile(self.nome) == mondo.valore_variabile(self.altro)

class CondizioneContatore(Condizione):
    """[Livello 3] Confronto numerico su un contatore: 'se [contatore] è almeno
    N', '... è più di N', '... è meno di N', '... è N' (uguaglianza).
    Un contatore vale 0 di default; un valore non numerico è trattato come 0.
    [0.31.0 / Tema 1b] Il termine di confronto è un Operando: oltre a un NUMERO
    letterale può essere il valore di un altro contatore ('è più di [forza]'),
    abilitando i confronti grandezza↔grandezza. `valore` è sempre un Operando
    (un int passato dai vecchi costruttori viene avvolto in OperandoNumero)."""
    def __init__(self, nome: str, operatore: str, valore):
        self.nome = nome
        self.operatore = operatore   # uno di: '==', '>=', '>', '<', '<='
        self.valore = _come_operando(valore)

    def valuta(self, mondo: 'Mondo') -> bool:
        v = valore_numerico(mondo, self.nome)
        soglia = self.valore.valore(mondo)
        if self.operatore == "==":
            return v == soglia
        if self.operatore == ">=":
            return v >= soglia
        if self.operatore == ">":
            return v > soglia
        if self.operatore == "<":
            return v < soglia
        if self.operatore == "<=":   # [0.18.0 / B4] 'al massimo N'
            return v <= soglia
        return False

class CondizioneProbabilita(Condizione):
    """[0.32.0 / Tema 2c] Condizione PROBABILISTICA: vera con probabilità N/M
    ('càpita (1 su 4)' = una volta su quattro, 'càpita (3 su 4)' = tre volte su
    quattro). È l'unica condizione senza un operando (VARIABILE/ENTITA) a
    sinistra: parte dalla keyword dedicata 'càpita', quindi distinguibile dal
    resto di cond_base al primo token. Pesca da mondo.rng — il generatore seedato
    e ANNULLA-safe del mondo, come A2/A5/2a — così una partita è riproducibile e
    l'undo riavvolge anche il caso. Valutata da un demone 'Ogni turno se càpita
    (…)' ri-pesca a OGNI turno (è il comportamento voluto: un imprevisto a turno).
    Nota: valutarla AVANZA l'RNG (la condizione è impura), com'è inevitabile per
    una pesca; lo stato dell'RNG è catturato dalle istantanee, perciò ANNULLA la
    riavvolge fedelmente."""
    def __init__(self, numeratore: int, denominatore: int):
        self.numeratore = int(numeratore)
        self.denominatore = int(denominatore)

    def valuta(self, mondo: 'Mondo') -> bool:
        if self.denominatore <= 0:
            return False
        # randint(1, M) <= N  ->  vera con probabilità N/M (estremi inclusi).
        # N>=M => sempre vera; N<=0 => mai vera (coerente con il significato).
        return mondo.rng.randint(1, self.denominatore) <= self.numeratore

class CondizionePosizioneGiocatore(Condizione):
    """[0.18.0 / B1] 'se il giocatore è in [stanza]': vera quando il giocatore si
    trova nella stanza indicata. La negazione si ottiene avvolgendola in
    CondizioneNot ('se il giocatore non è in [stanza]')."""
    def __init__(self, id_stanza: str):
        self.id_stanza = id_stanza

    def valuta(self, mondo: 'Mondo') -> bool:
        return mondo.posizione_giocatore == self.id_stanza

QUI = "<qui>"


class CondizionePosizioneOggetto(Condizione):
    """[1.3.0 / G-6] Dove sta un oggetto o un personaggio: 'se la guardia è in
    cucina', 'se la chiave è nella scatola' (anche dentro qualcos'altro che sta
    nella scatola), 'se la mela è in inventario', 'se il gatto è qui' (nella
    stanza del giocatore). Prima si poteva chiedere solo dove fosse il giocatore."""
    def __init__(self, id_oggetto: str, luogo: str):
        self.id_oggetto = id_oggetto
        self.luogo = luogo   # id di stanza o di oggetto, 'inventario', 'nulla' o QUI

    def valuta(self, mondo: 'Mondo') -> bool:
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if oggetto is None:
            return False
        if self.luogo == QUI:
            return (mondo.stanza_di(self.id_oggetto) == mondo.posizione_giocatore
                    or mondo.posizione_giocatore in oggetto.anche_in)
        if self.luogo == "inventario":
            return mondo.giocatore_possiede(self.id_oggetto)
        if self.luogo == "nulla":
            return not oggetto.posizione
        if self.luogo in mondo.stanze:
            return mondo.stanza_di(self.id_oggetto) == self.luogo or self.luogo in oggetto.anche_in
        return self.luogo in mondo.contenitori_di(self.id_oggetto)


class CondizionePngHa(Condizione):
    """[1.3.0 / M-10] 'se la guardia ha la chiave' (anche dentro una borsa che
    la guardia porta)."""
    def __init__(self, id_png: str, id_oggetto: str):
        self.id_png = id_png
        self.id_oggetto = id_oggetto

    def valuta(self, mondo: 'Mondo') -> bool:
        return self.id_png in mondo.contenitori_di(self.id_oggetto)


# [1.6.0 / B3] Operandi-quantificatore di una relazione nelle INTERROGAZIONI:
# 'qualcuno'/'qualcosa' significano «esiste un membro da quel lato». Sono
# sentinelle, mai ID di entità (i nomi contengono solo lettere/cifre/spazi).
REL_QUALCUNO = "<qualcuno>"
REL_QUALCOSA = "<qualcosa>"
# L'ID del giocatore nelle relazioni: 'giocatore' è una parola riservata, quindi
# non è mai l'ID di un oggetto dichiarato → nessuna collisione.
REL_GIOCATORE = "giocatore"


class CondizioneRelazione(Condizione):
    """[1.6.0 / B3] Interroga una relazione binaria nominata: 'se il giocatore si
    fida di Saverio', 'se qualcuno si fida del giocatore', 'se il giocatore si
    fida di qualcuno'. Gli operandi sono ID normalizzati, oppure le sentinelle
    REL_QUALCUNO/REL_QUALCOSA (esistenziali su quel lato). In questa prima
    versione è solo d'autore e interrogabile, non azionabile dal giocatore."""
    def __init__(self, nome_rel: str, a: str, b: str):
        self.nome_rel = nome_rel
        self.a = a
        self.b = b

    def valuta(self, mondo: 'Mondo') -> bool:
        rel = mondo.relazioni.get(self.nome_rel)
        if rel is None:
            return False
        a_q = self.a in (REL_QUALCUNO, REL_QUALCOSA)
        b_q = self.b in (REL_QUALCUNO, REL_QUALCOSA)
        if a_q and b_q:
            return bool(rel.coppie)
        if a_q:
            return any(y == self.b for (x, y) in rel.coppie)
        if b_q:
            return any(x == self.a for (x, y) in rel.coppie)
        return (self.a, self.b) in rel.coppie


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
        if oggetto and self.proprieta == "prendibile":
            oggetto.prendibile = True   # [1.3.0 / M-2] un campo, non una proprietà
            return
        if oggetto:
            oggetto.aggiungi_proprieta(self.proprieta)
            # [Livello 3 / M5] Le proprietà opposte si escludono a vicenda.
            # Le coppie sono dichiarabili dall'autore ('Aperta e chiusa sono
            # opposte.') e raccolte in mondo.opposti; aperta↔chiusa è precaricata
            # come default. Assegnare una proprietà rimuove tutte le sue opposte.
            # [Concordanza] Il confronto è per RADICE: assegnare 'aperto' rimuove
            # 'chiusa'/'chiuso' indistintamente (genere/numero ignorati).
            opp_radici = mondo.radici_opposte(self.proprieta)
            if opp_radici:
                for p in list(oggetto.proprieta):
                    if radice_proprieta(p) in opp_radici:
                        oggetto.proprieta.discard(p)

class ConseguenzaTogliProprieta(Conseguenza):
    """[1.3.0 / M-2] 'e adesso il panno non è più bagnato': toglie una proprietà
    (per radice: 'bagnato' toglie anche 'bagnata'). Prima si potevano solo
    aggiungere, e senza una coppia di opposte il panno restava bagnato e
    asciutto insieme."""
    def __init__(self, id_oggetto: str, proprieta: str):
        self.id_oggetto = id_oggetto
        self.proprieta = proprieta

    def esegui(self, mondo: 'Mondo'):
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if not oggetto:
            return
        if self.proprieta == "prendibile":
            oggetto.prendibile = False
            return
        r = radice_proprieta(self.proprieta)
        for p in list(oggetto.proprieta):
            if radice_proprieta(p) == r:
                oggetto.proprieta.discard(p)


class ConseguenzaCollegamento(Conseguenza):
    """[1.3.0 / M-8] Le uscite cambiano durante la partita: 'e adesso la cucina
    collega nord a la dispensa' apre un passaggio (con il ritorno, come la
    dichiarazione); 'e adesso la cucina non collega più nord' lo chiude (e
    chiude il ritorno, se porta di nuovo qui)."""
    def __init__(self, id_stanza: str, direzione: str, destinazione: Optional[str]):
        self.id_stanza = id_stanza
        self.direzione = direzione
        self.destinazione = destinazione   # None = il passaggio si chiude

    def esegui(self, mondo: 'Mondo'):
        stanza = mondo.trova_stanza(self.id_stanza)
        if stanza is None:
            return
        opposta = mondo.opposta_di(self.direzione)
        # [1.5.0 / C13] Un'uscita che cambia in partita perde la sua condizione.
        condizioni = mondo.condizioni_uscite
        if self.destinazione is None:
            vecchia = stanza.uscite.pop(self.direzione, None)
            condizioni.pop((self.id_stanza, self.direzione), None)
            dest = mondo.trova_stanza(vecchia) if vecchia else None
            if dest is not None and opposta and dest.uscite.get(opposta) == self.id_stanza:
                dest.uscite.pop(opposta, None)
                condizioni.pop((dest.nome, opposta), None)
            return
        dest = mondo.trova_stanza(self.destinazione)
        if dest is None:
            return
        stanza.uscite[self.direzione] = self.destinazione
        condizioni.pop((self.id_stanza, self.direzione), None)
        if opposta:
            dest.uscite[opposta] = self.id_stanza
            condizioni.pop((dest.nome, opposta), None)


class ConseguenzaPngRiceve(Conseguenza):
    """[1.3.0 / M-10] 'e adesso la guardia ha la chiave': l'oggetto passa al
    personaggio (lo porta con sé quando si muove; non è alla portata del
    giocatore)."""
    def __init__(self, id_png: str, id_oggetto: str):
        self.id_png = id_png
        self.id_oggetto = id_oggetto

    def esegui(self, mondo: 'Mondo'):
        png = mondo.trova_oggetto(self.id_png)
        oggetto = mondo.trova_oggetto(self.id_oggetto)
        if png is None or oggetto is None or png is oggetto:
            return
        mondo.rimuovi_da_posizione(oggetto)
        png.contenuto.add(self.id_oggetto)
        oggetto.posizione = self.id_png


class ConseguenzaRelazioneAggiungi(Conseguenza):
    """[1.6.0 / B3] Asserisce una coppia in una relazione: 'e adesso il giocatore
    si fida di Vito'. L'arietà e l'eventuale reciprocità sono gestite da
    Relazione.aggiungi."""
    def __init__(self, nome_rel: str, a: str, b: str):
        self.nome_rel = nome_rel
        self.a = a
        self.b = b

    def esegui(self, mondo: 'Mondo'):
        rel = mondo.relazioni.get(self.nome_rel)
        if rel is not None:
            rel.aggiungi(self.a, self.b)


class ConseguenzaRelazioneTogli(Conseguenza):
    """[1.6.0 / B3] Toglie una coppia da una relazione: 'e adesso il giocatore
    non si fida più di Vito'."""
    def __init__(self, nome_rel: str, a: str, b: str):
        self.nome_rel = nome_rel
        self.a = a
        self.b = b

    def esegui(self, mondo: 'Mondo'):
        rel = mondo.relazioni.get(self.nome_rel)
        if rel is not None:
            rel.togli(self.a, self.b)


class ConseguenzaProcedura(Conseguenza):
    """[1.6.0 / C1] Invoca una procedura nominata ('esegui "far passare la
    notte"'): esegue in ordine le conseguenze del suo corpo. Una guardia di
    profondità evita i cicli (una procedura che, direttamente o no, richiama se
    stessa): oltre il limite l'invocazione è silenziosamente ignorata."""
    LIMITE_RICORSIONE = 50

    def __init__(self, nome: str):
        self.nome = nome

    def esegui(self, mondo: 'Mondo'):
        corpo = (getattr(mondo, "procedure", None) or {}).get(self.nome)
        if not corpo:
            return
        in_corso = getattr(mondo, "_procedure_in_corso", None)
        if in_corso is None:
            in_corso = mondo._procedure_in_corso = []
        if len(in_corso) >= self.LIMITE_RICORSIONE:
            return
        in_corso.append(self.nome)
        try:
            for c in corpo:
                c.esegui(mondo)
        finally:
            in_corso.pop()


class ConseguenzaVariabile(Conseguenza):
    """[Livello 3] Imposta il valore di uno 'stato' globale (es. 'e adesso il
    semaforo è verde')."""
    def __init__(self, nome: str, valore: str):
        self.nome = nome
        self.valore = valore

    def esegui(self, mondo: 'Mondo'):
        mondo.scrivi_variabile(self.nome, self.valore)

class ConseguenzaVariabileCopia(Conseguenza):
    """[0.34.0 / Tema 3] Copia per INDIREZIONE del valore di uno stato in un altro:
    'e adesso il corteggiato diventa il preferito'. A differenza di
    ConseguenzaVariabile (che assegna un valore SIMBOLICO letterale, 'il corteggiato
    è Anna'), qui il valore copiato è il CONTENUTO CORRENTE di un'altra cella-stato,
    risolto al momento dell'esecuzione. Riservata agli STATI (valori simbolici): la
    copia numerica fra contatori usa già l'operando '[nome]' (Tema 1a, 'il punteggio
    diventa [forza]'); il mismatch stato↔contatore è un errore d'autore intercettato
    a compile-time. Se la sorgente non è ancora impostata (None), la copia propaga
    None (lo stato di destinazione torna 'non impostato')."""
    def __init__(self, nome: str, sorgente: str):
        self.nome = nome
        self.sorgente = sorgente

    def esegui(self, mondo: 'Mondo'):
        mondo.scrivi_variabile(self.nome, mondo.valore_variabile(self.sorgente))

class ConseguenzaSceltaStato(Conseguenza):
    """[0.32.0 / Tema 2b] Assegna a uno «stato» un valore SIMBOLICO scelto a caso
    fra un elenco ('e adesso il meteo diventa uno fra sereno, pioggia, nebbia').
    A differenza di ConseguenzaVariabile (un valore fisso), pesca da mondo.rng —
    il generatore seedato e ANNULLA-safe del mondo (come A2/A5) — quindi la scelta
    è riproducibile e l'undo la riavvolge. È casualità SIMBOLICA (un valore di
    stato), distinta dall'estrazione NUMERICA dell'operando ('un numero fra A e B',
    già in 0.31.0): qui i valori sono parole-stato, non interi."""
    def __init__(self, nome: str, valori: List[str]):
        self.nome = nome
        self.valori = list(valori)

    def esegui(self, mondo: 'Mondo'):
        # L'elenco ha sempre >=1 valore (la grammatica richiede almeno una
        # PROPRIETA dopo 'fra'); la guardia difende comunque da un elenco vuoto.
        if self.valori:
            mondo.scrivi_variabile(self.nome, mondo.rng.choice(self.valori))

class ConseguenzaContatore(Conseguenza):
    """[Livello 3] Mutazione di un contatore: 'aumenta X (di N)', 'diminuisci X
    (di N)', 'X diventa N'. Il delta predefinito di aumenta/diminuisci è 1.
    [0.31.0 / Tema 1a + casualità] La quantità è un Operando, risolto al momento
    dell'esecuzione: oltre a un NUMERO può essere il valore di un altro contatore
    ('di [forza]') o un'estrazione casuale ('di un numero fra 2 e 6'). `valore` è
    sempre un Operando (un int dei vecchi costruttori viene avvolto)."""
    def __init__(self, nome: str, modo: str, valore=1):
        self.nome = nome
        self.modo = modo   # uno di: 'aumenta', 'diminuisci', 'diventa'
        self.valore = _come_operando(valore)

    def esegui(self, mondo: 'Mondo'):
        attuale = mondo.variabili.get(self.nome)
        if not isinstance(attuale, int):
            attuale = 0
        quantita = self.valore.valore(mondo)
        if self.modo == "aumenta":
            mondo.scrivi_variabile(self.nome, attuale + quantita)
        elif self.modo == "diminuisci":
            mondo.scrivi_variabile(self.nome, attuale - quantita)
        elif self.modo == "moltiplica":      # [1.3.0 / M-7]
            mondo.scrivi_variabile(self.nome, attuale * quantita)
        elif self.modo == "dividi":
            # Divisione intera verso lo zero (7/2 = 3, -7/2 = -3); per zero il
            # contatore non cambia (non c'è un risultato sensato).
            if quantita != 0:
                mondo.scrivi_variabile(self.nome, int(attuale / quantita))
        elif self.modo == "modulo":
            # Il resto sempre fra 0 e N-1: 'riduci l'ora modulo 24'.
            if quantita != 0:
                mondo.scrivi_variabile(self.nome, attuale % abs(quantita))
        else:  # diventa
            mondo.scrivi_variabile(self.nome, quantita)


class ConseguenzaLimita(Conseguenza):
    """[1.3.0 / M-7] 'la forza resta fra 0 e 10': riporta il contatore
    nell'intervallo (è il minimo e il massimo insieme)."""
    def __init__(self, nome: str, minimo, massimo):
        self.nome = nome
        self.minimo = _come_operando(minimo)
        self.massimo = _come_operando(massimo)

    def esegui(self, mondo: 'Mondo'):
        attuale = valore_numerico(mondo, self.nome)
        basso, alto = self.minimo.valore(mondo), self.massimo.valore(mondo)
        if basso > alto:
            basso, alto = alto, basso
        mondo.scrivi_variabile(self.nome, max(basso, min(alto, attuale)))

class ConseguenzaFinePartita(Conseguenza):
    """[Livello 3] Termina la partita con un esito ('vinta', 'persa',
    'terminata'). Non agisce su un oggetto: si limita a impostare lo stato
    globale del mondo, che il loop di gioco controlla dopo ogni comando."""
    ESITI = ("vinta", "persa", "terminata")

    def __init__(self, esito: str, messaggio: Optional[str] = None):
        self.esito = esito
        # [0.18.0 / B3] Testo d'esito opzionale: se presente, sostituisce il
        # messaggio fisso ('*** HAI VINTO! ***' ecc.) alla chiusura della partita.
        self.messaggio = messaggio

    def esegui(self, mondo: 'Mondo'):
        mondo.stato_partita = self.esito
        # Memorizza l'eventuale messaggio personalizzato sul mondo, così il loop di
        # gioco (gioco.partita_finita) lo stampa al posto del banner di default.
        if self.messaggio is not None:
            mondo.messaggio_esito = self.messaggio

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

class ConseguenzaSpostamentoGiocatore(Conseguenza):
    """[0.18.0 / B2] Teletrasporto del giocatore: 'e adesso il giocatore è in
    [stanza]'. Sposta il giocatore nella stanza indicata, senza passare per le
    connessioni (`collega`). La stanza dev'essere esistente (validata in
    valida_post); a stanza inesistente l'effetto è nullo. Il loop di gioco mostra
    la nuova stanza quando il movimento avviene per una regola del giocatore."""
    def __init__(self, id_stanza: str, modo: Optional[str] = None):
        self.id_stanza = id_stanza
        # [1.5.0 / C4] None: come sempre ('è in': la stanza si mostra dopo una
        # regola su un oggetto, non dopo una regola 'vai', un demone, un evento,
        # un'opzione); 'mostra' ('va in'): sempre; 'tace' ('si ritrova in'): mai.
        self.modo = modo

    def esegui(self, mondo: 'Mondo'):
        if mondo.trova_stanza(self.id_stanza):
            mondo.posizione_giocatore = self.id_stanza
            mondo._modo_spostamento = self.modo


class ConseguenzaSegnala(Conseguenza):
    """[1.5.0 / N6] 'segnala "gemito"': manda un segnale a chi ospita il motore
    (un evento 'segnale', silenzioso nel terminale). Non cambia il mondo."""
    def __init__(self, nome: str):
        self.nome = nome

    def esegui(self, mondo: 'Mondo'):
        mondo.segnali.append(self.nome)

class ConseguenzaMovimentoPNG(Conseguenza):
    """[0.25.0 / A5] Movimento di un PERSONAGGIO (o altro oggetto) da una stanza a
    un'altra, così il mondo non sembra un museo. Due modi:
      - DETERMINISTICO ('la guardia va nel corridoio'): destinazione fissa;
      - CASUALE ('il gatto cambia stanza'): una stanza adiacente a caso, fra le
        uscite della stanza in cui si trova, pescata da mondo.rng (riproducibile e
        ANNULLA-safe, come le varianti A2).
    Se la mossa coinvolge la stanza del giocatore (l'NPC ne esce o vi entra), il
    motore accoda un annuncio in mondo.annunci, stampato dal loop di gioco: il
    movimento è così visibile e non muto. Senza uscite (caso casuale) o con
    destinazione assente, il personaggio resta dov'è."""
    def __init__(self, id_png: str, destinazione: Optional[str] = None,
                 adiacente: bool = False):
        self.id_png = id_png
        self.destinazione = destinazione   # id stanza (deterministico) o None
        self.adiacente = adiacente         # True = una stanza adiacente a caso

    def esegui(self, mondo: 'Mondo'):
        png = mondo.trova_oggetto(self.id_png)
        if not png:
            return
        origine = png.posizione
        stanza_orig = mondo.trova_stanza(origine) if origine else None
        direzione = None
        if self.adiacente:
            # [1.5.0 / C13] Le uscite chiuse da una condizione non si passano.
            uscite = mondo.uscite_visibili(origine) if stanza_orig else {}
            if not uscite:
                return  # nessuna uscita: il personaggio non si muove
            direzione = mondo.rng.choice(sorted(uscite.keys()))
            destinazione = uscite[direzione]
        else:
            destinazione = self.destinazione
            if stanza_orig:
                # Se la destinazione è adiacente, recuperiamo la direzione per un
                # annuncio più ricco ('se ne va verso nord').
                for d, s in stanza_orig.uscite.items():
                    if s == destinazione:
                        direzione = d
                        break
        stanza_dest = mondo.trova_stanza(destinazione)
        if not stanza_dest or destinazione == origine:
            return
        pos_gioc = mondo.posizione_giocatore
        nome = prima_maiuscola(png.nome_visualizzato)
        # Annuncio di USCITA: l'NPC lascia la stanza in cui si trova il giocatore.
        if origine == pos_gioc:
            if direzione:
                mondo.annunci.append(f"{nome} se ne va verso {direzione}.")
            else:
                mondo.annunci.append(f"{nome} se ne va.")
        mondo.rimuovi_da_posizione(png)
        stanza_dest.oggetti[self.id_png] = png
        png.posizione = destinazione
        # Annuncio di INGRESSO: l'NPC entra nella stanza del giocatore.
        if destinazione == pos_gioc:
            mondo.annunci.append(f"{nome} arriva.")

class ConseguenzaBuioStanza(Conseguenza):
    """[0.33.0 / Tema 4a] Commuta il BUIO di una stanza in scena: 'e adesso la
    radura diventa buia' (spegne la luce) / 'e adesso la radura diventa illuminata'
    (la riaccende). Il buio di stanza (`Stanza.buia`, §10) nasceva STATICO — solo
    'La cantina è buia.' all'avvio; questa conseguenza lo rende DINAMICO, così il
    ciclo giorno/notte di una storia di sopravvivenza può calare il buio. È stato
    del mondo (un attributo della stanza), quindi ANNULLA lo riavvolge come ogni
    altro cambiamento, senza bisogno di RNG. Il bersaglio dev'essere una stanza
    (validato a compile-time in `_valida_conseguenze`)."""
    def __init__(self, id_stanza: str, buio: bool):
        self.id_stanza = id_stanza
        self.buio = buio   # True = la stanza diventa buia; False = si illumina

    def esegui(self, mondo: 'Mondo'):
        stanza = mondo.trova_stanza(self.id_stanza)
        if stanza is not None:
            stanza.buia = self.buio

# --- Classi Esistenti (con modifiche) ---

class Azione:
    """Rappresenta un'azione standard, la sua logica e se richiede un oggetto."""
    def __init__(self, nomi: List[str], logica: Callable[..., None], richiede_oggetto: bool = True,
                 cede: bool = False):
        self.nomi = nomi
        self.logica_di_default = logica
        self.richiede_oggetto = richiede_oggetto
        # [1.3.0] Un'azione che CEDE lascia i suoi verbi a un verbo omonimo
        # dichiarato dall'autore (vedi Mondo.carica_azioni).
        self.cede = cede

class Regola:
    """Rappresenta una regola 'Invece di', con supporto per due oggetti,
    condizioni booleane composite e conseguenze multiple (v0.6.0)."""
    def __init__(self, verbo: str, id_oggetto_bersaglio: str, risposta: str,
                 condizione: Optional[Condizione] = None,
                 preposizione: Optional[str] = None,
                 id_oggetto_secondario: Optional[str] = None,
                 conseguenze: Optional[List[Conseguenza]] = None,
                 fase: str = "invece",
                 categoria: Optional[str] = None,
                 categoria_secondaria: Optional[str] = None,
                 altrimenti: Optional[tuple] = None):
        self.verbo = verbo
        self.id_oggetto_bersaglio = id_oggetto_bersaglio
        self.risposta = risposta
        self.condizione = condizione
        self.preposizione = preposizione
        self.id_oggetto_secondario = id_oggetto_secondario
        # Lista (eventualmente vuota) di conseguenze da eseguire in ordine.
        self.conseguenze: List[Conseguenza] = conseguenze or []
        # [1.3.0 / M-9] 'invece' (sostituisce l'azione), 'prima' (poi l'azione
        # prosegue), 'dopo' (dopo che l'azione di default è riuscita).
        self.fase = fase
        # [1.3.0 / M-9] Regola per categoria: 'qualcosa' ("" = ogni oggetto) o
        # 'qualcosa di pesante' (la radice della proprietà). None = un oggetto preciso.
        self.categoria = categoria
        self.categoria_secondaria = categoria_secondaria
        # [1.3.0 / M-9] Ramo 'altrimenti': (risposta, conseguenze) quando la
        # condizione è falsa. None = nessun ramo.
        self.altrimenti = altrimenti
        # [1.5.0 / C3] 'per la prima volta': la regola vale finché il suo ramo
        # principale non è scattato una volta (poi vale il ramo 'altrimenti', se
        # c'è). La memoria è nel mondo (Mondo.prime_volte), alla chiave
        # 'chiave_prima_volta' (condivisa dalle regole nate da una frase su più verbi).
        self.prima_volta: bool = False
        self.chiave_prima_volta: Optional[tuple] = None
        # [1.5.0 / C5] 'e poi dire "…"': il testo dopo le conseguenze, per ramo.
        self.poi_dire: Optional[str] = None
        self.poi_dire_altrimenti: Optional[str] = None
        # [1.5.0 / C1] 'e basta' (solo 'Prima di'): il ramo ferma l'azione. Una
        # regola che ferma è un VINCOLO: si controlla prima di tutte le altre.
        self.basta: bool = False
        self.basta_altrimenti: bool = False

    @property
    def globale(self) -> bool:
        """Senza bersaglio: né un oggetto, né una direzione, né una categoria."""
        return self.id_oggetto_bersaglio is None and self.categoria is None

    def esegui_conseguenze(self, mondo: 'Mondo', altrimenti: bool = False):
        """Esegue in ordine tutte le conseguenze associate alla regola (o al
        suo ramo 'altrimenti')."""
        conseguenze = self.altrimenti[1] if altrimenti and self.altrimenti else self.conseguenze
        for conseguenza in conseguenze:
            conseguenza.esegui(mondo)

    def risposta_di(self, altrimenti: bool = False) -> str:
        return self.altrimenti[0] if altrimenti and self.altrimenti else self.risposta

    def poi_dire_di(self, altrimenti: bool = False) -> Optional[str]:
        """[1.5.0 / C5] Il testo di 'e poi dire' del ramo."""
        return self.poi_dire_altrimenti if altrimenti else self.poi_dire

    def ferma(self, altrimenti: bool = False) -> bool:
        """[1.5.0 / C1] Il ramo finisce con 'e basta'."""
        return self.basta_altrimenti if altrimenti else self.basta

    @property
    def vincolo(self) -> bool:
        """[1.5.0 / C1] Una regola 'Prima di' con almeno un ramo che ferma."""
        return self.fase == "prima" and (self.basta or self.basta_altrimenti)

    def condizionata(self) -> bool:
        """[1.5.0 / C3] Ha una condizione da valutare: un 'se' o 'per la prima volta'."""
        return self.condizione is not None or self.prima_volta

    def vale(self, mondo: 'Mondo') -> bool:
        """[1.5.0 / C3] La condizione della regola, compresa 'per la prima volta'
        (falsa dopo che il ramo principale è scattato una volta)."""
        if self.prima_volta and self.chiave_prima_volta in mondo.prime_volte:
            return False
        return self.condizione is None or self.condizione.valuta(mondo)

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
        self.poi_dire: Optional[str] = None     # [1.5.0 / C5]

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

class Demone:
    """[Livello 8] Evento CONDIZIONALE (un 'demone'/sentinella): sorveglia una
    CONDIZIONE a ogni turno e scatta da solo quando è soddisfatta, senza essere
    legato a un'azione del giocatore né a un turno fisso. Due tipi:
      - 'ogni_turno' (a LIVELLO): 'Ogni turno se [cond]: ...' — scatta a OGNI turno
        in cui la condizione è vera (effetti continui; può ri-scattare).
      - 'quando' (sul FRONTE di salita): 'Quando [cond] diventa vera: ...' — scatta
        UNA volta nel turno in cui la condizione passa da falsa a vera. Richiede di
        ricordare il valore precedente (`era_vera`).
    Riusa l'albero `Condizione` completo e la stessa coda di conseguenze delle
    regole e degli eventi a tempo."""
    def __init__(self, tipo: str, condizione: 'Condizione', risposta: str,
                 conseguenze: Optional[List[Conseguenza]] = None):
        self.tipo = tipo            # 'ogni_turno', 'quando' o [1.3.0] 'dopo'
        self.condizione = condizione
        self.risposta = risposta
        self.conseguenze: List[Conseguenza] = conseguenze or []
        # [1.3.0 / M-7] 'N turni dopo che …': il ritardo e il conto alla
        # rovescia in corso (None = nessun conto aperto).
        self.ritardo: int = 0
        self.conto: Optional[int] = None
        # [Fronte di salita] Valore della condizione all'ultima valutazione. Per i
        # demoni 'quando' è inizializzato a fine compilazione sul mondo iniziale
        # (vedi compilatore.inizializza_demoni): così una condizione già vera alla
        # partenza NON genera un falso fronte. Irrilevante per i demoni 'ogni_turno'.
        self.era_vera: bool = False
        # [1.5.0 / C3, C5] 'Quando … per la prima volta' (una volta sola in tutta
        # la partita; memoria in Mondo.prime_volte) e 'e poi dire'.
        self.prima_volta: bool = False
        self.indice: int = 0
        self.poi_dire: Optional[str] = None

    def esegui_conseguenze(self, mondo: 'Mondo'):
        for conseguenza in self.conseguenze:
            conseguenza.esegui(mondo)

class VariantiDescrizione:
    """[0.22.0 / A2] Una descrizione con PIÙ varianti, scelta secondo una politica:
    - 'casuale' ('è una di: …'): a ogni richiesta una variante a caso, mai due
      volte di fila la stessa (se ce n'è più d'una); usa il generatore del mondo;
    - 'sequenza' ('è in sequenza: …'): le varianti si susseguono in ordine a ogni
      richiesta; raggiunta l'ultima, vi resta (descrizioni che «si consumano»).
    Lo stato di avanzamento vive nell'istanza → è catturato e ripristinato da
    ANNULLA insieme al resto del mondo."""
    def __init__(self, testi, politica: str):
        self.testi: List[str] = [t for t in testi]
        self.politica = politica          # 'casuale' | 'sequenza'
        self._indice = 0                  # 'sequenza': prossima variante da mostrare
        self._ultima = -1                 # 'casuale': ultima mostrata (anti-ripetizione)

    def scegli(self, mondo: 'Mondo') -> str:
        if not self.testi:
            return ""
        if len(self.testi) == 1:
            return self.testi[0]
        if self.politica == "sequenza":
            testo = self.testi[self._indice]
            if self._indice < len(self.testi) - 1:
                self._indice += 1
            return testo
        # 'casuale': evita di ripetere subito la stessa variante.
        rng = getattr(mondo, "rng", None) or random
        candidati = [i for i in range(len(self.testi)) if i != self._ultima]
        i = rng.choice(candidati)
        self._ultima = i
        return self.testi[i]


def testi_di_descrizione(valore) -> List[str]:
    """[0.22.0 / A2] Tutte le stringhe-variante di un valore-descrizione (sia una
    stringa semplice sia una VariantiDescrizione). Usato dalla validazione dei
    segnaposto e dal linter, che devono ispezionare OGNI variante senza
    «consumarla»."""
    if isinstance(valore, VariantiDescrizione):
        return list(valore.testi)
    return [valore] if valore else []


def descrizione_display(valore) -> str:
    """[0.22.0 / A2] Una stringa rappresentativa di un valore-descrizione, per la
    serializzazione (snapshot del mondo per l'IDE): la prima variante, o la
    stringa stessa."""
    if isinstance(valore, VariantiDescrizione):
        return valore.testi[0] if valore.testi else ""
    return valore


def _descrizione_attuale(entita, mondo: 'Mondo') -> str:
    """[Livello 5] Sceglie la descrizione da mostrare: la prima descrizione
    condizionale la cui condizione è vera (in ordine di dichiarazione), altrimenti
    la descrizione di base (fallback). [0.22.0 / A2] Il valore scelto può essere
    una VariantiDescrizione: in tal caso si pesca la variante secondo la politica.
    Condiviso da Stanza e Oggetto."""
    for condizione, testo in entita.descrizioni_condizionali:
        if condizione.valuta(mondo):
            return testo.scegli(mondo) if isinstance(testo, VariantiDescrizione) else testo
    base = entita.descrizione
    return base.scegli(mondo) if isinstance(base, VariantiDescrizione) else base

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

class Argomento:
    """[1.3.0 / M-10] Un argomento di conversazione: 'Se chiedi alla guardia di
    "chiave" oppure "custode": dire "…" e adesso …'. Il giocatore scrive
    'chiedi alla guardia della chiave'; la prima risposta la cui condizione è
    vera vince. Accanto ai dialoghi a menù, non al loro posto."""
    def __init__(self, id_png: str, chiavi: List[str], risposta: str,
                 condizione: Optional['Condizione'] = None,
                 conseguenze: Optional[List[Conseguenza]] = None):
        self.id_png = id_png
        self.chiavi = chiavi
        self.risposta = risposta
        self.condizione = condizione
        self.conseguenze: List[Conseguenza] = conseguenze or []
        self.poi_dire: Optional[str] = None     # [1.5.0 / C5]

    def esegui_conseguenze(self, mondo: 'Mondo'):
        for c in self.conseguenze:
            c.esegui(mondo)


class Arrivo:
    """[1.5.0 / C12] 'Quando il giocatore entra nella stiva [per la prima volta]
    [se …]: …'. Scatta quando il giocatore arriva nella stanza (un movimento, una
    regola, un demone), PRIMA che la stanza sia descritta; se chiude la partita
    la stanza non si stampa. Diverso dal demone 'Quando il giocatore è nella
    stiva', che guarda la fine del turno."""
    def __init__(self, id_stanza: str, condizione: Optional['Condizione'], risposta: str,
                 conseguenze: Optional[List[Conseguenza]] = None):
        self.id_stanza = id_stanza
        self.condizione = condizione
        self.risposta = risposta
        self.conseguenze: List[Conseguenza] = conseguenze or []
        self.prima_volta: bool = False
        self.indice: int = 0
        self.poi_dire: Optional[str] = None

    def esegui_conseguenze(self, mondo: 'Mondo'):
        for c in self.conseguenze:
            c.esegui(mondo)


class NodoDialogo:
    """Un nodo del grafo di dialogo: la battuta dell'NPC più le opzioni offerte."""
    def __init__(self, etichetta: str):
        self.etichetta = etichetta
        # Battuta di BASE (fallback senza condizione). Più dichiarazioni
        # incondizionate per lo stesso nodo: l'ultima vince (come le descrizioni).
        self.battuta: str = ""
        # [0.33.0 / Tema 4b] Battute CONDIZIONALI: lista di (Condizione, testo)
        # valutate in ordine di dichiarazione; la prima vera vince, altrimenti vale
        # 'battuta'. È la stessa simmetria «prima vera vince» delle descrizioni di
        # oggetti/stanze (vedi _descrizione_attuale).
        self.battute_condizionali: List = []
        self.opzioni: List[OpzioneDialogo] = []

    def battuta_attuale(self, mondo: 'Mondo') -> str:
        """[0.33.0 / Tema 4b] La battuta da pronunciare ora: la prima battuta
        condizionale la cui condizione è vera (in ordine), altrimenti la battuta
        di base. Le condizioni si valutano sullo stato corrente del mondo."""
        for condizione, testo in self.battute_condizionali:
            if condizione.valuta(mondo):
                return testo
        return self.battuta

class Stanza:
    """Rappresenta una singola stanza nel mondo di gioco."""
    def __init__(self, nome: str, descrizione: str = "Non vedi nulla di particolare."):
        self.nome = nome  # ID normalizzato (es. "cella di contenimento")
        self.nome_visualizzato = nome  # Nome originale visualizzabile (es. "La cella di contenimento")
        self.descrizione = descrizione
        # [Livello 5] Descrizioni condizionali: lista di (Condizione, testo)
        # valutate in ordine; la prima vera vince, altrimenti vale 'descrizione'.
        self.descrizioni_condizionali: List = []
        # [0.24.0 / A4] Stanza al buio: dichiarata con 'La cantina è buia.'. Finché
        # nessuna fonte di luce accesa è raggiungibile, il motore mostra «È buio
        # pesto.» e blocca esamina/prendi (le uscite restano percorribili). Vedi
        # Mondo.c_e_luce().
        self.buia: bool = False
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
        # [Livello 7] Capacità di trasporto: mentre questo oggetto è nell'inventario,
        # aumenta di 'bonus_capacita' il numero di oggetti che il giocatore può
        # portare (es. uno zaino 'dà 15 spazi'). 0 = nessun bonus (default).
        self.bonus_capacita: int = 0
        # [0.24.0 / A4] Fonte di luce: dichiarata con 'La torcia illumina.'. Un
        # oggetto che illumina rischiara una stanza buia se è raggiungibile e non è
        # «spento» (interagisce con le opposte accesa/spenta: una torcia spenta non
        # illumina). Vedi Mondo.c_e_luce().
        self.illumina: bool = False
        # [1.1.0] Posto iniziale: 'Il posto della mappa è "Su un mobile, …".'.
        # Frase d'ambiente mostrata sotto la descrizione della stanza finché
        # l'oggetto non è mai stato spostato ('spostato' diventa vero alla prima
        # rimozione dal suo luogo, vedi Mondo.rimuovi_da_posizione, e non torna
        # più falso). Nel frattempo l'oggetto non compare in «Puoi vedere qui».
        self.posto: Optional[str] = None
        self.spostato: bool = False
        # [1.3.0 / M-8] Oggetto DI SCENA ('Il cielo è di scena.'): si esamina ma
        # non compare in «Puoi vedere qui». Presente ANCHE in altre stanze ('Il
        # cielo è anche nel cortile.'): cielo, mare, una porta vista dai due lati.
        self.di_scena: bool = False
        self.anche_in: Set[str] = set()
        # [1.6.0 / B1] Oggetto CONTABILE: una cosa tenuta in più copie, con la
        # concordanza DICHIARATA (non indovinata): 'La pozione, plurale "pozioni",
        # è contabile.'. 'plurale' è il nucleo plurale dato dall'autore (es.
        # "pozioni"), usato negli elenchi concordati ('3 pozioni', '1 pozione'); il
        # motore non pluralizza mai da sé. 'quantita' mappa ogni LUOGO (id di stanza,
        # 'inventario', o un contenitore/supporto) al numero di copie lì presenti
        # (>0): è la fonte di verità del contabile. I marker di presenza standard
        # (inventario, stanza.oggetti, contenuto) restano in sincronia, così la
        # visibilità e la raggiungibilità esistenti valgono senza modifiche. Un
        # contabile è una cosa SEMPLICE: non è contenitore/supporto/personaggio/fonte
        # di luce (il compilatore lo verifica). Vedi §30 della grammatica.
        self.contabile: bool = False
        self.plurale: Optional[str] = None
        self.quantita: Dict[str, int] = {}

    def al_suo_posto(self) -> bool:
        """[1.1.0] True se la frase del posto iniziale va ancora mostrata."""
        return self.posto is not None and not self.spostato

    def aggiungi_proprieta(self, prop: str):
        """Aggiunge una proprietà (aggettivo) all'oggetto."""
        self.proprieta.add(prop)

    def descrizione_attuale(self, mondo: 'Mondo') -> str:
        return _descrizione_attuale(self, mondo)

    def concordanza(self):
        """[Livello 5] (genere, numero) inferiti dall'articolo del nome dichiarato
        (es. 'La torcia' -> ('f','s')). Vedi favella_utils.genere_numero."""
        from favella_utils import genere_numero
        return genere_numero(self.nome_visualizzato)

class Relazione:
    """[1.6.0 / B3] Una relazione binaria NOMINATA fra entità (e il giocatore),
    ispirata alle *relations* di Inform 7. Dichiarata una volta con la sua
    locuzione d'uso ('si fida di'), l'arietà delle due parti e l'eventuale
    reciprocità. In questa prima versione è d'autore e INTERROGABILE, non
    azionabile dal giocatore. I membri sono ID normalizzati ('giocatore' è il
    giocatore). Lo stato (le coppie) vive nel mondo, quindi è catturato dalle
    istantanee: ANNULLA riavvolge anche le relazioni."""
    ARIETA = ("uno-a-uno", "uno-a-molti", "molti-a-molti")

    def __init__(self, nome: str, locuzione: str, arieta: str = "molti-a-molti",
                 reciproca: bool = False, prep: Optional[str] = None):
        self.nome = nome              # id canonico (la locuzione normalizzata)
        self.locuzione = locuzione    # forma visualizzata ('si fida di')
        self.arieta = arieta if arieta in self.ARIETA else "molti-a-molti"
        self.reciproca = reciproca
        self.prep = prep              # preposizione finale ('di'/'a'/None), per riscrivere
        self.coppie: Set[tuple] = set()

    def vale(self, a: str, b: str) -> bool:
        return (a, b) in self.coppie

    def aggiungi(self, a: str, b: str):
        # Arietà: togli le coppie in conflitto prima di aggiungere.
        if self.arieta == "uno-a-uno":
            self.coppie = {(x, y) for (x, y) in self.coppie if x != a and y != b}
        elif self.arieta == "uno-a-molti":
            # Un solo soggetto per ogni oggetto (A→molti B, ma ogni B←un solo A).
            self.coppie = {(x, y) for (x, y) in self.coppie if y != b}
        self.coppie.add((a, b))
        if self.reciproca:
            self.coppie.add((b, a))

    def togli(self, a: str, b: str):
        self.coppie.discard((a, b))
        if self.reciproca:
            self.coppie.discard((b, a))

    def soggetti_di(self, b: str) -> List[str]:
        """Chi è in relazione con b (i soggetti): 'chi si fida di X'."""
        return sorted(x for (x, y) in self.coppie if y == b)

    def oggetti_di(self, a: str) -> List[str]:
        """Con chi a è in relazione (gli oggetti): 'di chi si fida X'."""
        return sorted(y for (x, y) in self.coppie if x == a)


class Mondo:
    """Contenitore per l'intero stato del mondo di gioco."""
    def __init__(self):
        self.stanze: Dict[str, Stanza] = {}
        self.oggetti: Dict[str, Oggetto] = {}
        self.regole: List[Regola] = []
        self.azioni: Dict[str, Azione] = {}
        self.mappa_verbi_giocatore: Dict[str, str] = {}
        # [1.2.2] Verbo → TUTTE le azioni che lo elencano, in ordine di libreria.
        # Serve ai verbi presenti in due azioni ('guarda': esamina X / guarda la
        # stanza), risolti dall'argomento del comando: vedi azione_del_verbo().
        self.azioni_del_verbo: Dict[str, List[str]] = {}
        # [1.3.0] Stato di SESSIONE del comando in corso (fuori dalle istantanee):
        # il comando non fa passare il tempo; una domanda di conferma in sospeso
        # ('esci', 'ricomincia'); il giocatore ha chiesto di chiudere la partita.
        self._turno_libero: bool = False
        self._in_conferma: Optional[str] = None
        self._uscita_richiesta: bool = False
        # [1.3.0] La logica di default ha fatto ciò che doveva (per 'Dopo di');
        # la domanda «Quale intendi…?» in attesa di risposta.
        self._azione_riuscita: bool = False
        self._ambiguita: Optional[dict] = None
        # [1.4.2] L'oggetto di «Con cosa vuoi usarlo?», in attesa del secondo.
        self._usa_in_sospeso: Optional[str] = None
        # [1.6.0 / B1] Quantità chiesta nel comando in corso per un oggetto
        # contabile ('prendi 2 pozioni'): un intero, la stringa 'tutte' (tutte le
        # copie), o None (predefinito: 1). Stato di sessione, azzerato a ogni comando.
        self._quantita_comando = None
        # [1.4.3] Nel comando in corso è scattata una regola dell'autore: il turno
        # non può più essere «libero» (vedi gioco._senza_turno).
        self._regola_scattata: bool = False
        # [1.5.0 / C4] Come l'ultima conseguenza ha spostato il giocatore
        # (None, 'mostra', 'tace'): vedi ConseguenzaSpostamentoGiocatore.
        self._modo_spostamento: Optional[str] = None
        # [1.5.0 / C10] Il comando è una consultazione «senza tempo»; una regola
        # scattata nel comando ha cambiato qualcosa (allora il tempo passa).
        self._consultazione: bool = False
        self._regola_cambia: bool = False
        self.posizione_giocatore: str | None = None
        # ID della stanza di partenza dichiarata esplicitamente dall'autore
        # tramite "Il giocatore comincia in [stanza].". None se non dichiarata.
        self.posizione_iniziale: str | None = None
        self.inventario: Set[str] = set()
        # [Livello 7] Capacità di trasporto BASE (numero di oggetti portabili a mani
        # nude). None = illimitata (default storico: nessun limite). I bonus degli
        # oggetti portati (es. uno zaino) si SOMMANO alla base. Vedi capacita_attuale().
        self.capacita_base: Optional[int] = None
        # [Livello 3] Stato della partita: "in_corso" finché una conseguenza di
        # fine partita non lo porta a "vinta"/"persa"/"terminata". Il loop di
        # gioco lo controlla dopo ogni comando per fermarsi.
        self.stato_partita: str = "in_corso"
        # [0.18.0 / B3] Messaggio d'esito personalizzato impostato da una
        # conseguenza 'vinci/perdi/termina "…"'. None = usa il banner di default.
        self.messaggio_esito: str | None = None
        # [Livello 3] Eventi temporali e contatore dei turni di gioco.
        self.eventi: List['Evento'] = []
        self.turno_corrente: int = 0
        # [Livello 8] Demoni: eventi CONDIZIONALI (sentinelle reattive). Lista
        # distinta dagli eventi a tempo per non intaccarne la serializzazione.
        self.demoni: List['Demone'] = []
        # [Livello 3 / G3] Stato astratto del mondo: variabili con nome ('stati')
        # che contengono una parola-stato. Dichiarate con 'X è uno stato.';
        # valore None finché non assegnate. Sono lo stato non legato a un oggetto.
        self.variabili: Dict[str, Optional[str]] = {}
        # [1.6.0 / Q1] Invarianti di clamp DICHIARATE: 'La sete resta sempre fra 0
        # e 100.'. Mappa nome-contatore -> (Operando minimo, Operando massimo). A
        # differenza della conseguenza 'X resta fra A e B' (da richiamare a ogni
        # modifica), questa è applicata dal motore AUTOMATICAMENTE dopo ogni
        # scrittura del contatore (vedi scrivi_variabile): il contatore non può
        # mai uscire dall'intervallo, senza che l'autore debba ricordarsene.
        self.invarianti_clamp: Dict[str, tuple] = {}
        # [1.6.0 / B3] Relazioni binarie nominate (nome-locuzione -> Relazione).
        # Lo stato (le coppie) è parte del mondo, quindi catturato dalle istantanee.
        self.relazioni: Dict[str, 'Relazione'] = {}
        # [1.6.0 / B3] Segnaposto-elenco '[chi <locuzione> <membro>]' risolti dal
        # compilatore: chiave normalizzata -> (nome_relazione, id_membro). L'elenco
        # vero è ricalcolato a ogni resa dalle coppie correnti (come condizioni_testo).
        self.liste_relazione: Dict[str, tuple] = {}
        # [1.6.0 / C1] Procedure nominate: nome -> lista di Conseguenza (il corpo).
        # Statico (scritto dal compilatore). Il contatore di ricorsione, invece, è
        # volatile (sessione del comando in corso).
        self.procedure: Dict[str, list] = {}
        self._procedure_in_corso: list = []
        # [1.6.0 / B1] Oggetti contabili: mappa id-FORMA-PLURALE -> id-canonico
        # (singolare). La forma plurale dichiarata ('pozioni') è un'ENTITA valida
        # che risolve all'oggetto 'pozione': trova_oggetto la canonicalizza, così
        # ogni riferimento al plurale trova lo stesso oggetto. Dato statico (scritto
        # dal compilatore, mai cambiato in partita).
        self.plurali: Dict[str, str] = {}
        # [Livello 3 / M5] Coppie di proprietà che si escludono a vicenda.
        # Mappa simmetrica proprietà -> insieme delle sue opposte. Le coppie
        # aperta↔chiusa e accesa↔spenta sono precaricate come default; l'autore può
        # aggiungerne altre con 'X e Y sono opposte.'.
        # [0.27.0 / B] accesa↔spenta precaricata: il motore le tratta GIÀ come coppia
        # per la luce (c_e_luce/fonte_di_luce, confronto per radice spent-), quindi
        # senza questa coppia 'e adesso la torcia è spenta' lasciava l'oggetto sia
        # 'accesa' sia 'spenta' (incoerenza: 'se la torcia è accesa' restava vera).
        self.opposti: Dict[str, Set[str]] = {
            "aperta": {"chiusa"},
            "chiusa": {"aperta"},
            "accesa": {"spenta"},
            "spenta": {"accesa"},
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
        # [0.19.0 / A7] Sottoinsieme dei verbi personalizzati dichiarati
        # INTRANSITIVI ('"accelera" è un comando senza oggetto.'): non richiedono
        # un oggetto bersaglio; li gestisce una regola globale 'Invece di [verbo]:'.
        self.verbi_intransitivi: Set[str] = set()
        # [0.26.0 / A6] Sinonimi di verbo: mappa parola-nuova -> verbo di libreria
        # canonico ('"ghermisci" è come prendi.'). A differenza di un verbo
        # personalizzato (che richiede una regola per ogni oggetto), un sinonimo
        # RIMAPPA al verbo di libreria: a runtime il parser lo riscrive nel
        # canonico, così si comporta identicamente (regole 'Invece di prendi …'
        # incluse). Serve l'input del giocatore; nelle regole d'autore vale il
        # canonico (come per gli alias di oggetto).
        self.sinonimi_verbo: Dict[str, str] = {}
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
        # [1.3.0 / M-10] Argomenti di conversazione ('Se chiedi alla guardia di
        # "chiave": …'), in ordine di dichiarazione.
        self.argomenti: List['Argomento'] = []
        # [1.3.0 / M-6] Presentazione: titolo, autore, prologo; messaggi del
        # motore ridefiniti dall'autore; condizioni compilate dei testi
        # condizionali '[se …]…[altrimenti]…[fine]' (sorgente -> Condizione).
        self.titolo: Optional[str] = None
        self.autore: Optional[str] = None
        self.prologo: Optional[str] = None
        self.messaggi: Dict[str, str] = {}
        self.condizioni_testo: Dict[str, 'Condizione'] = {}
        # [1.3.0] Parti di stato che la storia può cambiare e che le versioni
        # precedenti non conoscevano: entrano nell'impronta solo se servono,
        # così i salvataggi delle storie che non le usano restano validi.
        self._stato_esteso: Set[str] = set()
        # [1.3.0 / L-6] Il file della storia (per riconoscerla nei salvataggi
        # anche quando è stata corretta dopo il salvataggio).
        self.file_storia: Optional[str] = None
        # [1.3.0 / M-8] 'Le uscite nominano solo le stanze visitate.': la riga
        # «Uscite:» tace il nome delle stanze non ancora viste.
        self.uscite_solo_visitate: bool = False
        self.stanze_visitate: Set[str] = set()
        self.dialogo_attivo: Optional[str] = None
        self.nodo_dialogo: Optional[str] = None
        # [0.20.0 / A1] Anafora: l'ULTIMO oggetto riferito, indicizzato per
        # genere/numero, così 'prendila' (f.sing.) e 'aprilo' (m.sing.) rimandano
        # all'oggetto giusto anche se ne sono stati nominati di generi diversi. Un
        # oggetto «diventa riferito» quando il giocatore vi agisce con successo o
        # quando il motore lo nomina (elenco della stanza). Stato RUNTIME.
        self.ultimo_riferito: Dict[str, Optional[str]] = {
            "m_sing": None, "f_sing": None, "m_plur": None, "f_plur": None}
        # [0.21.0 / A3] Comandi di servizio. 'ultimo_comando' = ultimo comando
        # del giocatore che ha consumato un turno (per ANCORA); '_storia_stati' =
        # pila di istantanee profonde dello stato PRIMA di ogni turno (per ANNULLA).
        # La pila è stato di sessione; 'ultimo_comando' dalla 1.2.1 entra nelle
        # istantanee (ANNULLA lo riporta indietro).
        self.ultimo_comando: Optional[str] = None
        self._storia_stati: List[dict] = []
        # [0.27.0 / D-dialogo] Istantanea pre-dialogo messa da parte mentre una
        # conversazione è in corso: l'INTERA conversazione (con le sue conseguenze
        # 'e adesso …') è un solo passo di ANNULLA. Stato di sessione, sempre None
        # tra un turno e l'altro → escluso dalle istantanee.
        self._snap_dialogo: Optional[dict] = None
        # [1.2.0] SALVA/CARICA. Il salvataggio è la sequenza EFFETTIVA dei comandi
        # (i turni disfatti con ANNULLA ne escono, ANCORA vi entra col comando che
        # ripete): il motore è deterministico, quindi rigiocarla su un mondo
        # appena compilato riproduce lo stato. Tutto stato di SESSIONE, escluso
        # dalle istantanee (vedi _CAMPI_VOLATILI):
        #  - _registro_comandi: la sequenza;
        #  - _pos_registro: per ogni istantanea di ANNULLA, la lunghezza della
        #    sequenza prima del suo turno (allineata a _storia_stati);
        #  - _reg_ingresso_dialogo: lunghezza all'ingresso della conversazione in
        #    corso (una conversazione è un solo passo di ANNULLA);
        #  - _stato_iniziale / _impronta_iniziale: il mondo a partita non ancora
        #    cominciata, da cui CARICA riparte senza ricompilare;
        #  - _senza_istantanee: vero mentre CARICA rigioca la testa della sequenza
        #    (niente copia profonda a ogni turno).
        self._registro_comandi: List[str] = []
        self._pos_registro: List[int] = []
        self._reg_ingresso_dialogo: Optional[int] = None
        self._stato_iniziale: Optional[dict] = None
        self._impronta_iniziale: Optional[str] = None
        self._senza_istantanee: bool = False
        # [1.2.0] Dove SALVA/CARICA leggono e scrivono (oggetto con .scrivi(nome,
        # testo) e .leggi(nome) -> testo|None). None = scelta automatica del motore
        # (file nella cartella di lavoro; localStorage nel browser). Un host può
        # fornirne uno suo.
        self.archivio_salvataggi = None
        # [0.22.0 / A2] Generatore casuale del mondo, con seme fisso: alimenta le
        # descrizioni 'è una di: …' in modo RIPRODUCIBILE. È stato del mondo →
        # catturato/ripristinato dalle istantanee di ANNULLA (l'undo riavvolge
        # anche la casualità) e pronto per il giocatore-robot (B1).
        self.rng = random.Random(SEME_CASUALE_DEFAULT)
        # [0.25.0 / A5] Coda degli annunci di movimento degli NPC visibili al
        # giocatore (l'NPC esce dalla sua stanza o vi entra). Le conseguenze
        # restano «pure» (non stampano): il loop di gioco svuota e stampa questa
        # coda dopo aver eseguito le conseguenze. È stato di sessione, sempre vuoto
        # fra un turno e l'altro → escluso dalle istantanee di ANNULLA.
        self.annunci: List[str] = []
        # [1.4.0 / L-7] Dove va ciò che il motore dice al giocatore: un'Uscita di
        # favella_utils (terminale, raccolta, muta…). None = il terminale. La
        # sceglie l'host (IDE, sito, pagina esportata); fuori dalle istantanee.
        self.uscita = None
        # [1.4.0] PULSANTI-VERBO. Come il giocatore dà i comandi nelle pagine che
        # li mostrano: 'entrambi' (campo di testo e pulsanti, il predefinito),
        # 'pulsanti' (solo pulsanti), 'testo' (solo campo di testo). Vedi
        # 'I comandi si scrivono.' e gioco.pulsanti().
        self.modo_comandi: str = "entrambi"
        # [1.4.0] Ciò che il giocatore ha SCOPERTO scrivendo: i verbi d'autore
        # che ha usato e gli argomenti di cui ha chiesto (id personaggio, chiave).
        # Con il campo di testo accanto, i pulsanti non svelano ciò che l'autore
        # ha inventato finché il giocatore non l'ha trovato da sé. È memoria del
        # giocatore, non del mondo: ANNULLA non la cancella.
        self.verbi_scoperti: Set[str] = set()
        self.argomenti_scoperti: Set[tuple] = set()
        # [1.5.0 / L18] Le impronte di partenza che un salvataggio può portare.
        self._impronte_accettate: Set[str] = set()
        self._partenza_dopo_apertura: bool = False
        # [1.5.0 / C2] Stati CALCOLATI: 'La protezione è attiva quando …'. Nome ->
        # elenco di (valore, Condizione) nell'ordine della storia: vale il primo la
        # cui condizione è vera, altrimenti nessuno (None). Dato statico.
        self.stati_calcolati: Dict[str, List[tuple]] = {}
        # [1.5.0 / C9] Testi con un nome: 'Il testo "presa" è "…".' (nome -> testo).
        self.testi: Dict[str, str] = {}
        # [1.5.0 / C3] Ciò che 'per la prima volta' ha già consumato: coppie
        # (tipo, indice) con tipo 'regola', 'demone' o 'arrivo'. Stato del mondo:
        # entra in ANNULLA, nei salvataggi e, per le storie che lo usano,
        # nell'impronta.
        self.prime_volte: Set[tuple] = set()
        self._calcolo_in_corso: Set[str] = set()
        # [1.5.0 / C10] Le azioni che non fanno passare il tempo
        # ('"esamina" non fa passare il tempo.'). Dato statico.
        self.azioni_senza_tempo: Set[str] = set()
        # [1.5.0 / C11] Segnali per l'ospite accodati dalle conseguenze
        # ('segnala "gemito"'): sessione, come gli annunci.
        self.segnali: List[str] = []
        # [1.5.0 / C13] Uscite con una condizione: (stanza, direzione) ->
        # (Condizione, testo per chi prova a passare quando è chiusa, o None).
        self.condizioni_uscite: Dict[tuple, tuple] = {}
        # [1.5.0 / C12] Gli arrivi: 'Quando il giocatore entra nella stiva: …'.
        self.arrivi: List['Arrivo'] = []
        # [1.5.0] La riga di stato ('La riga di stato è "…".') e l'IFID.
        self.riga_stato: Optional[str] = None
        self.ifid: Optional[str] = None
        # [1.5.0 / D] 'I demoni guardano la fine del turno.': i fronti dei demoni si
        # rivalutano sullo stato di fine turno e alla chiusura di un dialogo (vedi
        # gioco._rivaluta_fronti). Spento senza la frase: cambierebbe il ritmo di
        # storie già scritte (Il Viaggiatore, Cuori al caffè).
        self.fronti_a_fine_turno: bool = False

    def valore_variabile(self, nome: str):
        """[1.5.0 / C2] Il valore di uno stato: quello assegnato o, per uno stato
        calcolato, il valore della prima delle sue condizioni che è vera (None se
        nessuna lo è). Un ciclo fra stati calcolati (rifiutato dal compilatore)
        qui vale None invece di non finire."""
        regole = self.stati_calcolati.get(nome)
        if regole is None:
            return self.variabili.get(nome)
        in_corso = self._calcolo_in_corso
        if nome in in_corso:
            return None
        in_corso.add(nome)
        try:
            for valore, condizione in regole:
                if condizione.valuta(self):
                    return valore
            return None
        finally:
            in_corso.discard(nome)

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

    def dichiara_relazione(self, relazione: 'Relazione'):
        """[1.6.0 / B3] Registra una relazione nominata (l'ultima dichiarazione per
        quel nome-locuzione vince; le eventuali coppie già asserite si conservano)."""
        esistente = self.relazioni.get(relazione.nome)
        if esistente is not None:
            relazione.coppie |= esistente.coppie
        self.relazioni[relazione.nome] = relazione

    def scrivi_variabile(self, nome: str, valore):
        """[1.6.0 / Q1] Unico punto di scrittura di uno stato/contatore: imposta il
        valore e poi applica l'eventuale invariante di clamp dichiarata ('X resta
        sempre fra A e B'). Ogni conseguenza che muta un contatore (aumenta,
        diminuisci, diventa, moltiplica, dividi, modulo, copia, scelta, limita)
        passa di qui, così l'invariante vale dopo OGNI scrittura."""
        self.variabili[nome] = valore
        if self.invarianti_clamp:
            self._applica_invariante_clamp(nome)

    def _applica_invariante_clamp(self, nome: str):
        """Riporta il contatore `nome` dentro l'intervallo della sua invariante, se
        ne ha una. Agisce solo su valori interi (uno stato simbolico non si
        clampa). Gli estremi sono Operando: possono leggere altri contatori
        ('[soglia]'), risolti al momento della scrittura."""
        limiti = self.invarianti_clamp.get(nome)
        if limiti is None:
            return
        attuale = self.variabili.get(nome)
        if not isinstance(attuale, int):
            return
        basso, alto = limiti[0].valore(self), limiti[1].valore(self)
        if basso > alto:
            basso, alto = alto, basso
        corretto = max(basso, min(alto, attuale))
        if corretto != attuale:
            self.variabili[nome] = corretto

    def applica_invarianti_iniziali(self):
        """[1.6.0 / Q1] Applica ogni invariante di clamp ai valori INIZIALI dei
        contatori, una volta sola a fine compilazione: anche 'La forza parte da
        150.' con 'La forza resta sempre fra 0 e 100.' nasce già nell'intervallo."""
        for nome in self.invarianti_clamp:
            self._applica_invariante_clamp(nome)

    def dichiara_opposte(self, prop_a: str, prop_b: str):
        """Registra che due proprietà sono opposte (relazione simmetrica). Le
        forme restano come scritte dall'autore (servono all'IDE per la lista delle
        coppie); il confronto a runtime è poi per RADICE (vedi radici_opposte)."""
        self.opposti.setdefault(prop_a, set()).add(prop_b)
        self.opposti.setdefault(prop_b, set()).add(prop_a)

    def radici_opposte(self, prop: str) -> Set[str]:
        """[Concordanza] Insieme delle RADICI opposte a `prop`, confrontando le
        coppie dichiarate per radice anziché alla lettera. Così 'aperto' trova
        l'opposta 'chiusa' (dichiarata aperta↔chiusa) anche se cambia il genere."""
        r = radice_proprieta(prop)
        out: Set[str] = set()
        for chiave, opposte in self.opposti.items():
            if radice_proprieta(chiave) == r:
                out.update(radice_proprieta(o) for o in opposte)
        return out

    def dichiara_alias(self, alias: str, id_canonico: str):
        """[Livello 4] Registra un nome alternativo per un oggetto. Entrambi gli
        argomenti sono già normalizzati. L'ultimo che vince in caso di collisione."""
        self.alias[alias] = id_canonico

    # [0.21.0 / A3] Campi ESCLUSI dalle istantanee di ANNULLA: i riferimenti
    # statici (azioni/mappe, immutabili dopo la compilazione) e lo stato di
    # sessione (la cronologia stessa). Tutto il resto — stanze, oggetti,
    # inventario, variabili, demoni, posizione, turno — è stato mutabile e viene
    # catturato/ripristinato fedelmente.
    # [1.2.1] 'ultimo_comando' è uscito da qui: ANNULLA riporta anche la memoria
    # di ANCORA, così dopo 'prendi X', 'annulla', 'ancora' non si rifà il turno
    # appena disfatto ma quello precedente.
    _CAMPI_VOLATILI = ("_storia_stati", "azioni",
                       "mappa_verbi_giocatore", "azioni_del_verbo",
                       "annunci", "_snap_dialogo",
                       # [1.3.0] sessione del comando in corso
                       "_turno_libero", "_in_conferma", "_uscita_richiesta",
                       "_azione_riuscita", "_ambiguita", "_usa_in_sospeso",
                       "_quantita_comando",
                       "_regola_scattata", "_modo_spostamento",
                       "_consultazione", "_regola_cambia",
                       # [1.2.0] sessione di SALVA/CARICA
                       "_registro_comandi", "_pos_registro", "_reg_ingresso_dialogo",
                       "_stato_iniziale", "_impronta_iniziale", "_senza_istantanee",
                       "archivio_salvataggi",
                       # [1.5.0 / L18] le impronte di partenza che un salvataggio
                       # può portare (anche quella che dava la 1.4)
                       "_impronte_accettate",
                       # [1.5.0] i segnali per l'ospite (come gli annunci) e il
                       # calcolo in corso degli stati calcolati
                       "segnali", "_calcolo_in_corso", "_partenza_dopo_apertura",
                       # [1.6.0 / C1] la pila di ricorsione delle procedure in corso
                       "_procedure_in_corso",
                       # [1.4.0] l'uscita dell'host e ciò che il giocatore ha scoperto
                       "uscita", "verbi_scoperti", "argomenti_scoperti")

    # [1.3.0 / L-5] Campi STATICI: scritti dal compilatore e mai cambiati in
    # partita (regole, eventi, dialoghi, argomenti, vocabolario, messaggi).
    # Restano fuori dalle istantanee: ripristina_stato non li tocca. Sul
    # Viaggiatore un'istantanea pesava circa 96 KiB, quasi tutti di regole.
    _CAMPI_STATICI = ("regole", "eventi", "dialogo_nodi", "argomenti", "condizioni_testo",
                      "messaggi", "titolo", "autore", "prologo", "_stato_esteso",
                      "verbi_personalizzati", "verbi_intransitivi", "sinonimi_verbo",
                      "alias", "opposti", "direzioni", "opposte_direzioni", "file_storia",
                      "modo_comandi",
                      # [1.5.0] le frasi nuove che non cambiano in partita
                      "stati_calcolati", "testi", "azioni_senza_tempo",
                      "arrivi", "riga_stato", "ifid",
                      "fronti_a_fine_turno",
                      # [1.6.0 / B3] la struttura delle relazioni e gli elenchi di
                      # testo risolti sono statici; lo STATO (le coppie) sta dentro
                      # i Relazione, che restano nell'istantanea come 'relazioni'.
                      "liste_relazione",
                      # [1.6.0 / C1] i corpi delle procedure sono statici.
                      "procedure",
                      # [1.6.0 / B1] la mappa plurale->canonico è statica (le
                      # QUANTITÀ, invece, vivono su Oggetto.quantita e sono catturate
                      # dall'istantanea come il resto dello stato degli oggetti).
                      "plurali")

    def cattura_stato(self) -> dict:
        """[0.21.0 / A3] Istantanea profonda dello stato MUTABILE del mondo, per
        l'ANNULLA. Un'unica deepcopy preserva l'identità condivisa fra gli oggetti
        (es. lo stesso Oggetto in mondo.oggetti e in stanza.oggetti)."""
        salvati = {k: self.__dict__.pop(k)
                   for k in self._CAMPI_VOLATILI + self._CAMPI_STATICI if k in self.__dict__}
        try:
            return copy.deepcopy(self.__dict__)
        finally:
            self.__dict__.update(salvati)

    def ripristina_stato(self, snap: dict):
        """[0.21.0 / A3] Ripristina lo stato catturato da cattura_stato(). I campi
        volatili (azioni, mappe, cronologia) non sono nell'istantanea e restano
        intatti: il mondo torna indietro nel tempo senza perdere le sue azioni."""
        self.__dict__.update(snap)

    def registra_riferito(self, id_oggetto: str):
        """[0.20.0 / A1] Registra l'oggetto come ULTIMO RIFERITO del suo
        genere/numero, per risolvere i pronomi anaforici ('prendila'). Gli oggetti
        senza genere/numero inferibile (nome senza articolo) sono ignorati: non
        sono raggiungibili da un pronome, ma il loro nome resta sempre usabile."""
        from favella_utils import chiave_genere_numero
        oggetto = self.trova_oggetto(id_oggetto)
        if not oggetto:
            return
        chiave = chiave_genere_numero(oggetto.nome_visualizzato)
        if chiave:
            self.ultimo_riferito[chiave] = id_oggetto

    def registra_riferiti_da_stanza(self):
        """[0.20.0 / A1] Registra come riferibili dai pronomi gli oggetti visibili
        nella stanza corrente, nell'ordine di dichiarazione: l'ultimo di ogni
        genere/numero vince. Chiamato quando il motore mostra/elenca la stanza."""
        stanza = self.trova_stanza(self.posizione_giocatore)
        if not stanza:
            return
        for id_ogg in stanza.oggetti:
            self.registra_riferito(id_ogg)

    def dichiara_verbo(self, verbo: str, intransitivo: bool = False):
        """[Livello 4] Registra un verbo personalizzato (parola-comando).
        [0.19.0 / A7] Se intransitivo, il verbo non richiede un oggetto bersaglio."""
        self.verbi_personalizzati.add(verbo)
        if intransitivo:
            self.verbi_intransitivi.add(verbo)

    def dichiara_sinonimo(self, sinonimo: str, verbo_canonico: str):
        """[0.26.0 / A6] Registra un sinonimo di verbo: la parola-nuova rimanda a
        un verbo di libreria. Entrambi già normalizzati (lowercase)."""
        self.sinonimi_verbo[sinonimo] = verbo_canonico

    def _inizializza_direzioni_base(self):
        """[Livello 4 / L1] Precarica le direzioni di base (fonte unica in favella_utils)."""
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
        # [1.3.0] Ora che il giocatore ha un posto, i demoni 'Quando' registrano il
        # valore di partenza delle loro condizioni: una condizione già vera
        # all'avvio non è un fronte. Prima lo si faceva a fine compilazione, con
        # la posizione ancora vuota, e 'Quando il giocatore è in <partenza>'
        # scattava al primo turno.
        self.azzera_memoria_demoni()
        # [1.5.0 / L18] La stanza di partenza è vista fin dall'inizio (come la
        # segnerebbe la prima stanza mostrata, se non è al buio). Prima il punto di
        # partenza dei salvataggi la dava per mai vista: con 'Le uscite nominano
        # solo le stanze visitate' ogni salvataggio si caricava dicendo, a torto,
        # che la storia era cambiata. L'impronta di prima (1.4) resta accettata.
        impronta_della_1_4 = self.impronta_stato()
        if self.posizione_giocatore and self.c_e_luce():
            self.stanze_visitate.add(self.posizione_giocatore)
        # [1.2.0] Il mondo a partita non ancora cominciata: CARICA riparte da qui
        # e rigioca la sequenza salvata. L'impronta dice se un salvataggio è stato
        # fatto su questa stessa storia. [1.5.0] Gli ospiti che mostrano l'apertura
        # con gioco.apri_partita fissano il punto di partenza DOPO l'apertura.
        self._stato_iniziale = self.cattura_stato()
        self._impronta_iniziale = self.impronta_stato()
        self._impronte_accettate = {impronta_della_1_4, self._impronta_iniziale}
        self._partenza_dopo_apertura = False
        self._registro_comandi = []
        self._pos_registro = []
        self._reg_ingresso_dialogo = None

    def azzera_memoria_demoni(self):
        """[1.3.0] Registra, per ogni demone 'Quando', il valore attuale della
        sua condizione (il punto di partenza per riconoscere un fronte di
        salita). Valutare una condizione con 'càpita' pesca dal generatore: qui
        lo stato del generatore viene rimesso com'era, così la preparazione della
        partita non consuma il caso."""
        stato_caso = self.rng.getstate()
        try:
            for demone in self.demoni:
                if demone.tipo == "quando":
                    demone.era_vera = demone.condizione.valuta(self)
        finally:
            self.rng.setstate(stato_caso)

    def stato_essenziale(self) -> dict:
        """[1.2.0] Tutto ciò che distingue una partita dall'altra, in forma
        confrontabile (liste ordinate, repr dei valori): luogo, turno, esito,
        dialogo, inventario, variabili, oggetti (posizione, proprietà, spostato,
        contenuto), memoria dei demoni, stato del generatore casuale."""
        oggetti = []
        for o in self.oggetti.values():
            oggetti.append([o.nome, str(o.posizione), sorted(o.proprieta),
                            bool(getattr(o, "spostato", False)),
                            sorted(getattr(o, "contenuto", None) or [])])
        stanze_buie = sorted(s.nome for s in self.stanze.values()
                             if getattr(s, "buia", False))
        dati = {
            "luogo": self.posizione_giocatore,
            "turno": self.turno_corrente,
            "esito": self.stato_partita,
            "dialogo": [self.dialogo_attivo, self.nodo_dialogo],
            "inventario": sorted(self.inventario),
            "variabili": sorted([k, repr(v)] for k, v in self.variabili.items()),
            "oggetti": sorted(oggetti),
            "buio": stanze_buie,
            "demoni": [bool(getattr(d, "era_vera", False)) for d in self.demoni],
            "caso": repr(self.rng.getstate()),
        }
        # [1.3.0] Solo ciò che la storia usa (vedi _stato_esteso).
        estesi = getattr(self, "_stato_esteso", ())
        if "uscite" in estesi:
            dati["uscite"] = sorted([s.nome, sorted(s.uscite.items())] for s in self.stanze.values())
            if self.condizioni_uscite:   # [1.5.0 / C13]
                dati["uscite_con_condizione"] = sorted(list(k) for k in self.condizioni_uscite)
        if "prime_volte" in estesi:      # [1.5.0 / C3]
            dati["prime_volte"] = sorted(list(k) for k in self.prime_volte)
        if "prendibile" in estesi:
            dati["prendibili"] = sorted(o.nome for o in self.oggetti.values() if o.prendibile)
        if getattr(self, "uscite_solo_visitate", False):
            dati["visitate"] = sorted(self.stanze_visitate)
        if any(getattr(d, "tipo", "") == "dopo" for d in self.demoni):
            dati["conti"] = [getattr(d, "conto", None) for d in self.demoni]
        return dati

    def impronta_stato(self) -> str:
        """[1.2.0] Impronta SHA-256 dello stato essenziale: due partite con la
        stessa impronta sono, per il giocatore, la stessa partita."""
        dati = json.dumps(self.stato_essenziale(), sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(dati.encode("utf-8")).hexdigest()

    def carica_azioni(self, libreria: Dict[str, Azione]):
        """Carica la libreria di azioni e costruisce la mappa di ricerca inversa."""
        # [1.2.2] Una COPIA: più sotto vi si aggiungono le azioni dei verbi
        # d'autore. Fino alla 1.2.1 si scriveva nel dizionario globale della
        # libreria, e i verbi di una storia restavano attaccati alle storie
        # caricate dopo nello stesso processo (sito, IDE): dopo una storia con
        # '"leggi" è un comando.', in un'altra 'leggi il diario' non leggeva più.
        self.azioni = dict(libreria)
        self.azioni_del_verbo = {}
        # [1.3.0] Precedenza: prima le azioni storiche della libreria (un verbo
        # d'autore omonimo non le scavalca, come sempre), poi i verbi d'autore,
        # poi le azioni che CEDONO (i verbi aggiunti nella 1.3.0: chiudi, accendi,
        # aspetta…), che valgono solo per i verbi che l'autore non ha dichiarato.
        cedevoli = []
        for nome_azione, azione_obj in libreria.items():
            if getattr(azione_obj, "cede", False):
                cedevoli.append((nome_azione, azione_obj))
                continue
            for verbo in azione_obj.nomi:
                self.mappa_verbi_giocatore[verbo] = nome_azione
                self.azioni_del_verbo.setdefault(verbo, []).append(nome_azione)

        # [Livello 4] Instrada i verbi personalizzati a un'azione generica priva
        # di logica di default (logica=None): il runtime, se nessuna regola
        # 'Invece di' si attiva, stampa un messaggio neutro. setdefault: un verbo
        # custom non scavalca mai un verbo della libreria standard.
        # [0.19.0 / A7] I verbi custom si dividono in TRANSITIVI (richiedono un
        # oggetto: '_personalizzata') e INTRANSITIVI (nessun oggetto: la fase
        # globale di gioco.py li gestisce via 'Invece di [verbo]:').
        transitivi = sorted(self.verbi_personalizzati - self.verbi_intransitivi)
        intransitivi = sorted(self.verbi_intransitivi & self.verbi_personalizzati)
        if transitivi:
            self.azioni["_personalizzata"] = Azione(
                nomi=transitivi, logica=None, richiede_oggetto=True)
            for verbo in transitivi:
                self.mappa_verbi_giocatore.setdefault(verbo, "_personalizzata")
                self.azioni_del_verbo.setdefault(verbo, ["_personalizzata"])
        if intransitivi:
            self.azioni["_personalizzata_intransitiva"] = Azione(
                nomi=intransitivi, logica=None, richiede_oggetto=False)
            for verbo in intransitivi:
                self.mappa_verbi_giocatore.setdefault(verbo, "_personalizzata_intransitiva")
                self.azioni_del_verbo.setdefault(verbo, ["_personalizzata_intransitiva"])
        dell_autore = set(self.verbi_personalizzati) | set(getattr(self, "sinonimi_verbo", {}) or {})
        for nome_azione, azione_obj in cedevoli:
            for verbo in azione_obj.nomi:
                if verbo in dell_autore:
                    continue
                self.mappa_verbi_giocatore.setdefault(verbo, nome_azione)
                self.azioni_del_verbo.setdefault(verbo, []).append(nome_azione)

    # [1.2.2] Azioni generiche dei verbi d'autore: raccolgono verbi DIVERSI
    # ('spingi', 'tira'…), quindi non hanno un verbo principale né sinonimi.
    AZIONI_PERSONALIZZATE = ("_personalizzata", "_personalizzata_intransitiva")

    def azione_del_verbo(self, verbo: str, con_oggetto: bool) -> Optional[str]:
        """[1.2.2] L'azione che il verbo del giocatore compie. Un verbo elencato da
        due azioni ('guarda', 'osserva') si risolve con l'argomento del comando:
        con un oggetto vale l'azione che lo richiede (esaminare), senza vale
        quella che non lo richiede (guarda la stanza). Fino alla 1.2.1 vinceva
        sempre l'ultima azione della libreria, e 'guarda il quadro' ristampava
        la stanza senza guardare il quadro. None se il verbo è ignoto."""
        candidate = getattr(self, "azioni_del_verbo", None) or {}
        nomi = candidate.get(verbo)
        if nomi and len(nomi) > 1:
            for nome in nomi:
                azione = self.azioni.get(nome)
                if azione is not None and azione.richiede_oggetto == con_oggetto:
                    return nome
        return self.mappa_verbi_giocatore.get(verbo)

    def verbo_principale(self, nome_azione: Optional[str]) -> Optional[str]:
        """[1.2.2] Il verbo principale di un'azione della libreria (il primo dei
        suoi nomi: 'prendi' per «prendere»). Una regola scritta con questo verbo
        vale per tutti i sinonimi dell'azione. None per le azioni dei verbi
        d'autore, che non hanno sinonimi (vedi AZIONI_PERSONALIZZATE)."""
        if not nome_azione or nome_azione in self.AZIONI_PERSONALIZZATE:
            return None
        azione = self.azioni.get(nome_azione)
        return azione.nomi[0] if azione is not None and azione.nomi else None

    def aggiungi_regola(self, regola: Regola):
        self.regole.append(regola)

    def aggiungi_evento(self, evento: 'Evento'):
        self.eventi.append(evento)

    def aggiungi_demone(self, demone: 'Demone'):
        demone.indice = len(self.demoni)   # [1.5.0 / C3] chiave di 'per la prima volta'
        self.demoni.append(demone)

    def aggiungi_arrivo(self, arrivo: 'Arrivo'):
        """[1.5.0 / C12] 'Quando il giocatore entra in …'."""
        arrivo.indice = len(self.arrivi)
        self.arrivi.append(arrivo)

    def uscita_aperta(self, id_stanza: str, direzione: str) -> bool:
        """[1.5.0 / C13] L'uscita c'è e, se ha una condizione, la condizione è
        vera adesso. Un'uscita chiusa non si vede e non si passa."""
        stanza = self.stanze.get(id_stanza)
        if stanza is None or direzione not in stanza.uscite:
            return False
        regola = self.condizioni_uscite.get((id_stanza, direzione))
        if regola is None:
            return True
        # Guardare le uscite non consuma il caso (una condizione con 'càpita').
        stato_caso = self.rng.getstate()
        try:
            return bool(regola[0].valuta(self))
        finally:
            self.rng.setstate(stato_caso)

    def uscite_visibili(self, id_stanza: str) -> Dict[str, str]:
        """[1.5.0 / C13] Le uscite della stanza che il giocatore vede adesso."""
        stanza = self.stanze.get(id_stanza)
        if stanza is None:
            return {}
        if not self.condizioni_uscite:
            return stanza.uscite
        return {d: s for d, s in stanza.uscite.items() if self.uscita_aperta(id_stanza, d)}

    def aggiungi_stanza(self, stanza: Stanza):
        self.stanze[stanza.nome] = stanza

    def aggiungi_oggetto(self, oggetto: Oggetto):
        self.oggetti[oggetto.nome] = oggetto

    def trova_stanza(self, nome: str) -> Stanza | None:
        return self.stanze.get(nome)

    def trova_oggetto(self, nome: str) -> Oggetto | None:
        oggetto = self.oggetti.get(nome)
        if oggetto is None and self.plurali:
            # [1.6.0 / B1] La forma plurale dichiarata ('pozioni') risolve
            # all'oggetto canonico ('pozione').
            oggetto = self.oggetti.get(self.plurali.get(nome, nome))
        return oggetto

    # --- [1.6.0 / B1] Oggetti contabili: quantità per luogo --------------------

    def canonizza(self, id_oggetto: str) -> str:
        """[1.6.0 / B1] Riporta una forma plurale dichiarata all'id canonico; ogni
        altro id resta com'è."""
        return self.plurali.get(id_oggetto, id_oggetto)

    def quantita_in(self, id_oggetto: str, luogo: str) -> int:
        """Quante copie di un contabile stanno nel luogo dato ('inventario', un id
        di stanza o di contenitore/supporto). 0 se nessuna."""
        oggetto = self.trova_oggetto(id_oggetto)
        if oggetto is None:
            return 0
        return oggetto.quantita.get(luogo, 0)

    def quantita_posseduta(self, id_oggetto: str) -> int:
        """Quante copie di un contabile il giocatore ha in inventario."""
        return self.quantita_in(id_oggetto, "inventario")

    def quantita_totale(self, id_oggetto: str) -> int:
        """Quante copie di un contabile esistono in tutto il mondo."""
        oggetto = self.trova_oggetto(id_oggetto)
        if oggetto is None:
            return 0
        return sum(oggetto.quantita.values())

    def _sincronizza_presenza_contabile(self, oggetto: 'Oggetto'):
        """Allinea i marker di presenza standard (inventario, stanza.oggetti,
        contenuto dei contenitori/supporti) e 'posizione' alle QUANTITÀ correnti di
        un contabile, così la visibilità e la raggiungibilità esistenti valgono
        senza modifiche. Un luogo con 0 copie sparisce dai marker."""
        id_ogg = oggetto.nome
        # togli le copie azzerate
        for luogo in [l for l, n in oggetto.quantita.items() if n <= 0]:
            oggetto.quantita.pop(luogo, None)
        luoghi = set(oggetto.quantita)
        # inventario
        if "inventario" in luoghi:
            self.inventario.add(id_ogg)
        else:
            self.inventario.discard(id_ogg)
        # stanze e contenitori/supporti
        for sid, stanza in self.stanze.items():
            if sid in luoghi:
                stanza.oggetti[id_ogg] = oggetto
            else:
                stanza.oggetti.pop(id_ogg, None)
        for altro in self.oggetti.values():
            if altro is oggetto:
                continue
            if (altro.is_contenitore or altro.is_supporto):
                if altro.nome in luoghi:
                    altro.contenuto.add(id_ogg)
                else:
                    altro.contenuto.discard(id_ogg)
        # posizione «primaria» (per il codice che la legge): inventario se c'è,
        # altrimenti un luogo qualsiasi con copie, altrimenti None.
        if "inventario" in luoghi:
            oggetto.posizione = "inventario"
        elif luoghi:
            oggetto.posizione = sorted(luoghi)[0]
        else:
            oggetto.posizione = None
        if luoghi:
            oggetto.spostato = True

    def imposta_quantita(self, id_oggetto: str, luogo: str, n: int):
        """Fissa a `n` le copie di un contabile nel luogo dato (n<=0 = nessuna) e
        risincronizza i marker di presenza."""
        oggetto = self.trova_oggetto(id_oggetto)
        if oggetto is None:
            return
        if n > 0:
            oggetto.quantita[luogo] = n
        else:
            oggetto.quantita.pop(luogo, None)
        self._sincronizza_presenza_contabile(oggetto)

    def aggiungi_quantita(self, id_oggetto: str, luogo: str, n: int = 1):
        """Aggiunge `n` copie al luogo dato."""
        self.imposta_quantita(id_oggetto, luogo, self.quantita_in(id_oggetto, luogo) + n)

    def togli_quantita(self, id_oggetto: str, luogo: str, n: int = 1):
        """Toglie fino a `n` copie dal luogo dato (non scende sotto zero).
        Restituisce quante ne ha davvero tolte."""
        attuali = self.quantita_in(id_oggetto, luogo)
        tolte = min(n, attuali)
        if tolte:
            self.imposta_quantita(id_oggetto, luogo, attuali - tolte)
        return tolte

    def luogo_scorta_raggiungibile(self, id_oggetto: str) -> Optional[str]:
        """[1.6.0 / B1] Il luogo RAGGIUNGIBILE (non l'inventario) in cui stanno copie
        di un contabile da prendere: la stanza corrente o un contenitore/supporto
        raggiungibile lì. None se non c'è nulla da prendere qui."""
        oggetto = self.trova_oggetto(id_oggetto)
        if oggetto is None or not oggetto.contabile:
            return None
        candidati = [l for l, n in oggetto.quantita.items() if n > 0 and l != "inventario"]
        for luogo in candidati:
            if luogo == self.posizione_giocatore:
                return luogo
        # dentro un contenitore/supporto raggiungibile
        for luogo in candidati:
            contenitore = self.trova_oggetto(luogo)
            if contenitore is not None and self.oggetto_raggiungibile(luogo):
                return luogo
        return None

    # --- [Livello 7] Capacità di trasporto ---

    def capacita_attuale(self) -> Optional[int]:
        """Numero massimo di oggetti trasportabili in questo momento: la base più
        i bonus degli oggetti attualmente nell'inventario (es. uno zaino). None se
        l'autore non ha dichiarato alcuna capacità (inventario illimitato)."""
        if self.capacita_base is None:
            return None
        bonus = sum(self.oggetti[i].bonus_capacita
                    for i in self.inventario if i in self.oggetti)
        return self.capacita_base + bonus

    def puo_portare_altro(self) -> bool:
        """Vero se il giocatore ha ancora un posto libero. Senza capacità
        dichiarata è sempre vero (illimitato). [1.2.2] Conta tutto ciò che il
        giocatore porta, anche dentro zaini e borse (numero_oggetti_portati)."""
        cap = self.capacita_attuale()
        return cap is None or self.numero_oggetti_portati() < cap

    # --- [1.2.2] Ciò che il giocatore ha addosso -------------------------------
    # Fino alla 1.2.1 «avere» voleva dire «stare nell'inventario»: una chiave
    # messa nello zaino che il giocatore porta non contava per 'il giocatore ha
    # la chiave', e la capienza contava solo gli oggetti in mano, così uno zaino
    # contenitore portava oggetti senza limite. Ora si possiede ciò che si ha
    # ADDOSSO: l'inventario più, a ogni livello, quello che sta dentro o sopra
    # gli oggetti portati (anche in un contenitore chiuso: ce l'hai, anche se
    # per usarlo devi aprirlo).

    def racchiusi_in(self, id_oggetto: str) -> Set[str]:
        """Gli oggetti dentro o sopra `id_oggetto`, a ogni livello di
        annidamento (l'oggetto stesso escluso; cicli patologici ignorati)."""
        risultato: Set[str] = set()
        ogg = self.trova_oggetto(id_oggetto)
        coda = list(ogg.contenuto) if ogg is not None else []
        while coda:
            c = coda.pop()
            if c in risultato or c == id_oggetto:
                continue
            risultato.add(c)
            figlio = self.trova_oggetto(c)
            if figlio is not None:
                coda += list(figlio.contenuto)
        return risultato

    def oggetti_portati(self) -> Set[str]:
        """Tutto ciò che il giocatore ha addosso: l'inventario e il contenuto,
        a ogni livello, degli oggetti portati."""
        portati: Set[str] = set(self.inventario)
        for id_ogg in list(self.inventario):
            portati |= self.racchiusi_in(id_ogg)
        return portati

    def contenitori_di(self, id_oggetto: str) -> List[str]:
        """[1.3.0] Tutto ciò che contiene l'oggetto, dal più vicino al più
        lontano: contenitori, supporti, personaggi e infine la stanza (o
        'inventario'). La chiave nella scatola sul tavolo in cucina →
        ['scatola', 'tavolo', 'cucina']."""
        catena, visti = [], set()
        oggetto = self.trova_oggetto(id_oggetto)
        pos = oggetto.posizione if oggetto else None
        while pos and pos not in visti:
            visti.add(pos)
            catena.append(pos)
            if pos in self.stanze or pos == "inventario":
                break
            contenitore = self.trova_oggetto(pos)
            pos = contenitore.posizione if contenitore else None
        return catena

    def stanza_di(self, id_oggetto: str) -> Optional[str]:
        """[1.3.0] La stanza in cui si trova l'oggetto, attraverso contenitori,
        supporti e personaggi; per ciò che il giocatore porta, la sua stanza."""
        catena = self.contenitori_di(id_oggetto)
        if not catena:
            return None
        ultimo = catena[-1]
        if ultimo == "inventario":
            return self.posizione_giocatore
        return ultimo if ultimo in self.stanze else None

    def oggetti_anche_qui(self) -> List['Oggetto']:
        """[1.3.0 / M-8] Gli oggetti presenti ANCHE nella stanza del giocatore
        ('Il cielo è anche nel cortile.'), nell'ordine della storia."""
        stanza = self.posizione_giocatore
        return [o for o in self.oggetti.values()
                if stanza in o.anche_in and o.posizione != stanza]

    def giocatore_possiede(self, id_oggetto: str) -> bool:
        """Vero se il giocatore ha l'oggetto addosso (vedi oggetti_portati). È
        la semantica di 'se il giocatore ha X'."""
        if id_oggetto in self.inventario:
            return True
        return id_oggetto in self.oggetti_portati()

    def numero_oggetti_portati(self) -> int:
        """Quanti oggetti pesano sulla capienza: tutti quelli addosso."""
        return len(self.oggetti_portati())

    def puo_prendere(self, oggetto: 'Oggetto') -> bool:
        """Vero se la capienza permette di prendere `oggetto`. Senza capacità
        dichiarata è sempre vero. Serve un posto libero, come sempre; in più,
        dopo la presa, tutto ciò che si porta (l'oggetto e quello che contiene)
        deve stare nella capienza, contando il bonus dell'oggetto stesso: uno
        zaino che «dà 5 spazi» copre il proprio contenuto. Tirare fuori un
        oggetto da una borsa che si porta non aggiunge nulla."""
        cap = self.capacita_attuale()
        if cap is None or self.giocatore_possiede(oggetto.nome):
            return True
        portati = self.numero_oggetti_portati()
        if portati >= cap:
            return False
        dopo = portati + 1 + len(self.racchiusi_in(oggetto.nome))
        return dopo <= cap + (getattr(oggetto, "bonus_capacita", 0) or 0)

    # --- [0.24.0 / A4] Buio e luce ---

    def _fonte_di_luce_accesa(self, oggetto: 'Oggetto') -> bool:
        """Vero se l'oggetto è una fonte di luce attiva: ha la capacità 'illumina'
        e non è «spento». L'interazione con le opposte accesa/spenta è per RADICE
        (folding 'spent-'), così 'spenta'/'spento'/'spenti' contano tutte; una
        torcia senza stato accesa/spenta illumina sempre."""
        if not getattr(oggetto, "illumina", False):
            return False
        r_spenta = radice_proprieta("spenta")
        return not any(radice_proprieta(p) == r_spenta for p in oggetto.proprieta)

    def c_e_luce(self) -> bool:
        """Vero se il giocatore può vedere nella stanza corrente: la stanza non è
        buia, OPPURE è raggiungibile una fonte di luce accesa (in mano, nella
        stanza, o dentro un contenitore aperto / su un supporto). Un oggetto
        luminoso è di per sé visibile (rischiara), quindi conta anche se è a terra
        in una stanza buia; una fonte dentro un contenitore CHIUSO non illumina
        (oggetti_raggiungibili la esclude già)."""
        stanza = self.trova_stanza(self.posizione_giocatore)
        if stanza is None or not getattr(stanza, "buia", False):
            return True
        for id_ogg in self.oggetti_raggiungibili():
            oggetto = self.trova_oggetto(id_ogg)
            if oggetto and self._fonte_di_luce_accesa(oggetto):
                return True
        return False

    # --- [Livello 4 / M1] Contenitori e supporti: raggiungibilità ---

    def contenitore_aperto(self, oggetto: 'Oggetto') -> bool:
        """Un contenitore è aperto (contenuto visibile) finché non è 'chiusa'.
        [Concordanza] Il confronto è per RADICE: vale anche 'chiuso'/'chiusi'."""
        r_chiusa = radice_proprieta("chiusa")
        return not any(radice_proprieta(p) == r_chiusa for p in oggetto.proprieta)

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
        if oggetto.contabile:
            # [1.6.0 / B1] Un contabile è alla portata se ha copie in inventario,
            # nella stanza corrente, o in un contenitore/supporto raggiungibile lì
            # (le copie possono essere sparse in più luoghi: non basta 'posizione').
            id_ogg = oggetto.nome
            if oggetto.quantita.get("inventario", 0) > 0:
                return True
            if oggetto.quantita.get(self.posizione_giocatore, 0) > 0:
                return True
            for luogo, n in oggetto.quantita.items():
                if n > 0 and luogo not in ("inventario",) and luogo not in self.stanze:
                    if self.oggetto_raggiungibile(luogo, _visti):
                        return True
            return False
        if id_oggetto in self.inventario:
            return True
        pos = oggetto.posizione
        if pos == self.posizione_giocatore or self.posizione_giocatore in oggetto.anche_in:
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
            coda += [o.nome for o in self.oggetti_anche_qui()]
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
        oggetto.spostato = True   # [1.1.0] il posto iniziale non vale più
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
            f"[FAVELLA 1] Report di compilazione (v{VERSIONE_MOTORE}):\n"
            f"  - Stanze: {len(self.stanze)}\n"
            f"  - Oggetti: {len(self.oggetti)}\n"
            f"  - Personaggi: {n_personaggi} (nodi di dialogo: {len(self.dialogo_nodi)})\n"
            f"  - Stati: {len(self.variabili)}\n"
            f"  - Regole: {len(self.regole)}\n"
            f"  - Eventi: {len(self.eventi)}\n"
            f"  - Demoni: {len(self.demoni)}\n"
        )
        if self.posizione_giocatore:
            report += f"  - Posizione iniziale: '{self.posizione_giocatore}'"
        return report

# compilatore.py
# Micro-Compilatore Formale per FAVELLA 1 (v0.5.0)
# Usa Lark per generare un AST (Abstract Syntax Tree) senza regex.

import re
from lark import Lark, Transformer, v_args
from lark.exceptions import UnexpectedInput
from strutture import Mondo, Stanza, Oggetto, Regola, CondizionePossesso, CondizioneProprieta, ConseguenzaProprieta, ConseguenzaSpostamento
from libreria_azioni import LIBRERIA_AZIONI
from utils import normalizza_nome
import sys

# Vocabolario chiuso dei verbi riconosciuti dal motore di gioco. Serve per
# validare a compile-time i verbi delle regole "Invece di" (un verbo non in
# questo insieme genera una regola morta che non si attiverà mai a runtime).
VERBI_VALIDI = {verbo for azione in LIBRERIA_AZIONI.values() for verbo in azione.nomi}

# ==============================================================================
# 1. LA GRAMMATICA EBNF DI FAVELLA 1 (La Costituzione)
# ==============================================================================

FAVELLA_GRAMMAR = r"""
    // Punto di ingresso: un file è una serie di dichiarazioni terminate da punto.
    start: dichiarazione+

    ?dichiarazione: def_stanza
                  | def_oggetto
                  | def_descrizione
                  | def_posizione
                  | def_prendibile
                  | def_proprieta
                  | def_connessione
                  | def_regola
                  | def_giocatore

    // --- DEFINIZIONI BASE ---
    //
    // NOTA SULLE PRIORITÀ DI REGOLA (i suffissi .2 / .1):
    // 'def_proprieta' (entita "è" entita) è un catch-all che entra in ambiguità
    // con le definizioni specifiche (oggetto, stanza, posizione, prendibile).
    // Assegnando priorità più alta (.2) alle regole specifiche rispetto a
    // 'def_proprieta' (.1) rendiamo ESPLICITA e deterministica la scelta del
    // resolver di Earley, invece di affidarci al suo tie-break interno.
    // La garanzia anti-regressione è data dalla suite test_linguaggio.py.

    // [stanza] è una stanza.
    def_stanza.2: entita "è" "una" "stanza" "."

    // [oggetto] è una cosa.
    def_oggetto.2: entita "è" "una" "cosa" "."

    // La descrizione di [entita] è "[testo]".
    def_descrizione: "La" "descrizione" ( "di" | "del" | "della" | "dell'" | "degli" | "delle" ) entita "è" TESTO_QUOTATO "."

    // [oggetto] è in [luogo].
    def_posizione.2: entita "è" PREP_LUOGO entita "."

    // [oggetto] è prendibile.
    def_prendibile.2: entita "è" "prendibile" "."

    // [oggetto] è [proprieta]. (Catch-all a priorità più bassa)
    def_proprieta.1: entita "è" entita "."

    // [stanza] collega [direzione] a [stanza].
    def_connessione: entita "collega" DIREZIONE "a" entita "."

    // Il giocatore comincia in [stanza]. (Posizione iniziale esplicita)
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO entita "."


    // --- REGOLE (INVECE DI) ---
    // Sintassi: Invece di [verbo] [ogg1] [prep_azione] [ogg2] se [condizione]: dire "[risposta]" e adesso [conseguenza].
    
    def_regola: "Invece" "di" VERBO entita (PREP_AZIONE entita)? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza )? "."

    // --- CONDIZIONI ---
    ?condizione: "il" "giocatore" "ha" entita  -> cond_possesso
               | entita "è" entita             -> cond_proprieta

    // --- CONSEGUENZE ---
    ?conseguenza: entita "è" PREP_LUOGO entita -> cons_spostamento // (in, nel...)
                | entita "è" "nel" "nulla"     -> cons_nulla       // Speciale
                | entita "è" entita            -> cons_proprieta   // (es. aperta)


    // --- TERMINALI LESSICALI ---

    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
    PREP_AZIONE: "su" | "con" | "contro" | "in"
    DIREZIONE: "nord" | "sud" | "est" | "ovest" | "n" | "s" | "e" | "o"
    
    // Un verbo è una parola.
    VERBO: WORD
    
    // Un'entità è una lista di parole. Earley risolverà l'ambiguità con le stringhe letterali ("è", "una", "stanza")
    entita: WORD+
    
    // Una parola è una sequenza di lettere, numeri o apostrofi (es. dell'albero)
    WORD: /[a-zA-ZÀ-ÿ0-9\']+/
    
    // Testo tra virgolette doppie, con supporto per escape (\" e \\)
    TESTO_QUOTATO: /"(\\.|[^"\\])*"/

    // Ignora spazi e commenti
    %import common.WS
    %ignore WS
    
    COMMENT: /#[^\n]*/
    %ignore COMMENT
"""

# ==============================================================================
# 2. IL TRANSFORMER DELL'AST
# ==============================================================================

@v_args(inline=True) # Passa i figli dei nodi come argomenti singoli ai metodi
class FavellaTransformer(Transformer):
    """
    Visita l'albero sintattico generato da Lark e popola l'oggetto Mondo.
    """
    def __init__(self):
        super().__init__()
        self.mondo = Mondo()
        self.errori = []        # Errori bloccanti: la compilazione fallisce
        self.warnings = []      # Avvisi non bloccanti: la compilazione prosegue
        self.start_dichiarato_raw = None  # Nome grezzo della stanza di partenza

    # --- Nodi Entità e Testo ---

    def entita(self, *tokens):
        # Unisce i token che formano il nome dell'entità preservando il nome originale
        return " ".join(t.value for t in tokens)

    def TESTO_QUOTATO(self, token):
        # Rimuove le virgolette iniziali e finali e applica l'unescape (\" -> ", \\ -> \)
        contenuto = token.value[1:-1]
        return re.sub(r'\\(.)', r'\1', contenuto)
        
    def VERBO(self, token):
        return token.value.lower()
        
    def DIREZIONE(self, token):
        return token.value.lower()

    def PREP_AZIONE(self, token):
        return token.value.lower()

    # --- Dichiarazioni Semplici ---

    def def_stanza(self, nome_grezzo):
        id_stanza = normalizza_nome(nome_grezzo)
        stanza = self.mondo.trova_stanza(id_stanza)
        if not stanza:
            stanza = Stanza(id_stanza)
            stanza.nome_visualizzato = nome_grezzo
            self.mondo.aggiungi_stanza(stanza)
        return None

    def def_oggetto(self, nome_grezzo):
        id_oggetto = normalizza_nome(nome_grezzo)
        oggetto = self.mondo.trova_oggetto(id_oggetto)
        if not oggetto:
            oggetto = Oggetto(id_oggetto)
            oggetto.nome_visualizzato = nome_grezzo
            self.mondo.aggiungi_oggetto(oggetto)
        return None

    def def_descrizione(self, *tokens):
        # I token attesi non ignorati: l'entità e il testo
        testo = tokens[-1]
        nome_grezzo = tokens[0] 
        if len(tokens) > 2:
            nome_grezzo = tokens[-2] # In caso ci fosse un token preposizione catturato

        id_entita = normalizza_nome(nome_grezzo)
        stanza = self.mondo.trova_stanza(id_entita)
        if stanza:
            stanza.descrizione = testo
            return None

        oggetto = self.mondo.trova_oggetto(id_entita)
        if oggetto:
            oggetto.descrizione = testo
            return None

        self.errori.append(f"Descrizione per entità inesistente: '{nome_grezzo}'")
        return None

    def def_posizione(self, ogg_grezzo, prep, luogo_grezzo):
        id_ogg = normalizza_nome(ogg_grezzo)
        id_luogo = normalizza_nome(luogo_grezzo)
        oggetto = self.mondo.trova_oggetto(id_ogg)
        stanza = self.mondo.trova_stanza(id_luogo)

        if oggetto and stanza:
            oggetto.posizione = id_luogo
            stanza.oggetti[id_ogg] = oggetto
        elif not stanza:
            self.errori.append(f"Stanza inesistente '{luogo_grezzo}' per posizionare '{ogg_grezzo}'")
        else:
            self.errori.append(f"Oggetto inesistente '{ogg_grezzo}' da posizionare")
        return None

    def def_prendibile(self, ogg_grezzo):
        id_ogg = normalizza_nome(ogg_grezzo)
        oggetto = self.mondo.trova_oggetto(id_ogg)
        if oggetto:
            oggetto.prendibile = True
        else:
            self.errori.append(f"'prendibile' per oggetto inesistente: '{ogg_grezzo}'")
        return None

    def def_proprieta(self, ogg_grezzo, proprieta_grezzo):
        id_ogg = normalizza_nome(ogg_grezzo)
        proprieta = normalizza_nome(proprieta_grezzo)
        oggetto = self.mondo.trova_oggetto(id_ogg)
        if oggetto:
            oggetto.aggiungi_proprieta(proprieta)
        else:
            self.errori.append(f"Proprietà '{proprieta_grezzo}' per oggetto inesistente: '{ogg_grezzo}'")
        return None

    def def_connessione(self, sta1_grezzo, direzione, sta2_grezzo):
        id_sta1 = normalizza_nome(sta1_grezzo)
        id_sta2 = normalizza_nome(sta2_grezzo)
        
        if not self.mondo.trova_stanza(id_sta1):
            stanza1 = Stanza(id_sta1)
            stanza1.nome_visualizzato = sta1_grezzo
            self.mondo.aggiungi_stanza(stanza1)
        if not self.mondo.trova_stanza(id_sta2):
            stanza2 = Stanza(id_sta2)
            stanza2.nome_visualizzato = sta2_grezzo
            self.mondo.aggiungi_stanza(stanza2)
        
        stanza1 = self.mondo.trova_stanza(id_sta1)
        stanza2 = self.mondo.trova_stanza(id_sta2)

        # Normalizza la direzione al suo nome completo
        DIREZIONI_MAP = {
            "n": "nord", "nord": "nord",
            "s": "sud", "sud": "sud",
            "e": "est", "est": "est",
            "o": "ovest", "ovest": "ovest"
        }
        direzione_norm = DIREZIONI_MAP.get(direzione, direzione)

        stanza1.uscite[direzione_norm] = id_sta2

        # Connessione automatica di ritorno
        direzione_opposta = {
            "nord": "sud", "sud": "nord",
            "est": "ovest", "ovest": "est"
        }[direzione_norm]
        stanza2.uscite[direzione_opposta] = id_sta1
        return None

    def def_giocatore(self, *tokens):
        # tokens: (PREP_LUOGO, entita_stanza) — l'ultimo è il nome della stanza.
        # La stanza potrebbe non essere ancora stata definita a questo punto del
        # transform: la validazione di esistenza è rimandata a valida_post().
        nome_grezzo = tokens[-1]
        self.start_dichiarato_raw = nome_grezzo
        self.mondo.posizione_iniziale = normalizza_nome(nome_grezzo)
        return None


    # --- Condizioni e Conseguenze (Sub-Alberi) ---

    def cond_possesso(self, ogg_grezzo):
        return CondizionePossesso(normalizza_nome(ogg_grezzo))

    def cond_proprieta(self, ogg_grezzo, proprieta_grezzo):
        return CondizioneProprieta(normalizza_nome(ogg_grezzo), normalizza_nome(proprieta_grezzo))

    def cons_spostamento(self, ogg_grezzo, prep, dest_grezzo):
        id_oggetto = normalizza_nome(ogg_grezzo)
        destinazione = normalizza_nome(dest_grezzo)
        if destinazione in ["nulla", "nessun luogo", "nessuno"]:
            destinazione = "nulla"
        return ConseguenzaSpostamento(id_oggetto, destinazione)

    def cons_nulla(self, ogg_grezzo):
        return ConseguenzaSpostamento(normalizza_nome(ogg_grezzo), "nulla")

    def cons_proprieta(self, ogg_grezzo, proprieta_grezzo):
        return ConseguenzaProprieta(normalizza_nome(ogg_grezzo), normalizza_nome(proprieta_grezzo))

    # --- La Regola Complessa ---
    
    def def_regola(self, *args):
        # args contiene figli nell'ordine: verbo, ogg1, [prep, ogg2], [condizione], risposta testuale, [conseguenza]
        args_puliti = [a for a in args if a is not None]
        
        verbo = args_puliti[0]
        ogg1_grezzo = args_puliti[1]
        
        # Inizializza opzionali
        prep_azione = None
        ogg2_grezzo = None
        condizione = None
        risposta = ""
        conseguenza = None
        
        idx = 2
        
        # Check per preposizione + secondo oggetto
        if idx < len(args_puliti) and args_puliti[idx] in ("su", "con", "contro", "in"):
            prep_azione = args_puliti[idx]
            ogg2_grezzo = args_puliti[idx+1]
            idx += 2
            
        # Check per condizione
        if idx < len(args_puliti) and isinstance(args_puliti[idx], (CondizionePossesso, CondizioneProprieta)):
            condizione = args_puliti[idx]
            idx += 1
            
        # Stringa di risposta
        if idx < len(args_puliti) and isinstance(args_puliti[idx], str):
            risposta = args_puliti[idx]
            idx += 1
            
        # Check per conseguenza
        if idx < len(args_puliti) and isinstance(args_puliti[idx], (ConseguenzaProprieta, ConseguenzaSpostamento)):
            conseguenza = args_puliti[idx]
            
        id_ogg1 = normalizza_nome(ogg1_grezzo)
        id_ogg2 = normalizza_nome(ogg2_grezzo) if ogg2_grezzo else None
        
        # Verifica entità principali della regola
        if self.mondo.trova_oggetto(id_ogg1) or id_ogg1 in ["nord", "sud", "est", "ovest", "n", "s", "e", "o"]:
            if id_ogg2 and not self.mondo.trova_oggetto(id_ogg2):
                self.errori.append(f"Regola per secondo oggetto inesistente: '{ogg2_grezzo}'")
            else:
                # Valida conseguenza a compile-time
                if conseguenza:
                    if not self.mondo.trova_oggetto(conseguenza.id_oggetto):
                        self.errori.append(f"Oggetto inesistente nella conseguenza: '{conseguenza.id_oggetto}'")
                    if isinstance(conseguenza, ConseguenzaSpostamento) and conseguenza.destinazione not in ["nulla", "inventario"]:
                        if not self.mondo.trova_stanza(conseguenza.destinazione):
                            self.errori.append(f"Luogo inesistente nella conseguenza: '{conseguenza.destinazione}'")
                
                nuova_regola = Regola(
                    verbo=verbo, 
                    id_oggetto_bersaglio=id_ogg1, 
                    risposta=risposta, 
                    condizione=condizione,
                    preposizione=prep_azione,
                    id_oggetto_secondario=id_ogg2,
                    conseguenza=conseguenza
                )
                self.mondo.aggiungi_regola(nuova_regola)
        else:
            self.errori.append(f"Regola per oggetto principale inesistente: '{ogg1_grezzo}'")

        return None

    # --- Validazione semantica globale (dopo il transform completo) ---

    def valida_post(self):
        """
        Esegue i controlli che richiedono la visione dell'intero mondo, una
        volta che tutte le dichiarazioni sono state processate. Popola errori
        (bloccanti) e warnings (non bloccanti).
        """
        m = self.mondo

        # 1. [GG1] La stanza di partenza dichiarata deve esistere.
        if self.start_dichiarato_raw is not None:
            if not m.trova_stanza(m.posizione_iniziale):
                self.errori.append(
                    f"Stanza di partenza inesistente: 'Il giocatore comincia in "
                    f"{self.start_dichiarato_raw}' (la stanza '{m.posizione_iniziale}' "
                    f"non è definita)."
                )

        # 2. [GG3] Il verbo di ogni regola deve appartenere al vocabolario noto,
        #    altrimenti la regola è "morta" (non si attiverà mai a runtime).
        for regola in m.regole:
            if regola.verbo not in VERBI_VALIDI:
                self.warnings.append(
                    f"Verbo '{regola.verbo}' non riconosciuto in una regola "
                    f"'Invece di': la regola non si attiverà mai. Usa un verbo noto "
                    f"al motore (es. usa, apri, prendi, esamina, mangia, sposta, vai)."
                )

        # 3. [GG2] Una condizione 'se [oggetto] è [proprietà]' che controlla una
        #    proprietà mai assegnata a quell'oggetto (né come stato iniziale né
        #    via conseguenza) è quasi sempre un refuso: resterebbe sempre falsa.
        proprieta_assegnabili = set()  # insieme di tuple (id_oggetto, proprieta)
        for id_ogg, ogg in m.oggetti.items():
            for prop in ogg.proprieta:
                proprieta_assegnabili.add((id_ogg, prop))
        for regola in m.regole:
            cons = regola.conseguenza
            if isinstance(cons, ConseguenzaProprieta):
                proprieta_assegnabili.add((cons.id_oggetto, cons.proprieta))

        for regola in m.regole:
            cond = regola.condizione
            if isinstance(cond, CondizioneProprieta):
                if not m.trova_oggetto(cond.id_oggetto):
                    self.warnings.append(
                        f"Condizione su oggetto inesistente: '{cond.id_oggetto}'."
                    )
                elif (cond.id_oggetto, cond.proprieta) not in proprieta_assegnabili:
                    self.warnings.append(
                        f"La proprietà '{cond.proprieta}' di '{cond.id_oggetto}' non "
                        f"è mai assegnata da nessuna parte: possibile refuso? La "
                        f"condizione resterà sempre falsa."
                    )

# ==============================================================================
# 3. MOTORE PRINCIPALE DI COMPILAZIONE
# ==============================================================================

# Inizializza il parser Lark una sola volta a livello di modulo usando l'Earley Algorithm
parser = Lark(FAVELLA_GRAMMAR, start='start', parser='earley')

def analizza_file(percorso_file: str) -> Mondo | None:
    """
    Legge un file .fav, ne elabora l'albero sintattico (AST) tramite Lark
    e genera in output l'istanza finale del Mondo popolato.
    """
    errori = []
    
    try:
        with open(percorso_file, 'r', encoding='utf-8') as file:
            testo = file.read()

        if not testo.strip():
            return Mondo() # File vuoto

        # 0. NORMALIZZAZIONE TIPOGRAFICA [L2]
        # Sostituisce apostrofi e virgolette "curve" (tipici di copia-incolla da
        # editor di testo) con le versioni dritte attese dalla grammatica.
        testo = (testo
                 .replace('’', "'").replace('‘', "'")
                 .replace('“', '"').replace('”', '"'))

        # 1. PARSING FORMALE (Testo -> AST)
        tree = parser.parse(testo)

        # 2. TRASFORMAZIONE (AST -> Oggetti Python)
        transformer = FavellaTransformer()
        transformer.transform(tree)

        # 3. VALIDAZIONE SEMANTICA GLOBALE
        transformer.valida_post()

        # Estrae i log dal transformer
        errori.extend(transformer.errori)

        # Avvisi non bloccanti: mostrati sempre, ma non interrompono la build
        if transformer.warnings:
            print("\n[FAVELLA 1] Avvisi (non bloccanti):")
            for w in transformer.warnings:
                print(f" - {w}")

        if errori:
            print("\n[FAVELLA 1] Trovati errori di logica durante la costruzione:")
            for err in errori:
                print(f" - {err}")
            return None

        return transformer.mondo

    except UnexpectedInput as e:
        # Errore sintattico formale sollevato da Lark (Es: manca punto, ortografia)
        print("\n[ERRORE DI SINTASSI FAVELLA]")
        print(f"Riga {e.line}, Colonna {e.column}")
        
        # Mostra il frammento di codice errato
        contesto = e.get_context(testo, span=40)
        print("-" * 40)
        print(contesto.strip())
        print("-" * 40)
        
        # Prova a suggerire cosa si aspettava il parser
        attesi = e.expected if hasattr(e, 'expected') else None
        if attesi:
            print(f"Mi aspettavo: {', '.join(attesi)}")
            
        return None
        
    except FileNotFoundError:
        print(f"[ERRORE FATALE] Il file '{percorso_file}' non è stato trovato.")
        return None
        
    except Exception as ex:
        print(f"[ERRORE INTERNO] Crash durante la compilazione: {ex}")
        return None

def main():
    print("FAVELLA 1 COMPILER TEST")
    if len(sys.argv) > 1:
        m = analizza_file(sys.argv[1])
        if m:
            print("Compilazione AST + Transform completata con successo!")
            print(str(m))

if __name__ == "__main__":
    main()
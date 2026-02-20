# compilatore.py
# Micro-Compilatore Formale per FAVELLA 1 (v0.2.0)
# Usa Lark per generare un AST (Abstract Syntax Tree) senza regex.

from lark import Lark, Transformer, v_args
from lark.exceptions import UnexpectedInput
from strutture import Mondo, Stanza, Oggetto, Regola, CondizionePossesso, CondizioneProprieta, ConseguenzaProprieta, ConseguenzaSpostamento
from utils import normalizza_nome
import sys

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

    // --- DEFINIZIONI BASE ---
    
    // [stanza] è una stanza.
    def_stanza: entita "è" "una" "stanza" "."

    // [oggetto] è una cosa.
    def_oggetto: entita "è" "una" "cosa" "."

    // La descrizione di [entita] è "[testo]".
    def_descrizione: "La" "descrizione" ( "di" | "del" | "della" | "dell'" | "degli" | "delle" ) entita "è" TESTO_QUOTATO "."

    // [oggetto] è in [luogo].
    def_posizione: entita "è" PREP_LUOGO entita "."

    // [oggetto] è prendibile.
    def_prendibile: entita "è" "prendibile" "."

    // [oggetto] è [proprieta]. (Esclude "una cosa", "prendibile", preposizioni di luogo)
    def_proprieta: entita "è" entita "."

    // [stanza] collega [direzione] a [stanza].
    def_connessione: entita "collega" DIREZIONE "a" entita "."


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
    
    // Testo tra virgolette doppie
    TESTO_QUOTATO: /"[^"]*"/

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
        self.errori = []

    # --- Nodi Entità e Testo ---
    
    def entita(self, *tokens):
        # Unisce i token che formano il nome dell'entità e normalizza
        return normalizza_nome(" ".join(t.value for t in tokens))

    def TESTO_QUOTATO(self, token):
        # Rimuove le virgolette iniziali e finali
        return token.value[1:-1]
        
    def VERBO(self, token):
        return token.value.lower()
        
    def DIREZIONE(self, token):
        return token.value.lower()

    def PREP_AZIONE(self, token):
        return token.value.lower()

    # --- Dichiarazioni Semplici ---

    def def_stanza(self, id_stanza):
        if not self.mondo.trova_stanza(id_stanza):
            self.mondo.aggiungi_stanza(Stanza(id_stanza))
        return None

    def def_oggetto(self, id_oggetto):
        if not self.mondo.trova_oggetto(id_oggetto):
            self.mondo.aggiungi_oggetto(Oggetto(id_oggetto))
        return None

    def def_descrizione(self, *tokens):
        # I token attesi non ignorati: l'entità e il testo
        # Troviamo il testo quotato che è sempre alla fine (selezioniamo l'ultimo) e l'entità (i primi)
        testo = tokens[-1]
        id_entita = tokens[0] 
        # NOTA: Lark, se non usa `?` o alias con `_`, passa tutti i non-terminali valutati (entita, testo)
        if len(tokens) > 2:
            id_entita = tokens[-2] # In caso ci fosse un token preposizione catturato

        stanza = self.mondo.trova_stanza(id_entita)
        if stanza:
            stanza.descrizione = testo
            return None

        oggetto = self.mondo.trova_oggetto(id_entita)
        if oggetto:
            oggetto.descrizione = testo
            return None

        self.errori.append(f"Descrizione per entità inesistente: '{id_entita}'")
        return None

    def def_posizione(self, id_ogg, prep, id_luogo):
        oggetto = self.mondo.trova_oggetto(id_ogg)
        stanza = self.mondo.trova_stanza(id_luogo)

        if oggetto and stanza:
            oggetto.posizione = id_luogo
            stanza.oggetti[id_ogg] = oggetto
        elif not stanza:
            self.errori.append(f"Stanza inesistente '{id_luogo}' per posizionare '{id_ogg}'")
        else:
            self.errori.append(f"Oggetto inesistente '{id_ogg}' da posizionare")
        return None

    def def_prendibile(self, id_ogg):
        oggetto = self.mondo.trova_oggetto(id_ogg)
        if oggetto:
            oggetto.prendibile = True
        else:
            self.errori.append(f"'prendibile' per oggetto inesistente: '{id_ogg}'")
        return None

    def def_proprieta(self, id_ogg, proprieta):
        oggetto = self.mondo.trova_oggetto(id_ogg)
        if oggetto:
            oggetto.aggiungi_proprieta(proprieta)
        else:
            self.errori.append(f"Proprietà '{proprieta}' per oggetto inesistente: '{id_ogg}'")
        return None

    def def_connessione(self, id_sta1, direzione, id_sta2):
        if not self.mondo.trova_stanza(id_sta1):
            self.mondo.aggiungi_stanza(Stanza(id_sta1))
        if not self.mondo.trova_stanza(id_sta2):
            self.mondo.aggiungi_stanza(Stanza(id_sta2))
        
        stanza1 = self.mondo.trova_stanza(id_sta1)
        stanza2 = self.mondo.trova_stanza(id_sta2)

        stanza1.uscite[direzione] = id_sta2

        # Connessione automatica di ritorno
        direzione_opposta = {
            "nord": "sud", "sud": "nord",
            "est": "ovest", "ovest": "est",
            "n": "s", "s": "n", "e": "o", "o": "e"
        }[direzione]
        stanza2.uscite[direzione_opposta] = id_sta1
        return None

    # --- Condizioni e Conseguenze (Sub-Alberi) ---

    def cond_possesso(self, id_oggetto):
        return CondizionePossesso(id_oggetto)

    def cond_proprieta(self, id_oggetto, proprieta):
        return CondizioneProprieta(id_oggetto, proprieta)

    def cons_spostamento(self, id_oggetto, prep, destinazione):
        if destinazione in ["nulla", "nessun luogo", "nessuno"]:
            destinazione = "nulla"
        # Valideremo l'esistenza dell'oggetto nella def_regola per stampare errori
        return ConseguenzaSpostamento(id_oggetto, destinazione)

    def cons_nulla(self, id_oggetto):
        return ConseguenzaSpostamento(id_oggetto, "nulla")

    def cons_proprieta(self, id_oggetto, proprieta):
        return ConseguenzaProprieta(id_oggetto, proprieta)

    # --- La Regola Complessa ---
    
    def def_regola(self, *args):
        # args contiene figli nell'ordine: verbo, ogg1, [prep, ogg2], [condizione], risposta testuale, [conseguenza]
        # Dato che gli elementi opzionali generano `None` se assenti in Lark quando configurato correttamente, 
        # oppure non vengono passati a seconda della struct, Lark passa i nodi figli catturati dall'albero.
        
        # Filtriamo dai None e estraiamo iterando (poiché abbiamo elementi opzionali senza token wrapper esplicito)
        args_puliti = [a for a in args if a is not None]
        
        verbo = args_puliti[0]
        id_ogg1 = args_puliti[1]
        
        # Inizializza opzionali
        prep_azione = None
        id_ogg2 = None
        condizione = None
        risposta = ""
        conseguenza = None
        
        idx = 2
        
        # Check per preposizione + secondo oggetto
        if idx < len(args_puliti) and args_puliti[idx] in ("su", "con", "contro", "in"):
            prep_azione = args_puliti[idx]
            id_ogg2 = args_puliti[idx+1]
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
            
            # Valida conseguenza a compile-time
            if not self.mondo.trova_oggetto(conseguenza.id_oggetto):
                self.errori.append(f"Oggetto inesistente nella conseguenza: '{conseguenza.id_oggetto}'")
            if isinstance(conseguenza, ConseguenzaSpostamento) and conseguenza.destinazione not in ["nulla", "inventario"]:
                if not self.mondo.trova_stanza(conseguenza.destinazione):
                    self.errori.append(f"Luogo inesistente nella conseguenza: '{conseguenza.destinazione}'")

        # Verifica entità principali della regola
        if self.mondo.trova_oggetto(id_ogg1) or id_ogg1 in ["nord", "sud", "est", "ovest", "n", "s", "e", "o"]:
            if id_ogg2 and not self.mondo.trova_oggetto(id_ogg2):
                self.errori.append(f"Regola per secondo oggetto inesistente: '{id_ogg2}'")
            else:
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
            self.errori.append(f"Regola per oggetto principale inesistente: '{id_ogg1}'")
            
        return None

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

        # 1. PARSING FORMALE (Testo -> AST)
        tree = parser.parse(testo)
        
        # 2. TRASFORMAZIONE (AST -> Oggetti Python)
        transformer = FavellaTransformer()
        transformer.transform(tree)
        
        # Estrae i log dal transformer
        errori.extend(transformer.errori)
        
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
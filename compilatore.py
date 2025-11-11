# compilatore.py
# Micro-Compilatore per FAVELLA 1 (v0.9)

from strutture import Mondo, Stanza, Oggetto, Regola, CondizionePossesso, CondizioneProprieta
from utils import normalizza_nome
import sys
import re

def analizza_file(percorso_file: str) -> Mondo | None:
    mondo = Mondo()
    errori = []
    
    # --- Grammatica v0.8 - Regole Condizionali (PRIORITÀ MASSIMA) ---
    # Pattern per: Invece di [verbo] [oggetto] se il giocatore ha [oggetto2]: dire "...".
    p_regola_cond_possesso = re.compile(
        r"^Invece di (.*?) (.*?) se il giocatore ha (.*?): dire \"(.*?)\"\.(?:\s*#.*)?$",
        re.IGNORECASE
    )
    
    # Pattern per: Invece di [verbo] [oggetto] se [oggetto2] è [proprietà]: dire "...".
    p_regola_cond_proprieta = re.compile(
        r"^Invece di (.*?) (.*?) se (.*?) è (.*?): dire \"(.*?)\"\.(?:\s*#.*)?$",
        re.IGNORECASE
    )
    
    # --- Grammatica v0.7 ---
    p_connessione = re.compile(r"^(.*?) collega (nord|sud|est|ovest) a (.*?)\.(?:\s*#.*)?$", re.IGNORECASE)

    # --- Grammatica v0.4 ---
    p_regola_invece_di = re.compile(r"^Invece di (.*?) (.*): dire \"(.*)\"\.(?:\s*#.*)?$", re.IGNORECASE)

    # Regex della v0.3
    p_stanza = re.compile(r"^(.*?) è una stanza\.(?:\s*#.*)?$", re.IGNORECASE)
    p_descrizione = re.compile(r"^La descrizione (?:di|della|del|dell'|degli|delle) (.*?) è \"(.*?)\".(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto_in_stanza = re.compile(r"^(.*?) è (?:in|nel|nella|negli|nelle|nell'|sul|sulla|sullo|sui|sugli|sulle) (.*?)\.(?:\s*#.*)?$", re.IGNORECASE)
    p_oggetto = re.compile(r"^(.*?) è una cosa\.(?:\s*#.*)?$", re.IGNORECASE)
    p_proprieta = re.compile(r"^(.*?) è (?!una cosa|in |nel |nella |negli |nelle |nell'|sul |sulla |sullo |sui |sugli |sulle |prendibile)(.*?)\.(?:\s*#.*)?$", re.IGNORECASE)
    p_prendibile = re.compile(r"^(.*?) è prendibile\.(?:\s*#.*)?$", re.IGNORECASE)

    with open(percorso_file, 'r', encoding='utf-8') as file:
        for numero_riga, riga in enumerate(file, 1):
            riga_originale = riga
            riga = riga.strip()
            if not riga or riga.startswith('#'):
                continue

            # --- Logica di Parsing ---
            
            # PRIORITÀ 1: Regole Condizionali (v0.8)
            match_cond_possesso = p_regola_cond_possesso.match(riga)
            if match_cond_possesso:
                verbo, ogg_grezzo, ogg_condizione_grezzo, risposta = match_cond_possesso.groups()
                id_ogg = normalizza_nome(ogg_grezzo)
                id_ogg_condizione = normalizza_nome(ogg_condizione_grezzo)
                
                if mondo.trova_oggetto(id_ogg):
                    condizione = CondizionePossesso(id_ogg_condizione)
                    nuova_regola = Regola(verbo.lower(), id_ogg, risposta, condizione)
                    mondo.aggiungi_regola(nuova_regola)
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Regola per oggetto inesistente: '{id_ogg}'")
                continue
            
            match_cond_proprieta = p_regola_cond_proprieta.match(riga)
            if match_cond_proprieta:
                verbo, ogg_grezzo, ogg_condizione_grezzo, proprieta_grezzo, risposta = match_cond_proprieta.groups()
                id_ogg = normalizza_nome(ogg_grezzo)
                id_ogg_condizione = normalizza_nome(ogg_condizione_grezzo)
                id_proprieta = normalizza_nome(proprieta_grezzo)
                
                if mondo.trova_oggetto(id_ogg):
                    condizione = CondizioneProprieta(id_ogg_condizione, id_proprieta)
                    nuova_regola = Regola(verbo.lower(), id_ogg, risposta, condizione)
                    mondo.aggiungi_regola(nuova_regola)
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Regola per oggetto inesistente: '{id_ogg}'")
                continue

            # PRIORITÀ 2: Connessioni (v0.7)
            match_connessione = p_connessione.match(riga)
            if match_connessione:
                nome_sta1_grezzo, direzione, nome_sta2_grezzo = match_connessione.groups()
                id_sta1 = normalizza_nome(nome_sta1_grezzo)
                id_sta2 = normalizza_nome(nome_sta2_grezzo)
                
                if not mondo.trova_stanza(id_sta1):
                    mondo.aggiungi_stanza(Stanza(id_sta1))
                if not mondo.trova_stanza(id_sta2):
                    mondo.aggiungi_stanza(Stanza(id_sta2))
                
                stanza1 = mondo.trova_stanza(id_sta1)
                stanza2 = mondo.trova_stanza(id_sta2)

                stanza1.uscite[direzione.lower()] = id_sta2

                direzione_opposta = {
                    "nord": "sud", "sud": "nord",
                    "est": "ovest", "ovest": "est"
                }[direzione.lower()]
                stanza2.uscite[direzione_opposta] = id_sta1
                continue

            # PRIORITÀ 3: Regole semplici (v0.4)
            match_regola = p_regola_invece_di.match(riga)
            if match_regola:
                verbo, ogg_grezzo, risposta = match_regola.groups()
                id_ogg = normalizza_nome(ogg_grezzo)

                if mondo.trova_oggetto(id_ogg):
                    nuova_regola = Regola(verbo.lower(), id_ogg, risposta)
                    mondo.aggiungi_regola(nuova_regola)
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Regola per oggetto inesistente: '{id_ogg}'")
                continue

            # PRIORITÀ 4: Descrizioni
            match_descrizione = p_descrizione.match(riga)
            if match_descrizione:
                nome_grezzo, testo = match_descrizione.groups()
                id_entita = normalizza_nome(nome_grezzo)
                
                stanza = mondo.trova_stanza(id_entita)
                if stanza:
                    stanza.descrizione = testo
                    continue

                oggetto = mondo.trova_oggetto(id_entita)
                if oggetto:
                    oggetto.descrizione = testo
                    continue

                errori.append(f"[ERRORE] Riga {numero_riga}: Descrizione per entità inesistente: '{id_entita}'")
                continue

            # PRIORITÀ 5: Posizionamento oggetti
            match_oggetto_in_stanza = p_oggetto_in_stanza.match(riga)
            if match_oggetto_in_stanza:
                nome_ogg, nome_sta = match_oggetto_in_stanza.groups()
                id_ogg, id_sta = normalizza_nome(nome_ogg), normalizza_nome(nome_sta)
                
                oggetto = mondo.trova_oggetto(id_ogg)
                stanza = mondo.trova_stanza(id_sta)

                if oggetto and stanza:
                    oggetto.posizione = id_sta
                    stanza.oggetti[id_ogg] = oggetto
                elif not stanza:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Stanza inesistente '{id_sta}'")
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Oggetto inesistente '{id_ogg}'")
                continue

            # PRIORITÀ 6: Definizione stanze
            match_stanza = p_stanza.match(riga)
            if match_stanza:
                id_sta = normalizza_nome(match_stanza.group(1))
                if not mondo.trova_stanza(id_sta):
                    mondo.aggiungi_stanza(Stanza(id_sta))
                continue
            
            # PRIORITÀ 7: Definizione oggetti
            match_oggetto = p_oggetto.match(riga)
            if match_oggetto:
                id_ogg = normalizza_nome(match_oggetto.group(1))
                if not mondo.trova_oggetto(id_ogg):
                    mondo.aggiungi_oggetto(Oggetto(id_ogg))
                continue

            # PRIORITÀ 8: Proprietà prendibile
            match_prendibile = p_prendibile.match(riga)
            if match_prendibile:
                nome_grezzo_ogg = match_prendibile.group(1)
                id_ogg = normalizza_nome(nome_grezzo_ogg)
                oggetto = mondo.trova_oggetto(id_ogg)
                if oggetto:
                    oggetto.prendibile = True
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: 'prendibile' per oggetto inesistente: '{id_ogg}'")
                continue

            # PRIORITÀ 9: Altre proprietà
            match_proprieta = p_proprieta.match(riga)
            if match_proprieta:
                nome_ogg, nome_prop = match_proprieta.groups()
                id_ogg = normalizza_nome(nome_ogg)
                id_prop = normalizza_nome(nome_prop.strip())
                oggetto = mondo.trova_oggetto(id_ogg)
                if oggetto:
                    oggetto.aggiungi_proprieta(id_prop)
                else:
                    errori.append(f"[ERRORE] Riga {numero_riga}: Proprietà per oggetto inesistente: '{id_ogg}'")
                continue

            errori.append(f"[ERRORE DI SINTASSI] Riga {numero_riga}: Non capisco la frase -> '{riga_originale.strip()}'")

    if errori:
        for errore in errori:
            print(errore)
        return None

    return mondo

def main():
    print("Eseguire 'gioco.py' per avviare l'interprete.")

if __name__ == "__main__":
    main()
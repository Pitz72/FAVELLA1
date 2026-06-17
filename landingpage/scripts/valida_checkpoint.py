# Harness OFFLINE: valida che [base + riga attesa] di ogni checkpoint del corso
# compili pulito col motore VERO (analizza_file_strutturato). Usa la copia
# vendorata del motore. NON fa parte della build: solo strumento di sviluppo.
import sys, os, json, shutil, tempfile

# I moduli vendorati sono serviti come «.fav» (l'hosting vieta i .py). Per
# importarli qui li ricopiamo col nome vero «.py» in una cartella temporanea,
# così questo controllo gira sulla STESSA copia che finisce in produzione.
ENGINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "favella-engine", "engine"))
_TMP_ENGINE = os.path.join(tempfile.gettempdir(), "favella_engine_valida")
os.makedirs(_TMP_ENGINE, exist_ok=True)
for _f in ("utils", "strutture", "libreria_azioni", "compilatore", "gioco"):
    shutil.copyfile(os.path.join(ENGINE, _f + ".fav"), os.path.join(_TMP_ENGINE, _f + ".py"))
sys.path.insert(0, _TMP_ENGINE)
from compilatore import analizza_file_strutturato  # noqa

# Ogni voce: (id, base[], attesa). base = righe di contesto necessarie perché la
# riga attesa risolva semanticamente.
CP = [
    # L1 apri-la-porta
    ("01-1", [], "L'ingresso è una stanza."),
    ("01-2", [], "La torcia è una cosa."),
    ("01-3", ["La torcia è una cosa."], "La torcia è prendibile."),
    # L2 le-stanze
    ("02-1", [], "Lo studio è una stanza."),
    ("02-2", ["Il giardino è una stanza."], 'La descrizione del giardino è "Erba, ghiaia, due piante di alloro.".'),
    ("02-3", ["La cantina è una stanza.", "La torcia è una cosa."], 'La descrizione della cantina se la torcia è spenta è "Sotto la scala è cieco.".'),
    # L3 muoversi
    ("03-1", ["La cucina è una stanza.", "Il giardino è una stanza."], "La cucina collega est a il giardino."),
    ("03-2", ["L'ingresso è una stanza."], "Il giocatore comincia in ingresso."),
    ("03-3", [], "Alto e basso sono direzioni opposte."),
    # L4 gli-oggetti
    ("04-1", [], "Il portaombrelli è una cosa."),
    ("04-2", ["Il portaombrelli è una cosa.", "L'ingresso è una stanza."], "Il portaombrelli è in ingresso."),
    ("04-3", ["Il portaombrelli è una cosa."], "Il portaombrelli è prendibile."),
    # L5 proprieta
    ("05-1", ["La torcia è una cosa."], "La torcia è spenta."),
    ("05-2", [], "Accesa e spenta sono opposte."),
    ("05-3", ["La porta della cantina è una cosa."], "La porta della cantina è chiusa."),
    # L6 contenitori
    ("06-1", [], "Il tavolino è un supporto."),
    ("06-2", ["La torcia è una cosa.", "Il tavolino è un supporto."], "La torcia è sul tavolino."),
    ("06-3", ["La torcia è una cosa."], 'La torcia si chiama anche "pila".'),
    # L7 stati-contatori
    ("07-1", [], "La verita è uno stato."),
    ("07-2", ["La verita è uno stato."], "La verita è ignota."),
    ("07-3", ["La calma è un contatore."], "La calma parte da 3."),
    # L8 regole
    ("08-1", ["Il vaso di gerani è una cosa."], 'Invece di sposta il vaso di gerani: dire "Sposti il vaso. Nulla di nuovo.".'),
    ("08-2", ['"accendi" è un comando.', "La torcia è una cosa."], 'Invece di accendi la torcia se la torcia è spenta: dire "Devi averla in mano per caricarla.".'),
    ("08-3", [], '"accendi" è un comando.'),
    # L9 conseguenze
    ("09-1", ['"brucia" è un comando.', "Le lettere è una cosa.", "La torcia è una cosa."], 'Invece di brucia le lettere se la torcia è spenta oppure il giocatore non ha le lettere: dire "Non così, non adesso.".'),
    ("09-2", ['"spegni" è un comando.', "La torcia è una cosa."], 'Invece di spegni la torcia se la torcia è accesa: dire "Premi l\'interruttore. Buio." e adesso la torcia è spenta.'),
    # L10 fine-partita
    ("10-1", [], '"scappa" è un comando.'),
    ("10-2", ['"scappa" è un comando.'], 'Invece di scappa: dire "Esci di corsa, senza voltarti." e adesso termina "Forse era meglio non sapere.".'),
    # L11 eventi-turni
    ("11-1", ["Il temporale è uno stato.", "Il temporale è lontano."], 'Al turno 4: dire "Sui colli si sente un tuono basso. Vento alle imposte." e adesso il temporale è vicino.'),
    ("11-2", [], 'Ogni 5 turni: dire "L\'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.".'),
    # L12 demoni
    ("12-1", ["Il temporale è uno stato.", "Il temporale è lontano.", "La calma è un contatore."], 'Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un\'altra." e adesso diminuisci la calma.'),
    ("12-2", ["La calma è un contatore."], 'Quando la calma è meno di 1 diventa vera: dire "Le mani ti tremano.".'),
    # L13 buio-luce
    ("buio-1", ["La cantina è una stanza."], "La cantina è buia."),
    ("buio-2", ["La torcia è una cosa."], "La torcia illumina."),
    # L14 dialoghi (cassetta 14)
    ("13-1", [], "Il notaio è un personaggio."),
    ("13-2", ["Il notaio è un personaggio.", 'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".'], 'Il dialogo del notaio comincia con "tavolo".'),
    ("13-3", ["Il notaio è un personaggio.", 'Il dialogo del notaio comincia con "tavolo".', 'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".', 'Il notaio al nodo "salute" dice "Cuore.".'], 'Al nodo "tavolo" l\'opzione "Di cosa è morta?" conduce al nodo "salute".'),
    ("13-4", ["Il notaio è un personaggio.", 'Il dialogo del notaio comincia con "tavolo".', 'Il notaio al nodo "tavolo" dice "Le carte sono sul tavolo.".'], 'Al nodo "tavolo" l\'opzione "Firmo subito." chiude il dialogo e adesso perdi.'),
    # L14 trasporto
    ("14-1", [], "Il giocatore può portare 5 oggetti."),
    ("14-2", ["Lo zaino è una cosa."], "Lo zaino dà 15 spazi."),
    # L15 moduli (Includi: serve che il file referenziato esista a fianco)
    ("15-1", [], 'Includi "oggetti.fav".'),
    ("15-2", [], 'Includi "dialoghi.fav".'),
    # Cassetta 18 — Le quantità che si parlano (Tema 1)
    ("18-1", ['"attacca" è un comando.', "La cripta è una stanza.", "Il troll è una cosa.", "Il troll è in cripta.", "La vita del troll è un contatore.", "La forza è un contatore."],
     'Invece di attacca il troll: dire "Lo colpisci!" e adesso diminuisci la vita del troll di [forza].'),
    ("18-2", ['"incanta" è un comando.', "La caverna è una stanza.", "Il drago è una cosa.", "Il drago è in caverna.", "La vita del drago è un contatore."],
     'Invece di incanta il drago: dire "Magia!" e adesso diminuisci la vita del drago di un numero fra 2 e 6.'),
    ("18-3", ["L'oro è un contatore.", "Il prezzo è un contatore."],
     'Ogni turno se l\'oro è almeno [prezzo]: dire "Te lo puoi permettere.".'),
    # Cassetta 19 — Il caso (Tema 2)
    ("19-1", ["Il meteo è uno stato.", "Il meteo è sereno."],
     "Ogni 3 turni: il meteo diventa uno fra sereno, pioggia, nebbia."),
    ("19-2", ["La salute è un contatore."],
     'Ogni turno se càpita (1 su 4): dire "Un\'auto sbuca dal nulla!" e adesso diminuisci la salute di 1.'),
    # Cassetta 20 — Il mondo che cambia, gli stati che si parlano (Temi 4 e 3)
    ("20-1", ["La cantina è una stanza."],
     'Al turno 5: dire "Cala la notte." e adesso la cantina diventa buia.'),
    ("20-2", ["Il corteggiato è uno stato.", "Il corteggiato è nessuno.", "Il preferito è uno stato.", "Il preferito è anna."],
     "Al turno 2: il corteggiato diventa il preferito."),
    ("20-3", ["La sala è una stanza.", "Lo specchio è una cosa.", "Lo specchio è in sala.", "Il corteggiato è uno stato.", "Il preferito è uno stato."],
     'Invece di esamina lo specchio se il corteggiato è come il preferito: dire "Sono la stessa persona.".'),
    # Cassetta 21 — riepilogo
    ("21-1", [], "La camera è una stanza."),
    ("21-2", ["Il bicchiere di grappa è una cosa."], "Il bicchiere di grappa è prendibile."),
    ("21-3", [], "Gli indizi è un contatore."),
]

# Per gli Includi: creiamo stub vuoti accanto al path fittizio.
WORKDIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "_tmp_valida"))
os.makedirs(WORKDIR, exist_ok=True)
for stub in ("oggetti.fav", "dialoghi.fav"):
    open(os.path.join(WORKDIR, stub), "w", encoding="utf-8").close()
FAKE = os.path.join(WORKDIR, "check.fav")

bad = 0
for cid, base, attesa in CP:
    sorgente = "\n".join(list(base) + [attesa]) + "\n"
    res = analizza_file_strutturato(FAKE, sorgente=sorgente)
    ok = res.get("ok")
    errs = [e["message"] for e in res.get("errors", [])]
    warns = [w["message"] for w in res.get("warnings", [])]
    if not ok:
        bad += 1
        print(f"[FAIL] {cid}: {attesa}")
        for e in errs:
            print(f"        ERR: {e}")
    else:
        tag = "ok" if not warns else f"ok (+{len(warns)} warn)"
        print(f"[{tag}] {cid}")
        for w in warns:
            print(f"        warn: {w}")

print(f"\n=== {len(CP)-bad}/{len(CP)} compilano puliti; {bad} FAIL ===")
sys.exit(1 if bad else 0)

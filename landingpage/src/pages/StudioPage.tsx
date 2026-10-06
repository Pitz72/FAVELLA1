import { useState } from "react";
import { Link } from "../router";
import { Btn, Ink, PageHero, Reveal, SectionHead, Spot } from "../ui/primitives";
import {
  STUDIO_VERSION,
  DOWNLOAD_STUDIO_WINDOWS,
  DOWNLOAD_STUDIO_LINUX,
  STUDIO_RELEASE_URL,
  STUDIO_MAC_URL,
  STUDIO_SOURCE_URL,
  STUDIO_GUIDE_URL,
  STUDIO_GUIDE_PAGES,
} from "../constants";

// Le schermate dell'app (rifatte dal banco di prova con scripts/foto-studio.mjs),
// nell'ordine in cui si scrive una storia.
const SCHERMATE = [
  {
    id: "storia",
    nome: "Storia",
    img: "/studio/storia.webp",
    alt: "La sezione Storia di Favella Studio: il testo di un'avventura, a sinistra i file della storia",
    titolo: "Il testo, con la storia a vista",
    testo:
      "Il testo della tua avventura, frase per frase, con i colori del manuale: parole del linguaggio in ciano, testi in smeraldo, punti in ambra. A sinistra, i file della storia: il principale e i moduli che include. Il motore controlla mentre scrivi.",
  },
  {
    id: "stanze",
    nome: "Stanze",
    img: "/studio/stanze.webp",
    alt: "Il pannello Stanze: nome, descrizione, uscite modificabili",
    titolo: "Una stanza, tutta modificabile",
    testo:
      "Nome, descrizione, punto di partenza e uscite: ognuna con la sua direzione e la stanza dall'altra parte, da cambiare, togliere o aggiungere. Il ritorno si scrive da solo.",
  },
  {
    id: "mappa",
    nome: "Mappa",
    img: "/studio/mappa.webp",
    alt: "La mappa delle stanze, con la scheda delle uscite della stanza selezionata",
    titolo: "Le stanze diventano una mappa",
    testo:
      "Trascini da una stanza all'altra per collegarle; la direzione è scritta accanto alla stanza da cui la prendi. Un clic su un collegamento lo cambia o lo toglie; un clic su una stanza apre le sue uscite, senza lasciare la mappa.",
  },
  {
    id: "oggetti",
    nome: "Oggetti",
    img: "/studio/oggetti.webp",
    alt: "L'editor degli oggetti: l'elenco a sinistra, il modulo a destra",
    titolo: "Un oggetto alla volta",
    testo:
      "Che cos'è, dove sta, se si prende, se si apre o si accende. Si crea già in una stanza, si rinomina (in tutte le frasi che lo citano) e si elimina, vedendo prima che cosa se ne va.",
  },
  {
    id: "personaggi",
    nome: "Personaggi",
    img: "/studio/personaggi.webp",
    alt: "Il pannello Personaggi: nome, dove si trova, descrizione, dialogo",
    titolo: "Chi vive nella storia",
    testo:
      "Un personaggio nasce da zero: nome, stanza, com'è fatto. Poi lo sposti, gli dai altri nomi e vai dritto al suo dialogo.",
  },
  {
    id: "dialoghi",
    nome: "Dialoghi",
    img: "/studio/dialoghi.webp",
    alt: "L'editor dei dialoghi: nodi di conversazione, battute e risposte modificabili sul posto",
    titolo: "Il copione, sul posto",
    testo: "Le conversazioni sono un copione che si modifica dove sta: battute, risposte, dove porta ogni scelta.",
  },
  {
    id: "regole",
    nome: "Regole",
    img: "/studio/regole.webp",
    alt: "L'editor delle regole: schede con «invece di», condizione, risposta e conseguenze",
    titolo: "Logica senza scrivere codice",
    testo:
      "«Invece di», «Prima di», «Dopo di» e «altrimenti», con le condizioni composte come blocchi: che cosa succede quando il giocatore agisce.",
  },
  {
    id: "parole",
    nome: "Parole",
    img: "/studio/parole.webp",
    alt: "Il pannello Parole e comandi: come comanda il giocatore, verbi inventati e sinonimi",
    titolo: "Le parole del giocatore",
    testo:
      "I verbi che inventi, le parole che valgono come un'altra azione, e il modo in cui chi gioca dà i comandi: scrivendo, toccando i pulsanti, o tutti e due.",
  },
  {
    id: "prova",
    nome: "Prova",
    img: "/studio/prova.webp",
    alt: "La Prova: la partita con i pulsanti-verbo, lo stato del mondo a destra",
    titolo: "Provi la storia dove la scrivi",
    testo:
      "Con i pulsanti-verbo che vedrà chi la riceve. A destra lo stato del mondo, la mappa e il passo passo, turno per turno.",
  },
] as const;

// Che cosa si può fare dai pannelli, oltre al testo.
const NOVITA = [
  ["Notte, carta, contrasto alto", "Tre modi di leggere, che valgono anche per il testo e per la mappa: un tema scuro, uno chiaro, e il contrasto alto per tutti e due. Ogni testo sta ad almeno 4,5:1 sul suo fondo."],
  ["Ogni modifica si annulla", "Quello che fai dai pannelli si disfa con «Annulla» o con Ctrl+Z, anche nei file che non hai aperto. Dopo un'eliminazione, l'avviso ha il suo «Annulla»."],
  ["Tutto da tastiera", "Sezioni, elenchi, schede, menu e finestre si usano con le frecce, Invio ed Esc. Il racconto della partita lo leggono i lettori di schermo."],
  ["Aggiornamenti col tuo permesso", "Studio chiede prima di collegarsi a internet. Una versione nuova si installa solo se la sua impronta coincide con quella pubblicata, e solo dopo averti chiesto dei file non salvati."],
  ["Una storia o una cartella", "Ctrl+O apre un file .fav, Ctrl+Maiusc+O una cartella; se nella cartella c'è una storia sola, si apre da sé. Il principale e i moduli che include li crei, li includi, li togli."],
  ["Una mappa che si legge", "Ogni collegamento ha la direzione scritta accanto alla stanza da cui la prendi; le uscite a senso unico sono tratteggiate, e le posizioni delle stanze si ricordano."],
] as const;

const SEZIONI = [
  ["Storia", "Il testo, con la sua struttura a vista."],
  ["Mondo", "Stanze, oggetti e la mappa che li collega."],
  ["Personaggi", "Chi c'è, e che cosa dice."],
  ["Regole", "Che cosa succede, e le parole del giocatore."],
  ["Prova", "La partita, con lo stato accanto."],
] as const;

const Scarica = ({ href, os, nota, ext, primary = false, ext_link = false }: { href: string; os: string; nota: string; ext: string; primary?: boolean; ext_link?: boolean }) => (
  <a
    href={href}
    {...(ext_link ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className={`group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 ${
      primary
        ? "border-favella-emerald/40 bg-favella-emerald/[0.08] hover:border-favella-emerald hover:bg-favella-emerald/15"
        : "border-favella-cyan/25 bg-favella-panel/40 hover:border-favella-cyan hover:bg-favella-cyan/10"
    }`}
  >
    <span>
      <span className="block font-display text-[16px] font-semibold text-favella-text-primary">{os}</span>
      <span className="block text-[13px] text-favella-text-muted">{nota}</span>
    </span>
    <span className={`font-mono text-[12px] ${primary ? "text-favella-emerald" : "text-favella-cyan"}`}>{ext}</span>
  </a>
);

const StudioPage = () => {
  const [attiva, setAttiva] = useState<(typeof SCHERMATE)[number]["id"]>("mappa");
  const s = SCHERMATE.find((x) => x.id === attiva) ?? SCHERMATE[0];

  return (
    <>
      <PageHero
        tone="emerald"
        eyebrow={`L'ambiente di scrittura · versione ${STUDIO_VERSION}`}
        title={
          <>
            Favella <Ink>Studio.</Ink>
          </>
        }
        lead="Scrivi la tua avventura in italiano, vedi le stanze diventare una mappa, componi personaggi, dialoghi e regole senza scrivere una riga, e prova la storia come la giocherebbe chi la riceve. Tutto in un posto solo."
        aside={
          <div className="relative [perspective:1600px]">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(52,211,153,0.2),transparent_70%)] blur-2xl" />
            <div className="overflow-hidden rounded-[20px] border border-favella-cyan/25 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] [transform:rotateY(-7deg)_rotateX(3deg)]">
              <img src="/studio/mappa.webp" alt="La mappa delle stanze in Favella Studio" width={1600} height={1000} className="block h-auto w-full" />
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap gap-4">
          <Btn href="#scarica" size="lg">
            Scarica per Windows o Linux
          </Btn>
          <Btn href="#schermate" variant="ghost" size="lg">
            Guardalo al lavoro
          </Btn>
        </div>
      </PageHero>

      {/* ═════════ SCHERMATE ═════════ */}
      <section id="schermate" className="relative scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead
            eyebrow="Dal vivo"
            tone="emerald"
            title={
              <>
                Ogni sezione, <Ink>com'è davvero.</Ink>
              </>
            }
            lead="Schermate vere, fatte con il motore vero su «La Casa di Via Stradivari»."
          />
          <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
            <div role="tablist" aria-label="Le schermate di Favella Studio" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
              {SCHERMATE.map((x, i) => (
                <button
                  key={x.id}
                  role="tab"
                  aria-selected={attiva === x.id}
                  onClick={() => setAttiva(x.id)}
                  className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-left font-display text-[14.5px] font-semibold transition-all duration-300 lg:rounded-2xl ${
                    attiva === x.id
                      ? "bg-favella-cyan text-favella-dark shadow-[0_14px_40px_-14px_rgba(34,211,238,0.8)] lg:translate-x-2"
                      : "border border-favella-cyan/15 text-favella-text-secondary hover:border-favella-cyan/50 hover:text-favella-text-primary"
                  }`}
                >
                  <span className={`hidden font-mono text-[11px] sm:inline ${attiva === x.id ? "text-favella-dark/60" : "text-favella-text-muted"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {x.nome}
                </button>
              ))}
            </div>
            <div>
              <div className="overflow-hidden rounded-[22px] border border-favella-cyan/20 bg-favella-panel shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95),0_0_80px_-30px_rgba(34,211,238,0.25)]">
                <img key={s.id} src={s.img} alt={s.alt} width={1600} height={1000} className="block h-auto w-full animate-fade-up" />
              </div>
              <div className="mt-6 max-w-[760px]">
                <h3 className="font-display text-[26px] font-bold tracking-[-0.03em] text-favella-text-primary">{s.titolo}</h3>
                <p className="mt-2 font-serif text-[17px] leading-[1.65] text-favella-text-secondary">{s.testo}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ NOVITÀ ═════════ */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead
            eyebrow={`Nella ${STUDIO_VERSION}`}
            tone="amber"
            title={
              <>
                Rivisto da cima a fondo, <Ink>per leggere bene.</Ink>
              </>
            }
            lead="Una revisione completa, riga per riga, e un'interfaccia ridisegnata per chi ci vede poco. Stanze, oggetti, personaggi, uscite, regole e dialoghi si creano e si cambiano dai pannelli, e il testo resta sempre uguale a ciò che fai."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {NOVITA.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <Spot className="h-full p-7">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-favella-amber">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mb-2 mt-3 font-display text-[22px] font-bold tracking-[-0.025em] text-favella-text-primary">{t}</h3>
                  <p className="font-serif text-[15.5px] leading-[1.65] text-favella-text-secondary">{d}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ CINQUE SEZIONI ═════════ */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead eyebrow="Com'è fatto" title={<>Cinque sezioni, <Ink>nell'ordine in cui si scrive.</Ink></>} />
          <div className="grid gap-px overflow-hidden rounded-[28px] border border-favella-cyan/15 bg-favella-cyan/10 sm:grid-cols-2 lg:grid-cols-5">
            {SEZIONI.map(([nome, desc], i) => (
              <div key={nome} className="bg-favella-dark p-7">
                <span className="font-display text-[40px] font-bold leading-none tracking-[-0.05em] text-ink-accent">{i + 1}</span>
                <h3 className="mb-1.5 mt-4 font-display text-[19px] font-bold text-favella-text-primary">{nome}</h3>
                <p className="text-[14px] leading-[1.6] text-favella-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ TRE IDEE ═════════ */}
      <section className="relative px-6 py-16">
        <div className="mx-auto grid max-w-[1240px] gap-5 md:grid-cols-3">
          {[
            [
              "Il testo e i pannelli sono la stessa cosa",
              "Ogni modifica dei pannelli si scrive nel testo, frase per frase, e si può disfare. Affianca il testo a qualunque pannello e guarda che cosa nasce. Niente formati nascosti: la tua storia è un file .fav, leggibile ovunque.",
            ],
            [
              "Dentro c'è il motore vero",
              "Lo stesso del linguaggio FAVELLA 1: ciò che provi qui è ciò che giocherà chi riceve la tua storia. E con un comando la esporti come una sola pagina web, che gira in qualunque browser, anche sul telefono.",
            ],
            [
              "Pensato per leggere bene",
              "Grandezza regolabile dall'80% al 200% (Ctrl + / − / 0), tema notte o carta, contrasto alto, bersagli grandi, fuoco sempre visibile, tutto raggiungibile da tastiera. I font sono inclusi: funziona anche senza rete.",
            ],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 100}>
              <Spot className="h-full p-8">
                <h3 className="mb-3 font-display text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-favella-text-primary">{t}</h3>
                <p className="font-serif text-[16px] leading-[1.7] text-favella-text-secondary">{d}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═════════ DOWNLOAD ═════════ */}
      <section id="scarica" className="relative scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[980px]">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-favella-emerald/25 bg-[radial-gradient(80%_100%_at_0%_0%,rgba(52,211,153,0.14),transparent_60%),linear-gradient(180deg,#0b1a26,#060d17)] p-8 md:p-12">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-favella-emerald">Gratuito · open source (MIT)</p>
              <h2 className="font-display text-[clamp(30px,4.4vw,52px)] font-bold leading-[1.02] tracking-[-0.04em] text-favella-text-primary">
                Scarica Favella Studio <Ink>{STUDIO_VERSION}</Ink>
              </h2>
              <p className="mt-4 max-w-[620px] font-serif text-[18px] leading-[1.6] text-favella-text-secondary">
                Non serve installare Python né altro: il motore è dentro l'app.
              </p>
              <div className="mt-9 flex flex-col gap-3">
                <Scarica href={DOWNLOAD_STUDIO_WINDOWS} os="Windows 10 / 11" nota="installer a 64 bit" ext="↓ .exe" primary ext_link />
                <Scarica href={DOWNLOAD_STUDIO_LINUX} os="Linux" nota="qualunque distribuzione, x86_64" ext="↓ .AppImage" primary ext_link />
                <Scarica href={STUDIO_MAC_URL} os="macOS — costruiscilo tu" nota="un comando, cinque minuti: l'app che ne esce è tua, e il Mac si fida" ext="istruzioni ↗" ext_link />
                <Scarica href={STUDIO_GUIDE_URL} os="La guida all'uso" nota={`${STUDIO_GUIDE_PAGES} pagine con le schermate vere, PDF accessibile; è anche dentro l'app`} ext="↓ .pdf" ext_link />
              </div>
              <div className="mt-9 grid gap-6 text-[14px] leading-[1.7] text-favella-text-secondary sm:grid-cols-2">
                <p>
                  <strong className="text-favella-text-primary">Windows.</strong> L'installer non è firmato con un certificato a pagamento: se compare
                  «Windows ha protetto il PC», clicca <em>Ulteriori informazioni</em> e poi <em>Esegui comunque</em>.
                </p>
                <p>
                  <strong className="text-favella-text-primary">Linux.</strong> Rendi eseguibile il file (
                  <code className="font-mono text-[12.5px] text-favella-emerald">chmod +x FavellaStudio-*.AppImage</code>) e avvialo. Su alcune distribuzioni serve
                  FUSE.
                </p>
              </div>
              <p className="mt-7 text-[13.5px] text-favella-text-muted">
                Tutti i file, con le note di versione, sono anche su{" "}
                <a href={STUDIO_RELEASE_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
                  GitHub Releases
                </a>
                . Il codice è nella cartella <code className="font-mono text-favella-emerald">studio/</code> del{" "}
                <a href={STUDIO_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
                  repository
                </a>
                .
              </p>
            </div>
          </Reveal>
          <p className="mx-auto mt-12 max-w-[760px] text-center font-serif text-[16px] italic leading-[1.7] text-favella-text-muted">
            Preferisci il terminale? <Link to="/download" className="text-favella-cyan not-italic hover:underline">FAVELLA 1 si usa anche con un comando</Link>{" "}
            (<code className="font-mono not-italic">pip install favella1</code>), o{" "}
            <Link to="/programma" className="text-favella-cyan not-italic hover:underline">direttamente nel browser</Link>.
          </p>
        </div>
      </section>
    </>
  );
};

export default StudioPage;

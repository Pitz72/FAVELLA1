// ====================================================================
//  La voce del gioco: il doppiaggio, parte per parte.
// --------------------------------------------------------------------
//  Un file Opus per parte (public/voce/<id>.opus, scritto da
//  strumenti/doppiaggio-banco.py) e un indice con la durata e il testo di
//  ciascuna. Le parti di un turno suonano in fila, con una pausa breve fra le
//  frasi della stessa riga e una più lunga fra una riga e l'altra; al primo
//  tasto la fila si svuota (come in un talkie: il testo resta sullo schermo).
//  Le cartelle che l'indice nomina («cartelle»: public/voce/elevenlabs/, le voci
//  escluse dalla licenza libera) hanno un indice loro e si aggiungono.
//
//  Due modi, mai insieme: «recitata» (la voce del doppiaggio; il diario non
//  annuncia) o «lettore» (nessuna voce: il lettore di schermo legge il diario).
//  Le impostazioni stanno nel browser (localStorage), come i salvataggi del web.
// ====================================================================
import { tabella, type Tabella, type Testi } from "./parti";

export type Modo = "recitata" | "lettore";
export interface Impostazioni { modo: Modo; volume: number }

const CHIAVE = "viaggiatore.voce";
const PREDEFINITE: Impostazioni = { modo: "recitata", volume: 0.9 };
const BASE = `${import.meta.env.BASE_URL}voce/`;
/** secondi di silenzio fra due frasi della stessa riga, e fra due righe */
export const PAUSA_FRASE = 0.3;
export const PAUSA_RIGA = 0.55;
const MEMORIA = 120;   // parti decodificate tenute in memoria

export function leggiImpostazioni(): Impostazioni {
  try {
    const d = JSON.parse(localStorage.getItem(CHIAVE) ?? "null") as Partial<Impostazioni> | null;
    if (!d) return { ...PREDEFINITE };
    return {
      modo: d.modo === "lettore" ? "lettore" : "recitata",
      volume: typeof d.volume === "number" && d.volume >= 0 && d.volume <= 1 ? d.volume : PREDEFINITE.volume,
    };
  } catch {
    return { ...PREDEFINITE };
  }
}

export function scriviImpostazioni(i: Impostazioni) {
  try { localStorage.setItem(CHIAVE, JSON.stringify(i)); } catch { /* il browser non salva: pazienza */ }
}

interface Indice { estensione: string; parti: Record<string, number>; testi?: Testi; cartelle?: string[] }

/** Una parte da dire, con la pausa che la precede. */
export interface Parte { id: string; pausa: number }

class Voce {
  private ctx: AudioContext | null = null;
  private uscita: GainNode | null = null;
  private dove = new Map<string, string>();          // id → URL del file
  private testi: Testi = {};
  private buffer = new Map<string, Promise<AudioBuffer | null>>();
  private suonano: AudioBufferSourceNode[] = [];
  private giro = 0;                                    // cresce a ogni fila nuova: le vecchie si fermano
  private ultima: Parte[] = [];
  private volume = PREDEFINITE.volume;
  private pronta: Promise<Tabella | null> | null = null;
  private quandoParla = new Set<(parla: boolean) => void>();
  parla = false;

  /** Carica gli indici (una volta sola); null se la voce non c'è. */
  prepara(): Promise<Tabella | null> {
    if (!this.pronta) {
      this.pronta = (async () => {
        try {
          const principale = await this.leggiIndice(`${BASE}indice.json`);
          if (!principale) return null;
          for (const id of Object.keys(principale.parti)) this.dove.set(id, `${BASE}${id}${principale.estensione}`);
          for (const c of principale.cartelle ?? []) {
            const altro = await this.leggiIndice(`${BASE}${c}/indice.json`);
            for (const id of Object.keys(altro?.parti ?? {})) this.dove.set(id, `${BASE}${c}/${id}${altro!.estensione}`);
          }
          this.testi = principale.testi ?? {};
          return tabella(this.testi);
        } catch {
          return null;
        }
      })();
    }
    return this.pronta;
  }

  private async leggiIndice(url: string): Promise<Indice | null> {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const testo = await r.text();
      return testo.trimStart().startsWith("{") ? (JSON.parse(testo) as Indice) : null;   // un fallback HTML non è un indice
    } catch {
      return null;
    }
  }

  /** C'è il file di questa parte? (Le parti mute, o solo locali e assenti, non ce l'hanno.) */
  ha(id: string) { return this.dove.has(id); }

  /** Il testo di una parte, per chi la legge invece della voce. */
  testoDi(id: string) { return this.testi[id]?.[1] ?? ""; }

  impostaVolume(v: number) {
    this.volume = v;
    if (this.uscita && this.ctx) this.uscita.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  ascolta(f: (parla: boolean) => void) { this.quandoParla.add(f); return () => { this.quandoParla.delete(f); }; }

  private segna(parla: boolean) {
    if (this.parla === parla) return;
    this.parla = parla;
    for (const f of this.quandoParla) f(parla);
  }

  private contesto(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.uscita = this.ctx.createGain();
      this.uscita.gain.value = this.volume;
      this.uscita.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private carica(id: string): Promise<AudioBuffer | null> {
    let p = this.buffer.get(id);
    if (!p) {
      const url = this.dove.get(id);
      const ctx = this.contesto();
      p = url
        ? fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
          .then((dati) => ctx.decodeAudioData(dati)).catch(() => null)
        : Promise.resolve(null);
      this.buffer.set(id, p);
      if (this.buffer.size > MEMORIA) this.buffer.delete(this.buffer.keys().next().value!);
    }
    return p;
  }

  /** Dice le parti in fila, dopo aver zittito ciò che suonava. */
  dici(parti: Parte[]) {
    this.ferma();
    const fila = parti.filter((p) => this.dove.has(p.id));
    if (!fila.length) return;
    this.ultima = fila;
    const giro = ++this.giro;
    const ctx = this.contesto();
    for (const p of fila) this.carica(p.id);   // tutte insieme: sono piccole
    this.segna(true);
    (async () => {
      let fine = ctx.currentTime;
      for (const [k, p] of fila.entries()) {
        const buf = await this.carica(p.id);
        if (giro !== this.giro) return;
        if (!buf) continue;
        const inizio = Math.max(ctx.currentTime + 0.02, k === 0 ? fine : fine + p.pausa);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.uscita!);
        src.start(inizio);
        this.suonano.push(src);
        fine = inizio + buf.duration;
      }
      const ultima = this.suonano[this.suonano.length - 1];
      if (!ultima) { if (giro === this.giro) this.segna(false); return; }
      ultima.onended = () => { if (giro === this.giro) { this.suonano = []; this.segna(false); } };
    })();
  }

  /** Zittisce subito e svuota la fila. */
  ferma() {
    this.giro++;
    for (const s of this.suonano) { s.onended = null; try { s.stop(); } catch { /* non ancora partita */ } }
    this.suonano = [];
    this.segna(false);
  }

  /** Ridice l'ultima fila. */
  riascolta() { if (this.ultima.length) this.dici(this.ultima); }
}

/** Una sola voce per tutto il gioco. */
export const voce = new Voce();

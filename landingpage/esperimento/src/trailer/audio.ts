// ====================================================================
//  Colonna sonora del trailer (Web Audio).
// --------------------------------------------------------------------
//  Con il BRANO (src/assets/intro.mp3, composto sul montaggio): la musica
//  fa da colonna e anche da OROLOGIO — finché suona, il trailer legge il
//  tempo da lei (orologio()), così immagini e musica non si separano mai.
//  Sopra, a volume basso, solo il rumorismo della scaletta (carta, tasti,
//  timbro, soffi, passi); bordone, vento e i suoni intonati (rintocchi,
//  tonfo) restano spenti: li fa già il brano.
//  Senza brano (file assente o illeggibile) torna la colonna sintetizzata
//  completa: vento, bordone che cresce e si incrina al guado, tutti gli effetti.
//  Parte spenta: i browser lo permettono solo dopo un gesto (il tasto audio).
// ====================================================================
import { EVENTI, type TipoSuono } from "./scaletta";

const INTONATI: TipoSuono[] = ["rintocco", "tonfo"];
const LIV_RUMORI_CON_BRANO = 0.55;
const CODA = 81.4;   // inizio della scena del titolo (vedi scaletta)

export class ColonnaSonora {
  private ac: AudioContext | null = null;
  private brano: HTMLAudioElement | null = null;
  private branoOk = false;
  private gBrano: GainNode | null = null;
  private coda = false;
  private master!: GainNode;
  private vento!: GainNode;
  private filtroVento!: BiquadFilterNode;
  private bordone!: GainNode;
  private gTerza!: GainNode;
  private rumore!: AudioBuffer;
  private ultimoT = -1;
  attivo = false;

  /** url del brano (facoltativo): il file si precarica subito, prima del tasto audio. */
  constructor(urlBrano?: string) {
    if (!urlBrano) return;
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("canplay", () => { this.branoOk = true; }, { once: true });
    a.addEventListener("error", () => { this.branoOk = false; this.brano = null; });
    a.src = urlBrano;
    this.brano = a;
  }

  /** Tempo del brano se sta suonando davvero (è l'orologio del trailer), altrimenti null. */
  orologio(): number | null {
    const b = this.brano;
    if (!b || !this.attivo || !this.branoOk || b.paused || b.seeking || this.coda) return null;
    return b.currentTime;
  }

  /** Solo per il collaudo in sviluppo. */
  diagnosi() {
    const b = this.brano;
    return { attivo: this.attivo, branoOk: this.branoOk, t: b?.currentTime ?? null, fermo: b?.paused ?? null, durata: b?.duration ?? null };
  }

  private get conBrano() { return !!this.brano && this.branoOk; }

  attiva() {
    if (!this.ac) this.costruisci();
    this.ac!.resume();
    this.master.gain.setTargetAtTime(0.9, this.ac!.currentTime, 0.4);
    this.attivo = true;
  }

  spegni() {
    if (!this.ac) return;
    this.master.gain.setTargetAtTime(0, this.ac.currentTime, 0.15);
    this.attivo = false;
  }

  chiudi() {
    this.brano?.pause();
    this.ac?.close(); this.ac = null; this.attivo = false;
  }

  private costruisci() {
    const ac = new AudioContext();
    this.ac = ac;
    this.master = ac.createGain(); this.master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    this.master.connect(comp).connect(ac.destination);

    // rumore bianco riutilizzabile (2 s)
    const len = ac.sampleRate * 2;
    this.rumore = ac.createBuffer(1, len, ac.sampleRate);
    const d = this.rumore.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // vento
    const src = ac.createBufferSource(); src.buffer = this.rumore; src.loop = true;
    this.filtroVento = ac.createBiquadFilter(); this.filtroVento.type = "bandpass"; this.filtroVento.Q.value = 0.8; this.filtroVento.frequency.value = 500;
    this.vento = ac.createGain(); this.vento.gain.value = 0.12;
    src.connect(this.filtroVento).connect(this.vento).connect(this.master);
    src.start();
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.09;
    const lfoG = ac.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG).connect(this.filtroVento.frequency); lfo.start();

    // bordone: La grave + quinta; la terza minore entra al guado
    this.bordone = ac.createGain(); this.bordone.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
    this.bordone.connect(lp).connect(this.master);
    [55, 82.41, 110.3].forEach((f, i) => {
      const o = ac.createOscillator(); o.type = i === 2 ? "triangle" : "sine"; o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = i === 2 ? 0.25 : 0.5;
      o.connect(g).connect(this.bordone); o.start();
    });
    const terza = ac.createOscillator(); terza.type = "sine"; terza.frequency.value = 65.41;
    this.gTerza = ac.createGain(); this.gTerza.gain.value = 0;
    terza.connect(this.gTerza).connect(this.bordone); terza.start();

    // il brano entra nello stesso master (il tasto audio spegne tutto insieme)
    if (this.brano) {
      this.gBrano = ac.createGain(); this.gBrano.gain.value = 1;
      ac.createMediaElementSource(this.brano).connect(this.gBrano).connect(this.master);
    }
  }

  /** Il brano segue il tempo del trailer: parte, si ferma, salta dove serve.
   *  Se si salta al titolo (tasto «salta») parte la CODA del brano, la parte
   *  scritta per il titolo, invece di lasciare il menu in silenzio. */
  private guidaBrano(t: number, inPausa: boolean, tPrec: number) {
    const b = this.brano, g = this.gBrano, ac = this.ac;
    if (!b || !g || !ac || !this.branoOk) return;
    if (inPausa) { if (!b.paused) b.pause(); return; }
    const fine = (b.duration || 0) - 0.05;
    g.gain.setTargetAtTime(1, ac.currentTime, 0.05);
    if (t < fine) {
      this.coda = false;
      if (Math.abs(b.currentTime - t) > 0.3) b.currentTime = t;   // salti: rivedi, capitoli
      if (b.paused) b.play().catch(() => {});
      return;
    }
    if (tPrec >= 0 && tPrec < fine - 2) {                          // salto al titolo
      this.coda = true;
      b.currentTime = Math.min(CODA, fine - 1);
      b.play().catch(() => {});
      return;
    }
    if (this.coda && b.paused && !b.ended) b.play().catch(() => {}); // ripresa dopo una pausa
  }

  /** Chiamata a ogni fotogramma col tempo del trailer. */
  aggiorna(t: number, inPausa: boolean) {
    if (!this.ac || !this.attivo) {
      if (this.brano && !this.brano.paused) this.brano.pause();
      this.ultimoT = t; return;
    }
    const now = this.ac.currentTime;
    this.guidaBrano(t, inPausa, this.ultimoT);
    if (this.conBrano) {
      this.bordone.gain.setTargetAtTime(0, now, 0.3);
      this.gTerza.gain.setTargetAtTime(0, now, 0.3);
      this.vento.gain.setTargetAtTime(0, now, 0.3);
    } else {
    // bordone: cresce verso il guado, si apre al titolo
    const liv = inPausa ? 0 : t < 9.6 ? 0.05 : t < 59.6 ? 0.05 + (t - 9.6) / 50 * 0.1 : t < 67.8 ? 0.2 : t < 81.4 ? 0.12 : 0.16;
    this.bordone.gain.setTargetAtTime(liv, now, 0.6);
    this.gTerza.gain.setTargetAtTime(!inPausa && t > 60.5 && t < 68 ? 0.35 : 0, now, 0.8);
    // il vento cala al guado (silenzio prima del tonfo), torna al titolo
    const v = inPausa ? 0.02 : t > 62.5 && t < 67.8 ? 0.05 : t > 67.8 && t < 81.4 ? 0.07 : 0.13;
    this.vento.gain.setTargetAtTime(v, now, 0.5);
    }

    if (inPausa) { this.ultimoT = t; return; }
    // eventi puntuali attraversati da questo fotogramma (se il salto è piccolo)
    const da = this.ultimoT;
    if (t > da && t - da < 0.5) {
      for (const e of EVENTI) {
        if (e.t > da && e.t <= t) {
          if (!this.conBrano) this.suona(e.tipo, e.vol ?? 1);
          else if (!INTONATI.includes(e.tipo)) this.suona(e.tipo, (e.vol ?? 1) * LIV_RUMORI_CON_BRANO);
        }
        if (e.t > t) break;
      }
    }
    this.ultimoT = t;
  }

  private suona(tipo: TipoSuono, vol: number) {
    const ac = this.ac!, now = ac.currentTime;
    const rumore = (dur: number, tipoF: BiquadFilterType, f: number, g: number, f2?: number) => {
      const s = ac.createBufferSource(); s.buffer = this.rumore;
      const fl = ac.createBiquadFilter(); fl.type = tipoF; fl.frequency.setValueAtTime(f, now);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + dur);
      const gg = ac.createGain();
      gg.gain.setValueAtTime(0.0001, now);
      gg.gain.exponentialRampToValueAtTime(g * vol, now + Math.min(0.02, dur / 4));
      gg.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      s.connect(fl).connect(gg).connect(this.master);
      s.start(now, Math.random() * 1.5, dur + 0.05);
    };
    const tono = (f0: number, f1: number, dur: number, g: number, tipoO: OscillatorType = "sine") => {
      const o = ac.createOscillator(); o.type = tipoO;
      o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f1, now + dur);
      const gg = ac.createGain();
      gg.gain.setValueAtTime(0.0001, now);
      gg.gain.exponentialRampToValueAtTime(g * vol, now + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(gg).connect(this.master); o.start(now); o.stop(now + dur + 0.05);
    };
    switch (tipo) {
      case "passo": rumore(0.11, "lowpass", 700, 0.5); tono(90, 50, 0.08, 0.12); break;
      case "carta": rumore(0.35, "bandpass", 2400, 0.25, 900); break;
      case "tasto": rumore(0.04, "highpass", 3000, 0.18); break;
      case "timbro": tono(120, 45, 0.35, 0.5); rumore(0.08, "lowpass", 1200, 0.4); break;
      case "soffio": rumore(0.6, "bandpass", 300, 0.22, 3000); break;
      case "tonfo": tono(70, 28, 1.4, 0.8); rumore(0.2, "lowpass", 400, 0.3); break;
      case "rintocco": tono(880, 870, 1.6, 0.06, "triangle"); tono(1320, 1310, 1.2, 0.03); break;
    }
  }
}

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
//  La VOCE di Enzo (il doppiaggio, se il giocatore ha scelto la voce recitata):
//  una traccia sola lunga quanto il trailer (public/voce/trailer.opus, scritta da
//  strumenti/doppiaggio-trailer.py) che segue lo stesso orologio; mentre parla la
//  musica si abbassa (VOCE_SOTTO) e torna su appena tace. Passa dal master: il
//  tasto audio spegne anche lei.
//  Parte spenta: i browser lo permettono solo dopo un gesto (il tasto audio).
// ====================================================================
import { EVENTI, type Evento, type TipoSuono } from "./scaletta";
import { rng } from "./tempo";

const INTONATI: TipoSuono[] = ["rintocco", "tonfo"];
const LIV_RUMORI_CON_BRANO = 0.55;
const CODA = 81.4;   // inizio della scena del titolo (vedi scaletta)
// la musica sotto la voce: quanto scende, quanto prima comincia a scendere e quanto dopo risale (due frasi
// vicine meno di ANTICIPO + RILASCIO restano sotto insieme: la musica non fa su e giù fra l'una e l'altra)
const VOCE_SOTTO = 0.4;   // -8 dB
const ANTICIPO = 0.15, RILASCIO = 0.35;
const SCENDE = 0.08, SALE = 0.3;   // costanti di tempo (s) di setTargetAtTime
const SCARTO_VOCE = 0.06;          // oltre questo scarto dall'orologio la voce si riposiziona

/** Dove trovare la voce del trailer e a che volume. */
export interface VoceDelTrailer { traccia: string; scaletta: string; volume: number }
interface Frase { id: string; da: number; a: number }

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
  private rumori!: GainNode;     // l'uscita dei rumori sintetici: passano da una «stanza» brevissima
  private ultimoT = -1;
  private datiVoce: VoceDelTrailer | null = null;
  private voce: AudioBuffer | null = null;
  private frasi: Frase[] = [];
  private gVoce: GainNode | null = null;
  private sorgVoce: AudioBufferSourceNode | null = null;
  private voceDa = 0;          // istante del contesto in cui la sorgente è partita
  private voceOffset = 0;      // e da che punto della traccia
  /** si risolve quando la voce è pronta (o non c'è): serve agli strumenti che rendono il suono offline */
  voceCaricata: Promise<void> = Promise.resolve();
  attivo = false;

  /** url del brano (facoltativo): il file si precarica subito, prima del tasto audio.
   *  `voce` (facoltativa): la voce del trailer; si carica quando nasce il contesto audio. */
  constructor(urlBrano?: string, voce?: VoceDelTrailer) {
    this.datiVoce = voce ?? null;
    if (!urlBrano) return;
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("canplay", () => { this.branoOk = true; }, { once: true });
    a.addEventListener("error", () => { this.branoOk = false; this.brano = null; });
    a.src = urlBrano;
    this.brano = a;
  }

  /** Quanto passa fra il punto del brano che il file ha decodificato e ciò che si sente: la latenza di base del contesto più
   *  quella dell'uscita (la scheda audio: 40 ms misurati, di più con le cuffie senza fili). Zero dove il browser non la dice. */
  private latenza(): number {
    const ac = this.ac as (AudioContext & { outputLatency?: number }) | null;
    if (!ac) return 0;
    const l = (ac.baseLatency || 0) + (ac.outputLatency || 0);
    return Math.max(0, Math.min(l, 0.25));
  }

  /** Tempo del brano IN CUI SI SENTE, se sta suonando davvero (è l'orologio del trailer), altrimenti null: l'immagine
   *  segue ciò che l'orecchio sente e non ciò che il file ha già decodificato (di circa tre fotogrammi). */
  orologio(): number | null {
    const b = this.brano;
    if (!b || !this.attivo || !this.branoOk || b.paused || b.seeking || this.coda) return null;
    return Math.max(0, b.currentTime - this.latenza());
  }

  /** Solo per il collaudo in sviluppo. */
  diagnosi() {
    const b = this.brano;
    const ac = this.ac;
    return {
      attivo: this.attivo, branoOk: this.branoOk, t: b?.currentTime ?? null, fermo: b?.paused ?? null, durata: b?.duration ?? null,
      voce: this.voce ? { durata: this.voce.duration, frasi: this.frasi.length, suona: !!this.sorgVoce,
        posizione: this.sorgVoce && ac ? this.voceOffset + (ac.currentTime - this.voceDa) : null,
        musica: this.gBrano?.gain.value ?? null } : null,
    };
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
    this.fermaVoce();
    this.ac?.close(); this.ac = null; this.attivo = false;
  }

  private async caricaVoce(ac: BaseAudioContext, d: VoceDelTrailer) {
    try {
      const [scaletta, dati] = await Promise.all([
        fetch(d.scaletta).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
        fetch(d.traccia).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))))),
      ]);
      this.voce = await ac.decodeAudioData(dati);
      this.frasi = (scaletta as { frasi: Frase[] }).frasi;
    } catch {
      this.voce = null; this.frasi = [];   // senza voce il trailer è quello di sempre
    }
  }

  /** Il livello della musica all'istante t: sotto mentre Enzo parla. */
  private livelloMusica(t: number): number {
    if (!this.voce) return 1;
    return this.frasi.some((f) => t >= f.da - ANTICIPO && t < f.a + RILASCIO) ? VOCE_SOTTO : 1;
  }

  private fermaVoce() {
    if (!this.sorgVoce) return;
    try { this.sorgVoce.stop(); } catch { /* già ferma */ }
    this.sorgVoce.disconnect();
    this.sorgVoce = null;
  }

  /** La voce segue il tempo del trailer come il brano: parte, si ferma, si riposiziona se si scosta. */
  private guidaVoce(t: number, inPausa: boolean) {
    const ac = this.ac, buf = this.voce;
    if (!ac || !buf || !this.gVoce) return;
    const voluta = t + (this.conBrano ? this.latenza() : 0);   // come il brano: ciò che parte ora si sente fra «latenza»
    if (inPausa || voluta < 0 || voluta >= buf.duration - 0.05) { this.fermaVoce(); return; }
    if (this.sorgVoce && Math.abs(this.voceOffset + (ac.currentTime - this.voceDa) - voluta) < SCARTO_VOCE) return;
    this.fermaVoce();
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.connect(this.gVoce);
    s.start(ac.currentTime, voluta);
    this.sorgVoce = s; this.voceDa = ac.currentTime; this.voceOffset = voluta;
  }

  /** Per gli strumenti (strumenti/trailer-mix.cjs): su un contesto offline, la voce e la musica che le scende
   *  sotto fra `da` e `a` secondi del trailer, programmate dall'istante 0 del contesto. Restituisce le frasi. */
  programmaVoceOffline(da: number, a: number) {
    const ac = this.ac, buf = this.voce;
    if (!ac || !buf || !this.gVoce || !this.gBrano) return 0;
    const s = ac.createBufferSource();
    s.buffer = buf; s.connect(this.gVoce);
    s.start(0, da, Math.max(0, Math.min(a, buf.duration) - da));
    const g = this.gBrano.gain;
    let prec = this.livelloMusica(da);
    g.setValueAtTime(prec, 0);
    for (let t = da; t < a; t += 0.01) {   // gli stessi scalini che il trailer vivo segue fotogramma per fotogramma
      const l = this.livelloMusica(t);
      if (l !== prec) { g.setTargetAtTime(l, t - da, l < prec ? SCENDE : SALE); prec = l; }
    }
    return this.frasi.filter((f) => f.a > da && f.da < a).length;
  }

  private costruisci() {
    const ac = new AudioContext();
    this.ac = ac;
    this.master = ac.createGain(); this.master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    this.master.connect(comp).connect(ac.destination);

    // i rumori sintetici passano da una «stanza» brevissima (0,22 s di coda che decade, solo un filo di mandata)
    this.rumori = ac.createGain();
    this.rumori.connect(this.master);
    const lungIr = Math.floor(ac.sampleRate * 0.22), ir = ac.createBuffer(2, lungIr, ac.sampleRate), ri = rng(41);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < lungIr; i++) d[i] = (ri() * 2 - 1) * Math.pow(1 - i / lungIr, 3.2); }
    const stanza = ac.createConvolver(); stanza.buffer = ir;
    const mandata = ac.createGain(); mandata.gain.value = 0.16;
    this.rumori.connect(mandata).connect(stanza).connect(this.master);

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
    this.gBrano = ac.createGain(); this.gBrano.gain.value = 1;
    this.gBrano.connect(this.master);
    if (this.brano) ac.createMediaElementSource(this.brano).connect(this.gBrano);

    // la voce del trailer, anche lei nel master
    if (this.datiVoce) {
      this.gVoce = ac.createGain(); this.gVoce.gain.value = this.datiVoce.volume;
      this.gVoce.connect(this.master);
      this.voceCaricata = this.caricaVoce(ac, this.datiVoce);
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
    // sotto la voce la musica scende; l'abbassamento si sente insieme alla voce, quindi guarda avanti di «latenza»
    const liv = this.livelloMusica(t + this.latenza());
    g.gain.setTargetAtTime(liv, ac.currentTime, liv < g.gain.value ? SCENDE : SALE);
    if (t < fine) {
      this.coda = false;
      const lat = this.latenza();
      if (Math.abs(b.currentTime - (t + lat)) > 0.3) b.currentTime = t + lat;   // salti: rivedi, capitoli
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
      this.fermaVoce();
      this.ultimoT = t; return;
    }
    const now = this.ac.currentTime;
    this.guidaBrano(t, inPausa, this.ultimoT);
    this.guidaVoce(t, inPausa);
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
      // l'immagine segue ciò che si sente; un rumore sintetico passa dalla stessa uscita e arriva alla stessa distanza:
      // lo si avvia con la latenza d'anticipo, così cade insieme alla musica e al fotogramma
      const ant = this.conBrano ? this.latenza() : 0;
      for (const e of EVENTI) {
        if (e.t > da + ant && e.t <= t + ant) {
          if (!this.conBrano) this.suona(e.tipo, e.vol ?? 1, e);
          else if (!INTONATI.includes(e.tipo)) this.suona(e.tipo, (e.vol ?? 1) * LIV_RUMORI_CON_BRANO, e);
        }
        if (e.t > t + ant) break;
      }
    }
    this.ultimoT = t;
  }

  /** Un rumore. `e` è l'evento: da lui un seme (lo stesso trailer suona sempre uguale, ma ogni passo è un po' diverso
   *  dall'altro: altezza, livello ±2 dB, filtro), il lato del piede e la materia del terreno. */
  private suona(tipo: TipoSuono, vol: number, e?: Evento) {
    const ac = this.ac!, now = ac.currentTime;
    const r = rng(Math.round((e?.t ?? now) * 1000) + 7);
    const v = (a: number, b: number) => a + (b - a) * r();
    const dB = (x: number) => Math.pow(10, x / 20);
    const uscita = (pan: number): AudioNode => {
      if (!pan || !ac.createStereoPanner) return this.rumori;
      const p = ac.createStereoPanner(); p.pan.value = pan; p.connect(this.rumori); return p;
    };
    const rumore = (dur: number, tipoF: BiquadFilterType, f: number, g: number, f2?: number, ritardo = 0, pan = 0) => {
      const t0 = now + ritardo;
      const s = ac.createBufferSource(); s.buffer = this.rumore;
      const fl = ac.createBiquadFilter(); fl.type = tipoF; fl.frequency.setValueAtTime(f, t0);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      const gg = ac.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.exponentialRampToValueAtTime(g * vol, t0 + Math.min(0.02, dur / 4));
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl).connect(gg).connect(uscita(pan));
      s.start(t0, r() * 1.5, dur + 0.05);
    };
    const tono = (f0: number, f1: number, dur: number, g: number, tipoO: OscillatorType = "sine", ritardo = 0, pan = 0) => {
      const t0 = now + ritardo;
      const o = ac.createOscillator(); o.type = tipoO;
      o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const gg = ac.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.exponentialRampToValueAtTime(g * vol, t0 + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg).connect(uscita(pan)); o.start(t0); o.stop(t0 + dur + 0.05);
    };
    switch (tipo) {
      case "passo": {
        const piede = e?.piede ?? 0, pan = piede ? 0.16 : -0.16;
        const alt = v(0.93, 1.07) * (piede ? 1 : 0.96), liv = dB(v(-2, 2));    // altezza (il sinistro appena più grave) e livello
        switch (e?.terreno ?? "asfalto") {
          case "crosta":                                                         // fango secco che scricchiola: tre schiocchi e un tonfo
            rumore(0.07, "bandpass", 1800 * alt, 0.30 * liv, 700, 0, pan);
            rumore(0.05, "highpass", 3200, 0.14 * liv, undefined, v(0.025, 0.05), pan);
            rumore(0.04, "bandpass", 2500 * alt, 0.12 * liv, 1200, v(0.06, 0.09), pan);
            tono(80 * alt, 45, 0.09, 0.14 * liv, "sine", 0, pan);
            break;
          case "sale":                                                           // sale che si schiaccia: un fruscio morbido e lungo
            rumore(0.17, "bandpass", 1500 * alt, 0.26 * liv, 500, 0, pan);
            rumore(0.06, "highpass", 4500, 0.05 * liv, undefined, 0.01, pan);
            break;
          case "sassi": {                                                        // sassi che rotolano: tanti clic piccoli sopra un tonfo sordo
            const n = 3 + Math.floor(r() * 3);
            for (let k = 0; k < n; k++) rumore(0.03, "bandpass", v(2400, 4200), v(0.08, 0.2) * liv, undefined, k * v(0.012, 0.03), pan);
            rumore(0.09, "lowpass", 700 * alt, 0.22 * liv, 350, 0, pan);
            break;
          }
          default:                                                               // asfalto secco: un colpo sordo e un filo di granello
            rumore(0.1, "lowpass", 900 * alt, 0.42 * liv, 400 * alt, 0, pan);
            tono(95 * alt, 52, 0.07, 0.1 * liv, "sine", 0, pan);
            rumore(0.03, "highpass", 3500, 0.06 * liv, undefined, 0.004, pan);
        }
        break;
      }
      case "carta": rumore(0.35 * v(0.9, 1.15), "bandpass", 2400 * v(0.92, 1.08), 0.25 * dB(v(-2, 2)), 900); break;
      case "tasto": rumore(0.04, "highpass", v(2600, 3600), 0.18 * dB(v(-2, 2))); tono(v(160, 230), 90, 0.03, 0.05); break;
      case "timbro": tono(120, 45, 0.35, 0.5); rumore(0.08, "lowpass", 1200, 0.4); break;
      case "soffio": rumore(0.6, "bandpass", 300, 0.22, 3000); break;
      case "tonfo": tono(70, 28, 1.4, 0.8); rumore(0.2, "lowpass", 400, 0.3); break;
      case "rintocco": tono(880, 870, 1.6, 0.06, "triangle"); tono(1320, 1310, 1.2, 0.03); break;
    }
  }
}

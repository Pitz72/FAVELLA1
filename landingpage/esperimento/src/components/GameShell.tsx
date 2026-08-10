// ====================================================================
//  Shell 16:9 «da emulatore a tutto schermo».
// --------------------------------------------------------------------
//  Container full-viewport NERO; al centro un palco 16:9 grande quanto
//  possibile mantenendo l'aspetto (letterbox: bande sopra/sotto o ai lati).
//  DENTRO il palco si renderizza una superficie a RISOLUZIONE FISSA
//  (1280×720) scalata per riempirlo: così la UI di gioco è un layout
//  desktop PIXEL-PERFECT a qualunque dimensione, come un emulatore — niente
//  reflow, niente stack mobile. Tasto Fullscreen (Fullscreen API).
// ====================================================================
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ViaggiatorePlayer from "./ViaggiatorePlayer";

const DESIGN_W = 1280;
const DESIGN_H = 720;

const GameShell = ({ onExit }: { onExit: () => void }) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fs, setFs] = useState(false);

  // Scala la superficie di design alla larghezza del palco 16:9.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / DESIGN_W));
    ro.observe(el);
    setScale(el.clientWidth / DESIGN_W);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFs = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  return (
    <div ref={shellRef} className="relative flex h-full w-full items-center justify-center bg-black">
      {/* Palco 16:9: il box più grande che entra nel viewport mantenendo 16/9. */}
      <div
        ref={stageRef}
        className="relative overflow-hidden"
        style={{
          width: "min(100vw, calc(100dvh * 16 / 9))",
          height: "min(100dvh, calc(100vw * 9 / 16))",
        }}
      >
        {/* Superficie di design 1280×720, scalata per riempire il palco. */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
        >
          <ViaggiatorePlayer onExit={onExit} />
        </div>

        {/* Controllo fullscreen, in sovrimpressione sul palco. */}
        <button
          onClick={toggleFs}
          title={fs ? "Esci da schermo intero" : "Schermo intero"}
          className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-favella-void/60 text-favella-text-secondary backdrop-blur-sm transition-colors hover:border-favella-amber hover:text-favella-text-primary"
        >
          {fs ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default GameShell;

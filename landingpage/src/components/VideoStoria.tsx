import { useState } from "react";
import { VIDEO_STORIA } from "../constants";

// ====================================================================
//  Il video «FAVELLA — La storia», sotto la testata della home.
// --------------------------------------------------------------------
//  Finché non si preme play si vede soltanto la copertina, servita dal
//  nostro dominio (public/video/): nessuna richiesta a YouTube, nessun
//  cookie. Al clic la copertina lascia il posto al lettore, caricato da
//  youtube-nocookie.com (la modalità di YouTube con privacy avanzata) e
//  già in riproduzione. È l'unico dominio che la CSP (public/.htaccess)
//  lascia entrare in un iframe. Privacy e cookie lo dicono.
// ====================================================================

const COPERTINA = `${import.meta.env.BASE_URL}video/favella-la-storia`;

const VideoStoria = () => {
  const [acceso, setAcceso] = useState(false);
  const embed = `https://www.youtube-nocookie.com/embed/${VIDEO_STORIA.id}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-favella-cyan/15 bg-favella-void shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        {acceso ? (
          <iframe
            src={embed}
            title={VIDEO_STORIA.titolo}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAcceso(true)}
            aria-label={`Guarda il video «${VIDEO_STORIA.titolo}» (${VIDEO_STORIA.durata}): il lettore di YouTube si carica adesso`}
            className="group absolute inset-0 block h-full w-full cursor-pointer"
          >
            <img
              src={`${COPERTINA}.webp`}
              srcSet={`${COPERTINA}-640.webp 640w, ${COPERTINA}.webp 1280w`}
              sizes="(min-width: 1100px) 1040px, 100vw"
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              alt="La storia di FAVELLA, quando l'italiano diventa codice: una stanza disegnata con linee di luce, e in fondo una porta accesa."
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* Il play sta in basso a sinistra, sotto il titolo della copertina: non lo copre. Sui
                telefoni è solo il cerchio, in basso a destra, lontano dal sottotitolo. */}
            <span
              aria-hidden="true"
              className="absolute bottom-3 right-3 flex items-center gap-3 rounded-full border border-favella-cyan/45 bg-favella-void/75 p-1.5 shadow-[0_0_36px_rgba(34,211,238,0.3)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.04] sm:bottom-4 sm:left-4 sm:right-auto sm:py-2 sm:pl-2 sm:pr-5 md:bottom-7 md:left-7 md:gap-4 md:pr-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-favella-cyan/15 md:h-14 md:w-14">
                <svg viewBox="0 0 24 24" className="ml-1 h-5 w-5 fill-favella-cyan-bright md:h-7 md:w-7">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-favella-text-primary sm:inline md:text-[13px]">
                Guarda il video · {VIDEO_STORIA.durata}
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-favella-text-muted">
        <span>Il lettore di YouTube si carica solo quando premi play, in modalità senza cookie.</span>
        <a href={VIDEO_STORIA.url} target="_blank" rel="noopener noreferrer" className="text-favella-cyan hover:underline">
          Guardalo su YouTube ↗
        </a>
      </p>
    </div>
  );
};

export default VideoStoria;

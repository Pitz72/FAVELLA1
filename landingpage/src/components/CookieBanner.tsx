import { useEffect, useState } from "react";
import { Link } from "../router";

// Avviso informativo sulla privacy. Il sito NON usa cookie di profilazione, quindi
// questo NON è un gate di consenso: è una nota trasparente, chiudibile. La scelta
// di chiusura è salvata in localStorage (strumento tecnico, esente da consenso).
const KEY = "favella-privacy-notice";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      // localStorage non disponibile: mostra comunque, senza persistere.
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignora */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] px-4 pb-4">
      <div className="mx-auto flex max-w-[860px] flex-col gap-3 rounded-2xl border border-favella-cyan/20 bg-favella-void/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5">
        <p className="flex-1 text-[13.5px] leading-[1.55] text-favella-text-secondary">
          <span className="font-semibold text-favella-text-primary">Privacy in breve:</span> questo
          sito non usa cookie di profilazione e non ti traccia. I font sono ospitati da noi (nessuna
          chiamata a Google) e nessun dato viene condiviso a fini di marketing. Dettagli nella{" "}
          <Link to="/privacy" className="text-favella-cyan hover:underline">Privacy</Link> e nella{" "}
          <Link to="/cookie" className="text-favella-cyan hover:underline">Cookie Policy</Link>.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg border border-favella-cyan/35 bg-favella-cyan/10 px-5 py-2.5 font-display text-[13.5px] font-semibold text-favella-cyan-bright transition-colors hover:border-favella-cyan hover:bg-favella-cyan hover:text-favella-dark"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;

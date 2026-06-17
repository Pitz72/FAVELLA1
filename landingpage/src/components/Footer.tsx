import { GitHubIcon, Spark, SiteVersionBadge, FacebookIcon } from "./icons";
import { AUTHOR_NAME, GITHUB_URL, GITHUB_DISCUSSIONS_URL, FACEBOOK_GROUP_URL, SITE_VERSION } from "../constants";

const Footer = () => (
  <footer className="w-full border-t border-favella-cyan/10 bg-black/30 backdrop-blur-sm mt-24">
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="font-display font-bold text-white text-lg">
            FAVELLA<span className="text-favella-cyan">1</span>
          </p>
          <p className="text-favella-text-secondary text-sm mt-1 font-serif">
            Il linguaggio di programmazione in cui l'italiano è il codice.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-favella-cyan/25 text-favella-text-primary hover:text-favella-dark hover:bg-favella-cyan transition-all duration-300 text-sm"
          >
            <GitHubIcon className="w-4 h-4" /> GitHub
          </a>
          <a
            href={GITHUB_DISCUSSIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-favella-text-secondary/20 text-favella-text-secondary hover:text-favella-cyan hover:border-favella-cyan/40 transition-all duration-300 text-sm"
          >
            Discussioni
          </a>
          <a
            href={FACEBOOK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-favella-text-secondary/20 text-favella-text-secondary hover:text-favella-cyan hover:border-favella-cyan/40 transition-all duration-300 text-sm"
          >
            <FacebookIcon className="w-4 h-4" /> Gruppo Facebook
          </a>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-favella-text-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-favella-text-muted">
        <p className="font-mono inline-flex items-center gap-3">
          © {new Date().getFullYear()} · Progetto open-source · {AUTHOR_NAME}
          <SiteVersionBadge version={SITE_VERSION} />
        </p>
        <p className="inline-flex items-center gap-2">
          Creato in dialogo con l'IA
          <Spark className="w-3.5 h-3.5 text-favella-amber animate-flame-flicker" />
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

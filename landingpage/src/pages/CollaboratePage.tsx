import AnimatedSection from "../components/AnimatedSection";
import BrandMark from "../components/BrandMark";
import { GitHubIcon, ChatIcon, MailIcon, TelegramIcon, FacebookIcon, BookProse, PlayIcon, LogicIcon, Spark } from "../components/icons";
import { GITHUB_URL, GITHUB_DISCUSSIONS_URL, GITHUB_ISSUES_URL, AUTHOR_EMAIL, TELEGRAM_HANDLE, TELEGRAM_URL, FACEBOOK_GROUP_URL } from "../constants";

const ways = [
  { Icon: PlayIcon, title: "Gioca e collauda", body: "Prova la demo «Il Relitto Silente», scrivi le tue storie e segnala cosa non torna." },
  { Icon: BookProse, title: "Scrivi storie", body: "Ogni nuova avventura è una prova del linguaggio sul campo e un esempio per gli altri." },
  { Icon: LogicIcon, title: "Proponi costrutti", body: "Hai un'idea per la grammatica? Aprila come discussione: si valuta insieme." },
  { Icon: GitHubIcon, title: "Contribuisci al codice", body: "Motore, toolchain e documentazione sono Python aperto: fork, patch, pull request." },
];

const CollaboratePage = () => (
  <AnimatedSection>
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <BrandMark size={88} rings className="mx-auto mb-6" />
        <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Collabora</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-favella-text-primary mb-5">
          Unisciti <span className="text-gradient-brand">all'avventura</span>
        </h1>
        <p className="max-w-2xl mx-auto text-favella-text-secondary leading-relaxed font-serif">
          FAVELLA 1 è open-source e cresce con chi ci mette le mani. Non serve essere programmatori
          esperti: l'italiano è già il linguaggio.
        </p>
      </div>

      {/* Modi per contribuire */}
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {ways.map(({ Icon, title, body }) => (
          <div key={title} className="glass rounded-2xl p-6 glow-border transition-transform duration-300 hover:-translate-y-1">
            <div className="w-11 h-11 rounded-xl bg-favella-cyan/10 text-favella-cyan flex items-center justify-center mb-4">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-favella-text-primary mb-1.5">{title}</h3>
            <p className="text-sm text-favella-text-secondary leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Appello maintainer */}
      <div className="relative overflow-hidden rounded-3xl glass glow-border p-8 md:p-12 text-center mb-10">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-favella-emerald/10 blur-[120px] pointer-events-none" />
        <div className="relative">
          <Spark className="w-7 h-7 text-favella-amber mx-auto mb-4 animate-flame-flicker" />
          <h2 className="font-display font-bold text-2xl md:text-3xl text-favella-text-primary mb-4">
            …e se volessi prenderlo in carico?
          </h2>
          <p className="text-favella-text-secondary max-w-2xl mx-auto leading-relaxed">
            La cosa più bella sarebbe che qualcuno appassionato di narrativa interattiva e linguaggi
            voglia <strong className="text-favella-cyan">dare una mano stabile</strong>, o persino
            <strong className="text-favella-emerald"> raccogliere il testimone</strong> e portare FAVELLA
            oltre. Se è la tua storia, facciamoci due parole.
          </p>
        </div>
      </div>

      {/* Canali */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gradient bg-[length:200%_auto] hover:bg-[position:100%] text-favella-dark font-bold py-3.5 px-7 rounded-xl shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-500"
        >
          <GitHubIcon className="w-5 h-5" /> Repository
        </a>
        <a
          href={GITHUB_DISCUSSIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl glass text-favella-text-primary hover:text-favella-cyan transition-all duration-300"
        >
          <ChatIcon className="w-5 h-5" /> Discussioni
        </a>
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl glass text-favella-text-primary hover:text-favella-cyan transition-all duration-300"
        >
          Issue
        </a>
        <a
          href={FACEBOOK_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl glass text-favella-text-primary hover:text-favella-cyan transition-all duration-300"
        >
          <FacebookIcon className="w-5 h-5" /> Gruppo Facebook
        </a>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 text-sm text-favella-text-secondary">
        <span className="text-favella-text-muted">Oppure scrivimi direttamente:</span>
        <a
          href={`mailto:${AUTHOR_EMAIL}`}
          className="text-favella-cyan hover:text-favella-cyan-bright inline-flex items-center gap-2"
        >
          <MailIcon className="w-4 h-4" /> {AUTHOR_EMAIL}
        </a>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-favella-cyan hover:text-favella-cyan-bright inline-flex items-center gap-2"
        >
          <TelegramIcon className="w-4 h-4" /> {TELEGRAM_HANDLE}
        </a>
      </div>
    </div>
  </AnimatedSection>
);

export default CollaboratePage;

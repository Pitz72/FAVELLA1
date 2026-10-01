import { useEffect, useMemo, useRef, useState } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio, infoStoria } from '../store'
import logoStudio from '../assets/favella-studio-logo.svg'
import { IconaCartella, IconaFreccia, IconaMenu, IconaPlay, IconaRiordina, IconaSalva } from './Icone'
import { stessoFile } from '../utils/progetto'

function nomeCartella(root: string | null): string {
  if (!root) return ''
  const parti = root.split(/[\\/]/).filter(Boolean)
  return parti[parti.length - 1] ?? root
}

function fileFav(nodi: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const n of nodi) {
    if (n.type === 'dir') out.push(...fileFav(n.children ?? []))
    else if (n.name.toLowerCase().endsWith('.fav')) out.push(n)
  }
  return out
}

/** Chiude un menu a comparsa al clic fuori o con Esc. */
function useChiudiFuori(aperto: boolean, chiudi: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!aperto) return
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) chiudi()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') chiudi()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [aperto, chiudi])
  return ref
}

function SelettoreFile(): JSX.Element | null {
  const tree = useStudio((s) => s.tree)
  const activePath = useStudio((s) => s.activePath)
  const openFile = useStudio((s) => s.openFile)
  // I file della storia a cui appartiene quello aperto (la radice e i moduli inclusi).
  const membri = useStudio((s) => JSON.stringify(infoStoria(s)?.membri ?? []))
  const [aperto, setAperto] = useState(false)
  const ref = useChiudiFuori(aperto, () => setAperto(false))
  const file = useMemo(() => fileFav(tree), [tree])
  const dellaStoria = useMemo(() => JSON.parse(membri) as string[], [membri])
  const attivo = file.find((f) => stessoFile(f.path, activePath))
  if (file.length === 0) return null

  const aDestra = file.filter((f) => !dellaStoria.some((m) => stessoFile(m, f.path)))
  const interni = dellaStoria
    .map((m) => file.find((f) => stessoFile(f.path, m)))
    .filter((f): f is FileNode => !!f)

  const voce = (f: FileNode, principale: boolean): JSX.Element => (
    <button
      key={f.path}
      role="option"
      aria-selected={stessoFile(f.path, activePath)}
      className={'menu-item' + (stessoFile(f.path, activePath) ? ' current' : '')}
      onClick={() => {
        setAperto(false)
        void openFile(f)
      }}
    >
      <span>
        {principale && '★ '}
        {f.name}
      </span>
      {principale && <span className="menu-nota">principale</span>}
    </button>
  )

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        className="crumb-file"
        onClick={() => setAperto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aperto}
        title="Scegli quale file della storia stai modificando"
      >
        <span className="crumb-file-name">{attivo?.name ?? 'Scegli un file…'}</span>
        {dellaStoria.length > 1 && <span className="crumb-badge">{dellaStoria.length} file</span>}
        <IconaFreccia />
      </button>
      {aperto && (
        <div className="menu menu-left" role="listbox">
          {interni.length > 1 && (
            <>
              <div className="menu-title">File di questa storia</div>
              {interni.map((f, i) => voce(f, i === 0))}
              {aDestra.length > 0 && <div className="menu-title">Altri file del progetto</div>}
              {aDestra.map((f) => voce(f, false))}
            </>
          )}
          {interni.length <= 1 && (
            <>
              <div className="menu-title">File della storia</div>
              {file.map((f) => voce(f, false))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function TopBar(): JSX.Element {
  const projectRoot = useStudio((s) => s.projectRoot)
  const activePath = useStudio((s) => s.activePath)
  const isFav = !!activePath?.toLowerCase().endsWith('.fav')
  const daSalvare = useStudio((s) => s.openFiles.filter((f) => f.content !== f.savedContent).length)
  const multiFile = useStudio((s) => (infoStoria(s)?.membri.length ?? 1) > 1)
  const saveAll = useStudio((s) => s.saveAll)
  const openProject = useStudio((s) => s.openProject)
  const newProject = useStudio((s) => s.newProject)
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const startGame = useStudio((s) => s.startGame)
  const busy = useStudio((s) => s.gameBusy)
  const [menu, setMenu] = useState(false)
  const refMenu = useChiudiFuori(menu, () => setMenu(false))
  const [salvaMenu, setSalvaMenu] = useState(false)
  const refSalva = useChiudiFuori(salvaMenu, () => setSalvaMenu(false))
  const st = useStudio.getState

  const voce = (
    etichetta: string,
    azione: () => void,
    opts?: { disabilitata?: boolean; scorciatoia?: string; chiudi?: () => void }
  ): JSX.Element => (
    <button
      className="menu-item"
      disabled={opts?.disabilitata}
      onClick={() => {
        ;(opts?.chiudi ?? (() => setMenu(false)))()
        azione()
      }}
    >
      <span>{etichetta}</span>
      {opts?.scorciatoia && <kbd>{opts.scorciatoia}</kbd>}
    </button>
  )
  const voceSalva = (etichetta: string, azione: () => void, scorciatoia?: string, disabilitata = false): JSX.Element =>
    voce(etichetta, azione, { scorciatoia, disabilitata, chiudi: () => setSalvaMenu(false) })

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-logo" src={logoStudio} alt="" width={34} height={34} />
        <span className="brand-name">Favella Studio</span>
      </div>

      {projectRoot && (
        <div className="crumb" aria-label="Dove sei">
          <span className="crumb-project" title={projectRoot}>
            <IconaCartella size={15} />
            {nomeCartella(projectRoot)}
          </span>
          <span className="crumb-sep" aria-hidden="true">
            /
          </span>
          <SelettoreFile />
        </div>
      )}

      <div className="topbar-spacer" />

      {projectRoot && (
        <>
          <button
            className="btn-riordina"
            onClick={() => void st().riordinaStoria()}
            disabled={!isFav}
            title={
              multiFile
                ? 'Riordina il testo di tutti i file della storia: stanze, oggetti, regole e dialoghi ognuno al suo posto (Ctrl+Alt+R)'
                : 'Riordina il testo: stanze, oggetti, regole e dialoghi ognuno al suo posto, senza perdere niente (Ctrl+Alt+R)'
            }
          >
            <IconaRiordina />
            Riordina
          </button>

          <div className="menu-wrap btn-salva-gruppo" ref={refSalva}>
            <button
              className={'btn-save' + (daSalvare > 0 ? ' dirty' : '')}
              onClick={() => void saveAll()}
              disabled={daSalvare === 0}
              title={daSalvare > 1 ? `Salva i ${daSalvare} file cambiati (Ctrl+S)` : 'Salva (Ctrl+S)'}
            >
              <IconaSalva />
              {daSalvare === 0 ? 'Salvato' : daSalvare > 1 ? `Salva (${daSalvare})` : 'Salva'}
            </button>
            <button
              className={'btn-save btn-save-caret' + (daSalvare > 0 ? ' dirty' : '')}
              onClick={() => setSalvaMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={salvaMenu}
              aria-label="Altri modi di salvare"
              title="Salva con nome, salva il progetto altrove"
            >
              <IconaFreccia />
            </button>
            {salvaMenu && (
              <div className="menu menu-right" role="menu">
                {voceSalva('Salva con nome…', () => void st().salvaConNome(), 'Ctrl+Maiusc+S', !isFav)}
                {voceSalva('Salva il progetto come…', () => void st().salvaProgettoCome())}
                <p className="menu-nota-lunga">
                  «Salva con nome» fa una copia di questo file (dentro il progetto). «Salva il progetto come…» copia
                  tutta la cartella, storia e moduli, in una cartella nuova e passa a lavorare lì.
                </p>
              </div>
            )}
          </div>

          <button
            className="btn-prova"
            onClick={() => void startGame()}
            disabled={!isFav || busy}
            title="Prova la storia: la compila e la gioca qui (F5)"
          >
            <IconaPlay />
            Prova la storia
          </button>
        </>
      )}

      <div className="menu-wrap" ref={refMenu}>
        <button
          className="btn-icon"
          onClick={() => setMenu((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menu}
          aria-label="Altre azioni"
          title="Altre azioni"
        >
          <IconaMenu />
        </button>
        {menu && (
          <div className="menu menu-right" role="menu">
            <div className="menu-title">Progetto</div>
            {voce('Nuovo progetto…', () => void newProject())}
            {voce('Apri una cartella…', () => void openProject(), { scorciatoia: 'Ctrl+O' })}
            {projectRoot && (
              <>
                {voce('Salva con nome…', () => void st().salvaConNome(), {
                  disabilitata: !isFav,
                  scorciatoia: 'Ctrl+Maiusc+S'
                })}
                {voce('Salva il progetto come…', () => void st().salvaProgettoCome())}
                <div className="menu-title">Storia</div>
                {voce('Riordina il testo', () => void st().riordinaStoria(), {
                  disabilitata: !isFav,
                  scorciatoia: 'Ctrl+Alt+R'
                })}
                {voce('Esporta come pagina web giocabile…', () => void st().exportGame(), { disabilitata: !isFav })}
                {voce('Apri il gioco in una finestra a parte', () => st().launchGameWindow(), { disabilitata: !isFav })}
              </>
            )}
            <div className="menu-title">Leggibilità</div>
            <div className="menu-zoom">
              <button className="zoom-btn" onClick={() => setZoom(zoom - 0.1)} aria-label="Riduci la grandezza" title="Riduci (Ctrl+−)">
                A−
              </button>
              <span className="zoom-val" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button className="zoom-btn" onClick={() => setZoom(zoom + 0.1)} aria-label="Ingrandisci" title="Ingrandisci (Ctrl++)">
                A+
              </button>
              <button className="zoom-btn" onClick={() => setZoom(1.1)} title="Torna alla grandezza consigliata (Ctrl+0)">
                Reimposta
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}


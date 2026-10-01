import { useEffect, useMemo, useRef, useState } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio } from '../store'
import { IconaCartella, IconaFreccia, IconaMenu, IconaPlay, IconaSalva } from './Icone'

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
  const [aperto, setAperto] = useState(false)
  const ref = useChiudiFuori(aperto, () => setAperto(false))
  const file = useMemo(() => fileFav(tree), [tree])
  const attivo = file.find((f) => f.path === activePath)
  if (file.length === 0) return null

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
        <IconaFreccia />
      </button>
      {aperto && (
        <div className="menu menu-left" role="listbox">
          <div className="menu-title">File della storia</div>
          {file.map((f) => (
            <button
              key={f.path}
              role="option"
              aria-selected={f.path === activePath}
              className={'menu-item' + (f.path === activePath ? ' current' : '')}
              onClick={() => {
                setAperto(false)
                void openFile(f)
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopBar(): JSX.Element {
  const projectRoot = useStudio((s) => s.projectRoot)
  const activePath = useStudio((s) => s.activePath)
  const isFav = !!activePath?.toLowerCase().endsWith('.fav')
  const dirty = useStudio((s) => {
    const f = s.openFiles.find((x) => x.path === s.activePath)
    return !!f && f.content !== f.savedContent
  })
  const saveActive = useStudio((s) => s.saveActive)
  const openProject = useStudio((s) => s.openProject)
  const newProject = useStudio((s) => s.newProject)
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const startGame = useStudio((s) => s.startGame)
  const busy = useStudio((s) => s.gameBusy)
  const [menu, setMenu] = useState(false)
  const refMenu = useChiudiFuori(menu, () => setMenu(false))
  const st = useStudio.getState

  const voce = (etichetta: string, azione: () => void, opts?: { disabilitata?: boolean; scorciatoia?: string }): JSX.Element => (
    <button
      className="menu-item"
      disabled={opts?.disabilitata}
      onClick={() => {
        setMenu(false)
        azione()
      }}
    >
      <span>{etichetta}</span>
      {opts?.scorciatoia && <kbd>{opts.scorciatoia}</kbd>}
    </button>
  )

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ✦
        </span>
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
            className={'btn-save' + (dirty ? ' dirty' : '')}
            onClick={() => void saveActive()}
            disabled={!dirty}
            title="Salva il file (Ctrl+S)"
          >
            <IconaSalva />
            {dirty ? 'Salva' : 'Salvato'}
          </button>
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
                <div className="menu-title">Storia</div>
                {voce('Riordina il testo in ordine canonico', () => void st().reorderActive(), { disabilitata: !isFav })}
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

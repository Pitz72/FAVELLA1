import { useMemo } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio, infoStoria } from '../store'
import logoStudio from '../assets/favella-studio-logo.svg'
import {
  IconaAiuto,
  IconaAnnulla,
  IconaCartella,
  IconaChevron,
  IconaEsporta,
  IconaFinestra,
  IconaMenu,
  IconaPiu,
  IconaPlay,
  IconaRiordina,
  IconaSalva,
  IconaStanza,
  IconaTesto
} from './Icone'
import { stessoFile } from '../utils/progetto'
import { useMenu, tastieraMenu, VoceMenu } from './Menu'

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

/** Il file che stai modificando, e il menu per passare a un altro file della storia. */
function SelettoreFile(): JSX.Element | null {
  const tree = useStudio((s) => s.tree)
  const activePath = useStudio((s) => s.activePath)
  const openFile = useStudio((s) => s.openFile)
  // I file della storia a cui appartiene quello aperto (la radice e i moduli inclusi).
  const membri = useStudio((s) => JSON.stringify(infoStoria(s)?.membri ?? []))
  const m = useMenu()
  const file = useMemo(() => fileFav(tree), [tree])
  const dellaStoria = useMemo(() => JSON.parse(membri) as string[], [membri])
  const attivo = file.find((f) => stessoFile(f.path, activePath))
  if (file.length === 0) return null

  const altri = file.filter((f) => !dellaStoria.some((x) => stessoFile(x, f.path)))
  const interni = dellaStoria.map((x) => file.find((f) => stessoFile(f.path, x))).filter((f): f is FileNode => !!f)

  const voce = (f: FileNode, principale: boolean): JSX.Element => (
    <VoceMenu
      key={f.path}
      tipo="menuitemradio"
      spunta={stessoFile(f.path, activePath)}
      onClick={() => {
        m.chiudi()
        void openFile(f)
      }}
    >
      {f.name}
      {principale && <span className="distintivo distintivo-accento">principale</span>}
    </VoceMenu>
  )

  return (
    <div className="menu-ancora" ref={m.refContenitore}>
      <button
        ref={m.refPulsante}
        className="selettore-file"
        onClick={m.alterna}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            m.apri()
          }
        }}
        aria-haspopup="menu"
        aria-expanded={m.aperto}
        title="Scegli quale file della storia stai modificando"
      >
        <IconaTesto size={15} />
        <span className="selettore-file-nome">{attivo?.name ?? 'Scegli un file…'}</span>
        {dellaStoria.length > 1 && <span className="distintivo">{dellaStoria.length} file</span>}
        <IconaChevron size={14} />
      </button>
      {m.aperto && (
        <div className="menu menu-sinistra" role="menu" aria-label="File" onKeyDown={(e) => tastieraMenu(e, m.chiudi)}>
          {interni.length > 1 ? (
            <>
              <div className="menu-titolo">File di questa storia</div>
              {interni.map((f, i) => voce(f, i === 0))}
              {altri.length > 0 && <div className="menu-titolo">Altri file del progetto</div>}
              {altri.map((f) => voce(f, false))}
            </>
          ) : (
            <>
              <div className="menu-titolo">Le storie del progetto</div>
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
  const openStory = useStudio((s) => s.openStory)
  const newProject = useStudio((s) => s.newProject)
  const openExample = useStudio((s) => s.openExample)
  const openGuide = useStudio((s) => s.openGuide)
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const aspetto = useStudio((s) => s.aspetto)
  const setAspetto = useStudio((s) => s.setAspetto)
  const startGame = useStudio((s) => s.startGame)
  const busy = useStudio((s) => s.gameBusy)
  const inPannello = useStudio((s) => s.rightTab !== null)
  const ultimoPasso = useStudio((s) => s.storicoPannelli[s.storicoPannelli.length - 1] ?? null)
  const annulla = useStudio((s) => s.annullaModificaPannello)
  const updaterStatus = useStudio((s) => s.updaterStatus)
  const setUpdateModalOpen = useStudio((s) => s.setUpdateModalOpen)
  const aggiornamentiAuto = useStudio((s) => s.aggiornamentiAuto)
  const rispondiAuto = useStudio((s) => s.rispondiAggiornamentiAuto)
  const menu = useMenu()
  const salvaMenu = useMenu()
  const st = useStudio.getState

  const fai = (azione: () => void, quale = menu) => (): void => {
    quale.chiudi()
    azione()
  }

  return (
    <header className="barra">
      <div className="marchio">
        <img className="marchio-logo" src={logoStudio} alt="" width={30} height={30} />
        <span className="marchio-nome">Favella Studio</span>
      </div>

      {projectRoot && (
        <nav className="dove" aria-label="Dove sei">
          <span className="dove-progetto" title={projectRoot}>
            <IconaCartella size={15} />
            <span>{nomeCartella(projectRoot)}</span>
          </span>
          <span className="dove-sep" aria-hidden="true">
            /
          </span>
          <SelettoreFile />
        </nav>
      )}

      <div className="barra-spazio" />

      {updaterStatus.type === 'available' && (
        <button className="pillola-aggiornamento" onClick={() => setUpdateModalOpen(true)}>
          <span className="pillola-punto" aria-hidden="true" />
          Versione {updaterStatus.version}
        </button>
      )}
      {updaterStatus.type === 'downloading' && (
        <button className="pillola-aggiornamento" onClick={() => setUpdateModalOpen(true)}>
          Scarico… {updaterStatus.percent}%
        </button>
      )}
      {updaterStatus.type === 'ready' && (
        <button className="pillola-aggiornamento pronta" onClick={() => setUpdateModalOpen(true)}>
          <span className="pillola-punto" aria-hidden="true" />
          Aggiornamento pronto
        </button>
      )}

      {projectRoot && (
        <div className="barra-azioni">
          {inPannello && (
            <button
              className="btn btn-quieto"
              aria-label="Annulla"
              onClick={() => void annulla()}
              disabled={!ultimoPasso}
              title={ultimoPasso ? `Annulla: ${ultimoPasso.etichetta.toLowerCase()} (Ctrl+Z)` : 'Niente da annullare'}
            >
              <IconaAnnulla />
              <span className="etichetta">Annulla</span>
            </button>
          )}
          <button
            className="btn btn-quieto"
            aria-label="Riordina"
            onClick={() => void st().riordinaStoria()}
            disabled={!isFav}
            title={
              (multiFile
                ? 'Riordina il testo di tutti i file della storia: '
                : 'Riordina il testo: ') + 'stanze, oggetti, regole e dialoghi ognuno al suo posto (Ctrl+Alt+R)'
            }
          >
            <IconaRiordina />
            <span className="etichetta">Riordina</span>
          </button>

          <div className="menu-ancora gruppo-salva" ref={salvaMenu.refContenitore}>
            <button
              className={'btn btn-salva' + (daSalvare > 0 ? ' da-salvare' : '')}
              aria-label={daSalvare === 0 ? 'Salvato' : `Salva ${daSalvare === 1 ? 'il file cambiato' : `i ${daSalvare} file cambiati`}`}
              onClick={() => void saveAll()}
              disabled={daSalvare === 0}
              title={daSalvare > 1 ? `Salva i ${daSalvare} file cambiati (Ctrl+S)` : 'Salva (Ctrl+S)'}
            >
              <IconaSalva />
              <span className="etichetta">{daSalvare === 0 ? 'Salvato' : daSalvare > 1 ? `Salva (${daSalvare})` : 'Salva'}</span>
            </button>
            <button
              ref={salvaMenu.refPulsante}
              className={'btn btn-salva btn-salva-freccia' + (daSalvare > 0 ? ' da-salvare' : '')}
              onClick={salvaMenu.alterna}
              aria-haspopup="menu"
              aria-expanded={salvaMenu.aperto}
              aria-label="Altri modi di salvare"
              title="Salva con nome, salva il progetto altrove"
            >
              <IconaChevron size={14} />
            </button>
            {salvaMenu.aperto && (
              <div className="menu menu-destra" role="menu" aria-label="Salva" onKeyDown={(e) => tastieraMenu(e, salvaMenu.chiudi)}>
                <VoceMenu onClick={fai(() => void st().salvaConNome(), salvaMenu)} disabled={!isFav} scorciatoia="Ctrl+Maiusc+S">
                  Salva con nome…
                </VoceMenu>
                <VoceMenu onClick={fai(() => void st().salvaProgettoCome(), salvaMenu)}>Salva il progetto come…</VoceMenu>
                <p className="menu-nota">
                  «Salva con nome» fa una copia di questo file, dentro il progetto. «Salva il progetto come…» copia tutta
                  la cartella in una cartella nuova e passa a lavorare lì.
                </p>
              </div>
            )}
          </div>

          <button
            className="btn btn-prova"
            aria-label="Prova la storia"
            onClick={() => void startGame()}
            disabled={!isFav || busy}
            title="Prova la storia: la compila e la gioca qui (F5)"
          >
            <IconaPlay />
            <span className="etichetta">Prova la storia</span>
          </button>
        </div>
      )}

      <div className="menu-ancora" ref={menu.refContenitore}>
        <button
          ref={menu.refPulsante}
          className="btn-icona btn-icona-grande"
          onClick={menu.alterna}
          aria-haspopup="menu"
          aria-expanded={menu.aperto}
          aria-label="Altre azioni"
          title="Altre azioni"
        >
          <IconaMenu />
        </button>
        {menu.aperto && (
          <div className="menu menu-destra menu-largo" role="menu" aria-label="Altre azioni" onKeyDown={(e) => tastieraMenu(e, menu.chiudi)}>
            <div className="menu-titolo">Progetto</div>
            <VoceMenu icona={<IconaPiu />} onClick={fai(() => void newProject())}>
              Nuova storia…
            </VoceMenu>
            <VoceMenu icona={<IconaTesto />} onClick={fai(() => void openStory())} scorciatoia="Ctrl+O">
              Apri una storia (.fav)…
            </VoceMenu>
            <VoceMenu icona={<IconaCartella />} onClick={fai(() => void openProject())} scorciatoia="Ctrl+Maiusc+O">
              Apri una cartella…
            </VoceMenu>
            <VoceMenu icona={<IconaStanza />} onClick={fai(() => void openExample())}>
              Apri la storia d’esempio
            </VoceMenu>
            {projectRoot && (
              <>
                <VoceMenu onClick={fai(() => void st().salvaConNome())} disabled={!isFav} scorciatoia="Ctrl+Maiusc+S">
                  Salva con nome…
                </VoceMenu>
                <VoceMenu onClick={fai(() => void st().salvaProgettoCome())}>Salva il progetto come…</VoceMenu>
                <div className="menu-titolo">Storia</div>
                <VoceMenu icona={<IconaRiordina />} onClick={fai(() => void st().riordinaStoria())} disabled={!isFav} scorciatoia="Ctrl+Alt+R">
                  Riordina il testo
                </VoceMenu>
                <VoceMenu icona={<IconaEsporta />} onClick={fai(() => void st().exportGame())} disabled={!isFav}>
                  Esporta come pagina web giocabile…
                </VoceMenu>
                <VoceMenu icona={<IconaFinestra />} onClick={fai(() => st().launchGameWindow())} disabled={!isFav}>
                  Apri il gioco in una finestra a parte
                </VoceMenu>
              </>
            )}

            <div className="menu-titolo">Leggibilità</div>
            <div className="menu-riga" role="group" aria-label="Grandezza dell’interfaccia">
              <span className="menu-riga-etichetta">Grandezza</span>
              <button className="btn-passo" onClick={() => setZoom(zoom - 0.1)} aria-label="Più piccolo" title="Più piccolo (Ctrl+−)">
                A−
              </button>
              <span className="menu-riga-valore" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button className="btn-passo" onClick={() => setZoom(zoom + 0.1)} aria-label="Più grande" title="Più grande (Ctrl++)">
                A+
              </button>
              <button className="btn-passo" onClick={() => setZoom(1.1)} title="La grandezza consigliata (Ctrl+0)">
                Consigliata
              </button>
            </div>
            <VoceMenu tipo="menuitemradio" spunta={aspetto.tema === 'notte'} onClick={() => setAspetto({ tema: 'notte' })}>
              Tema notte
            </VoceMenu>
            <VoceMenu tipo="menuitemradio" spunta={aspetto.tema === 'carta'} onClick={() => setAspetto({ tema: 'carta' })}>
              Tema carta (chiaro)
            </VoceMenu>
            <VoceMenu
              tipo="menuitemcheckbox"
              spunta={aspetto.contrasto === 'alto'}
              onClick={() => setAspetto({ contrasto: aspetto.contrasto === 'alto' ? 'normale' : 'alto' })}
            >
              Contrasto alto
            </VoceMenu>

            <div className="menu-titolo">Applicazione</div>
            <VoceMenu icona={<IconaAiuto />} onClick={fai(() => void openGuide())}>
              Guida di Favella Studio (PDF)
            </VoceMenu>
            <VoceMenu
              onClick={fai(() => {
                setUpdateModalOpen(true)
                void window.favella.checkForUpdates(true)
              })}
            >
              Controlla gli aggiornamenti…
            </VoceMenu>
            <VoceMenu tipo="menuitemcheckbox" spunta={aggiornamentiAuto === true} onClick={() => void rispondiAuto(aggiornamentiAuto !== true)}>
              Controlla da solo a ogni avvio
            </VoceMenu>
          </div>
        )}
      </div>
    </header>
  )
}

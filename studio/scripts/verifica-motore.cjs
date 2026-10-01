// Prima di impacchettare: il motore congelato (dist/favella_engine[.exe]) deve esistere.
const fs = require('fs')
const path = require('path')
const exe = process.platform === 'win32' ? 'favella_engine.exe' : 'favella_engine'
const percorso = path.join(__dirname, '..', '..', 'dist', exe)
if (!fs.existsSync(percorso)) {
  console.error('ERRORE: manca ' + percorso)
  console.error('Congela prima il motore, dalla radice del repository:')
  console.error('  python -m PyInstaller --noconfirm favella_engine.spec')
  console.error('(o lancia lo script che fa tutto: studio/scripts/build-locale.sh | .ps1)')
  process.exit(1)
}

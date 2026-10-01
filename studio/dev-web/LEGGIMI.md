# Banco di prova nel browser

Per sviluppare l'interfaccia senza Electron:

```
node dev-web/bridge.mjs [cartella-progetto]   # il vero motore Python su :5301
npx vite --config vite.web.config.ts          # l'interfaccia su :5310
```

`shim.js` imita `window.favella` (`src/preload/index.ts`) via HTTP. Non fa parte
dell'app impacchettata.

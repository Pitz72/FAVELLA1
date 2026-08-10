// ====================================================================
//  FAVELLA 1 — Deploy del sito su favella.eu (Aruba) via FTPS
// --------------------------------------------------------------------
//  Carica il contenuto di landingpage/dist/ (sito statico pre-renderizzato)
//  nella root remota. Le credenziali NON stanno qui: vengono lette dalla
//  cartella segreta fuori dal repo (vedi memory deploy-favella-eu).
//
//  Uso:  node scripts/deploy.mjs            (carica dist/ così com'è)
//        node scripts/deploy.mjs --build    (rifà prima `npm run build`)
// ====================================================================
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { Client } from "basic-ftp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const CRED_PATH = "C:/Users/Utente/.favella1-deploy/credentials.json";
if (!existsSync(CRED_PATH)) {
  console.error(`Credenziali non trovate in ${CRED_PATH}`);
  process.exit(1);
}
if (!existsSync(resolve(DIST, "index.html"))) {
  console.error("dist/index.html non trovato: lancia prima `npm run build`.");
  process.exit(1);
}

const cred = JSON.parse(readFileSync(CRED_PATH, "utf8"));
const remoteRoot = cred.remote_root || "/";

const client = new Client(30000);
client.ftp.verbose = false;

// Log compatto: una riga per file caricato.
client.trackProgress((info) => {
  if (info.type === "upload" && info.name) {
    process.stdout.write(`  ↑ ${info.name}\n`);
  }
});

try {
  console.log(`Connessione FTPS a ${cred.host}:${cred.port} …`);
  await client.access({
    host: cred.host,
    port: cred.port || 21,
    user: cred.username,
    password: cred.password,
    secure: true, // FTPS esplicito (AUTH TLS)
    secureOptions: { rejectUnauthorized: false }, // Aruba: cert spesso non per l'host
  });
  console.log(`Connesso. Carico dist/ → ${remoteRoot}\n`);

  await client.ensureDir(remoteRoot);
  await client.uploadFromDir(DIST, remoteRoot);

  console.log(`\n✅ Deploy completato su ${cred.site_url || cred.host}`);
} catch (err) {
  console.error("\n❌ Deploy fallito:", err.message);
  process.exitCode = 1;
} finally {
  client.close();
}

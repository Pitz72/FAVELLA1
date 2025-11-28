# Landing Page FAVELLA 1

Landing page ufficiale per il progetto FAVELLA 1 - Linguaggio di programmazione per narrativa interattiva in italiano.

## 📁 Struttura File

```
landingpage/
├── index.html          # Struttura HTML della pagina
├── styles.css          # Stili CSS con color palette ufficiale
├── script.js           # JavaScript per animazioni e interattività
├── README.md           # Questa documentazione
├── Favella1Logo.png    # Logo ufficiale del progetto
├── icon.png            # Favicon
├── banner.png          # Banner per social media
└── manuale.png         # Immagine di riferimento
```

## 🎨 Design System

### Color Palette

- **Background Primary:** `#1a237e` (Indaco scuro)
- **Background Secondary:** `#151d5f` (Indaco più scuro per sezioni alternate)
- **Accent Cyan:** `#00e5ff` (Ciano acceso - colore primario)
- **Text Primary:** `#F5F5F5` (Bianco caldo)
- **Text Secondary:** `#9fa8da` (Grigio-azzurro chiaro)
- **Text Muted:** `#7986cb` (Grigio-azzurro più scuro)
- **Code Background:** `#0d1447` (Blu molto scuro per blocchi codice)

### Tipografia

- **Headings:** 'Lora' (serif moderno) - evoca letteratura
- **Body Text:** 'Inter' (sans-serif) - massima leggibilità
- **Code:** 'Fira Code' (monospace) - per codice e terminale

## ✨ Funzionalità Implementate

### 1. Hero Section con Animazione Typing
- Simulazione terminale con effetto "digitazione"
- Testo: "Scrivi storie, non codice."
- Cursore lampeggiante animato
- CTA primaria e secondaria

### 2. Navigazione Fissa
- Logo {F1} a sinistra
- Menu: Il Progetto | Aggiornamenti | Manuale | Collabora
- Smooth scroll con offset per navbar
- Effetti hover con glow ciano

### 3. Sezione Il Progetto
- Storia del progetto e filosofia
- Flow diagram del processo di sviluppo
- Highlight box per concetti chiave
- Layout a griglia responsive

### 4. Sezione Aggiornamenti
- Version card con badge e feature tags
- Log accordion espandibili
- Cronologia completa delle versioni
- Sistema a due fasi per priorità

### 5. Sezione Manuale
- Manuale completo di riferimento
- Blocchi codice con syntax highlighting
- Bottoni "Copia" per ogni esempio
- Esempi di gameplay interattivi
- Note importanti evidenziate

### 6. Sezione Collabora
- Grid di modi per contribuire
- CTA per GitHub e Discussions
- Informazioni di contatto

### 7. Footer
- Credits e copyright
- Link social e portfolio
- Nota su partnership con IA

## 🔧 Interattività JavaScript

### Animazioni
- **Typing Effect:** Animazione di digitazione del testo principale
- **Cursor Blink:** Cursore lampeggiante con CSS animation
- **Fade-in Sections:** Intersection Observer per animazioni scroll
- **Accordion Logs:** Espansione/chiusura log di sviluppo

### Funzionalità
- **Copy Code:** Copia negli appunti con feedback visivo
- **Smooth Scroll:** Navigazione fluida tra sezioni
- **Navbar Shadow:** Effetto ombra al scroll
- **Glow Effects:** Effetti luminosi su hover

### Easter Egg
- **Konami Code:** Sequenza segreta che mostra messaggio speciale
- **Console Message:** Messaggio stilizzato nella console del browser

## 📱 Responsive Design

### Breakpoints
- **Desktop:** > 768px (layout completo)
- **Tablet:** 481px - 768px (grid semplificato)
- **Mobile:** ≤ 480px (layout verticale, menu nascosto)

### Adattamenti Mobile
- Menu navigazione collassato
- Grid a singola colonna
- Font size ridotti
- Padding ottimizzati
- CTA buttons full-width

## 🚀 Come Usare

### Apertura Locale
```bash
# Apri direttamente il file HTML nel browser
open landingpage/index.html
# oppure
start landingpage/index.html
```

### Hosting
La pagina è completamente statica e può essere hostata su:
- GitHub Pages
- Netlify
- Vercel
- Qualsiasi hosting statico

### Personalizzazione

1. **Link GitHub:** Sostituisci `https://github.com/tuo-utente/favella1` con il tuo repository
2. **Email:** Aggiorna `tua-email@example.com` con il tuo contatto
3. **Nome/Nickname:** Modifica "Il Tuo Nome/Nickname" nel footer
4. **Link Social:** Aggiungi i tuoi profili LinkedIn, Portfolio, etc.

## 🎯 Filosofia del Design

### "Il Cursore Lampeggiante"
L'elemento visivo centrale che comunica immediatamente l'essenza del progetto: un linguaggio di programmazione che si scrive come testo.

### Micro-Interazioni
Ogni elemento interattivo ha un effetto "glow" (bagliore) ciano, come elementi al neon, evitando i classici effetti hover generici.

### Separatori Stilizzati
Le parentesi graffe `{` del logo vengono usate come elementi decorativi per separare le sezioni, creando coerenza visiva.

## 📊 Performance

- **Nessuna dipendenza esterna** (eccetto Google Fonts)
- **JavaScript vanilla** (no framework)
- **CSS puro** (no preprocessori)
- **Immagini ottimizzate** (PNG per logo e icone)
- **Caricamento rapido** (< 1MB totale)

## ✅ Checklist Pre-Pubblicazione

- [ ] Sostituire tutti i link placeholder con URL reali
- [ ] Aggiungere email di contatto reale
- [ ] Verificare che tutte le immagini siano presenti
- [ ] Testare su diversi browser (Chrome, Firefox, Safari, Edge)
- [ ] Testare su dispositivi mobile
- [ ] Verificare accessibilità (contrasto colori, navigazione tastiera)
- [ ] Ottimizzare immagini per il web
- [ ] Configurare meta tags per social media (Open Graph, Twitter Cards)
- [ ] Testare velocità di caricamento
- [ ] Verificare SEO (meta description, keywords, title)

## 🔗 Risorse

- **Progetto FAVELLA 1:** [Repository principale](../README.md)
- **Documentazione:** [Cartella documentazione](../documentazione/)
- **Manuale:** [manuale.md](../documentazione/manuale/manuale.md)

---

**Versione Landing Page:** 1.0  
**Data Creazione:** 11 Novembre 2025  
**Compatibilità:** Tutti i browser moderni (ES6+)  
**Licenza:** Stessa del progetto FAVELLA 1
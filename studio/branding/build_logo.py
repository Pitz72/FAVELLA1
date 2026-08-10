#!/usr/bin/env python3
# Ricostruzione vettoriale PULITA del logo Favella Studio (concept 0217 (1)),
# disegnata a mano con gradienti SVG NATIVI. ViewBox 1024, esterno trasparente.
# Si itera confrontando il render con favella-studio-icon-isolata.png.

def brace(cx, cy, h, aw, tw, side):
    # Graffa { o } centrata in (cx,cy), semialtezza h, sbraccio aw, punta tw.
    s = 1 if side == 'L' else -1   # L apre a destra
    k = h * 0.30
    x = cx
    return (f"M {cx+aw*s},{cy-h} "
            f"Q {x},{cy-h} {x},{cy-h*0.62} "
            f"L {x},{cy-k} "
            f"Q {x},{cy} {x-tw*s},{cy} "
            f"Q {x},{cy} {x},{cy+k} "
            f"L {x},{cy+h*0.62} "
            f"Q {x},{cy+h} {cx+aw*s},{cy+h}")

P = []
def add(s): P.append(s)

add('<?xml version="1.0" encoding="UTF-8"?>')
add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">')

# ---------- DEFS (gradienti nativi) ----------
add('<defs>')
add('''
<linearGradient id="gBg" x1="0" y1="0" x2="0.35" y2="1">
  <stop offset="0" stop-color="#1a3252"/>
  <stop offset="0.45" stop-color="#0e1f35"/>
  <stop offset="1" stop-color="#070d18"/>
</linearGradient>
<linearGradient id="gWin" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1c3050"/>
  <stop offset="1" stop-color="#0d1c30"/>
</linearGradient>
<linearGradient id="gFlame" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffd84d"/>
  <stop offset="0.5" stop-color="#f7a323"/>
  <stop offset="1" stop-color="#ee7a12"/>
</linearGradient>
<radialGradient id="gGlow" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#ffae33" stop-opacity="0.55"/>
  <stop offset="0.6" stop-color="#ff9a1f" stop-opacity="0.18"/>
  <stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/>
</radialGradient>
<linearGradient id="gPageL" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#62f1ff"/>
  <stop offset="1" stop-color="#1b8ccb"/>
</linearGradient>
<linearGradient id="gPageR" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#5ff0c0"/>
  <stop offset="1" stop-color="#12968d"/>
</linearGradient>
<linearGradient id="gCover" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2f6aa6"/>
  <stop offset="1" stop-color="#0f3357"/>
</linearGradient>
<linearGradient id="gBrace" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#3ce0d0"/>
  <stop offset="1" stop-color="#1aa6c4"/>
</linearGradient>
''')
add('</defs>')

# ---------- SQUIRCLE ----------
add('<rect x="8" y="8" width="1008" height="1008" rx="218" ry="218" fill="url(#gBg)"/>')
# leggerissimo bordo interno
add('<rect x="8" y="8" width="1008" height="1008" rx="218" ry="218" fill="none" stroke="#3a5a7e" stroke-opacity="0.18" stroke-width="3"/>')

# ---------- texture codice (molto tenue) ----------
add('<g stroke="#7fd6e6" stroke-opacity="0.07" stroke-width="6" stroke-linecap="round">')
ys = [120,150,180,210,760,790,820,850,880]
import random
random.seed(7)
for i,yy in enumerate(ys):
    x0 = 120 + (i%3)*18
    x1 = x0 + 120 + (i*37 % 160)
    add(f'<line x1="{x0}" y1="{yy}" x2="{x1}" y2="{yy}"/>')
add('</g>')

# ---------- GRAFFE ----------
add(f'<path d="{brace(166,506,272,70,36,"L")}" fill="none" stroke="url(#gBrace)" '
    f'stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<path d="{brace(858,506,272,70,36,"R")}" fill="none" stroke="url(#gBrace)" '
    f'stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>')

# ---------- FINESTRA EDITOR ----------
add('<g>')
add('<rect x="266" y="158" width="492" height="320" rx="20" fill="url(#gWin)" '
    'stroke="#2f5d86" stroke-opacity="0.5" stroke-width="3"/>')
# barra titolo
add('<path d="M266 178 q0 -20 20 -20 h452 q20 0 20 20 v28 h-492 z" fill="#21385a"/>')
# 3 pallini
add('<circle cx="304" cy="192" r="10" fill="#f5a623"/>')
add('<circle cx="340" cy="192" r="10" fill="#2dd4bf"/>')
add('<circle cx="376" cy="192" r="10" fill="#2dd4bf"/>')
add('</g>')

# ---------- LIBRO (aperto verso l'alto, dorso in basso) ----------
# Cover/base navy con incavo del dorso al centro
add('<path d="M286 598 '
    'Q512 650 738 598 '
    'L738 660 '
    'Q512 752 286 660 Z" '
    'fill="url(#gCover)" stroke="#0a1d34" stroke-width="7" stroke-linejoin="round"/>')
# Pagina SINISTRA: dorso-basso -> top interno -> top esterno (curvo) -> basso esterno
add('<path d="M512 664 L498 492 Q400 462 284 452 L306 620 Z" fill="url(#gPageL)" '
    'stroke="#0a2740" stroke-width="7" stroke-linejoin="round"/>')
# fogli a gradini (sinistra)
add('<path d="M498 516 Q404 492 312 484" stroke="#0a2740" stroke-opacity="0.4" stroke-width="4" fill="none"/>')
add('<path d="M498 548 Q400 528 306 524" stroke="#0a2740" stroke-opacity="0.4" stroke-width="4" fill="none"/>')
# Pagina DESTRA (specchiata)
add('<path d="M512 664 L526 492 Q624 462 740 452 L718 620 Z" fill="url(#gPageR)" '
    'stroke="#0a2740" stroke-width="7" stroke-linejoin="round"/>')
add('<path d="M526 516 Q620 492 712 484" stroke="#0a2740" stroke-opacity="0.4" stroke-width="4" fill="none"/>')
add('<path d="M526 548 Q624 528 718 524" stroke="#0a2740" stroke-opacity="0.4" stroke-width="4" fill="none"/>')
# dorso centrale
add('<line x1="512" y1="492" x2="512" y2="664" stroke="#0a2740" stroke-width="8"/>')

# ---------- CARET I-BEAM (nel solco del libro, sotto la fiamma) ----------
add('<g fill="#f5a623">')
add('<rect x="505" y="470" width="14" height="78" rx="3"/>')
add('<rect x="489" y="470" width="46" height="10" rx="4"/>')
add('<rect x="489" y="538" width="46" height="10" rx="4"/>')
add('</g>')

# ---------- FIAMMA + PLAY ----------
add('<ellipse cx="512" cy="330" rx="196" ry="210" fill="url(#gGlow)"/>')
# silhouette fiamma
add('<path d="M512 182 '
    'C 568 244 610 286 610 356 '
    'C 610 422 566 462 512 462 '
    'C 458 462 414 422 414 356 '
    'C 414 314 440 300 462 320 '
    'C 462 276 482 228 512 182 Z" '
    'fill="url(#gFlame)" stroke="#d9670c" stroke-width="3"/>')
# play triangle (navy) dentro la fiamma
add('<path d="M490 320 L490 398 L558 359 Z" fill="#0c1c30"/>')

add('</svg>')

open("favella-studio-logo.svg","w",encoding="utf-8").write("\n".join(P))
print("scritto favella-studio-logo.svg")

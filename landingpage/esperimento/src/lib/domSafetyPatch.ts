// ====================================================================
//  Patch di robustezza DOM — convivenza con gli strumenti che alterano
//  la pagina dall'esterno (lettura ad alta voce di Edge/Chrome, screen
//  reader, traduzione automatica di Google/Edge…).
//
//  PERCHÉ. Questi strumenti — fondamentali per l'accessibilità — avvolgono
//  o spostano i nodi di TESTO della pagina per evidenziarli/tradurli. Quando
//  poi React smonta una parte di interfaccia, prova a rimuovere un nodo che
//  nel frattempo è stato spostato sotto un altro genitore, e il browser
//  solleva «NotFoundError: Failed to execute 'removeChild' … not a child of
//  this node» (idem per insertBefore). Risultato: schermata bianca.
//
//  COSA FA. Rende `removeChild`/`insertBefore` TOLLERANTI: se il nodo non è
//  più figlio dell'elemento atteso, l'operazione viene ignorata invece di
//  far crashare l'app. È la mitigazione nota e collaudata per React + tool
//  di traduzione/lettura. NON disabilita la lettura ad alta voce né la
//  traduzione: le lascia funzionare, semplicemente non lascia crashare React.
//
//  Va eseguita UNA VOLTA, prima del primo render (vedi index.tsx).
// ====================================================================
export function applicaPatchDomSicuro(): void {
  if (typeof Node !== "function" || !Node.prototype) return;
  const w = window as unknown as { __favellaDomPatch?: boolean };
  if (w.__favellaDomPatch) return; // idempotente
  w.__favellaDomPatch = true;

  const removeChildOriginale = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // Il nodo è stato spostato da un tool esterno: niente crash, lo ignoriamo.
      return child;
    }
    return removeChildOriginale.call(this, child) as T;
  };

  const insertBeforeOriginale = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // Il riferimento non è più figlio di questo nodo: appendiamo in coda
      // invece di sollevare NotFoundError.
      return this.appendChild(newNode) as T;
    }
    return insertBeforeOriginale.call(this, newNode, referenceNode) as T;
  };
}

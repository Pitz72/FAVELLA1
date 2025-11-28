"""
FAVELLA STUDIO (v0.1)
IDE per il linguaggio di narrativa interattiva FAVELLA 1.

DIPENDENZE:
Per eseguire questo software, installare le seguenti librerie:
pip install PySide6 networkx matplotlib

AUTORE: Antigravity (Google Deepmind)
DATA: 2025-11-28
"""

import sys
import os
import io
import tempfile
import contextlib
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QPlainTextEdit, QSplitter, QTabWidget, QLineEdit, QPushButton, 
    QToolBar, QStatusBar, QFileDialog, QMessageBox, QLabel, QTextEdit
)
from PySide6.QtGui import (
    QAction, QFont, QSyntaxHighlighter, QTextCharFormat, QColor, 
    QIcon, QKeySequence, QTextCursor
)
from PySide6.QtCore import Qt, Signal, QObject, Slot

import networkx as nx
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
from matplotlib.figure import Figure

# Import moduli FAVELLA
# Assicurarsi che questi file siano nella stessa directory o nel PYTHONPATH
import compilatore
import gioco
import strutture
from libreria_azioni import LIBRERIA_AZIONI

# --- 1. UTILS & SYSTEM ---

class StdOutRedirector(QObject):
    """
    Intercetta sys.stdout e emette un segnale con il testo catturato.
    Usato per reindirizzare i print() del gioco nella console GUI.
    """
    text_written = Signal(str)

    def write(self, text):
        self.text_written.emit(str(text))

    def flush(self):
        pass

# --- 2. EDITOR COMPONENT ---

class FavellaHighlighter(QSyntaxHighlighter):
    """
    Evidenziatore di sintassi per il linguaggio FAVELLA.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.highlighting_rules = []

        # Formati
        keyword_format = QTextCharFormat()
        keyword_format.setForeground(QColor("#569CD6")) # Blue VSCode style
        keyword_format.setFontWeight(QFont.Bold)

        definition_format = QTextCharFormat()
        definition_format.setForeground(QColor("#4EC9B0")) # Teal
        
        string_format = QTextCharFormat()
        string_format.setForeground(QColor("#CE9178")) # Orange/Red
        
        comment_format = QTextCharFormat()
        comment_format.setForeground(QColor("#6A9955")) # Green
        comment_format.setFontItalic(True)

        condition_format = QTextCharFormat()
        condition_format.setForeground(QColor("#C586C0")) # Purple

        # Regole (Ordine importante!)
        
        # Keywords di definizione
        keywords = [
            "è una stanza", "è una cosa", "è un oggetto", 
            "collega", "nord", "sud", "est", "ovest"
        ]
        for pattern in keywords:
            self.highlighting_rules.append((f"\\b{pattern}\\b", keyword_format))

        # Keywords condizionali
        conditions = ["Invece di", "se", "dire", "il giocatore ha", "è"]
        for pattern in conditions:
            self.highlighting_rules.append((f"\\b{pattern}\\b", condition_format))

        # Stringhe (tra virgolette)
        self.highlighting_rules.append(("\"[^\"]*\"", string_format))

        # Commenti (da # a fine riga)
        self.highlighting_rules.append(("#[^\n]*", comment_format))

    def highlightBlock(self, text):
        for pattern, format in self.highlighting_rules:
            import re
            expression = re.compile(pattern, re.IGNORECASE)
            for match in expression.finditer(text):
                self.setFormat(match.start(), match.end() - match.start(), format)

class CodeEditor(QPlainTextEdit):
    """
    Widget editor con numeri di riga (predisposizione) e font monospaziato.
    """
    def __init__(self):
        super().__init__()
        font = QFont("Consolas", 11)
        font.setStyleHint(QFont.Monospace)
        self.setFont(font)
        self.highlighter = FavellaHighlighter(self.document())
        self.setTabStopDistance(40) # 4 spaces

# --- 3. VISUALIZATION COMPONENTS ---

class MapWidget(QWidget):
    """
    Widget che visualizza il grafo del mondo usando NetworkX e Matplotlib.
    """
    def __init__(self):
        super().__init__()
        self.layout = QVBoxLayout(self)
        self.figure = Figure(figsize=(5, 5), dpi=100)
        self.canvas = FigureCanvasQTAgg(self.figure)
        self.layout.addWidget(self.canvas)
        self.ax = self.figure.add_subplot(111)
        self.ax.axis('off')

    def draw_map(self, mondo: strutture.Mondo):
        self.ax.clear()
        self.ax.axis('off')

        if not mondo or not mondo.stanze:
            self.canvas.draw()
            return

        G = nx.DiGraph()

        # Aggiungi nodi (stanze)
        for id_stanza, stanza in mondo.stanze.items():
            # Usa il nome visualizzato se possibile, altrimenti l'ID
            label = stanza.nome.capitalize()
            G.add_node(id_stanza, label=label)

        # Aggiungi archi (connessioni)
        for id_stanza, stanza in mondo.stanze.items():
            for direzione, id_destinazione in stanza.uscite.items():
                G.add_edge(id_stanza, id_destinazione, label=direzione)

        # Layout
        try:
            pos = nx.spring_layout(G, seed=42, k=0.5) # k regola la distanza
        except:
            pos = nx.shell_layout(G)

        # Disegna nodi
        nx.draw_networkx_nodes(G, pos, ax=self.ax, node_color='lightblue', node_size=2000, alpha=0.9)
        
        # Disegna label nodi
        labels = nx.get_node_attributes(G, 'label')
        nx.draw_networkx_labels(G, pos, labels, ax=self.ax, font_size=9, font_weight='bold')

        # Disegna archi
        nx.draw_networkx_edges(G, pos, ax=self.ax, edge_color='gray', arrows=True, arrowsize=20)
        
        # Disegna label archi (direzioni)
        edge_labels = nx.get_edge_attributes(G, 'label')
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, ax=self.ax, font_size=8)

        self.figure.tight_layout()
        self.canvas.draw()

class GameConsoleWidget(QWidget):
    """
    Console di gioco con output di sola lettura e input line.
    """
    command_entered = Signal(str)

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        self.output_area = QTextEdit()
        self.output_area.setReadOnly(True)
        self.output_area.setFont(QFont("Consolas", 10))
        self.output_area.setStyleSheet("background-color: #1E1E1E; color: #D4D4D4;")
        
        self.input_line = QLineEdit()
        self.input_line.setFont(QFont("Consolas", 10))
        self.input_line.setPlaceholderText("Inserisci comando qui...")
        self.input_line.returnPressed.connect(self.on_return_pressed)
        
        layout.addWidget(self.output_area)
        layout.addWidget(self.input_line)

    def on_return_pressed(self):
        cmd = self.input_line.text()
        self.input_line.clear()
        self.append_text(f"> {cmd}", color="#569CD6") # Echo comando utente
        self.command_entered.emit(cmd)

    def append_text(self, text, color=None):
        if color:
            self.output_area.append(f'<span style="color:{color}">{text}</span>')
        else:
            self.output_area.append(text)
        # Auto-scroll
        self.output_area.moveCursor(QTextCursor.End)

    def clear_console(self):
        self.output_area.clear()

# --- 4. GAME LOGIC INTEGRATION ---

class GameSession:
    """
    Gestisce lo stato del gioco e l'interazione con il motore FAVELLA.
    """
    def __init__(self, output_callback):
        self.mondo = None
        self.output_callback = output_callback
        self.redirector = StdOutRedirector()
        self.redirector.text_written.connect(self.handle_stdout)
        self.original_stdout = sys.stdout

    def handle_stdout(self, text):
        # Filtra newline vuoti eccessivi se necessario
        if text:
            self.output_callback(text.rstrip())

    def start_game(self, mondo: strutture.Mondo):
        print("[DEBUG] start_game called")
        self.mondo = mondo
        self.mondo.carica_azioni(LIBRERIA_AZIONI)
        self.mondo.imposta_posizione_iniziale()
        
        print(f"[DEBUG] Posizione iniziale: {self.mondo.posizione_giocatore}")

        # Cattura output iniziale (benvenuto e descrizione stanza)
        sys.stdout = self.redirector
        try:
            print("\n--- SESSIONE AVVIATA ---")
            gioco.mostra_stanza(self.mondo)
        except Exception as e:
            sys.__stdout__.write(f"[ERROR IN START_GAME] {e}\n")
            print(f"[ERRORE RUNTIME] {e}")
        finally:
            sys.stdout = self.original_stdout
            print("[DEBUG] start_game finished")

    def process_command(self, cmd):
        if not self.mondo:
            print("[DEBUG] process_command: No world loaded")
            return

        sys.stdout = self.redirector
        try:
            # Usa la funzione refactorizzata di gioco.py
            continua = gioco.elabora_comando(self.mondo, cmd)
            if not continua:
                print("\n[SESSIONE TERMINATA]")
                self.mondo = None
        except Exception as e:
            sys.__stdout__.write(f"[ERROR IN PROCESS_COMMAND] {e}\n")
            print(f"[ERRORE ESECUZIONE] {e}")
        finally:
            sys.stdout = self.original_stdout

# --- 5. MAIN WINDOW ---

class FavellaStudio(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Favella Studio v0.1")
        self.resize(1200, 800)
        
        self.current_file_path = None
        self.game_session = GameSession(self.on_game_output)
        
        self.unsaved_changes = False

        self.setup_ui()
        
        # Connect text changed signal
        self.editor.textChanged.connect(self.on_text_changed)

    def setup_ui(self):
        # Central Widget & Splitter
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        
        splitter = QSplitter(Qt.Horizontal)
        main_layout.addWidget(splitter)

        # Pannello Sinistro: Editor
        self.editor = CodeEditor()
        splitter.addWidget(self.editor)

        # Pannello Destro: Tabs
        self.right_tabs = QTabWidget()
        splitter.addWidget(self.right_tabs)

        # Tab 1: Mappa
        self.map_widget = MapWidget()
        self.right_tabs.addTab(self.map_widget, "Mappa del Mondo")

        # Tab 2: Console
        self.console_widget = GameConsoleWidget()
        self.console_widget.command_entered.connect(self.on_console_input)
        self.right_tabs.addTab(self.console_widget, "Console di Gioco")

        # Imposta proporzioni splitter (50% - 50%)
        splitter.setSizes([600, 600])

        # Toolbar
        self.toolbar = QToolBar("Main Toolbar")
        self.addToolBar(self.toolbar)

        # Azioni Toolbar
        action_compile = QAction("Compila & Verifica", self)
        action_compile.triggered.connect(self.compile_code)
        self.toolbar.addAction(action_compile)

        self.action_play = QAction("Gioca", self)
        self.action_play.triggered.connect(self.play_game)
        self.action_play.setEnabled(False) # Disabilitato finché non compila
        self.toolbar.addAction(self.action_play)

        # Menu File
        menu_bar = self.menuBar()
        file_menu = menu_bar.addMenu("File")
        
        open_action = QAction("Apri...", self)
        open_action.triggered.connect(self.open_file)
        file_menu.addAction(open_action)

        save_action = QAction("Salva", self)
        save_action.triggered.connect(self.save_file)
        file_menu.addAction(save_action)

        exit_action = QAction("Esci", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Status Bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Pronto.")

    # --- LOGIC ---

    def open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Apri Storia Favella", "", "Favella Files (*.fav);;All Files (*)")
        if path:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    self.editor.setPlainText(f.read())
                self.current_file_path = path
                self.unsaved_changes = False
                self.setWindowTitle(f"Favella Studio v0.1 - {os.path.basename(path)}")
                self.status_bar.showMessage(f"Caricato: {path}")
            except Exception as e:
                QMessageBox.critical(self, "Errore", f"Impossibile aprire il file:\n{e}")

    def save_file(self):
        if not self.current_file_path:
            path, _ = QFileDialog.getSaveFileName(self, "Salva Storia", "", "Favella Files (*.fav)")
            if not path:
                return
            self.current_file_path = path
        
        try:
            with open(self.current_file_path, 'w', encoding='utf-8') as f:
                f.write(self.editor.toPlainText())
            self.unsaved_changes = False
            self.setWindowTitle(f"Favella Studio v0.1 - {os.path.basename(self.current_file_path)}")
            self.status_bar.showMessage(f"Salvato: {self.current_file_path}")
        except Exception as e:
            QMessageBox.critical(self, "Errore", f"Impossibile salvare il file:\n{e}")

    def compile_code(self):
        """
        Salva il codice in un file temporaneo e lancia il compilatore.
        """
        code = self.editor.toPlainText()
        if not code.strip():
            self.status_bar.showMessage("Niente da compilare.")
            return

        # Crea file temporaneo per la compilazione
        with tempfile.NamedTemporaryFile(mode='w+', encoding='utf-8', delete=False, suffix='.fav') as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        # Cattura output del compilatore (print errori)
        capture_io = io.StringIO()
        original_stdout = sys.stdout
        sys.stdout = capture_io
        
        mondo = None
        try:
            mondo = compilatore.analizza_file(tmp_path)
        except Exception as e:
            print(f"[CRASH COMPILATORE] {e}")
        finally:
            sys.stdout = original_stdout
            os.unlink(tmp_path) # Pulizia

        output_log = capture_io.getvalue()

        if mondo:
            self.status_bar.showMessage("Compilazione completata con successo!")
            self.last_compiled_world = mondo
            self.action_play.setEnabled(True)
            
            # Aggiorna Mappa
            self.map_widget.draw_map(mondo)
            self.right_tabs.setCurrentIndex(0) # Mostra mappa
            
            if output_log:
                 QMessageBox.information(self, "Info Compilatore", f"Compilazione OK.\nNote:\n{output_log}")
        else:
            self.status_bar.showMessage("Errore di compilazione.")
            self.action_play.setEnabled(False)
            QMessageBox.warning(self, "Errori di Compilazione", f"Il compilatore ha riscontrato errori:\n\n{output_log}")

    def play_game(self):
        if not hasattr(self, 'last_compiled_world') or not self.last_compiled_world:
            return

        # Switch to console tab
        self.right_tabs.setCurrentIndex(1)
        self.console_widget.clear_console()
        
        # Start game session
        # Importante: dobbiamo passare una COPIA o ricompilare per evitare di sporcare lo stato "pulito"
        # Per ora usiamo l'oggetto mondo così com'è, ma resettiamo la posizione
        self.game_session.start_game(self.last_compiled_world)
        self.console_widget.input_line.setFocus()

    def on_console_input(self, cmd):
        self.game_session.process_command(cmd)

    def on_game_output(self, text):
        self.console_widget.append_text(text)

    def on_text_changed(self):
        if not self.unsaved_changes:
            self.unsaved_changes = True
            current_title = self.windowTitle()
            if not current_title.endswith("*"):
                self.setWindowTitle(current_title + " *")

    def closeEvent(self, event):
        if self.unsaved_changes:
            reply = QMessageBox.question(
                self, 
                'Modifiche non salvate',
                "Ci sono modifiche non salvate. Vuoi salvare prima di uscire?",
                QMessageBox.StandardButton.Save | QMessageBox.StandardButton.Discard | QMessageBox.StandardButton.Cancel,
                QMessageBox.StandardButton.Save
            )

            if reply == QMessageBox.StandardButton.Save:
                self.save_file()
                if not self.unsaved_changes: # Se il salvataggio è andato a buon fine
                    event.accept()
                else:
                    event.ignore()
            elif reply == QMessageBox.StandardButton.Discard:
                event.accept()
            else:
                event.ignore()
        else:
            event.accept()

def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion") # Look moderno cross-platform
    
    window = FavellaStudio()
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()

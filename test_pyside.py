from PySide6.QtWidgets import QApplication, QLabel
import sys

app = QApplication(sys.argv)
label = QLabel("Hello World")
label.show()
print("PySide6 works!")
# app.exec() # Don't block

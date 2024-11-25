import sys
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QAction, QLineEdit, QMessageBox
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import pyqtSlot


class App(QWidget):
    def __init__(self):
        super().__init__()
        self.title = "PyQt5 simple window - pythonspot.com"
        self.left = 10
        self.top = 10
        self.width = 320
        self.height = 200
        self.initUI()

    def initUI(self):
        self.setWindowTitle(self.title)
        self.setGeometry(self.left, self.top, self.width, self.height)
        self.textbox = QLineEdit(self)
        self.textbox.move(20, 80)
        self.textbox.resize(200,40)

        self.button = QPushButton('Show Message', self)
        self.button.setToolTip('This is an example button')
        self.button.move(100, 70)
        self.button.clicked.connect(self.on_click)
        self.show()
    @pyqtSlot()
    def on_click(self):
        textBoxValue = self.textbox.text()
        QMessageBox.question(self, 'Message', "You typed " + textBoxValue, QMessageBox.Ok, QMessageBox.Ok)
        self.textbox.setText("")

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = App()
    sys.exit(app.exec_())
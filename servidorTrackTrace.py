import threading
import http.server
import socketserver
import os
import sys
from pystray import Icon, MenuItem, Menu
from PIL import Image, ImageDraw
import sys
import traceback

# Redirigir errores a un archivo
sys.stderr = open("error.log", "w")
sys.stdout = open("output.log", "w")

# Configuración
if getattr(sys, 'frozen', False):
    CARPETA_PROYECTO = sys._MEIPASS
else:
    CARPETA_PROYECTO = os.path.dirname(os.path.abspath(__file__))
    
PUERTO = 8080

# Crear el servidor en un hilo
class ServidorThread(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)  # ← daemon=True permite cerrar el hilo al salir
        self.httpd = None

    def run(self):
        try:
            os.chdir(CARPETA_PROYECTO)
            handler = http.server.SimpleHTTPRequestHandler
            self.httpd = socketserver.ThreadingTCPServer(("", PUERTO), handler)
            print(f"Servidor web en http://localhost:{PUERTO}")
            self.httpd.serve_forever()
        except Exception as e:
            print(f"Error al iniciar el servidor: {e}")

    def detener(self):
        if self.httpd:
            print("Deteniendo servidor...")
            self.httpd.shutdown()
            self.httpd.server_close()
            print("Servidor detenido.")

# Crear un icono simple
def crear_icono():
    imagen = Image.new("RGB", (64, 64), "blue")
    dibujar = ImageDraw.Draw(imagen)
    dibujar.rectangle((16, 16, 48, 48), fill="white")
    return imagen

# Funciones del menú
def detener_servidor(icono, item):
    servidor.detener()
    icono.stop()

def salir(icono, item):
    servidor.detener()
    icono.stop()
    sys.exit()

# Iniciar servidor
servidor = ServidorThread()
servidor.start()

# Crear icono de bandeja
icono = Icon("Servidor Web")
icono.icon = crear_icono()
icono.title = "Track & Trace Server"
icono.menu = Menu(
    MenuItem("Detener servidor", detener_servidor),
    MenuItem("Salir", salir)
)

icono.run()
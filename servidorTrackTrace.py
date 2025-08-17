import threading
import http.server
import socketserver
import os
import sys
from pystray import Icon, MenuItem, Menu
from PIL import Image, ImageDraw
import sys
import traceback
import json
import sqlite3

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
            handler = ManejadorPersonalizado
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

#Clase SQLITE

def obtener_ruta_db():
    if getattr(sys, 'frozen', False):
        # Si está congelado (ejecutándose como .exe)
        carpeta_ejecucion = os.path.dirname(sys.executable)
    else:
        # Si está en modo script
        carpeta_ejecucion = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(carpeta_ejecucion, "database.db")

def inicializar_db():
    try:
        conn = sqlite3.connect(obtener_ruta_db())
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            apellido TEXT,
            edad INTEGER
        )""")
        conn.commit()
        conn.close()
    except Exception as e:
        traceback.print_exc(file=sys.stderr)

class ManejadorPersonalizado(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/guardar":
            longitud = int(self.headers.get("Content-Length", 0))
            datos = json.loads(self.rfile.read(longitud))
            try:
                conn = sqlite3.connect(obtener_ruta_db())
                c = conn.cursor()
                c.execute("""CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT,
                    apellido TEXT,
                    edad INTEGER
                )""")
                c.execute("INSERT INTO usuarios (nombre, apellido, edad) VALUES (?, ?, ?)",
                          (datos["nombre"], datos["apellido"], datos["edad"]))
                conn.commit()
                conn.close()
                self.send_response(200)
                self.end_headers()
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                traceback.print_exc(file=sys.stderr)

    def do_GET(self):
        if self.path == "/usuarios":
            try:
                conn = sqlite3.connect(obtener_ruta_db())
                c = conn.cursor()
                c.execute("SELECT nombre, apellido, edad FROM usuarios")
                usuarios = [{"nombre": n, "apellido": a, "edad": e} for n, a, e in c.fetchall()]
                conn.close()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(usuarios).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                traceback.print_exc(file=sys.stderr)
        else:
            super().do_GET()


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
# generar_encodings.py

import face_recognition
import os
import pickle
from PIL import Image

RUTA_ROSTROS = 'RostrosConocidos'
ARCHIVO_ENCODINGS = 'encodings_guardados.pkl'
MAPEO_NOMBRES = {
    # COPIA AQUÍ TU DICCIONARIO MAPEO_NOMBRES COMPLETO DE main.py
    "Dayana": "Dávila Dután Dayana Sofía",
    "Valeska": "Cevallos Loor Danna Valeska",
    "Valentín": "Alvarado Loor Cristyan Valentín",
    "Aeris": "Castillo Saltos Aeris Elizabeth",
    "Alam": "Alvarado Loor Cristyan Valentín",
    "Allison": "Dominguez Macías Allison Ariana",
    "Darwin": "Vera Peñafiel Darwin Alexander",
    "Diego": "Arboledam Montesdeoca Diego Fernando",
    "Emanuel": "Macías Briones Darwin Emanuel",
    "Emiliano": "Cárdenas Zambrano Mario Emiliano",
    "García": "García Zambrano Carlos Josué",
    "Gustavo": "Cárdenas Zambrano Mario Gustavo",
    "Heidi": "Iza Morán Heidi Francheska",
    "Jair": "Gutierrez Romero Jair Yeshua",
    "Jaramillo": "Jaramillo Palma Jesús Alberto",
    "Jhon": "Menendez Cevallos Jhon Sebastián",
    "Jordan": "Castillo Huerta Jordan Jeray",
    "Kevin": "Molina Bravo Kevin Daniel",
    "Leon": "León Barberán Marcos Sebastián",
    "Marco": "Guevara Carrión Marco Alexander",
    "Miguel": "Mera García Miguel Ángel",
    "Moreira": "Moreira Reyes Jhon Andrés",
    "Narda": "Parada Moreira Narda Julieth",
    "Nayeli": "Villalva Macías Nayeli Jassú",
    "Ortega": "Ortega Caicedo Carlos Jaidán",
    "Paul": "Chavez Villamar Paúl Isaías",
    "Peter": "Vinces Macías Peter Antonio",
    "Salazar": "Salazar Cano Luis Sebastián",
    "Valentino": "Dueñas Giler Valentino Jafiel",
    "Vicente": "Maldonado León Holmes Vicente",
    "Victor": "Cedeño Marcillo Víctor Eduardo",
}

def generar_y_guardar():
    nombres_conocidos = []
    encodings_conocidos = []
    
    print("⏳ IA: Cargando y codificando todos los rostros... ¡Esto puede tardar!")
    
    # Bucle para leer todas las carpetas y codificar los rostros
    for name in os.listdir(RUTA_ROSTROS):
        if name in MAPEO_NOMBRES:
            # name será el nombre de la carpeta (ej: "Dayana")
            print(f"  > Procesando carpeta: {name}")
            
            ruta_carpeta = os.path.join(RUTA_ROSTROS, name)
            
            # Bucle para leer todas las fotos dentro de la carpeta
            for filename in os.listdir(ruta_carpeta):
                if filename.endswith(('.jpg', '.jpeg', '.png')):
                    ruta_imagen = os.path.join(ruta_carpeta, filename)
                    try:
                        # 1. Cargar la imagen
                        imagen = face_recognition.load_image_file(ruta_imagen)
                        
                        # 2. Obtener el encoding (código numérico)
                        encoding = face_recognition.face_encodings(imagen)
                        
                        if encoding:
                            # 3. Guardar el primer rostro encontrado
                            encodings_conocidos.append(encoding[0])
                            
                            # 4. Usar la clave corta de la carpeta (ej: "Dayana")
                            nombres_conocidos.append(name) 
                        else:
                            print(f"    - Aviso: No se detectó rostro en {filename}")
                            
                    except Exception as e:
                        print(f"    - ERROR al procesar {ruta_imagen}: {e}")

    # 🟢 GUARDAR LOS DATOS CON PICKLE
    datos = {
        "nombres": nombres_conocidos, 
        "encodings": encodings_conocidos
    }
    
    try:
        with open(ARCHIVO_ENCODINGS, 'wb') as f: # 'wb' significa escribir en binario
            pickle.dump(datos, f)
        print(f"\n✅ ÉXITO: {len(nombres_conocidos)} encodings guardados en {ARCHIVO_ENCODINGS}")
        print("Ahora, actualiza tu main.py con la función de carga rápida.")
    except Exception as e:
        print(f"\n❌ ERROR: Fallo al guardar el archivo pickle: {e}")

if __name__ == '__main__':
    generar_y_guardar()
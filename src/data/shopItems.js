export const shopItems = [
    { 
        id: 1, 
        name: "Paso 2: Conexión Drive", 
        price: 50, 
        icon: "☁️", 
        description: "Conecta Google Drive en Colab para acceder a tus archivos.",
        code: `# =========================================================
# ☁️ CONEXIÓN CON GOOGLE DRIVE
# Permite acceder a archivos almacenados en Google Drive
# desde el entorno de Google Colab
# =========================================================

from google.colab import drive  # Importa la herramienta para conectar Google Drive

drive.mount('/content/drive')  # Monta Google Drive en la ruta /content/drive dentro de Colab

print("Conexión con Google Drive en Colab establecida ✅")` 
    },
    { 
        id: 2, 
        name: "Paso 3: Verificar Dataset", 
        price: 1, 
        icon: "📂", 
        description: "Script para verificar la estructura de carpetas y contar imágenes por categoría.", 
        code: `#✅ Paso 3: Verifica que tu carpeta con fotos existe
# =========================================================
# 📂 VERIFICACIÓN DE ESTRUCTURA DEL DATASET
# Este bloque revisa si la carpeta del dataset existe
# y muestra las categorías (carpetas) junto con la
# cantidad de imágenes que contiene cada una.
# =========================================================

import os

# Ruta donde se encuentra el dataset en Google Drive
ruta_fotos = '/content/drive/MyDrive/Colab Notebooks/DATASET/Reconocimiento_Facial2'


# =========================================================
# 🔎 Verificar si la ruta del dataset existe
# =========================================================
if os.path.exists(ruta_fotos):

    # Obtener todas las carpetas dentro del dataset (cada carpeta representa una categoría/persona)
    carpetas = [
        d for d in os.listdir(ruta_fotos)
        if os.path.isdir(os.path.join(ruta_fotos, d))
    ]

    print("Cantidad de carpetas encontradas:", len(carpetas))
    print("Carpetas detectadas:", carpetas)


    # =========================================================
    # 📊 Contar cuántos archivos hay en cada carpeta
    # =========================================================
    print("\\nCantidad de archivos por carpeta:")

    for carpeta in carpetas:

        # Ruta completa de la carpeta
        ruta_categoria = os.path.join(ruta_fotos, carpeta)

        # Contar los archivos dentro de la carpeta
        num_archivos = len([
            nombre for nombre in os.listdir(ruta_categoria)
            if os.path.isfile(os.path.join(ruta_categoria, nombre))
        ])

        print(f"  - {carpeta}: {num_archivos} archivos")


# =========================================================
# ⚠️ Mensaje en caso de que la ruta no exista
# =========================================================
else:
    print("La ruta no existe. Verifica el nombre de la carpeta.")` 
    },
    { 
        id: 3, 
        name: "Paso 4: Cargar Imágenes", 
        price: 1, 
        icon: "🖼️", 
        description: "Lógica completa de carga, redimensionamiento y normalización de imágenes.", 
        code: `#✅ Paso 4: Cargar y etiquetar automáticamente las imágenes
# =========================================================
# 📂 CARGA Y PREPROCESAMIENTO DEL DATASET DE IMÁGENES
# Este bloque carga las imágenes desde el dataset,
# las redimensiona, normaliza y genera las etiquetas
# para entrenar el modelo de Machine Learning.
# =========================================================

import os
import cv2
import numpy as np

# =========================================================
# 🔎 Verificar que la ruta del dataset exista
# =========================================================

if not os.path.exists(ruta_fotos):
    raise ValueError("La ruta base no existe. Verifica el nombre en Drive.")


# =========================================================
# 📁 Detectar automáticamente las subcarpetas (categorías)
# Cada carpeta representa una clase o persona
# =========================================================

categorias = sorted([
    carpeta for carpeta in os.listdir(ruta_fotos)
    if os.path.isdir(os.path.join(ruta_fotos, carpeta))
])

print("Categorías detectadas:", categorias)


# =========================================================
# 📊 Crear listas para almacenar datos e etiquetas
# datos: almacenará las imágenes procesadas
# etiquetas: guardará el índice de la categoría (0,1,2...)
# =========================================================

datos = []
etiquetas = []

# Recorrer cada categoría y sus imágenes
for indice, categoria in enumerate(categorias):
    ruta_categoria = os.path.join(ruta_fotos, categoria)
    
    # Leer imágenes de la carpeta actual
    for nombre_imagen in os.listdir(ruta_categoria):
        ruta_imagen = os.path.join(ruta_categoria, nombre_imagen)
        
        try:
            # Leer imagen
            img = cv2.imread(ruta_imagen)
            
            # Verificar si se leyó correctamente
            if img is not None:
                # Redimensionar a 32x32 píxeles (estándar para modelos simples)
                img = cv2.resize(img, (32, 32))
                
                # Convertir a array y normalizar (valores entre 0 y 1)
                datos.append(img.astype('float32') / 255.0)
                
                # Guardar la etiqueta correspondiente
                etiquetas.append(indice)
        except Exception as e:
            print(f"Error al procesar {nombre_imagen}: {e}")

# Convertir listas a arrays de Numpy
datos = np.array(datos)
etiquetas = np.array(etiquetas)

print("✅ Imágenes cargadas y procesadas.")
print(f"Total de imágenes: {len(datos)}")
print(f"Dimensiones de los datos: {datos.shape}")` 
    },
    { 
        id: 4, 
        name: "Paso 5: Split Train/Test", 
        price: 1, 
        icon: "✂️", 
        description: "Divide los datos en conjuntos de entrenamiento y prueba.", 
        code: `#✅ Paso 5: Separar datos de entrenamiento y prueba
# =========================================================
# ✂️ DIVISIÓN DEL DATASET (TRAIN / TEST)
# Se separa el 80% de los datos para entrenar el modelo
# y el 20% para evaluar su rendimiento.
# =========================================================

from sklearn.model_selection import train_test_split

# Dividir datos
# test_size=0.2 -> 20% para pruebas
# stratify=etiquetas -> Mantiene la proporción de clases
x_train, x_test, y_train, y_test = train_test_split(
    datos, 
    etiquetas, 
    test_size=0.2, 
    random_state=42, 
    stratify=etiquetas
)

print("✅ Datos divididos correctamente")
print(f"Entrenamiento: {len(x_train)} imágenes")
print(f"Prueba: {len(x_test)} imágenes")` 
    },
    { 
        id: 5, 
        name: "Paso 6: Data Augmentation", 
        price: 1, 
        icon: "🔄", 
        description: "Aumenta el dataset generando variaciones de las imágenes.", 
        code: `#✅ Paso 6: Crear el modelo
# =========================================================
# 🧠 CREACIÓN DEL MODELO DE RED NEURONAL CONVOLUCIONAL (CNN)
# Este bloque define la arquitectura del modelo que se
# utilizará para clasificar imágenes en dos categorías.
# =========================================================

import tensorflow as tf
from tensorflow.keras import layers, models, regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping


# =========================================================
# 🔄 DATA AUGMENTATION
# Genera variaciones de las imágenes de entrenamiento
# para mejorar la capacidad de generalización del modelo
# =========================================================

datagen = ImageDataGenerator(

    rotation_range=10,        # Pequeñas rotaciones de la imagen
    width_shift_range=0.05,   # Desplazamiento horizontal leve
    height_shift_range=0.05,  # Desplazamiento vertical leve
    zoom_range=0.05,          # Zoom leve
    horizontal_flip=True      # Voltear imágenes horizontalmente
)

# Ajustar el generador con los datos de entrenamiento
datagen.fit(x_train)


# =========================================================
# 🧠 DEFINICIÓN DE LA ARQUITECTURA DEL MODELO CNN
# =========================================================

model = models.Sequential([

    # Entrada del modelo (imágenes de 32x32 con 3 canales RGB)
    layers.Input(shape=(32,32,3)),

    # -----------------------------------------------------
    # Bloque Convolucional 1
    # Detecta patrones básicos como bordes o texturas
    # -----------------------------------------------------
    layers.Conv2D(32, (3,3), activation='relu', padding='same'),
    layers.BatchNormalization(),   # Normaliza activaciones para entrenamiento más estable
    layers.MaxPooling2D((2,2)),    # Reduce tamaño de la imagen (downsampling)

    # -----------------------------------------------------
    # Bloque Convolucional 2
    # Detecta patrones más complejos
    # -----------------------------------------------------
    layers.Conv2D(64, (3,3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2,2)),

    # Convertir mapas de características en un vector
    layers.Flatten(),

    # -----------------------------------------------------
    # Capa densa (Fully Connected)
    # Aprende combinaciones de características
    # -----------------------------------------------------
    layers.Dense(
        64,
        activation='relu',
        kernel_regularizer=regularizers.l2(0.001)  # Regularización para evitar sobreajuste
    ),

    # Dropout para reducir overfitting
    layers.Dropout(0.5),

    # -----------------------------------------------------
    # Capa de salida
    # Clasificación binaria (2 clases)
    # -----------------------------------------------------
    layers.Dense(1, activation='sigmoid')
])


# =========================================================
# ⚙️ OPTIMIZADOR DEL MODELO
# =========================================================

optimizer = tf.keras.optimizers.Adam(
    learning_rate=0.0001  # Tasa de aprendizaje baja para entrenamiento estable
)


# =========================================================
# 🔧 COMPILACIÓN DEL MODELO
# Se define cómo aprenderá el modelo
# =========================================================

model.compile(
    optimizer=optimizer,
    loss='binary_crossentropy',  # Función de pérdida para clasificación binaria
    metrics=[
        'accuracy',              # Precisión general
        tf.keras.metrics.Precision(),  # Precisión de clasificación
        tf.keras.metrics.Recall()      # Sensibilidad del modelo
    ]
)


# =========================================================
# 📊 MOSTRAR INFORMACIÓN DEL MODELO
# =========================================================

print("✅ Modelo de Red Neuronal Convolucional (CNN) listo para entrenamiento")
print("📊 Arquitectura del modelo:\n")

model.summary()

print("\nEl modelo está configurado para clasificar entre 2 clases.")` 
    },
    { 
        id: 6, 
        name: "Paso 7: Modelo CNN", 
        price: 1, 
        icon: "🧠", 
        description: "Arquitectura de Red Neuronal Convolucional (CNN).", 
        code: `#✅ Paso 7: Entrenar el modelo
# =========================================================
# 🚀 ENTRENAMIENTO DEL MODELO CNN
# En este bloque se crean los generadores de datos y se
# entrena el modelo utilizando los datos de entrenamiento
# y validación.
# =========================================================

from tensorflow.keras.preprocessing.image import ImageDataGenerator


# =========================================================
# 🔄 CREACIÓN DE GENERADORES DE DATOS
# Permiten alimentar el modelo por lotes (batch)
# durante el entrenamiento.
# =========================================================

# Generador de datos para entrenamiento
train_generator = datagen.flow(
    x_train,     # Imágenes de entrenamiento
    y_train,     # Etiquetas de entrenamiento
    batch_size=32
)

# Generador de datos para validación
validation_generator = valgen.flow(
    x_test,      # Imágenes de prueba
    y_test,      # Etiquetas de prueba
    batch_size=32
)


# =========================================================
# 🧠 ENTRENAMIENTO DEL MODELO
# El modelo aprende a partir de los datos de entrenamiento
# y se evalúa en cada época con los datos de validación.
# =========================================================

history = model.fit(

    train_generator,        # Datos de entrenamiento
    epochs=150,             # Número de ciclos de entrenamiento
    validation_data=validation_generator,  # Datos de validación
    verbose=1               # Mostrar progreso del entrenamiento
)


# =========================================================
# 📊 EVALUACIÓN DEL MODELO Y DETECCIÓN DE SOBREAJUSTE
# Se comparan los resultados de entrenamiento y validación.
# =========================================================

train_accuracy = history.history['accuracy'][-1]
val_accuracy = history.history['val_accuracy'][-1]

# Diferencia entre accuracy de entrenamiento y validación
sobreajuste = train_accuracy - val_accuracy


# =========================================================
# 📈 RESULTADOS FINALES
# =========================================================

print(f"Accuracy (porcentaje de aciertos del modelo) entrenamiento: {train_accuracy:.2%}")
print(f"Accuracy validación: {val_accuracy:.2%}")
print(f"Nivel de sobreajuste: {sobreajuste:.2%}")` 
    },
    { 
        id: 7, 
        name: "Paso 8: Compilar", 
        price: 1, 
        icon: "⚙️", 
        description: "Configuración del optimizador y función de pérdida.", 
        code: `##✅ Paso 8. Evaluar el Modelo
# =========================================================
# 📊 EVALUACIÓN DEL MODELO
# Este bloque evalúa el rendimiento del modelo utilizando
# el conjunto de datos de prueba (test).
# También genera la matriz de confusión y el reporte
# de clasificación.
# =========================================================

from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np


# =========================================================
# 🧠 EVALUACIÓN GENERAL DEL MODELO
# Calcula métricas básicas sobre el conjunto de prueba
# =========================================================

results = model.evaluate(x_test, y_test, verbose=0)

print("📊 Resultados de evaluación del modelo:")
print(f"Accuracy (porcentaje de aciertos): {results[1]:.2%}")
print(f"Precisión: {results[2]:.2%}")
print(f"Recall (sensibilidad): {results[3]:.2%}")


# =========================================================
# 🔎 GENERAR PREDICCIONES DEL MODELO
# =========================================================

y_pred_prob = model.predict(x_test)

# Convertir probabilidades a clases (0 o 1)
y_pred = (y_pred_prob > 0.5).astype("int32")


# =========================================================
# 📊 MATRIZ DE CONFUSIÓN
# Muestra aciertos y errores del modelo
# =========================================================

cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6,5))
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=categorias,
    yticklabels=categorias
)

plt.title("Matriz de Confusión del Modelo")
plt.xlabel("Predicción")
plt.ylabel("Valor Real")
plt.show()


# =========================================================
# 📋 REPORTE DE CLASIFICACIÓN
# Muestra métricas detalladas por clase
# =========================================================

print("\n📄 Reporte de Clasificación:")
print(classification_report(y_test, y_pred, target_names=categorias))



` 
    },
    { 
        id: 9, 
        name: "Paso 9: Guardar El Modelo Entrenado", 
        price: 1, 
        icon: "📊", 
        description: "Matriz de confusión y reporte de clasificación.", 
        code: `# =========================================================
# 💾 paso 9 GUARDAR EL MODELO ENTRENADO
# Este bloque guarda el modelo entrenado en Google Drive
# para poder reutilizarlo posteriormente sin necesidad
# de volver a entrenarlo.
# =========================================================

# Ruta donde se almacenará el modelo en Google Drive
ruta_modelo = '/content/drive/MyDrive/Colab Notebooks/Modelos_Entrenados'


# =========================================================
# 📂 Crear carpeta si no existe
# =========================================================

os.makedirs(ruta_modelo, exist_ok=True)


# =========================================================
# 💾 Guardar el modelo entrenado
# Se utiliza el formato moderno .keras recomendado
# por TensorFlow para guardar modelos completos
# =========================================================

model.save(os.path.join(ruta_modelo, 'modelo_Reconocimiento_Facial.keras'))


# =========================================================
# ✅ Confirmación
# =========================================================

print("Modelo guardado correctamente.")` 
    },
    { 
        id: 10, 
        name: "Paso 10: Cargar modelo pre-entrenado (Opcional)", 
        price: 1, 
        icon: "💾", 
        description: "Guarda el modelo entrenado en Google Drive.", 
        code: `##✅ Paso 10: Cargar modelo pre-entrenado (Opcional)

# =========================================================
# 🧠 USO DE MODELO YA ENTRENADO
# Este bloque permite utilizar un modelo previamente entrenado
# sin necesidad de repetir el proceso de entrenamiento.
# Ideal para abrir el notebook nuevamente y hacer:
# - Evaluación en el dataset
# - Predicción de nuevas imágenes
# Todo lo necesario ya está guardado en el modelo .keras
# =========================================================

# ------------------------------
# 📦 Importar librerías
# ------------------------------
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
from PIL import Image
from google.colab import drive


# ------------------------------
# ☁️ Montar Google Drive
# ------------------------------
drive.mount('/content/drive')
print("Conexión con Google Drive en Colab establecida ✅")


# ------------------------------
# 📂 Rutas del proyecto
# ------------------------------
MODEL_PATH = '/content/drive/MyDrive/Colab Notebooks/Modelos_Entrenados/modelo_Reconocimiento_Facial.keras'
ruta_fotos = '/content/drive/MyDrive/Colab Notebooks/DATASET/Reconocimiento_Facial2'


# ------------------------------
# 🧹 Función para limpiar imágenes corruptas
# ------------------------------
def limpiar_imagenes_corruptas(ruta_dataset):
    eliminadas = 0

    for root, dirs, files in os.walk(ruta_dataset):
        for file in files:
            path = os.path.join(root, file)
            try:
                with Image.open(path) as img:
                    img.verify()  # Verifica si la imagen está corrupta
            except:
                print(f"❌ Imagen corrupta eliminada: {path}")
                os.remove(path)
                eliminadas += 1

    print(f"\n✅ Limpieza finalizada. Imágenes eliminadas: {eliminadas}")


# ------------------------------
# 🔄 Ejecutar limpieza si la ruta existe
# ------------------------------
if os.path.exists(ruta_fotos):
    limpiar_imagenes_corruptas(ruta_fotos)


# ------------------------------
# 🧠 Cargar modelo guardado
# ------------------------------
if os.path.exists(MODEL_PATH):
    print("Cargando modelo guardado...")
    model = load_model(MODEL_PATH)

    # ------------------------------
    # 📁 Detectar categorías
    # ------------------------------
    if os.path.exists(ruta_fotos):
        categorias = sorted(
            [carpeta for carpeta in os.listdir(ruta_fotos)
             if os.path.isdir(os.path.join(ruta_fotos, carpeta))]
        )

        print(f"✅ Modelo cargado. Categorías detectadas: {categorias}")


        # ------------------------------
        # 🔄 Preparar generador de datos para prueba
        # ------------------------------
        test_datagen = ImageDataGenerator(rescale=1./255)

        test_generator = test_datagen.flow_from_directory(
            ruta_fotos,
            target_size=(32, 32),
            batch_size=32,
            class_mode='binary',
            shuffle=False
        )


        # ------------------------------
        # 📊 Evaluar el modelo
        # ------------------------------
        loss, accuracy, precision_metric, recall_metric = model.evaluate(test_generator, verbose=1)

        print(f"\n📊 Evaluación del modelo:")
        print(f"Pérdida del modelo: {loss:.4f}")
        print(f"Exactitud (accuracy): {accuracy:.2%}")
        print(f"Precisión (precision): {precision_metric:.2%}")
        print(f"Sensibilidad / Recall: {recall_metric:.2%}")
        print(f"Nivel de confianza promedio del modelo: {accuracy:.2%}")


        # ------------------------------
        # 📋 Reporte de clasificación detallado
        # ------------------------------
        y_true = test_generator.classes
        y_pred_prob = model.predict(test_generator)
        y_pred = (y_pred_prob > 0.5).astype(int).flatten()

        report = classification_report(y_true, y_pred, target_names=categorias)

        print("\nReporte de Clasificación:")
        print(report)

    else:
        print("⚠️ Modelo cargado, pero no se encontró la carpeta de fotos para definir las categorías.")

else:
    print("⚠️ No se encontró el modelo. Debes ejecutar el entrenamiento primero.")

` 
    },
    { 
        id: 12, 
        name: "Paso 11: Predecir si una imagen eres tú", 
        price: 1, 
        icon: "🔮", 
        description: "Prueba el modelo con una imagen individual.", 
        code: `##✅ Paso 11: Predecir si una imagen eres tú
# =========================================================
# 🔍 FUNCIÓN PARA PROBAR UNA IMAGEN INDIVIDUAL
# - Predice la clase de la imagen
# - Muestra la confianza del modelo
# - Visualiza la imagen con el resultado
# =========================================================

import cv2
import numpy as np
from google.colab.patches import cv2_imshow
from google.colab import files

def test_image_with_confidence(model, img_path, categorias):
    """
    Evalúa una imagen individual usando el modelo entrenado,
    muestra la imagen con el resultado y la confianza.
    """

    # ------------------------------
    # Cargar imagen
    # ------------------------------
    img = cv2.imread(img_path)
    if img is None:
        print("❌ Error: No se pudo cargar la imagen")
        return

    # Convertir BGR a RGB (igual que durante el entrenamiento)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # ------------------------------
    # Preprocesamiento
    # ------------------------------
    img_resized = cv2.resize(img_rgb, (32, 32))
    img_array = img_resized.astype('float32') / 255.0
    img_array = np.expand_dims(img_array, axis=0)  # Añadir dimensión de batch

    # ------------------------------
    # Predicción
    # ------------------------------
    predicciones = model.predict(img_array)
    probabilidad = predicciones[0][0]

    # Determinar clase y confianza
    if probabilidad < 0.5:
        clase_predicha = 0
        confianza = (1 - probabilidad) * 100
    else:
        clase_predicha = 1
        confianza = probabilidad * 100

    resultado = categorias[clase_predicha]

    # ------------------------------
    # Mostrar imagen con resultado
    # ------------------------------
    output_img = img.copy()

    # Redimensionar para visualización (ancho 400px)
    output_width = 400
    scale = output_width / output_img.shape[1]
    output_height = int(output_img.shape[0] * scale)
    output_img = cv2.resize(output_img, (output_width, output_height))

    text1 = f"Resultado: {resultado}"
    text2 = f"Confianza: {confianza:.1f}%"

    # Color: Verde si es 'shakira', Rojo si es 'otros'
    if resultado.lower() == 'shakira':
        color = (0, 255, 0)
    else:
        color = (0, 0, 255)

    cv2.putText(output_img, text1, (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    cv2.putText(output_img, text2, (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2_imshow(output_img)

    # ------------------------------
    # Resultados en consola
    # ------------------------------
    print(f"\nPredicción: {resultado}")
    print(f"Confianza: {confianza:.1f}%")


# =========================================================
# 🔄 Subir imagen desde Colab y probar
# =========================================================

uploaded = files.upload()

if uploaded:
    file = list(uploaded.keys())[0]
    test_image_with_confidence(model, file, categorias)` 
    },
    {
        id: 13, 
        name: "Paso 12: Predecir con Cámara 📸", 
        price: 1, 
        icon: "📸", 
        description: "Utiliza la cámara para capturar una imagen y predecir si eres tú.", 
        code: `import cv2
import numpy as np
import base64
from google.colab.patches import cv2_imshow
from IPython.display import HTML, display
from google.colab import output

def process_photo(data):
    global model, categorias  # Acceder al modelo y categorías
    try:
        # Decodificar imagen base64
        img_bytes = base64.b64decode(data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print("Error: No se pudo decodificar la imagen.")
            return

        # Voltear horizontal para efecto espejo
        img = cv2.flip(img, 1)

        # Resize para mostrar en pantalla
        display_img = cv2.resize(img, (480, 360))

        # Preprocesamiento para predicción
        img_for_model = cv2.cvtColor(display_img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_for_model, (32, 32)).astype('float32') / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # Predicción
        pred = model.predict(img_for_model)
        prob = pred[0][0]
        clase_pred = 1 if prob >= 0.5 else 0
        confianza = prob * 100 if clase_pred == 1 else (1 - prob) * 100
        resultado = categorias[clase_pred]
        color = (0, 255, 0) if clase_pred == 1 else (0, 0, 255)  # Verde para 'shakira', rojo para 'otros'

        # Overlay de predicción sobre la imagen
        cv2.putText(display_img, f"Resultado: {resultado}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)
        cv2.putText(display_img, f"Confianza: {confianza:.1f}%", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)

        cv2_imshow(display_img)
        print(f"Predicción: {resultado}, Confianza: {confianza:.1f}%")

    except Exception as e:
        print(f"Error al procesar la imagen: {e}")


# HTML + JS para cámara espejo
js_code = """
<div class="output-js-content">
  <video id="video" width="640" height="480" autoplay style="display: block; margin: 10px 0; transform: scaleX(-1);"></video>
  <button onclick="capture()" style="font-size: 16px; padding: 10px 20px; cursor: pointer;">📸 Tomar Foto</button>
</div>
<script>
  const video = document.getElementById('video');
  let stream;

  // Activar cámara
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(s => { stream = s; video.srcObject = s; })
    .catch(e => console.error("Error en cámara: ", e));

  function capture() {
    if (!stream) {
      console.error("Cámara no activa.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);  // Voltear horizontal
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg');

    // Enviar a Python
    google.colab.kernel.invokeFunction(
      'notebook.processPhoto',
      [data.split(',')[1]],
      {}
    );
  }
</script>
"""

display(HTML(js_code))

# Registrar callback Python
output.register_callback('notebook.processPhoto', process_photo)
    `},
    { 
        id: 'theme_matrix', 
        name: "Tema Matrix", 
        price: 200, 
        icon: "💊", 
        description: "Desbloquea el tema Matrix con lluvia binaria animada.", 
        code: "/* Matrix Theme Unlocked */" 
    }
];

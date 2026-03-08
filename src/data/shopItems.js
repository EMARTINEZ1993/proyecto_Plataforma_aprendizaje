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
        price: 75, 
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
        price: 100, 
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
        price: 80, 
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
        price: 120, 
        icon: "🔄", 
        description: "Aumenta el dataset generando variaciones de las imágenes.", 
        code: `#✅ Paso 6: Aumentar datos para mejorar el entrenamiento
# =========================================================
# 🔄 DATA AUGMENTATION (AUMENTO DE DATOS)
# Genera variaciones aleatorias de las imágenes (rotación,
# zoom, desplazamiento) para que el modelo generalice mejor.
# =========================================================

from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Configurar el generador de variaciones
datagen = ImageDataGenerator(
    rotation_range=10,      # Rotar hasta 10 grados
    width_shift_range=0.1,  # Desplazamiento horizontal
    height_shift_range=0.1, # Desplazamiento vertical
    zoom_range=0.1,         # Zoom aleatorio
    horizontal_flip=True,   # Voltear horizontalmente
    fill_mode='nearest'     # Rellenar píxeles vacíos
)

# Ajustar el generador a los datos de entrenamiento
datagen.fit(x_train)

print("✅ Data Augmentation configurado correctamente")` 
    },
    { 
        id: 6, 
        name: "Paso 7: Modelo CNN", 
        price: 200, 
        icon: "🧠", 
        description: "Arquitectura de Red Neuronal Convolucional (CNN).", 
        code: `#✅ Paso 7: Crear el modelo de Red Neuronal Convolucional (CNN)
# =========================================================
# 🧠 ARQUITECTURA DEL MODELO (CNN)
# Definición de las capas de la red neuronal:
# - Capas Convolucionales (Conv2D): Extraen características
# - Pooling (MaxPooling2D): Reducen dimensiones
# - Dense: Capas de clasificación final
# =========================================================

import tensorflow as tf
from tensorflow.keras import layers, models, regularizers

# Crear modelo secuencial
model = models.Sequential([
    
    # --- Bloque 1: Extracción de características ---
    layers.Conv2D(32, (3,3), activation='relu', padding='same', input_shape=(32,32,3)),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2,2)),
    
    # --- Bloque 2: Más profundidad ---
    layers.Conv2D(64, (3,3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2,2)),
    
    # --- Bloque 3: Clasificación ---
    layers.Flatten(),
    layers.Dense(64, activation='relu', kernel_regularizer=regularizers.l2(0.001)),
    layers.Dropout(0.5), # Apaga neuronas aleatorias para evitar memorización
    
    # Capa de salida (1 neurona con sigmoide para clasificación binaria o Dense(N, softmax) para multiclase)
    # Como tenemos varias clases, usamos len(categorias) y softmax
    layers.Dense(len(categorias), activation='softmax')
])

model.summary()` 
    },
    { 
        id: 7, 
        name: "Paso 8: Compilar", 
        price: 90, 
        icon: "⚙️", 
        description: "Configuración del optimizador y función de pérdida.", 
        code: `#✅ Paso 8: Compilar el modelo
# =========================================================
# ⚙️ COMPILACIÓN DEL MODELO
# Define cómo aprenderá el modelo:
# - Optimizador: Adam (ajusta los pesos)
# - Loss: Sparse Categorical Crossentropy (para clasificación)
# - Métricas: Accuracy (precisión)
# =========================================================

optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)

model.compile(
    optimizer=optimizer,
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("✅ Modelo compilado listo para entrenar")` 
    },
    { 
        id: 8, 
        name: "Paso 9: Entrenar", 
        price: 150, 
        icon: "🏋️", 
        description: "Ejecuta el entrenamiento del modelo.", 
        code: `#✅ Paso 9: Entrenar el modelo
# =========================================================
# 🏋️ ENTRENAMIENTO (FIT)
# El modelo comienza a aprender de los datos de entrenamiento
# y se valida con los datos de prueba.
# =========================================================

# Entrenar usando el generador de imágenes (datagen)
history = model.fit(
    datagen.flow(x_train, y_train, batch_size=32),
    epochs=50,                  # Número de veces que ve todo el dataset
    validation_data=(x_test, y_test),
    verbose=1
)

print("✅ Entrenamiento finalizado")` 
    },
    { 
        id: 9, 
        name: "Paso 10: Evaluar", 
        price: 110, 
        icon: "📊", 
        description: "Matriz de confusión y reporte de clasificación.", 
        code: `#✅ Paso 10: Evaluar el rendimiento
# =========================================================
# 📊 EVALUACIÓN Y MATRIZ DE CONFUSIÓN
# Visualiza qué tan bien clasifica el modelo cada categoría
# =========================================================

from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Obtener predicciones
y_pred_prob = model.predict(x_test)
y_pred = np.argmax(y_pred_prob, axis=1)

# Mostrar reporte
print(classification_report(y_test, y_pred, target_names=categorias))

# Matriz de Confusión
plt.figure(figsize=(10,8))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=categorias, yticklabels=categorias)
plt.xlabel('Predicción')
plt.ylabel('Realidad')
plt.show()` 
    },
    { 
        id: 10, 
        name: "Paso 11: Guardar", 
        price: 60, 
        icon: "💾", 
        description: "Guarda el modelo entrenado en Google Drive.", 
        code: `#✅ Paso 11: Guardar el modelo
# =========================================================
# 💾 EXPORTAR MODELO
# Guarda el modelo en formato .h5 para usarlo después
# sin tener que volver a entrenar.
# =========================================================

ruta_guardado = '/content/drive/MyDrive/Colab Notebooks/modelo_reconocimiento.h5'

model.save(ruta_guardado)
print(f"✅ Modelo guardado exitosamente en: {ruta_guardado}")` 
    },
    { 
        id: 11, 
        name: "Paso 12: Cargar Modelo", 
        price: 85, 
        icon: "📂", 
        description: "Carga un modelo previamente guardado.", 
        code: `#✅ Paso 12: Cargar modelo guardado
# =========================================================
# 📂 CARGAR MODELO
# Recupera el modelo desde el archivo guardado
# =========================================================

from tensorflow.keras.models import load_model

if os.path.exists(ruta_guardado):
    model = load_model(ruta_guardado)
    print("✅ Modelo cargado y listo para usar")
else:
    print("⚠️ No se encontró el archivo del modelo")` 
    },
    { 
        id: 12, 
        name: "Paso 13: Predecir", 
        price: 130, 
        icon: "🔮", 
        description: "Prueba el modelo con una imagen individual.", 
        code: `#✅ Paso 13: Probar con una imagen nueva
# =========================================================
# 🔮 PREDICCIÓN INDIVIDUAL
# Carga una imagen, la procesa y el modelo predice qué es.
# =========================================================

def predecir_imagen(ruta_imagen, model, categorias):
    # Leer y procesar
    img = cv2.imread(ruta_imagen)
    if img is None:
        print("Error al leer la imagen")
        return

    img_resized = cv2.resize(img, (32, 32))
    img_array = np.expand_dims(img_resized.astype('float32') / 255.0, axis=0)
    
    # Predecir
    prediccion = model.predict(img_array)
    indice = np.argmax(prediccion)
    confianza = np.max(prediccion)
    
    print(f"Predicción: {categorias[indice]} (Confianza: {confianza:.2%})")
    
    # Mostrar imagen
    plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()

# Usar la función (cambia la ruta por una imagen real)
# predecir_imagen('/content/drive/MyDrive/foto_prueba.jpg', model, categorias)` 
    },
    { 
        id: 'theme_matrix', 
        name: "Tema Matrix", 
        price: 200, 
        icon: "💊", 
        description: "Desbloquea el tema Matrix con lluvia binaria animada.", 
        code: "/* Matrix Theme Unlocked */" 
    }
];

# ⚡ Sellos Chacaíto - Plugin de Impresión para Adobe Illustrator

Plugin profesional diseñado para el flujo de trabajo de Sellos Chacaíto. Permite redimensionar y enmarcar diseños con medidas predeterminadas y personalizadas, procesar grabados para Máquina Láser (PNG transparente a 2400 PPP, modo espejo y 3mm de margen) y preparar montajes para Fotopolímero.

---

## 🚀 Método 1: Instalación como Panel HTML5 (Recomendado)

1. Haz doble clic en el archivo `instalar_extension.bat`.
2. El instalador:
   - Habilitará el modo desarrollador de Adobe CEP en el Registro de Windows.
   - Copiará los archivos a `%APPDATA%\Adobe\CEP\extensions\com.selloschacaito.impresion`.
3. Abre o reinicia **Adobe Illustrator**.
4. Ve al menú superior: **Ventana > Extensiones > Sellos Chacaíto - Impresión**.
5. ¡Listo! Puedes anclar el panel en tu espacio de trabajo.

---

## ⚡ Método 2: Ejecución Directa (ScriptUI sin instalar)

Si deseas usarlo de inmediato sin instalar la extensión:
1. En Illustrator, ve a **Archivo > Secuencias de comandos > Otra secuencia de comandos...** (o `Ctrl + F12`).
2. Selecciona el archivo `SellosChacaito_Panel_ScriptUI.jsx`.
3. Se abrirá una ventana flotante con todas las herramientas de medidas, Láser y Fotopolímero.

---

## 🛠️ Características Principales

### 1. 📏 Botones de Medidas Personalizables
- Botones rápidos: `4913 (58x22)`, `4912 (47x18)`, `4911 (38x14)`, `9511 (38x14)`, `9512 (47x18)`, `45x45 mm`, `R-542`, `4910`.
- **Crear nuevos botones**: Haz clic en `+ Crear Botón`, ingresa nombre, ancho y alto en mm. Se guardará de forma permanente en tus preferencias.
- Opción de **Ajuste Proporcional** o **Medida Exacta**.

### 2. 🔴 Grabado Láser
- Convierte textos a contornos y todos los trazos/rellenos a blanco puro.
- Genera fondo negro con **3 mm de margen por lado** (+6 mm total).
- Aplica **Modo Espejo** (reflejo horizontal automático).
- Exporta en PNG transparente a **2400 PPP** en la carpeta `Escritorio/LASER`.

### 3. 🟢 Impresión Fotopolímero
- Convierte textos a contornos y arte a blanco sobre fondo negro con **7.5 mm de margen**.
- Acomoda y centra el diseño 5 mm debajo del borde superior de la mesa de trabajo para mandar a imprimir directamente.

### 4. 🎨 Biblioteca y Buscador de Iconos Vectoriales
- **Guardar Selección**: Guarda cualquier vector seleccionado en Illustrator directo a la biblioteca con vista previa nítida.
- **Buscador en tiempo real**: Encuentra cualquier icono al instante por nombre o palabra clave (ej. *doctor, cruz, balanza, muela, estrella*).
- **Filtro por Categorías**: Organiza iconos por especialidades (*Médicos, Leyes, Odontología, Redes, etc.*).
- **Inserción inmediata**: Haz clic en cualquier tarjeta para insertarlo centrado en tu sello como vector 100% editable.
- **Soporte de carpetas**: Vincula una carpeta de iconos existente (.ai, .svg, .eps, .pdf, .png) para cargarlos en masa.

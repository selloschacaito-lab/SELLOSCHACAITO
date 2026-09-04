# DTF Semitono Studio

Aplicación web especializada para crear tramas de medios tonos (*halftones*), líneas onduladas y separación de color con función **Knockout** para estampado textil en **DTF (Direct to Film), DTG y Serigrafía**.

---

## 📁 Ubicación del Proyecto

Esta carpeta está ubicada en tus Documentos:
`C:\Users\User\Documents\DTF SEMITONO\`

---

## 🚀 Cómo Iniciar la Aplicación

1. **Opción 1 (Doble clic):** Haz doble clic en el archivo `iniciar.bat`.
2. **Opción 2 (Directo):** Abre directamente el archivo `index.html` en Chrome, Edge, Firefox o Brave.
3. **Opción 3 (Servidor local):** Ejecuta `python -m http.server 8080` y abre `http://localhost:8080`.

---

## 🖱️ Cómo Subir tus Imágenes

La aplicación cuenta con 3 formas sencillas de cargar cualquier diseño:
1. **Arrastrar y Soltar (Drag & Drop):** Arrastra cualquier imagen desde una carpeta o el escritorio y suéltala en cualquier parte de la ventana de la aplicación.
2. **Botón "Subir Imagen":** Haz clic en el botón superior o en el recuadro punteado de la barra lateral para buscar tu archivo.
3. **Pegar desde el Portapapeles (Ctrl + V):** Copia una imagen desde internet, Photoshop o la herramienta de recortes de Windows y pulsa `Ctrl + V` en la app para tramarlo de inmediato.

---

## 🎨 Controles y Funcionalidades

### 1. Patrones de Trama
* **Puntos Euclidianos:** Círculos clásicos cuya área es proporcional a la densidad del color.
* **Líneas Onduladas (*Wavy Lines*):** Líneas dinámicas moduladas por ondas de frecuencia y amplitud ajustables.
* **Cruce de Líneas Onduladas (*Cross Wavy*):** Trama bi-direccional orgánica.
* **Líneas Rectas Paralelas:** Grabado lineal estilo billete clásico.
* **Diamantes:** Trama de medios tonos con rombos nítidos.

### 2. Transformaciones en Tiempo Real
* **Escala / LPI:** Ajusta la densidad de puntos por pulgada.
* **Ángulo de Rotación:** Rota la trama de 0° a 360° para evitar efecto moiré.
* **Nitidez / Feathering:** Controla la suavidad del borde de los puntos.

### 3. Función Knockout (Esencial para DTF y Serigrafía)
* **Knockout Black:** Convierte los negros/sombras en transparencia para que la tela negra de la prenda haga de sombra. Ahorra hasta un 40% de tinta blanca y la camiseta queda con tacto suave.
* **Knockout White:** Elimina los blancos para prendas claras.
* **Solo Tinta:** Fondo 100% transparente.
* **Simulador de Prenda:** Prueba cómo se ve tu diseño sobre tela negra, blanca, gris, azul marino o roja.

### 4. Exportación
* Haz clic en **"Descargar PNG (300 DPI)"** para obtener el archivo en alta resolución con canal alfa transparente, listo para imprimir.

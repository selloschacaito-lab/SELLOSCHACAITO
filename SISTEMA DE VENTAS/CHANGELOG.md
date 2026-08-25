# Registro de cambios — Sellos Chacaíto

## V9.2.2 — 31/07/2026

### Alerta pendiente confiable
- Cada entrada a `Impresión` crea una alerta pendiente dentro de Realtime Database en la misma operación que cambia el estado.
- Si Android suspende la PWA, el teléfono recupera el aviso cuando vuelve a conectarse o abrirse.
- El aviso permanece pendiente hasta que la técnica pulsa `Recibido` o `Ver pedido`.
- La confirmación se sincroniza entre dispositivos para impedir que el mismo aviso vuelva a aparecer.
- Si varios pedidos esperan confirmación, se muestran en orden mediante la cola existente.
- Volver a mover el mismo pedido a `Impresión` crea un nuevo evento sin reactivar alertas ya confirmadas.
- Se conserva el interruptor local: las computadoras pueden mantener las alertas apagadas y solo el teléfono de la técnica mostrarlas y reproducirlas.

### Conservado
- Mismos pedidos, estados, imágenes, historial, identidad visual, proyecto Firebase y configuración PWA de V9.2.1.
- No se añaden notificaciones push con la aplicación completamente cerrada; esta versión recupera el aviso al reabrir la PWA.

## V9.2.1 — 31/07/2026

### Corrección de alertas
- La alerta de Impresión dejó de ocupar y bloquear toda la pantalla.
- En computadora aparece como una tarjeta fija abajo a la derecha.
- En teléfonos aparece como una franja amplia en la parte inferior para facilitar la lectura y el toque.
- El aviso permanece hasta pulsar `Recibido` o `Ver pedido`.
- Activar, desactivar o cerrar una alerta solo afecta al dispositivo donde se realiza la acción.
- El botón superior ahora funciona como interruptor local: `Alertas activas` / `Alertas apagadas`.
- Solo los dispositivos con las alertas activadas reciben el aviso visual, el sonido y la notificación del sistema.
- La preferencia se reinicia en esta versión: debe activarse únicamente en el teléfono de la técnica.
- Se mantiene la cola para varios pedidos y el acceso directo a la tarjeta correspondiente.

### Conservado
- Mismo proyecto Firebase, pedidos, estados, imágenes, historial y configuración PWA de V9.2.

## V9.2 — 31/07/2026

### Nuevo
- Aplicación preparada para publicarse en Firebase Hosting e instalarse como PWA.
- Botón `Activar alertas` con sonido de prueba para habilitar el audio en cada dispositivo.
- Alerta visual y auditiva en tiempo real cuando un pedido cambia a `Impresión`.
- La alerta muestra cliente, diseñador, número FINA y detalles del pedido.
- Botón `Ver pedido` que abre la etapa Impresión y resalta la tarjeta correspondiente.
- Notificación del sistema cuando la aplicación permanece abierta en segundo plano y el navegador lo permite.

### Prevención de errores
- No se generan alertas por pedidos que ya estaban en Impresión al abrir la aplicación.
- No se repite el aviso por otras actualizaciones del mismo pedido.
- Si varios pedidos llegan a Impresión juntos, las alertas se muestran en una cola ordenada.
- El service worker ahora limita la caché a archivos de la propia aplicación y renueva la caché como `v9.2`.

### Conservado
- Mismo proyecto, Realtime Database, pedidos, imágenes, historial, flujo y permisos de la V9 Final.

## V9.0 Final — 30/07/2026

### Corrección visual final
- Logo oficial aumentado a 72 px en escritorio y 60 px en móvil.
- Favicon recortado y optimizado para ocupar casi todo el espacio disponible.
- Iconos PWA regenerados desde el archivo vectorial original.
- Caché de favicon y logo renovada para evitar que Chrome muestre la versión anterior.
- No se modificó ninguna función ni el flujo de trabajo.

## V9.0 — 30/07/2026

### Identidad visual
- Se integró el logo oficial de Sellos Chacaíto sin simplificaciones.
- Se reemplazó el bloque “SC” del encabezado por el logo oficial.
- Se añadió favicon para navegador en formatos ICO y PNG.
- Se añadieron iconos para instalación como PWA en Windows, Android y iOS.
- Se actualizó el encabezado a “Sistema de producción”.
- Se añadió el identificador visible `V9.0 · Build 2026.07.30`.

### Flujo de trabajo
- Flujo definitivo de siete etapas:
  1. Diseño Enviado
  2. Espera de Pago
  3. FINA
  4. Impresión
  5. En Producción
  6. Terminado
  7. Empacado
- Todos los miembros del equipo pueden ver todos los pedidos.
- La técnica trabaja principalmente con En Producción y Terminado.
- Se mantiene la notificación de WhatsApp al pasar a Empacado.

### Seguimiento
- Barra de progreso por pedido.
- Porcentaje de avance.
- Paso actual de siete.
- Responsable actual.
- Compatibilidad visual con estados antiguos.

### Imágenes
- Imagen del diseño del sello.
- Imagen del recibo FINA.
- Pegar con Ctrl+V.
- Arrastrar y soltar.
- Subir archivo.
- Miniatura, visor, reemplazo y eliminación.

### Gestión
- Historial de cambios.
- Archivado y restauración.
- Eliminación definitiva de pedido, historial e imágenes.
- Detección de FINA duplicada.
- Indicadores de retraso.
- Filtros rápidos.

### PWA
- Nuevo manifiesto.
- Service worker con caché de la interfaz.
- Iconos oficiales de 192 px y 512 px.

## V8.0
- Flujo simplificado.
- Barra de progreso.
- Responsable por etapa.
- Adaptación de estados antiguos.

## V7.0
- Pegar imágenes con Ctrl+V.
- Arrastrar y soltar.
- Diseño y recibo FINA separados.
- Se mantuvo la carga de archivos.

## V6.0
- Mejoras de WhatsApp.
- Archivado.
- Eliminación definitiva.
- Historial ampliado.

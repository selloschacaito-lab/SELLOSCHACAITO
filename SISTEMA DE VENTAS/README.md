# Sellos Chacaíto V9.2.2

Sistema interno de seguimiento de pedidos y producción.

## Publicar la aplicación en Firebase Hosting

1. Extrae toda la carpeta V9.2.2 en la computadora.
2. Instala Node.js desde `https://nodejs.org/` si todavía no lo tienes.
3. Abre PowerShell dentro de la carpeta extraída.
4. Ejecuta `npm.cmd install -g firebase-tools` si todavía no lo instalaste.
5. Ejecuta `firebase.cmd login` si la sesión no está iniciada.
6. Ejecuta `firebase.cmd deploy --only hosting`.
7. Abre la dirección `https://seguimiento-sellos-chacaito.web.app`.

El paquete ya contiene `.firebaserc` y `firebase.json`; no es necesario ejecutar `firebase init`.

## Instalar en el teléfono Android

1. Abre `https://seguimiento-sellos-chacaito.web.app` en Chrome.
2. Toca `Instalar aplicación` dentro del sistema o usa `⋮ > Agregar a pantalla principal`.
3. Abre la aplicación desde el nuevo icono de Sellos Chacaíto.
4. En el teléfono de la técnica, toca `Alertas apagadas` para cambiarlo a `Alertas activas` y acepta el permiso si aparece.
5. Escucha el sonido de prueba para confirmar que el teléfono no está en silencio.

Deja las alertas apagadas en las computadoras de diseño. La tarjeta de aviso aparece abajo a la derecha en computadora y abajo, a todo lo ancho, en teléfono.

Cuando un pedido pasa a `Impresión`, la V9.2.2 guarda una alerta pendiente en Realtime Database. Si Android suspende la aplicación, el teléfono de la técnica recupera el aviso al volver a abrirla. La confirmación `Recibido` o `Ver pedido` se guarda de forma compartida, por lo que solo la técnica debe usar esos botones. Activar o desactivar alertas continúa siendo una preferencia local de cada dispositivo.

Con la aplicación completamente cerrada, el sonido no puede ejecutarse en el mismo instante. Para avisos inmediatos con la aplicación cerrada se necesita Firebase Cloud Messaging. La alerta pendiente sí aparecerá al volver a abrir la V9.2.2.

## Archivos principales

- `index.html`: aplicación completa.
- `assets/`: logo, favicon e iconos.
- `manifest.webmanifest`: configuración de instalación.
- `service-worker.js`: instalación, caché PWA y apertura desde notificaciones.
- `CHANGELOG.md`: registro de versiones.
- `README.md`: instrucciones.

## Firebase

Proyecto configurado dentro de la aplicación:

`seguimiento-sellos-chacaito`

La V9.2.2 conserva la misma base de datos y todos los pedidos existentes. Solo agrega la ruta `printAlerts` para registrar y confirmar avisos pendientes de Impresión.

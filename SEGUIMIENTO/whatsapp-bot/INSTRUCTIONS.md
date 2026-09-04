# Bot de WhatsApp para Sellos Chacaíto 📱🤖

Este es un asistente local en Node.js que conecta tu WhatsApp y automatiza el envío de notificaciones en tiempo real a tus clientes cuando ocurren cambios en el sistema.

---

## ¿Qué hace este bot?
Escucha los cambios en tu base de datos de Firebase y envía un WhatsApp automático al cliente en los siguientes casos:

1.  **Iniciando Pedido / Diseño por Aprobar (`design_sent`):**
    Envía un mensaje con el enlace único del pedido para que el cliente pueda ver el diseño y aprobarlo por la web.
2.  **Venta Procesada / Pagado (`fina`):**
    Envía un mensaje de confirmación de pago con el monto total en Bolívares y el enlace a su recibo digital.
3.  **Listo para Retirar (`packed`):**
    Envía una notificación avisando que el sello está terminado y empacado, indicando la dirección del local (C.C. Arta) y horarios de retiro.

---

## Requisitos Previos
Debes tener instalado **Node.js** en la computadora de la oficina. Si no lo tienes:
1.  Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/). (Elige la versión LTS recomendada).

---

## Cómo Ejecutar el Bot por Primera Vez

1.  Abre una consola de comandos (PowerShell o CMD) en esta carpeta (`whatsapp-bot`).
2.  Instala las dependencias necesarias ejecutando:
    ```bash
    npm install
    ```
3.  Inicia el bot con el comando:
    ```bash
    npm start
    ```
4.  La primera vez que lo inicies, **se mostrará un código QR grande en la pantalla de la consola**.
5.  Abre WhatsApp en tu teléfono, ve a **Dispositivos Vinculados > Vincular un dispositivo** y escanea ese código QR.
6.  ¡Listo! Verás el mensaje `¡CONEXIÓN EXITOSA!`. La sesión quedará guardada localmente en la carpeta `baileys_auth_info`, por lo que **no tendrás que escanear el código QR de nuevo** aunque apagues la computadora o reinicies el script.

---

## Recomendación para el Día a Día
Para que las notificaciones salgan solas, simplemente deja esta ventana de consola abierta en segundo plano en la PC de la oficina mientras trabajas.
Si por alguna razón la consola se cierra o el internet falla, solo abre la consola y escribe de nuevo `npm start` para reactivar las alertas automáticas.

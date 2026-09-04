# PROMPT 01 — DISTRITO 23 / Fundación + Prototipo de Control

Trabaja como agente principal de desarrollo dentro de este proyecto Godot. Lee primero `DISTRITO_23_MASTER.md` y `ROADMAP_TECNICO.md` y respétalos como fuente de verdad. No avances más allá de la Fase 1.

OBJETIVO: Crear una primera build jugable de DISTRITO 23 enfocada exclusivamente en movimiento, orientación, cámara, apuntado híbrido y disparo básico. Debe poder probarse en PC y quedar preparada para Android.

ANTES DE MODIFICAR:
1. Inspecciona el proyecto completo y su estructura actual.
2. Si el proyecto está vacío, crea una estructura limpia y modular para Godot 4.x.
3. Usa APIs modernas y compatibles con exportación Android.
4. No instales addons o dependencias externas salvo necesidad real y justificada.

IMPLEMENTA:
- Escena de prueba 2D en orientación horizontal 16:9.
- Player con movimiento 360°.
- El personaje apunta normalmente en la misma dirección del movimiento.
- Al soltar movimiento conserva la última orientación.
- Cámara suave que siga al personaje y se adelante ligeramente hacia la dirección de movimiento.
- Cámara preparada para desplazarse ligeramente hacia la dirección de apuntado independiente.
- Joystick virtual izquierdo para movimiento en Android.
- Botón derecho de disparo separado:
  * Tap en disparo: un disparo en la dirección actual.
  * Mantener disparo: fuego continuo si el arma lo permite.
  * Mantener + arrastrar desde el botón de disparo: convertir temporalmente ese control en un mini-joystick de apuntado 360°. Mientras está activo, el personaje puede moverse en una dirección y apuntar/disparar en otra.
  * Al soltar el botón de disparo, volver inmediatamente al modo de orientación anclado al movimiento.
- Controles equivalentes de teclado/mouse para depurar en PC (WASD + Click o apuntado con mouse).
- Input preparado también para Gamepad físico (stick izquierdo mueve, gatillo/stick derecho apunta y dispara).
- Arma placeholder tipo pistola.
- Dummy targets estáticos que reaccionen al impacto (cambio de color o parpadeo).
- Feedback mínimo de disparo: muzzle flash simple, impacto simple y recoil visual ligero. Usa formas geométricas o placeholders, no arte final.
- Separar claramente input, locomoción, apuntado, arma y cámara en scripts independientes.
- Preparar estructura para sustituir sprites placeholder por pixel art sin cambiar la lógica.

NO IMPLEMENTES:
- Enemigos con IA compleja.
- Inventario, loot o implantes.
- Historia, diálogos o cinemáticas.
- Sistema completo de armas.

REQUISITOS DE SENSACIÓN:
- El movimiento debe responder inmediatamente sin sentirse resbaladizo.
- Pequeña deadzone configurable en joysticks.
- El cambio entre apuntado anclado e independiente debe sentirse instantáneo y sin saltos bruscos de rotación.
- Todos los valores importantes deben quedar exportados (@export) y configurables: velocidad, deadzone, suavizado de cámara, cadencia y sensibilidad de apuntado.

AL FINAL ENTRÉGAME:
1. Qué construiste.
2. Archivos principales creados/modificados.
3. Controles de prueba en PC.
4. Variables configurables importantes.
5. Problemas conocidos reales.
6. Qué debo probar manualmente en Android.

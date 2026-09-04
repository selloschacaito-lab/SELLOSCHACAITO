# DISTRITO 23 — Documento Maestro

## 1. Identidad del proyecto
- **Título provisional:** DISTRITO 23
- **Plataforma inicial:** Android
- **Motor:** Godot Engine (Godot 4.x recomendado)
- **Género:** Shooter de acción 2D con cámara cenital inclinada / 3/4 (Top-down 3/4)
- **Estética:** Cyberpunk, pixel art inicial, preparado para arte de mayor detalle en el futuro
- **Orientación principal:** Horizontal (Landscape 16:9)
- **Modo:** 100% offline
- **FPS objetivo:** 60 FPS (con opción de 30 FPS para dispositivos más modestos)
- **Público técnico objetivo:** Android gama media/alta
- **Duración típica de misión:** 3–5 minutos
- **Tono:** Oscuro, serio, violento, con humor seco ocasional
- **Mundo:** Futurista global, año 2300, con influencia cultural latina y español latino predominante

---

## 2. Principio de diseño
La prioridad absoluta es la **jugabilidad**. El juego debe sentirse satisfactorio en movimiento, apuntado, disparo, impacto, esquiva, cobertura y cambio de armas antes de ampliar historia, contenido o progresión.

> **Regla de producción:** No avanzar de fase si el núcleo actual no funciona bien.

---

## 3. Cámara y presentación
- Cámara top-down 3/4, aproximadamente 45 grados de inclinación visual.
- Personaje de tamaño medio en pantalla (para distinguir armas, ropa e implantes).
- Vista suficientemente alejada para leer enemigos, coberturas y rutas.
- La cámara se adelanta suavemente hacia la dirección de movimiento.
- Al usar apuntado independiente, la cámara se sesga sutilmente hacia la dirección de la mira.
- Zoom manual mediante gesto de pellizcar con dos dedos (para observar detalles, sin dar ventaja abusiva).
- Al entrar en interiores, el techo se oculta o desvanece manteniendo la misma cámara continua.

---

## 4. Control principal
### Movimiento y orientación normal
- **Joystick izquierdo virtual:** Movimiento 360 grados.
- La orientación del personaje está anclada por defecto al movimiento (mira hacia donde camina).
- Al soltar el joystick, conserva la última orientación.

### Disparo y apuntado híbrido
- **Botón derecho de disparo separado:**
  - **Tap rápido:** Dispara un tiro en la orientación actual.
  - **Mantener presionado (Hold):** Fuego continuo en armas automáticas.
  - **Mantener + Arrastrar (Hold & Drag):** El botón se convierte temporalmente en un mini-joystick de apuntado 360°.
    - Permite moverse en una dirección (joystick izquierdo) mientras se apunta/dispara en otra (botón derecho desacoplado).
  - **Al soltar el botón:** Vuelve de inmediato al modo anclado a la marcha.

### Otros controles
- Botón dedicado de Dash/Esquiva.
- Botón de Habilidad/Implante cuando corresponda.
- Recarga manual y recarga automática al vaciarse el cargador.
- Cambio rápido de arma accesible en pantalla.
- Soporte para Gamepad Bluetooth considerado desde el diseño base.
- Hápticos/vibración adaptativa en Android para disparos, impactos y explosiones.

---

## 5. Combate
- Coberturas físicas: vehículos, cajas, muros, mobiliario y elementos urbanos.
- Sigilo táctico posible: aproximaciones traseras, armas silenciadas y evasión.
- Combate abierto frenético en escenarios despejados.
- Munición limitada para obligar a rotar y recoger armas del suelo.
- Sistema de **Vida + Escudo**: el escudo se regenera tras unos segundos sin recibir daño; la salud requiere botiquines o módulos.
- Ejecuciones cuerpo a cuerpo rápidas (0.5 a 1 segundo) sin cinemáticas invasivas.
- Violencia estilizada pixel-art: sangre, impactos con recoil, y cadáveres persistentes durante la misión según rendimiento.
- Checkpoints estratégicos para evitar frustración innecesaria.

---

## 6. Arsenal
### Ranuras base
1. **Arma principal / larga:** Rifles de asalto, SMG, escopetas, rifles sniper.
2. **Secundaria / corta:** Pistolas tácticas, revólveres, pistolas automáticas.
3. **Cuerpo a cuerpo (Melee):** Cuchillo táctico, machete, bate, katana, hacha.
4. **Pesada / Especial:** Lanzagranadas, lanzamisiles, cañones de energía, prototipos experimentales (munición muy escasa).
5. **Consumibles / Lanzables:** Granadas de fragmentación, Molotovs, EMP, minas de proximidad, cuchillos arrojadizos.

### Clasificación por origen
- Civil, Industrial, Militar, Mercado Negro, Experimental / Anomalía.
- Las mejoras deben alterar comportamientos, dispersión y utilidad, no meramente sumar porcentajes planos.

---

## 7. Personajes jugables: Álvaro & Abril
- Ambos tienen 35 años, veteranos militares con un suceso clasificado en su pasado.
- Misma capacidad jugable y balance de stats (ninguno es caricatura de género).
- Diferencias sutiles de animaciones, voz y tono en comentarios:
  - **Álvaro:** Humor seco, pragmático.
  - **Abril:** Sarcasmo mordaz, resolutiva.
- Inicio callejero con ropa civil; transformación progresiva mediante implantes visibles en el sprite (ojos, brazos, torso, piernas cinéticas).

---

## 8. Enemigos y Facciones
- **Facciones principales:**
  - *Autoridad Federal / Gobierno:* Oficialmente niegan la existencia del Distrito 23 pero operan en la sombra.
  - *Policía Metropolitana:* Desde patrulleros comunes hasta equipos tácticos de asalto.
  - *Seguridad Corporativa:* Milicias privadas de megacorporaciones con equipo experimental y drones.
  - *Pandillas de los Bajos:* Violentas, territoriales y equipadas con armas del mercado negro.
- **Arquetipos base de IA:**
  - *Gunner:* Mantiene distancia media, usa coberturas y fuego de supresión.
  - *Rusher:* Agresivo, busca acortar distancia con escopetas o armas cuerpo a cuerpo.
  - *Heavy:* Armadura pesada, avance implacable y armas de gran calibre.
- **Escalada:** Humanos convencionales → Cibernéticos → Alterados con regeneración anómala → Mutaciones/Anomalías del 23.

---

## 9. Reglas de contención para el desarrollo
1. No inventar sistemas no aprobados ni saturar de lore prematuro.
2. Cada fase debe terminar con una build jugable y testeable en PC y Android.
3. Separación estricta de componentes en Godot: `Input`, `Locomoción`, `Apuntado`, `Arma`, `Cámara` e `Interfaz`.

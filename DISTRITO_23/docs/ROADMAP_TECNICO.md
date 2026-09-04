# DISTRITO 23 — Roadmap Técnico Godot

## Objetivo General
Construir el juego por capas rigurosamente verificables. Cada fase culmina en una build ejecutable y evaluada. No se avanza a la siguiente fase si la sensación de control o la estabilidad de la fase anterior no alcanzan el estándar.

---

## FASE 0 — Fundación del proyecto
**Objetivo:** Proyecto Godot limpio, modular y configurado para Android.
- Configuración de resolución horizontal 16:9 (1920x1080 escalado).
- Input Map unificado (soporte para Teclado/Mouse, Gamepad Bluetooth y Táctil).
- Estructura limpia de carpetas (`scenes/`, `scripts/`, `assets/`, `prefabs/`).
- Escena de prueba vacía con medidor de rendimiento (FPS, memoria).
- Configuración de objetivo 60 FPS / opción 30 FPS.

---

## FASE 1 — Prototipo de Control y Sensación
**Objetivo:** Demostrar que mover, orientar, apuntar y disparar se siente satisfactorio e intuitivo.
- Player 2D con movimiento 360°.
- Orientación anclada al movimiento y retención de orientación al frenar.
- Cámara top-down 3/4 suave con avance dinámico hacia la marcha y hacia la mira.
- Joystick virtual izquierdo y Botón de disparo híbrido derecho (Tap, Hold, Hold & Drag).
- Cambio instantáneo y fluido entre apuntado anclado y desacoplado.
- Controles de mouse/teclado y gamepad para depuración ágil en PC.
- Arma placeholder (pistola) con proyectiles/hitscan, dummies estáticos y feedback de impacto/recoil.

---

## FASE 2 — Combate Básico y Supervivencia
**Objetivo:** Establecer el ciclo de daño, regeneración y respuesta táctica.
- Sistema de Vida y Escudo regenerativo.
- Munición, cargador, recarga manual y automática al vaciarse.
- Mecánica de Dash / Esquiva con cooldown o energía.
- Reacción al daño visual y hápticos en Android.
- Estado de muerte del jugador y reaparición en checkpoint.

---

## FASE 3 — Enemigos Mínimos Viables (IA)
**Objetivo:** Primeros encuentros de combate con arquetipos definidos.
- Tres arquetipos: Gunner (distancia), Rusher (cuerpo a cuerpo), Heavy (tanque).
- Máquina de estados básica: Patrulla, Detección, Persecución, Ataque y Muerte.
- Navegación 2D con NavigationServer / NavigationAgent2D.
- Encuentros de prueba de 3 a 8 enemigos simultáneos.

---

## FASE 4 — Arsenal Base y Recogida
**Objetivo:** Variedad de armas y gestión táctica de munición.
- 4 ranuras: Principal, Secundaria, Melee y Pesada + Consumibles.
- Sistema de pickup de armas del suelo y soltar/reemplazar.
- Set inicial: Pistola, Rifle de asalto, Escopeta, Cuchillo y Granadas.

---

## FASE 5 — Coberturas, Sigilo e Interactividad
**Objetivo:** Alternativas tácticas de infiltración y uso del entorno.
- Coberturas físicas con reducción de daño o protección total.
- Conos de visión y niveles de ruido/alerta para enemigos.
- Eliminación sigilosa trasera (cuerpo a cuerpo rápida).
- Elementos interactivos del escenario: puertas, vidrios rompibles, luces y barriles explosivos.

---

## FASE 6 — IA Táctica y Coordinación
**Objetivo:** Comportamiento avanzado y combate desafiante.
- Flanqueo coordinado, retirada al recibir mucho daño y solicitud de refuerzos.
- Alarmas y búsqueda activa tras perder contacto visual.
- Optimización de rendimiento para 20 enemigos activos simultáneos a 60 FPS estables.

---

## FASE 7 — Progresión, Implantes y Persistencia
**Objetivo:** Evolución del personaje y guardado de partida.
- Sistema de guardado local robusto y seguro.
- Inventario de suministros y créditos.
- Primer árbol de implantes cibernéticos funcionales (ojos tácticos, piernas cinéticas, etc.).
- Modificación visual del personaje reflejada en el sprite.

---

## FASE 8 — Atmósfera y Presentación Visual Cyberpunk
**Objetivo:** Elevación de calidad audiovisual y shaders móviles.
- Pipeline definitivo de pixel art e iluminación 2D.
- Efectos ambientales: lluvia, niebla/vapor de neón, reflejos y sangre/cadáveres persistentes.
- Interiores de edificios con transición fluida (ocultación de techos).
- HUD definitivo minimalista y zoom táctil de dos dedos.
- Sonido espacial 2D, efectos sonoros contundentes y música dinámica.

---

## FASE 9 — Vertical Slice (Nivel de Prueba Integrado)
**Objetivo:** Validar la experiencia completa en una misión autónoma de 3 a 5 minutos.
- Integración de todas las mecánicas anteriores en un nivel cerrado.
- Evaluación de ritmo, ergonomía táctil en Android y balance de combate.

---

## FASE 10 — Misión 1: "Entrega"
**Objetivo:** La primera misión oficial de la campaña de DISTRITO 23.
- Escenario urbano en el Distrito 8 con transeúntes y edificios cerrados.
- Incidente del receptor muerto y paquete anómalo.
- Encuentro con el primer humano alterado con regeneración incomprensible.
- Escape táctico y revelación del misterio de DISTRITO 23.

---

## FASE 11 — Expansión y Campaña
**Objetivo:** Escalabilidad a largo plazo.
- Base de operaciones / Refugio.
- Nuevas facciones corporativas y mutaciones del 23.
- Campaña completa de 20 misiones y batallas contra jefes.

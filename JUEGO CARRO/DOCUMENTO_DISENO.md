# Game Design Document (GDD) — Pixel Drag & Cruise

Proyecto inspirado en la esencia de *Pixel Car Racer*, combinando estética pixel art modular, iluminación 2D moderna y simulación automotriz realista con profundidad mecánica.

---

## 1. Ficha Técnica y Plataforma
* **Motor:** Godot Engine 4.x (2D).
* **Plataformas objetivo:** PC (Windows/Linux) y Dispositivos Móviles (Android / iOS).
* **Perspectiva:** 2D lateral (Side-scrolling).

---

## 2. Dirección de Arte y Gráficos
* **Estilo visual híbrido:**
  * Sprites de autos en **Pixel Art** detallado y estilizado.
  * Escenarios con iluminación dinámica 2D (`PointLight2D`, `DirectionalLight2D`), reflejos de asfalto y partículas modernas (humo volumétrico de neumáticos, chispas de escape, llamaradas de backfire).
* **Estructura modular por capas (Sprite Stacking 2D):**
  1. *Capa 0:* Sombra proyectada en el suelo.
  2. *Capa 1:* Rueda trasera + caliper de freno.
  3. *Capa 2:* Rueda delantera + caliper de freno.
  4. *Capa 3:* Carrocería / Chasis base.
  5. *Capa 4:* Kits de carrocería (Bumpers delanteros/traseros, faldones laterales, guardabarros ensanchados).
  6. *Capa 5:* Alerón / Spoilers traseros.
  7. *Capa 6:* Capó / Tomas de aire (Hood scoops / Intercooler frontal visible).
  8. *Capa 7:* Cristales y tintes.
  9. *Capa 8:* Luces delanteras y traseras (con conos de luz emisivos).
  10. *Capa 9:* Calcomanías, vinilos y detalles de pintura.

---

## 3. Modelo Físico y Matemático del Motor

Para que un **Honda Civic 1.6L (4 cil)** se sienta completamente distinto a un **Mustang 5.0L V8**, la física no usa estadísticas abstractas, sino magnitudes de ingeniería mecánica real:

### Parámetros Principales del Auto:
* **Masa / Peso total ($kg$):** Influye en la inercia según $F = m \cdot a$.
* **Distribución de peso (% eje delantero / trasero):** Crítico para la transferencia de carga en aceleración brusca.
* **Tipo de Tracción:**
  * `FWD` (Tracción delantera): Buen agarre inicial con poco torque, pero al acelerar el peso se va atrás y pierde tracción.
  * `RWD` (Tracción trasera): Gran transferencia de peso atrás al salir, pero el alto torque inicial puede hacer patinar las ruedas.
  * `AWD` (Tracción total): Salida explosiva sin apenas patinaje, pero penalizado por mayor peso del tren motriz.
* **Curva de Torque ($Nm$ o $lb\cdot ft$) vs RPM:**
  * Motor 1.6L 4 cil (ej. D16/B16): Bajo torque en bajas revoluciones, pico de potencia arriba (7,000 - 8,500 RPM con VTEC).
  * Motor 5.0L V8: Enorme torque instantáneo desde 2,000 RPM, entrega de potencia lineal y contundente.
* **Línea Roja / Corte de Inyección ($Redline\ RPM$):**
  * Limita las revoluciones del motor y activa el sistema de chispas/fuego del limitador (*two-step* / *anti-lag*).

### Física de Neumáticos y Salida:
* **Temperatura de Neumáticos:**
  * Fase previa de **Burnout** (calentamiento de gomas en la zona de agua).
  * Si los neumáticos están fríos: coeficiente de fricción ($\mu$) bajo $\rightarrow$ patinaje.
  * Si están a temperatura óptima: $\mu$ máximo $\rightarrow$ tracción óptima.
  * Si se sobrecalientan: degradación y menor agarre.

---

## 4. Transmisión y Controles en Carrera
* **Embrague (Clutch) analógico o botón de acople.**
* **Palanca Secuencial / Paletas:** Subir (+) y bajar (-) marchas.
* **Tacómetro y Cuadro de Instrumentos:**
  * Aguja de RPM analógica con shift light personalizable.
  * Manómetro de presión de Turbo / Boost (PSI / Bar).
  * Velocímetro digital/analógico.
* **Fallas mecánicas simuladas:**
  * Si se pasa de vueltas (Money Shift): Daño al motor.
  * Cambio a destiempo sin clutch en caja manual estándar: Pérdida de tiempo y raspado de caja.

---

## 5. Modos de Juego
1. **Modo Drag Racing (Pista Cerrada):**
   * Semáforo profesional (Árbol de Navidad con luces amarillas y verde).
   * 1/4 de milla (400 m) y 1/2 milla (800 m).
   * Detección de falsa salida (Red light / Jump start).
   * Tiempos de reacción (Reaction Time), tiempo de 60 pies (60ft time) y velocidad final (Trap Speed).
2. **Modo Autopista / Highway Cruise (Tráfico Libre):**
   * Pista infinita con múltiples carriles.
   * Autos civiles transitando a diferentes velocidades.
   * Sistema de puntuación por velocidad, adelantamientos milimétricos (*near misses*) y distancia recorrida sin chocar.

---

## 6. Taller, Garaje y Modificaciones
* **Piezas Mecánicas:**
  * **Inducción forzada:** Turbochargers (Single/Twin), Superchargers (Roots/Centrífugo), Intercoolers, Tuberías de admisión.
  * **Tren motriz y Bloque:** Árboles de levas de competencia, Pistones y Bielas forjadas, Bloques reforzados.
  * **Escape:** Colectores/Headers, Downpipe, Tubería recta / Mofles de alto flujo con backfire.
  * **Electrónica:** ECU programable (ajuste de mezcla aire/combustible, limitador dos pasos).
  * **Suspensión:** Coilovers ajustables (altura al suelo, dureza de rebote, camber/caída).
  * **Neumáticos:** Calle, semi-slicks, slicks de competición drag (mickey thompson).
* **Engine Swaps (Cambios de Motor):**
  * Posibilidad de cambiar el motor del chasis por motores emblemáticos (K20/K24 Honda, 2JZ-GTE Toyota, LS V8 Chevy, RB26 Nissan, 13B Wankel Rotativo).
* **Banco de Potencia (Dyno) & Gear Tuning:**
  * Rodillos de aceleración en taller para medir curvas de HP y Torque reales en tiempo real.
  * Ajuste individual de las relaciones de cada marcha (1ª a 6ª) y relación final (Final Drive).


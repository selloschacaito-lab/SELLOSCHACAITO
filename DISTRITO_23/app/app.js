// State and Data for Distrito 23
const PHASES_DATA = [
  {
    id: "fase-0",
    number: "0",
    title: "Fundación del Proyecto",
    objective: "Proyecto Godot limpio, escalable y preparado para Android.",
    tag: "FUNDACIÓN",
    tasks: [
      { id: "f0_t1", text: "Crear proyecto Godot 4.x con configuración horizontal 16:9 (1920x1080)." },
      { id: "f0_t2", text: "Definir estructura modular de carpetas (scenes, scripts, assets, prefabs)." },
      { id: "f0_t3", text: "Configurar Input Map unificado (soporte para teclado, gamepad y táctil)." },
      { id: "f0_t4", text: "Crear escena base de prueba con medidor de FPS (objetivo 60 FPS / opción 30 FPS)." }
    ]
  },
  {
    id: "fase-1",
    number: "1",
    title: "Prototipo de Control y Sensación",
    objective: "Demostrar que mover, orientar, apuntar y disparar se siente satisfactorio.",
    tag: "NÚCLEO CRÍTICO",
    tasks: [
      { id: "f1_t1", text: "Player 2D con movimiento 360° y orientación anclada a la marcha." },
      { id: "f1_t2", text: "Retención de la última orientación al frenar (no resetea a 0°)." },
      { id: "f1_t3", text: "Cámara top-down 3/4 suave con adelanto según movimiento." },
      { id: "f1_t4", text: "Joystick virtual izquierdo en pantalla con deadzone configurable." },
      { id: "f1_t5", text: "Botón híbrido de disparo derecho: Tap (disparo), Hold (fuego continuo), Hold+Drag (apuntado 360° desacoplado)." },
      { id: "f1_t6", text: "Retorno inmediato al modo anclado al soltar el botón de disparo." },
      { id: "f1_t7", text: "Controles equivalentes para Mouse/Teclado y Gamepad Bluetooth en PC." },
      { id: "f1_t8", text: "Arma placeholder (pistola), dummy targets estáticos y feedback de impacto/recoil." }
    ]
  },
  {
    id: "fase-2",
    number: "2",
    title: "Combate Básico y Supervivencia",
    objective: "Ciclo de daño, escudo regenerable y respuesta táctica.",
    tag: "COMBATE",
    tasks: [
      { id: "f2_t1", text: "Sistema de Vida y Escudo (el escudo regenera tras X seg sin daño)." },
      { id: "f2_t2", text: "Munición limitada, cargador, recarga manual y automática al llegar a 0." },
      { id: "f2_t3", text: "Mecánica de Dash / Esquiva con cooldown o consumo de energía." },
      { id: "f2_t4", text: "Feedback de daño (flash rojo, screen shake medido y hápticos en Android)." },
      { id: "f2_t5", text: "Muerte del jugador y reaparición en checkpoint." }
    ]
  },
  {
    id: "fase-3",
    number: "3",
    title: "Enemigos Mínimos Viables (IA)",
    objective: "Primeros 3 arquetipos de enemigos reactivos.",
    tag: "IA",
    tasks: [
      { id: "f3_t1", text: "Arquetipo Gunner (mantiene distancia y dispara en ráfagas)." },
      { id: "f3_t2", text: "Arquetipo Rusher (muy veloz, busca combate cercano)." },
      { id: "f3_t3", text: "Arquetipo Heavy (lento, gran resistencia y daño alto)." },
      { id: "f3_t4", text: "Navegación 2D con NavigationServer / NavigationAgent2D." },
      { id: "f3_t5", text: "Prueba de rendimiento con encuentros de 3 a 8 enemigos simultáneos." }
    ]
  },
  {
    id: "fase-4",
    number: "4",
    title: "Arsenal Base y Recogida",
    objective: "4 ranuras de equipamiento y consumibles.",
    tag: "ARSENAL",
    tasks: [
      { id: "f4_t1", text: "Ranuras funcionales: Principal, Secundaria, Melee, Pesada y Consumibles." },
      { id: "f4_t2", text: "Sistema para soltar y recoger armas del suelo (pickup)." },
      { id: "f4_t3", text: "Implementar Rifle de Asalto, Escopeta, Pistola, Cuchillo y Granadas." },
      { id: "f4_t4", text: "Gestión de tipos de munición y escasez de armas pesadas." }
    ]
  },
  {
    id: "fase-5",
    number: "5",
    title: "Coberturas, Sigilo e Interactividad",
    objective: "Alternativas tácticas y uso del escenario.",
    tag: "ENTORNO",
    tasks: [
      { id: "f5_t1", text: "Coberturas físicas funcionales (carros, muros, barriles)." },
      { id: "f5_t2", text: "Conos de visión de enemigos y detección por ruido de disparos." },
      { id: "f5_t3", text: "Ejecución cuerpo a cuerpo rápida por la espalda (0.5 a 1s)." },
      { id: "f5_t4", text: "Interactividad: puertas, vidrios rompibles y luces destructibles." }
    ]
  },
  {
    id: "fase-6",
    number: "6",
    title: "IA Táctica y Coordinación",
    objective: "Comportamiento grupal y profiling de rendimiento.",
    tag: "IA AVANZADA",
    tasks: [
      { id: "f6_t1", text: "Comportamientos de flanqueo y retirada estratégica." },
      { id: "f6_t2", text: "Lanzamiento de granadas por parte de enemigos y activación de alarmas." },
      { id: "f6_t3", text: "Optimización y profiling: 20 enemigos activos simultáneos a 60 FPS." }
    ]
  },
  {
    id: "fase-7",
    number: "7",
    title: "Progresión, Implantes y Persistencia",
    objective: "Guardado local y árbol de implantes cibernéticos.",
    tag: "SISTEMAS",
    tasks: [
      { id: "f7_t1", text: "Sistema de guardado local robusto en JSON / ConfigFile." },
      { id: "f7_t2", text: "Inventario básico, créditos y botiquines." },
      { id: "f7_t3", text: "Primer set de implantes con mecánicas reales (ojo táctico, piernas cinéticas)." },
      { id: "f7_t4", text: "Reflejo visual de implantes en el sprite del protagonista." }
    ]
  },
  {
    id: "fase-8",
    number: "8",
    title: "Atmósfera y Presentación Cyberpunk",
    objective: "Iluminación 2D, lluvia, neones, shaders y audio.",
    tag: "ARTE & FX",
    tasks: [
      { id: "f8_t1", text: "Pipeline de luces 2D y paleta cyberpunk de alto contraste." },
      { id: "f8_t2", text: "Efectos ambientales de lluvia, humo/vapor y charcos con reflejos." },
      { id: "f8_t3", text: "Interiores con ocultación/desvanecimiento suave de techos." },
      { id: "f8_t4", text: "HUD minimalista final adaptativo y zoom de pellizco en pantalla táctil." }
    ]
  },
  {
    id: "fase-9",
    number: "9",
    title: "Vertical Slice (Nivel Integrado)",
    objective: "Misión de prueba completa de 3 a 5 minutos.",
    tag: "VERTICAL SLICE",
    tasks: [
      { id: "f9_t1", text: "Integración de todas las mecánicas en un mapa cerrado de prueba." },
      { id: "f9_t2", text: "Evaluación exhaustiva de ergonomía táctil en Android real." },
      { id: "f9_t3", text: "Ajuste fino de tiempos de recarga, recoil y velocidad del jugador." }
    ]
  },
  {
    id: "fase-10",
    number: "10",
    title: "Misión 1: Entrega (Inicio Campaña)",
    objective: "La primera misión oficial con Álvaro o Abril.",
    tag: "CAMPAÑA",
    tasks: [
      { id: "f10_t1", text: "Escenario Distrito 8 con ambientación urbana y transeúntes." },
      { id: "f10_t2", text: "Secuencia del receptor muerto y paquete que pesa 4.7 kg." },
      { id: "f10_t3", text: "Primer combate con humano alterado de regeneración inexplicable." },
      { id: "f10_t4", text: "Escape táctico y cierre con pantalla de título DISTRITO 23." }
    ]
  }
];

const PROMPT_01_TEXT = `# PROMPT 01 — DISTRITO 23 / Fundación + Prototipo de Control

Trabaja como agente principal de desarrollo dentro de este proyecto Godot. Lee primero \`DISTRITO_23_MASTER.md\` y \`ROADMAP_TECNICO.md\` y respétalos como fuente de verdad. No avances más allá de la Fase 1.

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
6. Qué debo probar manualmente en Android.`;

// LocalStorage Keys
const STORAGE_KEY = "distrito23_progress_v1";

// State
let userProgress = {};

// Initialize
function init() {
  loadProgress();
  renderPhases();
  updateGlobalProgress();
  loadPrompt();
  loadMasterDoc();
  setupEvents();
}

function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      userProgress = JSON.parse(saved);
    } catch (e) {
      userProgress = {};
    }
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  updateGlobalProgress();
}

function renderPhases(filter = "all") {
  const container = document.getElementById("phases-container");
  container.innerHTML = "";

  PHASES_DATA.forEach((phase) => {
    const totalTasks = phase.tasks.length;
    const completedTasks = phase.tasks.filter((t) => userProgress[t.id]).length;
    const isDone = totalTasks > 0 && completedTasks === totalTasks;

    if (filter === "pending" && isDone) return;
    if (filter === "completed" && !isDone) return;

    const phaseCard = document.createElement("div");
    phaseCard.className = `bg-cyber-card border ${isDone ? "border-cyber-cyan/50 bg-cyan-950/10" : "border-cyber-border"} rounded-lg p-5 transition-all`;

    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let tasksHtml = phase.tasks.map((task) => {
      const checked = userProgress[task.id] ? "checked" : "";
      return `
        <label class="flex items-start gap-3 p-2 rounded hover:bg-cyber-dark/40 cursor-pointer transition">
          <input type="checkbox" class="cyber-checkbox mt-0.5" data-task-id="${task.id}" ${checked}>
          <span class="text-xs font-mono text-cyber-text select-none leading-relaxed ${checked ? 'line-through text-cyber-muted' : ''}">${task.text}</span>
        </label>
      `;
    }).join("");

    phaseCard.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 border-b border-cyber-border/60 pb-3">
        <div class="flex items-center gap-3">
          <span class="font-orbitron font-extrabold text-sm px-2.5 py-1 rounded bg-cyber-dark border border-cyber-border text-white">FASE ${phase.number}</span>
          <h3 class="font-orbitron font-bold text-white text-base">${phase.title}</h3>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-dark text-cyber-cyan border border-cyber-cyan/30">${phase.tag}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono ${isDone ? 'text-cyber-cyan font-bold' : 'text-cyber-muted'}">${completedTasks}/${totalTasks} completados (${progressPct}%)</span>
          <div class="w-20 bg-cyber-border rounded-full h-1.5 overflow-hidden">
            <div class="bg-cyber-cyan h-full transition-all duration-300" style="width: ${progressPct}%"></div>
          </div>
        </div>
      </div>
      <p class="text-xs text-cyber-muted italic mb-3 font-mono">Objetivo: ${phase.objective}</p>
      <div class="space-y-1">
        ${tasksHtml}
      </div>
    `;

    container.appendChild(phaseCard);
  });

  // Attach checkbox listeners
  container.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const taskId = e.target.getAttribute("data-task-id");
      userProgress[taskId] = e.target.checked;
      saveProgress();
      renderPhases(document.getElementById("phase-filter").value);
    });
  });
}

function updateGlobalProgress() {
  let total = 0;
  let completed = 0;

  PHASES_DATA.forEach((phase) => {
    phase.tasks.forEach((t) => {
      total++;
      if (userProgress[t.id]) completed++;
    });
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById("global-progress-percent").textContent = `${percent}%`;
  document.getElementById("global-progress-bar").style.width = `${percent}%`;
}

function loadPrompt() {
  document.getElementById("prompt-01").textContent = PROMPT_01_TEXT;
}

function loadMasterDoc() {
  const container = document.getElementById("master-doc-content");
  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 bg-cyber-dark rounded border border-cyber-cyan/30">
        <h3 class="font-orbitron font-bold text-cyber-cyan text-sm mb-1">DISTRITO 23 // RESUMEN EJECUTIVO</h3>
        <p class="text-xs">Shooter de acción 2D táctico top-down 3/4 para Android en Godot 4. Ambientado en el año 2300 con atmósfera cyberpunk global y sabor latino. Diseñado para jugabilidad 100% offline y partidas rápidas de 3–5 min a 60 FPS.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-3 bg-cyber-dark rounded border border-cyber-border">
          <h4 class="font-orbitron text-xs text-white font-bold mb-1">🎮 CONTROL HÍBRIDO INNOVADOR</h4>
          <p class="text-xs text-gray-400">Joystick izquierdo mueve y orienta al personaje de forma anclada. El botón derecho permite Tap (disparo frontal), Hold (automático) y Hold+Drag para apuntado 360° desacoplado mientras caminas.</p>
        </div>
        <div class="p-3 bg-cyber-dark rounded border border-cyber-border">
          <h4 class="font-orbitron text-xs text-white font-bold mb-1">⚡ COMBATE TÁCTICO</h4>
          <p class="text-xs text-gray-400">Escudo regenerable + vida fija. Coberturas rompibles, dash táctico, ejecuciones melee rápidas (0.5s) y munición contada que obliga a recoger armas enemigas.</p>
        </div>
        <div class="p-3 bg-cyber-dark rounded border border-cyber-border">
          <h4 class="font-orbitron text-xs text-white font-bold mb-1">👤 ÁLVARO & ABRIL</h4>
          <p class="text-xs text-gray-400">Protagonistas de 35 años, exmilitares con un misterio enterrado en su pasado. Misma potencia jugable, diferenciados por personalidad y animaciones.</p>
        </div>
        <div class="p-3 bg-cyber-dark rounded border border-cyber-border">
          <h4 class="font-orbitron text-xs text-white font-bold mb-1">🔮 EL MISTERIO DEL DISTRITO 23</h4>
          <p class="text-xs text-gray-400">Un paquete de 4.7 kg aparentemente vacío, humanos que no mueren a los disparos y una zona de la ciudad borrada de todos los mapas oficiales.</p>
        </div>
      </div>
    </div>
  `;
}

function switchTab(tabId) {
  document.querySelectorAll("main > section").forEach((sec) => sec.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active-tab"));

  if (tabId === "roadmap") {
    document.getElementById("view-roadmap").classList.remove("hidden");
    document.getElementById("nav-roadmap").classList.add("active-tab");
  } else if (tabId === "prompts") {
    document.getElementById("view-prompts").classList.remove("hidden");
    document.getElementById("nav-prompts").classList.add("active-tab");
  } else if (tabId === "docs") {
    document.getElementById("view-docs").classList.remove("hidden");
    document.getElementById("nav-docs").classList.add("active-tab");
  }
}

function copyPrompt(elementId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast("PROMPT COPIADO AL PORTAPAPELES");
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.querySelector("span").textContent = msg;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 2500);
}

function setupEvents() {
  document.getElementById("phase-filter").addEventListener("change", (e) => {
    renderPhases(e.target.value);
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userProgress, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "distrito23_progreso.json");
    dlAnchor.click();
    showToast("RESPALDO EXPORTADO EXITOSAMENTE");
  });

  document.getElementById("file-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        userProgress = JSON.parse(event.target.result);
        saveProgress();
        renderPhases(document.getElementById("phase-filter").value);
        showToast("PROGRESO IMPORTADO CORRECTAMENTE");
      } catch (err) {
        alert("Error al procesar el archivo JSON.");
      }
    };
    reader.readAsText(file);
  });
}

// Run
window.addEventListener("DOMContentLoaded", init);

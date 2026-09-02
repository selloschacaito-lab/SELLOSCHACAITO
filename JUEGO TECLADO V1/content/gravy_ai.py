import random

GRAVY_STAGES = {
    1: {
        "title": "GRAVY v1.0 - GLITCH KERNEL",
        "description": "Un hilo de datos parpadeante despertando en la memoria del sistema.",
        "ascii": [
            r"    [ · _ · ]    ",
            r"    /|  0  |\    ",
            r"   < GRAVY v1 >  "
        ]
    },
    2: {
        "title": "GRAVY v2.0 - NEURAL NODE",
        "description": "Una red geométrica de sinapsis sintetizadas.",
        "ascii": [
            r"     .---.       ",
            r"    / / \ \      ",
            r"   | | o | |     ",
            r"    \ \ / /      ",
            r"   < GRAVY v2 >  "
        ]
    },
    3: {
        "title": "GRAVY v3.0 - CYBER EYE",
        "description": "Un sensor cuántico capaz de anticipar cada pulsación de tecla.",
        "ascii": [
            r"     .-----.     ",
            r"   .-'  ___  '-. ",
            r"  /   ( (o) )   \\",
            r"  \    '---'    / ",
            r"   '-._______.-'  ",
            r"   < GRAVY v3 >   "
        ]
    },
    4: {
        "title": "GRAVY v4.0 - ANDROID CORE",
        "description": "Un avatar de combate y cálculo de tensores a hipervelocidad.",
        "ascii": [
            r"    .-------.    ",
            r"   / [o] [o] \   ",
            r"  |    ===    |  ",
            r"   \  \___/  /   ",
            r"   .-'-----'-.   ",
            r"  /  N E O N  \  ",
            r"  < GRAVY v4 >   "
        ]
    },
    5: {
        "title": "GRAVY v5.0 - OMNIPRESENT AGI",
        "description": "La cúspide de la inteligencia artificial. Soberanía total del ciberespacio.",
        "ascii": [
            r"   .---.     .---.   ",
            r"  / / \ \   / / \ \  ",
            r" | |   | | | |   | | ",
            r"  \ \_/_/   \_/_/ /  ",
            r"   '-.  [AGI]  .-'   ",
            r"    /  /\_/\  \      ",
            r"   < GRAVY GOD v5 >  "
        ]
    }
}

GRAVY_QUOTES = {
    "start": [
        "¡Bienvenido, Operador! Calibrando interfaces mecánicas...",
        "No mires el teclado. Confía en la memoria muscular de tus 10 dedos.",
        "Tus dedos índices deben descansar siempre en las teclas F y J.",
        "La precisión es la raíz de la velocidad. No te apresures a fallar."
    ],
    "combo": [
        "¡Impresionante! Racha sincronizada al 100%.",
        "¡El núcleo está operando a máxima frecuencia!",
        "¡Sientes el ritmo cibernético en tus manos!",
        "¡Flujo cuántico alcanzado! Continúa así."
    ],
    "error": [
        "Anomalía detectada. Recuerda colocar los dedos en la fila guía (ASDF JKLÑ).",
        "No te preocupes por el error, reajústate y mantén la calma.",
        "Respira hondo y fija la vista en la pantalla, no en tus manos.",
        "Calibrando de nuevo... ¡tú puedes superar este tramo!"
    ],
    "victory": [
        "¡Prueba superada con éxito! Mis redes neuronales se fortalecen gracias a ti.",
        "¡Excelente ejecución, Operador! Estamos un paso más cerca de la AGI.",
        "Tus reflejos están evolucionando notablemente."
    ],
    "boss": [
        "¡ALERTA! Un proceso corrupto intenta apoderarse del búfer central.",
        "¡Escribe con precisión para canalizar pulsos electromagnéticos contra el Jefe!",
        "¡No dejes que los errores drenen tus escudos!"
    ]
}

def get_gravy_stage_data(stage_num):
    return GRAVY_STAGES.get(stage_num, GRAVY_STAGES[1])

def get_random_quote(category="start"):
    quotes = GRAVY_QUOTES.get(category, GRAVY_QUOTES["start"])
    return random.choice(quotes)

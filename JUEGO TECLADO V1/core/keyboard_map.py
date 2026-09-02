# Mapeos de teclados y asignación de 10 dedos ergonómica
# Dedos:
# LI4: Izquierda Meñique (Pinky)
# LI3: Izquierda Anular (Ring)
# LI2: Izquierda Medio (Middle)
# LI1: Izquierda Índice (Index)
# LD1: Derecha Índice (Index)
# LD2: Derecha Medio (Middle)
# LD3: Derecha Anular (Ring)
# LD4: Derecha Meñique (Pinky)
# THUMB: Pulgar (Espacio)

FINGER_NAMES = {
    "LI4": "Mano Izq - Meñique",
    "LI3": "Mano Izq - Anular",
    "LI2": "Mano Izq - Medio",
    "LI1": "Mano Izq - Índice",
    "LD1": "Mano Der - Índice",
    "LD2": "Mano Der - Medio",
    "LD3": "Mano Der - Anular",
    "LD4": "Mano Der - Meñique",
    "THUMB": "Pulgar (Espacio)",
}

# Mapeo de teclas a dedo para teclado Español (ES)
KEY_TO_FINGER_ES = {
    # Fila Números
    'º': 'LI4', '1': 'LI4', '!': 'LI4',
    '2': 'LI3', '"': 'LI3',
    '3': 'LI2', '·': 'LI2',
    '4': 'LI1', '$': 'LI1',
    '5': 'LI1', '%': 'LI1',
    '6': 'LD1', '&': 'LD1',
    '7': 'LD1', '/': 'LD1',
    '8': 'LD2', '(': 'LD2',
    '9': 'LD3', ')': 'LD3',
    '0': 'LD4', '=': 'LD4',
    "'": 'LD4', '?': 'LD4',
    '¡': 'LD4', '¿': 'LD4',

    # Fila Superior (QWERTY)
    'q': 'LI4', 'Q': 'LI4',
    'w': 'LI3', 'W': 'LI3',
    'e': 'LI2', 'E': 'LI2',
    'r': 'LI1', 'R': 'LI1',
    't': 'LI1', 'T': 'LI1',
    'y': 'LD1', 'Y': 'LD1',
    'u': 'LD1', 'U': 'LD1',
    'i': 'LD2', 'I': 'LD2',
    'o': 'LD3', 'O': 'LD3',
    'p': 'LD4', 'P': 'LD4',
    '`': 'LD4', '^': 'LD4',
    '+': 'LD4', '*': 'LD4',

    # Fila Guía (Home Row)
    'a': 'LI4', 'A': 'LI4',
    's': 'LI3', 'S': 'LI3',
    'd': 'LI2', 'D': 'LI2',
    'f': 'LI1', 'F': 'LI1',
    'g': 'LI1', 'G': 'LI1',
    'h': 'LD1', 'H': 'LD1',
    'j': 'LD1', 'J': 'LD1',
    'k': 'LD2', 'K': 'LD2',
    'l': 'LD3', 'L': 'LD3',
    'ñ': 'LD4', 'Ñ': 'LD4',
    '´': 'LD4', '¨': 'LD4',
    'ç': 'LD4', 'Ç': 'LD4',

    # Fila Inferior
    '<': 'LI4', '>': 'LI4',
    'z': 'LI4', 'Z': 'LI4',
    'x': 'LI3', 'X': 'LI3',
    'c': 'LI2', 'C': 'LI2',
    'v': 'LI1', 'V': 'LI1',
    'b': 'LI1', 'B': 'LI1',
    'n': 'LD1', 'N': 'LD1',
    'm': 'LD1', 'M': 'LD1',
    ',': 'LD2', ';': 'LD2',
    '.': 'LD3', ':': 'LD3',
    '-': 'LD4', '_': 'LD4',

    # Espacio y símbolos comunes
    ' ': 'THUMB',
    '\n': 'LD4',
    '{': 'LD4', '}': 'LD4', '[': 'LD4', ']': 'LD4',
    '@': 'LI3', '#': 'LI2', '~': 'LD1', '|': 'LI4',
    '\\': 'LI4', '/': 'LD1'
}

# Representación gráfica ASCII para renderizado en consola
ASCII_KEYBOARD_TEMPLATE_ES = [
    r"┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───────┐",
    r"│ º │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 0 │ ' │ ¡ │ BACK  │",
    r"├───┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─────┤",
    r"│ TAB │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │ ` │ + │ ENT │",
    r"├─────┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┤    │",
    r"│ CAPS │ A │ S │ D │[F]│ G │ H │[J]│ K │ L │ Ñ │ ´ │ Ç │    │",
    r"├────┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴───┴────┤",
    r"│SHFT│ < │ Z │ X │ C │ V │ B │ N │ M │ , │ . │ - │   SHIFT   │",
    r"├────┼───┴┬──┴─┬─┴───┴───┴───┴───┴───┴───┴─┬─┴───┼───┬──────┤",
    r"│CTRL│WIN │ALT │         [ESPACIO]        │ALTGR│WIN│ CTRL │",
    r"└───┴────┴────┴──────────────────────────┴─────┴───┴──────┘"
]

def get_finger_for_char(char, layout="es"):
    """Devuelve el código de dedo y la descripción para el carácter dado."""
    code = KEY_TO_FINGER_ES.get(char, "LD1")
    desc = FINGER_NAMES.get(code, "Dedo Desconocido")
    return code, desc

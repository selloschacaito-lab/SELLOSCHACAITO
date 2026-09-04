# Temas visuales para GRAVY PROTOCOL

THEMES = {
    "cyberpunk": {
        "name": "Cyberpunk Neon 2077",
        "price": 0,
        "req_boss": 0,
        "primary": "bright_cyan",
        "secondary": "bright_magenta",
        "accent": "bright_yellow",
        "bg": "black",
        "text": "white",
        "correct": "bright_green",
        "error": "bright_red",
        "key_active": "bright_yellow",
        "banner_color": "magenta"
    },
    "matrix": {
        "name": "Matrix Green Fósforo",
        "price": 1500,
        "req_boss": 0,
        "primary": "bright_green",
        "secondary": "green",
        "accent": "bright_white",
        "bg": "black",
        "text": "bright_green",
        "correct": "bright_green",
        "error": "bright_red",
        "key_active": "bright_white",
        "banner_color": "green"
    },
    "synthwave": {
        "name": "Synthwave 80s Sunset",
        "price": 3500,
        "req_boss": 1,
        "primary": "bright_magenta",
        "secondary": "bright_blue",
        "accent": "bright_cyan",
        "bg": "black",
        "text": "bright_white",
        "correct": "bright_cyan",
        "error": "bright_red",
        "key_active": "bright_magenta",
        "banner_color": "magenta"
    },
    "monokai": {
        "name": "Monokai Pro Hacker",
        "price": 6000,
        "req_boss": 1,
        "primary": "bright_yellow",
        "secondary": "bright_green",
        "accent": "bright_cyan",
        "bg": "black",
        "text": "white",
        "correct": "bright_green",
        "error": "bright_red",
        "key_active": "bright_yellow",
        "banner_color": "yellow"
    },
    "amber": {
        "name": "Amber CRT Retro Terminal",
        "price": 10000,
        "req_boss": 2,
        "primary": "bright_yellow",
        "secondary": "yellow",
        "accent": "bright_white",
        "bg": "black",
        "text": "bright_yellow",
        "correct": "bright_yellow",
        "error": "bright_red",
        "key_active": "bright_white",
        "banner_color": "yellow"
    },
    "glitch_red": {
        "name": "Blood Glitch / Red Alert",
        "price": 16000,
        "req_boss": 3,
        "primary": "bright_red",
        "secondary": "red",
        "accent": "bright_yellow",
        "bg": "black",
        "text": "bright_white",
        "correct": "bright_yellow",
        "error": "bright_white",
        "key_active": "bright_red",
        "banner_color": "red"
    },
    "cyber_ghost": {
        "name": "Cyber Ghost (Ice & Pure White)",
        "price": 25000,
        "req_boss": 4,
        "primary": "bright_white",
        "secondary": "bright_cyan",
        "accent": "bright_blue",
        "bg": "black",
        "text": "white",
        "correct": "bright_cyan",
        "error": "bright_red",
        "key_active": "bright_white",
        "banner_color": "bright_cyan"
    },
    "quantum_gold": {
        "name": "Quantum Gold (AGI Sovereign)",
        "price": 40000,
        "req_boss": 5,
        "primary": "bright_yellow",
        "secondary": "bright_white",
        "accent": "bright_yellow",
        "bg": "black",
        "text": "white",
        "correct": "bright_yellow",
        "error": "bright_red",
        "key_active": "bright_white",
        "banner_color": "yellow"
    }
}

def get_theme(theme_key):
    return THEMES.get(theme_key, THEMES["cyberpunk"])

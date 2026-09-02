import pygame

# Layout de teclas (Español con Ñ estándar)
KEYBOARD_ROWS_ES = [
    [("º", "LI4"), ("1", "LI4"), ("2", "LI3"), ("3", "LI2"), ("4", "LI1"), ("5", "LI1"), ("6", "LD1"), ("7", "LD1"), ("8", "LD2"), ("9", "LD3"), ("0", "LD4"), ("'", "LD4"), ("¡", "LD4"), ("BACK", "LD4", 1.8)],
    [("TAB", "LI4", 1.5), ("Q", "LI4"), ("W", "LI3"), ("E", "LI2"), ("R", "LI1"), ("T", "LI1"), ("Y", "LD1"), ("U", "LD1"), ("I", "LD2"), ("O", "LD3"), ("P", "LD4"), ("`", "LD4"), ("+", "LD4"), ("ENT", "LD4", 1.3)],
    [("CAPS", "LI4", 1.8), ("A", "LI4"), ("S", "LI3"), ("D", "LI2"), ("F", "LI1"), ("G", "LI1"), ("H", "LD1"), ("J", "LD1"), ("K", "LD2"), ("L", "LD3"), ("Ñ", "LD4"), ("´", "LD4"), ("Ç", "LD4")],
    [("SHFT", "LI4", 2.2), ("<", "LI4"), ("Z", "LI4"), ("X", "LI3"), ("C", "LI2"), ("V", "LI1"), ("B", "LI1"), ("N", "LD1"), ("M", "LD1"), (",", "LD2"), (".", "LD3"), ("-", "LD4"), ("SHIFT", "LD4", 2.2)],
    [("CTRL", "LI4", 1.5), ("WIN", "LI4", 1.2), ("ALT", "LI4", 1.2), ("ESPACIO", "THUMB", 6.5), ("ALTGR", "LD4", 1.2), ("WIN", "LD4", 1.2), ("CTRL", "LD4", 1.5)]
]

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

class VisualKeyboard2D:
    """Teclado 2D translúcido con efecto de brillo glow, teclas reactivas y siluetas de manos."""

    def __init__(self, x=190, y=475, key_size=36, spacing=4):
        self.x = x
        self.y = y
        self.key_size = key_size
        self.spacing = spacing
        self.font = pygame.font.SysFont("consolas", 12, bold=True)
        self.active_presses = {} # {char: timer}

    def register_press(self, char):
        self.active_presses[char.upper()] = 6

    def update(self):
        for k in list(self.active_presses.keys()):
            self.active_presses[k] -= 1
            if self.active_presses[k] <= 0:
                del self.active_presses[k]

    def draw(self, surface, theme, target_char=None, show_hands=True, blindfold=False):
        if blindfold:
            # Modo velo negro activado
            blind_rect = pygame.Rect(self.x - 20, self.y - 30, 900, 230)
            pygame.draw.rect(surface, (12, 14, 20), blind_rect, border_radius=8)
            pygame.draw.rect(surface, theme["secondary"], blind_rect, 2, border_radius=8)
            msg = self.font.render("🕶️ MODO VELO NEGRO ACTIVADO // MEMORIA MUSCULAR PURA (+50% PUNTOS)", True, theme["accent"])
            surface.blit(msg, (blind_rect.centerx - msg.get_width() // 2, blind_rect.centery - msg.get_height() // 2))
            return

        c_pri = theme["primary"]
        c_acc = theme["accent"]
        c_sec = theme["secondary"]
        c_bg_key = (24, 28, 38)

        target_upper = target_char.upper() if target_char and target_char != " " else ("ESPACIO" if target_char == " " else None)
        active_finger_code = None

        cur_y = self.y
        for row in KEYBOARD_ROWS_ES:
            cur_x = self.x
            for item in row:
                label = item[0]
                finger = item[1]
                width_mult = item[2] if len(item) > 2 else 1.0
                k_w = int(self.key_size * width_mult)
                k_h = self.key_size

                k_rect = pygame.Rect(cur_x, cur_y, k_w, k_h)

                is_target = (target_upper == label) or (target_char and target_char.upper() == label)
                is_pressed = (label in self.active_presses)

                if is_target:
                    active_finger_code = finger
                    # Brillo neón amarillo/dorado de tecla objetivo
                    pygame.draw.rect(surface, c_acc, k_rect, border_radius=4)
                    text_col = (10, 10, 15)
                elif is_pressed:
                    # Tecla presionada en tiempo real
                    pygame.draw.rect(surface, c_sec, k_rect, border_radius=4)
                    text_col = (255, 255, 255)
                else:
                    # Tecla normal
                    pygame.draw.rect(surface, c_bg_key, k_rect, border_radius=4)
                    # Relieves táctiles en F y J
                    if label in ("F", "J"):
                        pygame.draw.rect(surface, c_pri, k_rect, 2, border_radius=4)
                        pygame.draw.line(surface, c_acc, (cur_x + 8, cur_y + k_h - 6), (cur_x + k_w - 8, cur_y + k_h - 6), 2)
                    else:
                        pygame.draw.rect(surface, (50, 60, 80), k_rect, 1, border_radius=4)
                    text_col = theme["text"]

                # Renderizar etiqueta
                txt_surf = self.font.render(label, True, text_col)
                surface.blit(txt_surf, (k_rect.centerx - txt_surf.get_width() // 2, k_rect.centery - txt_surf.get_height() // 2))

                cur_x += k_w + self.spacing
            cur_y += self.key_size + self.spacing

        # Dibujar Radar de Manos a los costados
        if show_hands:
            self._draw_hands_radar(surface, theme, active_finger_code)

    def _draw_hands_radar(self, surface, theme, active_code):
        c_pri = theme["primary"]
        c_acc = theme["accent"]
        c_dim = (60, 70, 90)

        # Mano Izquierda (izquierda del teclado)
        lx = self.x - 140
        ly = self.y + 10
        left_fingers = [("LI4", "MEÑIQUE"), ("LI3", "ANULAR"), ("LI2", "MEDIO"), ("LI1", "ÍNDICE")]
        for idx, (f_code, f_name) in enumerate(left_fingers):
            col = c_acc if f_code == active_code else c_dim
            r = pygame.Rect(lx, ly + idx * 26, 120, 22)
            pygame.draw.rect(surface, (20, 24, 34), r, border_radius=3)
            pygame.draw.rect(surface, col, r, 2 if f_code == active_code else 1, border_radius=3)
            txt = self.font.render(f_name, True, (255, 255, 255) if f_code == active_code else (140, 150, 170))
            surface.blit(txt, (r.x + 6, r.y + 4))

        # Mano Derecha (derecha del teclado)
        rx = self.x + 665
        ry = self.y + 10
        right_fingers = [("LD1", "ÍNDICE"), ("LD2", "MEDIO"), ("LD3", "ANULAR"), ("LD4", "MEÑIQUE")]
        for idx, (f_code, f_name) in enumerate(right_fingers):
            col = c_acc if f_code == active_code else c_dim
            r = pygame.Rect(rx, ry + idx * 26, 120, 22)
            pygame.draw.rect(surface, (20, 24, 34), r, border_radius=3)
            pygame.draw.rect(surface, col, r, 2 if f_code == active_code else 1, border_radius=3)
            txt = self.font.render(f_name, True, (255, 255, 255) if f_code == active_code else (140, 150, 170))
            surface.blit(txt, (r.x + 6, r.y + 4))

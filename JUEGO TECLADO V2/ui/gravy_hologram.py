import pygame
import math
import random

THEME_COLORS = {
    "cyberpunk_neon": {
        "primary": (0, 240, 255),       # Cyan
        "secondary": (255, 0, 128),     # Magenta
        "accent": (255, 230, 0),        # Amarillo Neón
        "bg": (10, 12, 18),             # Azul noche profundo
        "surface": (18, 22, 32),
        "correct": (0, 255, 136),       # Verde neón
        "error": (255, 40, 60),         # Rojo alerta
        "text": (230, 240, 255)
    },
    "matrix_phosphor": {
        "primary": (0, 255, 80),
        "secondary": (0, 160, 40),
        "accent": (180, 255, 180),
        "bg": (5, 12, 5),
        "surface": (10, 24, 12),
        "correct": (0, 255, 80),
        "error": (255, 50, 50),
        "text": (200, 255, 200)
    },
    "synthwave_sunset": {
        "primary": (255, 110, 210),
        "secondary": (70, 150, 255),
        "accent": (255, 210, 60),
        "bg": (16, 8, 28),
        "surface": (28, 14, 46),
        "correct": (0, 240, 220),
        "error": (255, 60, 90),
        "text": (255, 235, 255)
    },
    "obsidian_gold": {
        "primary": (255, 215, 0),
        "secondary": (255, 160, 0),
        "accent": (255, 255, 255),
        "bg": (10, 10, 10),
        "surface": (22, 22, 22),
        "correct": (255, 215, 0),
        "error": (255, 50, 50),
        "text": (255, 245, 220)
    }
}

class GravyHologram:
    """Holograma reactivo 2D de GRAVY con animaciones de escaneo, expresiones y bocadillos."""

    def __init__(self, x=1080, y=140):
        self.default_x = x
        self.default_y = y
        self.x = x
        self.y = y
        self.is_combat_mode = False
        self.anim_timer = 0
        self.expression = "idle" # idle, happy, alarmed, thinking
        self.dialogue = ""
        self.dialogue_life = 0
        self.max_dialogue_life = 210

    def set_combat_mode(self, in_combat: bool):
        self.is_combat_mode = in_combat
        if in_combat:
            # Reubicar en la esquina inferior derecha (al lado del teclado)
            self.x = 1190
            self.y = 590
        else:
            self.x = self.default_x
            self.y = self.default_y

    def say(self, text, duration=210): # 3.5 segundos a 60 FPS
        self.dialogue = text
        self.dialogue_life = duration
        self.max_dialogue_life = duration

    def dismiss(self):
        """Ocultar el diálogo inmediatamente al primer tecleo del jugador."""
        if self.dialogue_life > 10:
            self.dialogue_life = 10 # Desvanecimiento rápido

    def set_expression(self, expr):
        self.expression = expr

    def update(self):
        self.anim_timer += 0.05
        if self.dialogue_life > 0:
            self.dialogue_life -= 1

    def draw(self, surface, theme, stage=1):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        bob = math.sin(self.anim_timer) * 3
        center_x = int(self.x)
        center_y = int(self.y + bob)

        # Anillo holográfico exterior
        rot_r = 30 + int(math.cos(self.anim_timer * 1.5) * 2)
        pygame.draw.circle(surface, c_pri, (center_x, center_y), rot_r, 2)
        
        # Partículas/anillo interior secundario
        inner_r = 22
        pygame.draw.circle(surface, c_sec, (center_x, center_y), inner_r, 1)

        # Núcleo según fase (1 a 5)
        core_r = 13
        if stage >= 4:
            head_rect = pygame.Rect(center_x - 10, center_y - 10, 20, 20)
            pygame.draw.rect(surface, c_acc, head_rect, border_radius=4)
            eye_c = (10, 10, 20) if self.expression != "alarmed" else (255, 40, 40)
            pygame.draw.circle(surface, eye_c, (center_x - 4, center_y - 2), 2)
            pygame.draw.circle(surface, eye_c, (center_x + 4, center_y - 2), 2)
        else:
            pygame.draw.circle(surface, c_acc, (center_x, center_y), core_r)
            scan_y = center_y + int(math.sin(self.anim_timer * 3) * core_r)
            pygame.draw.line(surface, (255, 255, 255), (center_x - 10, scan_y), (center_x + 10, scan_y), 2)

        # Nombre y Fase
        font = pygame.font.SysFont("consolas", 11, bold=True)
        name_surf = font.render(f"GRAVY [F-{stage}]", True, c_pri)
        surface.blit(name_surf, (center_x - name_surf.get_width() // 2, center_y + 36))

        # Bocadillo de diálogo flotante no invasivo
        if self.dialogue_life > 0 and self.dialogue:
            d_font = pygame.font.SysFont("consolas", 12, bold=False)
            d_surf = d_font.render(self.dialogue, True, (255, 255, 255))
            pad_x = 10
            pad_y = 6
            bubble_w = d_surf.get_width() + pad_x * 2
            bubble_h = d_surf.get_height() + pad_y * 2

            # Cálculo de opacidad para desvanecimiento suave (fade out)
            alpha = 255
            if self.dialogue_life < 30:
                alpha = int((self.dialogue_life / 30.0) * 255)

            bubble_surf = pygame.Surface((bubble_w + 10, bubble_h + 16), pygame.SRCALPHA)

            if self.is_combat_mode:
                # Durante combate: Flota ARRIBA de Gravy en la esquina inferior derecha
                bx = max(10, min(surface.get_width() - bubble_w - 10, center_x - bubble_w // 2))
                by = center_y - bubble_h - 24

                # Fondo y borde con alpha
                b_rect = pygame.Rect(0, 0, bubble_w, bubble_h)
                pygame.draw.rect(bubble_surf, (16, 20, 32, alpha), b_rect, border_radius=6)
                pygame.draw.rect(bubble_surf, (c_pri[0], c_pri[1], c_pri[2], alpha), b_rect, 2, border_radius=6)
                d_surf.set_alpha(alpha)
                bubble_surf.blit(d_surf, (pad_x, pad_y))

                # Flecha apuntando abajo hacia Gravy
                arrow_pts = [
                    (bubble_w // 2 - 6, bubble_h),
                    (bubble_w // 2 + 6, bubble_h),
                    (bubble_w // 2, bubble_h + 8)
                ]
                pygame.draw.polygon(bubble_surf, (c_pri[0], c_pri[1], c_pri[2], alpha), arrow_pts)
                surface.blit(bubble_surf, (bx, by))
            else:
                # Menú principal y pantallas fuera de combate: a la izquierda de Gravy
                bx = center_x - bubble_w - 25
                by = center_y - bubble_h // 2

                b_rect = pygame.Rect(0, 0, bubble_w, bubble_h)
                pygame.draw.rect(bubble_surf, (16, 20, 32, alpha), b_rect, border_radius=6)
                pygame.draw.rect(bubble_surf, (c_pri[0], c_pri[1], c_pri[2], alpha), b_rect, 2, border_radius=6)
                d_surf.set_alpha(alpha)
                bubble_surf.blit(d_surf, (pad_x, pad_y))

                # Flecha hacia la derecha
                arrow_pts = [
                    (bubble_w, bubble_h // 2 - 5),
                    (bubble_w, bubble_h // 2 + 5),
                    (bubble_w + 8, bubble_h // 2)
                ]
                pygame.draw.polygon(bubble_surf, (c_pri[0], c_pri[1], c_pri[2], alpha), arrow_pts)
                surface.blit(bubble_surf, (bx, by))

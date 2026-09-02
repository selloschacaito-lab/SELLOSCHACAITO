import pygame
import math

class MultiPhaseBoss:
    """Jefe de Sector con 3 fases de combate y ataques visuales interactivos."""

    def __init__(self, name, title, max_hp, phases_data):
        self.name = name
        self.title = title
        self.max_hp = max_hp
        self.hp = max_hp
        self.phase = 1
        self.phases_data = phases_data
        self.x = 640
        self.y = 130
        self.anim_timer = 0
        self.is_defeated = False
        self.font_boss = pygame.font.SysFont("consolas", 18, bold=True)
        self.font_small = pygame.font.SysFont("consolas", 12, bold=False)

    def take_damage(self, amount):
        self.hp = max(0, self.hp - amount)
        # Transición de fases
        if self.hp <= self.max_hp * 0.33 and self.phase < 3:
            self.phase = 3
            return "phase_3"
        elif self.hp <= self.max_hp * 0.66 and self.phase < 2:
            self.phase = 2
            return "phase_2"
        elif self.hp <= 0:
            self.is_defeated = True
            return "dead"
        return "hit"

    def update(self):
        self.anim_timer += 0.04
        self.x = 640 + math.sin(self.anim_timer) * 80

    def draw(self, surface, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]
        c_err = theme["error"]

        # Chasis masivo del Jefe
        boss_rect = pygame.Rect(int(self.x - 140), int(self.y - 35), 280, 70)
        pygame.draw.rect(surface, (25, 15, 25), boss_rect, border_radius=8)
        pygame.draw.rect(surface, c_err, boss_rect, 3, border_radius=8)

        # Núcleo de energía oscilante
        core_r = 18 + int(math.sin(self.anim_timer * 3) * 4)
        pygame.draw.circle(surface, c_acc, (int(self.x), int(self.y)), core_r)

        # Alas / Torretas laterales
        pygame.draw.polygon(surface, c_sec, [(self.x - 140, self.y), (self.x - 190, self.y - 20), (self.x - 150, self.y + 25)])
        pygame.draw.polygon(surface, c_sec, [(self.x + 140, self.y), (self.x + 190, self.y - 20), (self.x + 150, self.y + 25)])

        # Título y Nombre
        name_t = self.font_boss.render(f"⚠️ {self.name} // FASE {self.phase} [3]", True, c_acc)
        surface.blit(name_t, (self.x - name_t.get_width() // 2, self.y - 65))

        # Barra de vida del Jefe
        bar_w = 400
        bar_h = 16
        bar_x = 640 - bar_w // 2
        bar_y = 190
        
        pygame.draw.rect(surface, (15, 18, 25), (bar_x, bar_y, bar_w, bar_h), border_radius=4)
        pygame.draw.rect(surface, (80, 90, 110), (bar_x, bar_y, bar_w, bar_h), 1, border_radius=4)

        ratio = max(0.0, self.hp / self.max_hp)
        fill = int(bar_w * ratio)
        if fill > 0:
            pygame.draw.rect(surface, c_err, (bar_x + 1, bar_y + 1, fill - 2, bar_h - 2), border_radius=3)

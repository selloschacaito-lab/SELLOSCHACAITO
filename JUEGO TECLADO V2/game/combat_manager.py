import pygame
import random
import math

class EnemyDrone:
    """Enemigo tipo Drone / Centinela con una palabra flotante."""

    def __init__(self, text, x, y, speed=1.2, drone_type="scout"):
        self.text = text
        self.typed_idx = 0
        self.x = x
        self.y = y
        self.speed = speed
        self.drone_type = drone_type
        self.is_dead = False
        self.hover_timer = random.uniform(0, math.tau)
        self.width = max(80, len(text) * 14 + 20)
        self.height = 42

    def update(self):
        self.y += self.speed
        self.hover_timer += 0.08
        self.x += math.sin(self.hover_timer) * 0.8

    def match_char(self, char):
        if self.typed_idx < len(self.text) and self.text[self.typed_idx].lower() == char.lower():
            self.typed_idx += 1
            if self.typed_idx >= len(self.text):
                self.is_dead = True
                return "killed"
            return "hit"
        return "miss"

    def get_target_char(self):
        if self.typed_idx < len(self.text):
            return self.text[self.typed_idx]
        return None

    def draw(self, surface, theme, font, is_active_target=False):
        c_pri = theme["primary"]
        c_acc = theme["accent"]
        c_corr = theme["correct"]
        c_bg = (18, 22, 34)

        rect = pygame.Rect(int(self.x - self.width // 2), int(self.y), self.width, self.height)

        # Chasis del Drone
        border_col = c_acc if is_active_target else (60, 80, 110)
        border_w = 2 if is_active_target else 1
        pygame.draw.rect(surface, c_bg, rect, border_radius=6)
        pygame.draw.rect(surface, border_col, rect, border_w, border_radius=6)

        # Ojo de sensor del drone
        sensor_c = (255, 40, 60) if not is_active_target else (0, 255, 180)
        pygame.draw.circle(surface, sensor_c, (rect.x + 12, rect.centery), 4)

        # Renderizar texto (resaltando caracteres acertados)
        typed_str = self.text[:self.typed_idx]
        remain_str = self.text[self.typed_idx:]

        t1 = font.render(typed_str, True, c_corr)
        t2 = font.render(remain_str, True, (255, 255, 255) if is_active_target else (170, 180, 200))

        start_x = rect.x + 24
        surface.blit(t1, (start_x, rect.centery - t1.get_height() // 2))
        surface.blit(t2, (start_x + t1.get_width(), rect.centery - t2.get_height() // 2))

class CombatManager:
    """Gestiona el combate de acción en tiempo real al estilo 'Typing of the Dead' Cyberpunk."""

    def __init__(self, sound_engine, particle_system):
        self.sound = sound_engine
        self.particles = particle_system
        self.drones = []
        self.font = pygame.font.SysFont("consolas", 16, bold=True)
        self.active_target = None
        self.laser_shots = []

    def spawn_drone(self, text, x, y=-50, speed=1.0):
        d = EnemyDrone(text, x, y, speed=speed)
        self.drones.append(d)

    def process_key(self, char):
        if not self.drones:
            return None

        # Si ya hay un objetivo fijado, intentar acertarle
        if self.active_target and not self.active_target.is_dead:
            res = self.active_target.match_char(char)
            if res in ("hit", "killed"):
                self.laser_shots.append((640, 480, self.active_target.x, self.active_target.y + 20, (0, 240, 255), 5))
                self.particles.emit_burst(self.active_target.x, self.active_target.y + 20, (0, 255, 200), count=6)
                if res == "killed":
                    self.particles.emit_burst(self.active_target.x, self.active_target.y + 20, (255, 210, 0), count=25, speed_mult=4.5)
                    self.sound.play_hit()
                    killed_d = self.active_target
                    self.active_target = None
                    return {"status": "killed", "drone": killed_d}
                else:
                    self.sound.play_laser()
                    return {"status": "hit", "drone": self.active_target}
            else:
                self.sound.play_error()
                return {"status": "miss"}

        # Si no hay objetivo activo, buscar el drone más cercano al fondo que empiece con esta letra
        candidates = [d for d in self.drones if not d.is_dead and d.text[0].lower() == char.lower()]
        if candidates:
            # Elegir el que esté más abajo (mayor peligro)
            candidates.sort(key=lambda d: d.y, reverse=True)
            chosen = candidates[0]
            self.active_target = chosen
            chosen.typed_idx = 1
            self.laser_shots.append((640, 480, chosen.x, chosen.y + 20, (0, 240, 255), 5))
            self.particles.emit_burst(chosen.x, chosen.y + 20, (0, 255, 200), count=6)
            if chosen.typed_idx >= len(chosen.text):
                chosen.is_dead = True
                self.particles.emit_burst(chosen.x, chosen.y + 20, (255, 210, 0), count=25, speed_mult=4.5)
                self.sound.play_hit()
                self.active_target = None
                return {"status": "killed", "drone": chosen}
            else:
                self.sound.play_laser()
                return {"status": "hit", "drone": chosen}
        else:
            self.sound.play_error()
            return {"status": "miss"}

    def get_current_target_char(self):
        if self.active_target and not self.active_target.is_dead:
            return self.active_target.get_target_char()
        elif self.drones:
            # Sugerir la primera letra del drone más cercano
            lowest = max(self.drones, key=lambda d: d.y)
            return lowest.get_target_char()
        return None

    def update(self, breach_limit_y=460):
        breached_count = 0
        for d in self.drones:
            d.update()
            if d.y >= breach_limit_y and not d.is_dead:
                d.is_dead = True
                breached_count += 1
                self.particles.emit_burst(d.x, breach_limit_y, (255, 50, 60), count=20)
                self.sound.play_hit()
                if self.active_target == d:
                    self.active_target = None

        self.drones = [d for d in self.drones if not d.is_dead]

        # Actualizar rayos láser
        new_lasers = []
        for sx, sy, ex, ey, col, life in self.laser_shots:
            if life > 1:
                new_lasers.append((sx, sy, ex, ey, col, life - 1))
        self.laser_shots = new_lasers

        return breached_count

    def draw(self, surface, theme):
        # Dibujar rayos láser
        for sx, sy, ex, ey, col, _ in self.laser_shots:
            pygame.draw.line(surface, col, (sx, sy), (ex, ey), 3)
            pygame.draw.line(surface, (255, 255, 255), (sx, sy), (ex, ey), 1)

        # Dibujar drones
        for d in self.drones:
            is_active = (d == self.active_target)
            d.draw(surface, theme, self.font, is_active_target=is_active)

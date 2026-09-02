import pygame
import math
import random

class CyberCityBackground:
    """Fondo procedural 2D de megaciudad cyberpunk con rascacielos parallax,
    ventanas neón titilantes, lluvia digital, rejilla de horizonte y oscurecimiento táctico.
    """

    SECTOR_PALETTES = {
        1: { # Subsuelo de Neón
            "sky_top": (8, 6, 14),
            "sky_bot": (22, 10, 26),
            "far_building": (14, 12, 20),
            "mid_building": (20, 16, 28),
            "window_colors": [(255, 0, 128), (255, 120, 40), (255, 220, 60), (0, 220, 255)],
            "grid_color": (160, 20, 100),
            "rain_color": (255, 60, 140),
            "beacon_color": (255, 40, 80)
        },
        2: { # Distrito Corporativo
            "sky_top": (4, 8, 18),
            "sky_bot": (10, 20, 36),
            "far_building": (10, 16, 26),
            "mid_building": (14, 24, 38),
            "window_colors": [(0, 240, 255), (80, 180, 255), (200, 240, 255), (0, 255, 180)],
            "grid_color": (0, 160, 240),
            "rain_color": (0, 220, 255),
            "beacon_color": (0, 255, 200)
        },
        3: { # Nube de Datos Cuántica
            "sky_top": (10, 6, 20),
            "sky_bot": (26, 12, 38),
            "far_building": (16, 12, 24),
            "mid_building": (24, 18, 36),
            "window_colors": [(255, 215, 0), (200, 100, 255), (0, 255, 200), (255, 150, 220)],
            "grid_color": (180, 80, 240),
            "rain_color": (220, 140, 255),
            "beacon_color": (255, 215, 0)
        },
        4: { # Red Oscura / Hacker Core
            "sky_top": (4, 12, 6),
            "sky_bot": (8, 26, 14),
            "far_building": (8, 18, 10),
            "mid_building": (12, 26, 16),
            "window_colors": [(0, 255, 100), (50, 255, 150), (180, 255, 120), (0, 200, 80)],
            "grid_color": (0, 200, 90),
            "rain_color": (0, 255, 120),
            "beacon_color": (0, 255, 80)
        },
        5: { # Nexo AGI / Ciudadela IA
            "sky_top": (14, 4, 8),
            "sky_bot": (30, 8, 14),
            "far_building": (22, 10, 14),
            "mid_building": (32, 14, 20),
            "window_colors": [(255, 40, 60), (255, 240, 240), (255, 180, 0), (255, 0, 120)],
            "grid_color": (255, 40, 70),
            "rain_color": (255, 70, 90),
            "beacon_color": (255, 50, 70)
        }
    }

    def __init__(self, width=1280, height=720):
        self.width = width
        self.height = height
        self.time_counter = 0.0
        self.current_sector = 1

        # Generar capa de rascacielos lejanos (siluetas oscuras fijas con balizas parpadeantes)
        random.seed(42)
        self.far_buildings = []
        bx = 0
        while bx < self.width + 100:
            bw = random.randint(45, 95)
            bh = random.randint(240, 460)
            has_antenna = random.random() < 0.65
            antenna_h = random.randint(20, 50) if has_antenna else 0
            self.far_buildings.append({
                "rect": pygame.Rect(bx, self.height - bh, bw, bh),
                "has_antenna": has_antenna,
                "antenna_h": antenna_h,
                "beacon_phase": random.random() * math.pi * 2
            })
            bx += bw - random.randint(5, 15)

        # Generar capa de rascacielos medios (con matrices de ventanas iluminadas)
        random.seed(1337)
        self.mid_buildings = []
        bx = -20
        while bx < self.width + 100:
            bw = random.randint(60, 130)
            bh = random.randint(180, 360)
            # Generar ventanas para este edificio
            windows = []
            cols = max(2, bw // 14)
            rows = max(4, bh // 18)
            for r in range(rows):
                for c in range(cols):
                    if random.random() < 0.42: # 42% de ventanas encendidas
                        wx = c * 12 + 6
                        wy = r * 16 + 10
                        color_idx = random.randint(0, 3)
                        twinkle_speed = random.uniform(0.8, 2.5)
                        windows.append((wx, wy, color_idx, twinkle_speed))

            has_led_strip = random.random() < 0.4
            self.mid_buildings.append({
                "rect": pygame.Rect(bx, self.height - bh, bw, bh),
                "windows": windows,
                "has_led_strip": has_led_strip
            })
            bx += bw - random.randint(8, 20)

        # Generar lluvia digital neón (40 gotas que caen continuamente)
        random.seed(999)
        self.rain_drops = []
        for _ in range(40):
            rx = random.randint(0, self.width)
            ry = random.randint(0, self.height)
            rlen = random.randint(12, 28)
            rspeed = random.uniform(5.0, 11.0)
            self.rain_drops.append([rx, ry, rlen, rspeed])

        # Superficie de oscurecimiento táctico precacheada para máximo rendimiento
        self.tactical_overlay = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        self.tactical_overlay.fill((10, 12, 18, 210)) # ~82% oscurecimiento táctico

        # Superficie de cielo gradiente
        self.sky_surface = pygame.Surface((self.width, self.height))
        self._cached_sector = None

    def set_sector(self, sector_id):
        self.current_sector = max(1, min(5, sector_id))

    def _update_sky_gradient(self, palette):
        if self._cached_sector == self.current_sector:
            return
        self._cached_sector = self.current_sector
        top_c = palette["sky_top"]
        bot_c = palette["sky_bot"]
        for y in range(self.height):
            ratio = y / self.height
            r = int(top_c[0] + (bot_c[0] - top_c[0]) * ratio)
            g = int(top_c[1] + (bot_c[1] - top_c[1]) * ratio)
            b = int(top_c[2] + (bot_c[2] - top_c[2]) * ratio)
            pygame.draw.line(self.sky_surface, (r, g, b), (0, y), (self.width, y))

    def update(self):
        self.time_counter += 0.035
        # Mover lluvia digital hacia abajo
        for drop in self.rain_drops:
            drop[1] += drop[3]
            drop[0] -= 0.5 # Ligero viento diagonal cyberpunk
            if drop[1] > self.height:
                drop[1] = random.randint(-40, -5)
                drop[0] = random.randint(0, self.width + 50)

    def draw(self, surface, theme=None):
        palette = self.SECTOR_PALETTES.get(self.current_sector, self.SECTOR_PALETTES[1])
        self._update_sky_gradient(palette)

        # 1. Cielo gradiente base
        surface.blit(self.sky_surface, (0, 0))

        # 2. Capa de rascacielos lejanos (Siluetas + Balizas)
        far_c = palette["far_building"]
        beacon_base_c = palette["beacon_color"]
        for b in self.far_buildings:
            pygame.draw.rect(surface, far_c, b["rect"])
            if b["has_antenna"]:
                ax = b["rect"].centerx
                ay_top = b["rect"].top - b["antenna_h"]
                pygame.draw.line(surface, far_c, (ax, b["rect"].top), (ax, ay_top), 2)
                # Baliza luminosa parpadeante
                pulse = (math.sin(self.time_counter * 3.0 + b["beacon_phase"]) + 1) * 0.5
                if pulse > 0.4:
                    pygame.draw.circle(surface, beacon_base_c, (ax, ay_top), 2)

        # 3. Capa de rascacielos medios con ventanas neón titilantes
        mid_c = palette["mid_building"]
        win_colors = palette["window_colors"]
        for mb in self.mid_buildings:
            pygame.draw.rect(surface, mid_c, mb["rect"])
            # Tira LED vertical si aplica
            if mb["has_led_strip"]:
                strip_x = mb["rect"].x + 4
                pygame.draw.line(surface, palette["grid_color"], (strip_x, mb["rect"].top + 10), (strip_x, mb["rect"].bottom - 10), 2)

            # Ventanas
            for wx, wy, col_idx, speed in mb["windows"]:
                global_x = mb["rect"].x + wx
                global_y = mb["rect"].y + wy
                if global_x + 5 < mb["rect"].right and global_y + 6 < mb["rect"].bottom:
                    twinkle = math.sin(self.time_counter * speed)
                    if twinkle > -0.2: # Ventana encendida
                        c = win_colors[col_idx]
                        pygame.draw.rect(surface, c, (global_x, global_y, 4, 6))

        # 4. Rejilla de perspectiva cibernética en la parte inferior (Cyber Grid)
        grid_y_horizon = int(self.height * 0.72)
        grid_c = palette["grid_color"]
        # Líneas horizontales que viajan hacia adelante
        for i in range(1, 9):
            depth_ratio = (i / 8.0) ** 1.8
            gy = grid_y_horizon + int((self.height - grid_y_horizon) * depth_ratio)
            # Efecto de movimiento continuo
            gy_offset = int((self.time_counter * 18) % 30)
            final_gy = min(self.height - 1, gy + (gy_offset * i // 8))
            pygame.draw.line(surface, (grid_c[0] // 3, grid_c[1] // 3, grid_c[2] // 3), (0, final_gy), (self.width, final_gy), 1)

        # Líneas en perspectiva convergentes
        vanish_x = self.width // 2
        for offset_x in range(-600, 650, 100):
            bottom_x = vanish_x + offset_x * 2.2
            pygame.draw.line(surface, (grid_c[0] // 4, grid_c[1] // 4, grid_c[2] // 4), (vanish_x, grid_y_horizon), (bottom_x, self.height), 1)

        # 5. Lluvia digital de neón
        rain_c = palette["rain_color"]
        for rx, ry, rlen, _ in self.rain_drops:
            pygame.draw.line(surface, rain_c, (int(rx), int(ry)), (int(rx - 1), int(ry + rlen)), 1)

        # 6. Oscurecimiento Táctico (82% de opacidad)
        # Permite ver los rascacielos, luces y rejilla pero deja el área de juego con contraste supremo
        surface.blit(self.tactical_overlay, (0, 0))

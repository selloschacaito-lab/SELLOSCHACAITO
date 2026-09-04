import sys
import os
import random
import time
import math
import pygame

# Asegurar importaciones relativas
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.particle_system import ParticleSystem
from core.sound_engine import SoundEngine
from core.save_manager import SaveManager
from core.city_background import CyberCityBackground
from ui.gravy_hologram import GravyHologram, THEME_COLORS
from ui.visual_keyboard import VisualKeyboard2D, FINGER_NAMES
from ui.hud_telemetry import HUDTelemetry
from ui.black_market_ui import BlackMarketUI
from ui.trophy_room_ui import TrophyRoomUI
from game.combat_manager import CombatManager
from game.boss_engine import MultiPhaseBoss
from content.campaign_50_levels import CAMPAIGN_SECTORS
from content.shop_catalog import BLACK_MARKET_CATALOG

# 5 Dificultades Tácticas Cyberpunk con modificadores de combate y recompensas
DIFFICULTY_MODS = {
    1: {"name": "RECLUTA", "badge": "🥉 RECLUTA", "speed": 0.75, "dmg": 3, "pts_mult": 1.0, "wpm_add": -6, "acc_min": 90.0, "color": (0, 255, 140)},
    2: {"name": "OPERADOR", "badge": "🥈 OPERADOR", "speed": 1.00, "dmg": 5, "pts_mult": 1.5, "wpm_add": 0, "acc_min": 94.0, "color": (0, 240, 255)},
    3: {"name": "VETERANO", "badge": "🥇 VETERANO", "speed": 1.35, "dmg": 8, "pts_mult": 2.5, "wpm_add": 8, "acc_min": 95.0, "color": (255, 215, 0)},
    4: {"name": "CYBER-ÉLITE", "badge": "💠 CYBER-ÉLITE", "speed": 1.75, "dmg": 12, "pts_mult": 4.0, "wpm_add": 18, "acc_min": 96.0, "color": (255, 0, 180)},
    5: {"name": "PROTOCOLO GRAVY", "badge": "👑 PROTOCOLO GRAVY", "speed": 2.20, "dmg": 20, "pts_mult": 7.0, "wpm_add": 28, "acc_min": 97.0, "color": (255, 50, 70)}
}

class GravyRevolutionGame:
    """Motor principal de GRAVY PROTOCOL REVOLUTION 2.0 en Pygame-CE."""

    def __init__(self):
        pygame.init()
        self.width = 1280
        self.height = 720
        self.is_fullscreen = False

        self.screen = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)
        pygame.display.set_caption("GRAVY PROTOCOL REVOLUTION 2.0 // CYBERPUNK TYPING RPG")
        self.clock = pygame.time.Clock()

        # Componentes base
        self.particles = ParticleSystem()
        self.sound = SoundEngine()
        self.save_mgr = SaveManager()
        self.city_bg = CyberCityBackground(self.width, self.height)
        self.hologram = GravyHologram(x=1140, y=140)
        self.keyboard_ui = VisualKeyboard2D(x=190, y=475)
        self.hud = HUDTelemetry()
        self.market_ui = BlackMarketUI()
        self.trophy_ui = TrophyRoomUI()
        self.combat = CombatManager(self.sound, self.particles)

        # Estado del juego: MENU, SECTOR_SELECT, SUBSECTOR_SELECT, COMBAT, BOSS, VICTORY_SCREEN, MARKET, TROPHIES, ZEN
        self.state = "MENU"
        self.current_sector = 1
        self.current_subsector_idx = 0
        self.current_boss = None
        self.victory_data = {}
        self.subsector_boxes = [] # [(rect, idx, is_unlocked, is_boss)]
        self.sector_boxes = []    # [(rect, sec_id, is_unlocked)]
        self.difficulty_tabs = [] # [(rect, diff_level)]

        # Sistema de 5 Dificultades Tácticas & Habilidades Activas
        self.current_difficulty = 2 # 1: Recluta, 2: Operador, 3: Veterano, 4: Cyber-Élite, 5: Protocolo Gravy
        self.mission_difficulty = 2
        self.quantum_energy = 0.0
        self.overclock_timer = 0
        self.shield_invuln_timer = 0

        # Métricas de sesión en vivo
        self.session_keystrokes = 0
        self.session_hits = 0
        self.session_errors = 0
        self.session_combo = 0
        self.session_max_combo = 0
        self.session_start_time = 0
        self.player_shields = 100
        self.player_max_shields = 100
        self.blindfold_active = False

        # Fuentes tipográficas
        self.font_title = pygame.font.SysFont("consolas", 28, bold=True)
        self.font_menu = pygame.font.SysFont("consolas", 16, bold=True)
        self.font_mid = pygame.font.SysFont("consolas", 14, bold=True)
        self.font_small = pygame.font.SysFont("consolas", 12, bold=False)

        # Cola de aparición de palabras en combate
        self.word_spawn_queue = []
        self.spawn_cooldown = 0

    def get_current_theme(self):
        prof = self.save_mgr.get_profile()
        theme_id = prof.get("active_theme", "cyberpunk_neon")
        return THEME_COLORS.get(theme_id, THEME_COLORS["cyberpunk_neon"])

    def toggle_fullscreen(self):
        self.is_fullscreen = not self.is_fullscreen
        if self.is_fullscreen:
            self.screen = pygame.display.set_mode((self.width, self.height), pygame.FULLSCREEN)
        else:
            self.screen = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)

    def start_mission(self, sector_id, subsector_idx):
        self.current_sector = sector_id
        self.current_subsector_idx = subsector_idx
        self.mission_difficulty = self.current_difficulty
        self.quantum_energy = 0.0
        self.overclock_timer = 0
        self.shield_invuln_timer = 0

        sec_data = CAMPAIGN_SECTORS[sector_id]
        subsec_data = sec_data["subsectors"][subsector_idx]
        diff = DIFFICULTY_MODS.get(self.mission_difficulty, DIFFICULTY_MODS[2])

        # Configurar Cyber-Deck y escudos
        prof = self.save_mgr.get_profile()
        deck_id = prof.get("active_cyberdeck", "deck_mk1")
        extra_shield = 0
        for d in BLACK_MARKET_CATALOG["cyberdecks"]:
            if d["id"] == deck_id:
                extra_shield = d.get("shield_bonus", 0)
                break

        self.player_max_shields = 100 + extra_shield
        self.player_shields = self.player_max_shields

        self.word_spawn_queue = list(subsec_data["words"])
        random.shuffle(self.word_spawn_queue)
        self.combat.drones.clear()
        self.combat.active_target = None
        self.spawn_cooldown = 20

        self.session_keystrokes = 0
        self.session_hits = 0
        self.session_errors = 0
        self.session_combo = 0
        self.session_max_combo = 0
        self.session_start_time = time.time()
        self.state = "COMBAT"

        self.hologram.say(f"¡Sector {sector_id}.{subsector_idx+1}: {subsec_data['name']}! [{diff['name']}]")

    def start_boss_battle(self, sector_id):
        self.current_sector = sector_id
        self.mission_difficulty = self.current_difficulty
        self.quantum_energy = 0.0
        self.overclock_timer = 0
        self.shield_invuln_timer = 0
        sec_data = CAMPAIGN_SECTORS[sector_id]

        prof = self.save_mgr.get_profile()
        self.player_max_shields = 120
        self.player_shields = self.player_max_shields

        self.current_boss = MultiPhaseBoss(
            name=sec_data["boss_name"],
            title=sec_data["boss_title"],
            max_hp=sec_data["boss_hp"],
            phases_data=[]
        )

        all_words = []
        for sub in sec_data["subsectors"]:
            all_words.extend(sub["words"])
        self.word_spawn_queue = all_words
        random.shuffle(self.word_spawn_queue)
        self.combat.drones.clear()

        self.session_keystrokes = 0
        self.session_hits = 0
        self.session_errors = 0
        self.session_combo = 0
        self.session_max_combo = 0
        self.session_start_time = time.time()
        self.state = "BOSS"
        self.sound.play_boss_alert()
        self.hologram.say(f"¡ALERTA MÁXIMA! ¡{sec_data['boss_name']} ha desplegado sus defensas!")

    def run(self):
        running = True
        while running:
            theme = self.get_current_theme()
            dt = self.clock.tick(60)

            # Manejo de eventos globales
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    pos = event.pos
                    if self.state == "SECTOR_SELECT":
                        self._handle_sector_mouse(pos)
                    elif self.state == "SUBSECTOR_SELECT":
                        self._handle_subsector_mouse(pos)
                    elif self.state == "VICTORY_SCREEN":
                        self._handle_victory_key(pygame.event.Event(pygame.KEYDOWN, {"key": pygame.K_RETURN}))
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_F11:
                        self.toggle_fullscreen()
                    elif self.state == "MENU":
                        self._handle_menu_key(event)
                    elif self.state == "SECTOR_SELECT":
                        self._handle_sector_key(event)
                    elif self.state == "SUBSECTOR_SELECT":
                        self._handle_subsector_key(event)
                    elif self.state in ("COMBAT", "BOSS"):
                        self._handle_combat_key(event)
                    elif self.state == "VICTORY_SCREEN":
                        self._handle_victory_key(event)
                    elif self.state == "MARKET":
                        self._handle_market_key(event)
                    elif self.state in ("TROPHIES", "ZEN"):
                        if event.key in (pygame.K_ESCAPE, pygame.K_RETURN):
                            self.state = "MENU"

            # Actualizaciones lógicas
            self.city_bg.set_sector(self.current_sector)
            self.city_bg.update()
            self.particles.update()
            self.hologram.update()
            self.keyboard_ui.update()

            if self.state in ("COMBAT", "BOSS"):
                self.hologram.set_combat_mode(True)
                self._update_combat_logic()
            else:
                self.hologram.set_combat_mode(False)

            # Renderizado en pantalla (Fondo Cyberpunk Procedural con oscurecimiento táctico)
            self.city_bg.draw(self.screen, theme)

            if self.state == "MENU":
                self._draw_main_menu(theme)
            elif self.state == "SECTOR_SELECT":
                self._draw_sector_select(theme)
            elif self.state == "SUBSECTOR_SELECT":
                self._draw_subsector_select(theme)
            elif self.state in ("COMBAT", "BOSS"):
                self._draw_combat(theme)
            elif self.state == "VICTORY_SCREEN":
                self._draw_victory_screen(theme)
            elif self.state == "MARKET":
                prof = self.save_mgr.get_profile()
                bosses_count = sum(1 for s in prof.get("campaign_progress", {}).values() if s.get("boss_beaten"))
                self.market_ui.draw(self.screen, theme, prof, bosses_count)
            elif self.state == "TROPHIES":
                self.trophy_ui.draw(self.screen, theme, self.save_mgr.get_profile())
            elif self.state == "ZEN":
                self._draw_zen_mode(theme)

            # Capa superior de partículas neón
            self.particles.draw(self.screen)

            pygame.display.flip()

        pygame.quit()

    def _handle_market_key(self, event):
        cat_key = self.market_ui.categories[self.market_ui.current_cat_idx][0]
        items = BLACK_MARKET_CATALOG.get(cat_key, [])

        if event.key == pygame.K_ESCAPE:
            self.state = "MENU"
        elif event.key == pygame.K_TAB:
            self.market_ui.current_cat_idx = (self.market_ui.current_cat_idx + 1) % len(self.market_ui.categories)
            self.market_ui.selected_item_idx = 0
            self.sound.play_switch_click()
        elif event.key in (pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5, pygame.K_6,
                           pygame.K_KP1, pygame.K_KP2, pygame.K_KP3, pygame.K_KP4, pygame.K_KP5, pygame.K_KP6):
            kp_cat = {
                pygame.K_1: 0, pygame.K_KP1: 0,
                pygame.K_2: 1, pygame.K_KP2: 1,
                pygame.K_3: 2, pygame.K_KP3: 2,
                pygame.K_4: 3, pygame.K_KP4: 3,
                pygame.K_5: 4, pygame.K_KP5: 4,
                pygame.K_6: 5, pygame.K_KP6: 5,
            }
            cat_idx = kp_cat.get(event.key, 0)
            if 0 <= cat_idx < len(self.market_ui.categories):
                self.market_ui.current_cat_idx = cat_idx
                self.market_ui.selected_item_idx = 0
                self.sound.play_switch_click()
        elif event.key == pygame.K_UP:
            self.market_ui.selected_item_idx = max(0, self.market_ui.selected_item_idx - 1)
            self.sound.play_switch_click()
        elif event.key == pygame.K_DOWN:
            self.market_ui.selected_item_idx = min(len(items) - 1, self.market_ui.selected_item_idx + 1)
            self.sound.play_switch_click()
        elif event.key in (pygame.K_RETURN, pygame.K_SPACE):
            if items:
                chosen = items[self.market_ui.selected_item_idx]
                self._buy_or_equip_item(cat_key, chosen)

    def _buy_or_equip_item(self, cat_key, item):
        prof = self.save_mgr.get_profile()
        req_sec = item.get("req_sector", 0)
        req_diff = item.get("req_difficulty", 0)
        max_d_beaten = max(prof.get("subsector_difficulty", {}).values(), default=0)
        diff_names = {3: "VETERANO", 4: "CYBER-ÉLITE", 5: "PROTOCOLO GRAVY"}

        if max_d_beaten < req_diff:
            self.sound.play_error()
            self.hologram.say(f"¡Requiere superar niveles en {diff_names.get(req_diff, 'Dificultad Alta')}!")
            return

        bosses_beaten = sum(1 for s in prof.get("campaign_progress", {}).values() if s.get("boss_beaten"))
        if bosses_beaten < req_sec:
            self.sound.play_error()
            self.hologram.say(f"¡Requiere derrotar al Jefe del Sector {req_sec} primero!")
            return

        # Lógica de compra / equipamiento por categoría
        if cat_key == "cyberdecks":
            owned = prof.setdefault("owned_decks", ["deck_mk1"])
            if item["id"] in owned:
                prof["active_cyberdeck"] = item["id"]
                self.sound.play_switch_click()
                self.hologram.say(f"¡Cyber-Deck {item['name']} equipado!")
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                prof["active_cyberdeck"] = item["id"]
                self.sound.play_combo(20)
                self.hologram.say(f"¡{item['name']} comprado y equipado!")
            else:
                self.sound.play_error()
                self.hologram.say("¡Créditos insuficientes!")
        elif cat_key == "lasers":
            owned = prof.setdefault("owned_lasers", ["cyan"])
            if item["id"] in owned:
                prof["active_laser_skin"] = item["id"]
                self.sound.play_switch_click()
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                prof["active_laser_skin"] = item["id"]
                self.sound.play_combo(20)
            else:
                self.sound.play_error()
        elif cat_key == "switches":
            owned = prof.setdefault("owned_switches", ["blue"])
            if item["id"] in owned:
                prof["active_switch"] = item["id"]
                self.sound.switch_type = item["id"]
                self.sound.play_switch_click()
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                prof["active_switch"] = item["id"]
                self.sound.switch_type = item["id"]
                self.sound.play_combo(20)
            else:
                self.sound.play_error()
        elif cat_key == "chips":
            owned = prof.setdefault("installed_chips", [])
            if item["id"] in owned:
                self.sound.play_switch_click()
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                self.sound.play_combo(20)
            else:
                self.sound.play_error()
        elif cat_key == "gravy_skins":
            owned = prof.setdefault("owned_gravy_skins", ["classic"])
            if item["id"] in owned:
                prof["active_gravy_skin"] = item["id"]
                self.sound.play_switch_click()
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                prof["active_gravy_skin"] = item["id"]
                self.sound.play_combo(20)
            else:
                self.sound.play_error()
        elif cat_key == "themes":
            owned = prof.setdefault("owned_themes", ["cyberpunk_neon"])
            if item["id"] in owned:
                prof["active_theme"] = item["id"]
                self.sound.play_switch_click()
            elif prof["points"] >= item["price"]:
                prof["points"] -= item["price"]
                owned.append(item["id"])
                prof["active_theme"] = item["id"]
                self.sound.play_combo(20)
            else:
                self.sound.play_error()

        self.save_mgr.save()

    def _handle_menu_key(self, event):
        if event.key in (pygame.K_1, pygame.K_KP1):
            self.state = "SECTOR_SELECT"
        elif event.key in (pygame.K_2, pygame.K_KP2):
            # Supervivencia infinita
            self.start_mission(random.randint(1, 3), 0)
        elif event.key in (pygame.K_3, pygame.K_KP3):
            # Modo Zen Story
            self.state = "ZEN"
        elif event.key in (pygame.K_4, pygame.K_KP4):
            self.state = "MARKET"
        elif event.key in (pygame.K_5, pygame.K_KP5):
            self.state = "TROPHIES"
        elif event.key in (pygame.K_ESCAPE, pygame.K_0, pygame.K_KP0):
            pygame.quit()
            sys.exit(0)

    def _handle_sector_key(self, event):
        kp_map = {
            pygame.K_1: 1, pygame.K_KP1: 1,
            pygame.K_2: 2, pygame.K_KP2: 2,
            pygame.K_3: 3, pygame.K_KP3: 3,
            pygame.K_4: 4, pygame.K_KP4: 4,
            pygame.K_5: 5, pygame.K_KP5: 5
        }
        if event.key in kp_map:
            sec_num = kp_map[event.key]
            self._select_sector(sec_num)
        elif event.key == pygame.K_ESCAPE:
            self.state = "MENU"

    def _handle_sector_mouse(self, pos):
        for box_rect, sec_num, is_unlocked in self.sector_boxes:
            if box_rect.collidepoint(pos):
                self._select_sector(sec_num)
                break

    def _select_sector(self, sec_num):
        prof = self.save_mgr.get_profile()
        sec_prog = prof.get("campaign_progress", {}).get(f"sector_{sec_num}", {})
        prev_prog = prof.get("campaign_progress", {}).get(f"sector_{sec_num - 1}", {})
        prev_beaten = prev_prog.get("boss_beaten") or len(prev_prog.get("stars", {})) >= 10
        is_unlocked = (sec_num == 1) or sec_prog.get("unlocked", False) or prev_beaten

        if is_unlocked:
            self.current_sector = sec_num
            self.state = "SUBSECTOR_SELECT"
            self.sound.play_switch_click()
            self.hologram.say(f"Accediendo al Sector {sec_num}. Selecciona un subsector de entrenamiento.")
        else:
            self.hologram.say(f"¡Sector {sec_num} bloqueado! Supera el Sector {sec_num - 1} o a su Jefe.")
            self.sound.play_error()

    def _handle_subsector_key(self, event):
        kp_sub_map = {
            pygame.K_1: 0, pygame.K_KP1: 0,
            pygame.K_2: 1, pygame.K_KP2: 1,
            pygame.K_3: 2, pygame.K_KP3: 2,
            pygame.K_4: 3, pygame.K_KP4: 3,
            pygame.K_5: 4, pygame.K_KP5: 4,
            pygame.K_6: 5, pygame.K_KP6: 5,
            pygame.K_7: 6, pygame.K_KP7: 6,
            pygame.K_8: 7, pygame.K_KP8: 7,
            pygame.K_9: 8, pygame.K_KP9: 8,
            pygame.K_0: 9, pygame.K_KP0: 9
        }
        if event.key in (pygame.K_F1, pygame.K_F2, pygame.K_F3, pygame.K_F4, pygame.K_F5):
            f_map = {pygame.K_F1: 1, pygame.K_F2: 2, pygame.K_F3: 3, pygame.K_F4: 4, pygame.K_F5: 5}
            self.current_difficulty = f_map[event.key]
            self.sound.play_switch_click()
            diff = DIFFICULTY_MODS[self.current_difficulty]
            self.hologram.say(f"Dificultad: {diff['badge']} (Recompensas x{diff['pts_mult']})")
        elif event.key == pygame.K_TAB:
            self.current_difficulty = (self.current_difficulty % 5) + 1
            self.sound.play_switch_click()
            diff = DIFFICULTY_MODS[self.current_difficulty]
            self.hologram.say(f"Dificultad: {diff['badge']} (Recompensas x{diff['pts_mult']})")
        elif event.key in kp_sub_map:
            idx = kp_sub_map[event.key]
            self._try_start_subsector(idx)
        elif event.key == pygame.K_b:
            self.start_boss_battle(self.current_sector)
        elif event.key == pygame.K_ESCAPE:
            self.state = "SECTOR_SELECT"

    def _handle_subsector_mouse(self, pos):
        # Selector de pestañas de dificultad
        for d_rect, d_lvl in self.difficulty_tabs:
            if d_rect.collidepoint(pos):
                self.current_difficulty = d_lvl
                self.sound.play_switch_click()
                diff = DIFFICULTY_MODS[self.current_difficulty]
                self.hologram.say(f"Dificultad: {diff['badge']} (Recompensas x{diff['pts_mult']})")
                return

        for box_rect, idx, is_unlocked, is_boss in self.subsector_boxes:
            if box_rect.collidepoint(pos):
                if is_boss:
                    self.start_boss_battle(self.current_sector)
                else:
                    self._try_start_subsector(idx)
                break

    def _try_start_subsector(self, idx):
        sec_key = f"sector_{self.current_sector}"
        prof = self.save_mgr.get_profile()
        sec_prog = prof.get("campaign_progress", {}).get(sec_key, {})
        stars_dict = sec_prog.get("stars", {})

        # El subsector 0 siempre está disponible. Los demás exigen haber obtenido al menos 4 estrellas en el anterior
        prev_stars = stars_dict.get(f"{self.current_sector}.{idx}", 0)
        is_unlocked = (idx == 0) or (prev_stars >= 4)
        if is_unlocked:
            self.start_mission(self.current_sector, idx)
        else:
            self.sound.play_error()
            self.hologram.say(f"¡Subsector bloqueado! Necesitas al menos 4★ en el subsector {self.current_sector}.{idx} (tienes {prev_stars}★).")

    def _handle_victory_key(self, event):
        vd = self.victory_data
        passed = vd.get("passed", True)

        if event.key in (pygame.K_RETURN, pygame.K_SPACE, pygame.K_KP_ENTER):
            if not passed:
                # Si no alcanzó 4 estrellas, ENTER reintenta la misión para superarla
                self.start_mission(self.current_sector, self.current_subsector_idx)
                return

            if vd.get("is_boss"):
                if self.current_sector < 5:
                    self.current_sector += 1
                    self.state = "SUBSECTOR_SELECT"
                else:
                    self.state = "SECTOR_SELECT"
            else:
                # Siguiente subsector si existe
                if self.current_subsector_idx < 9:
                    self.start_mission(self.current_sector, self.current_subsector_idx + 1)
                else:
                    # Todos los 10 completados con 4★+, retar al boss
                    self.start_boss_battle(self.current_sector)
        elif event.key == pygame.K_r:
            # Reintentar nivel
            if vd.get("is_boss"):
                self.start_boss_battle(self.current_sector)
            else:
                self.start_mission(self.current_sector, self.current_subsector_idx)
        elif event.key == pygame.K_ESCAPE:
            self.state = "SUBSECTOR_SELECT"

    def _handle_combat_key(self, event):
        if event.key == pygame.K_ESCAPE:
            self.state = "SUBSECTOR_SELECT"
            return
        elif event.key == pygame.K_TAB:
            self.blindfold_active = not self.blindfold_active
            return

        prof = self.save_mgr.get_profile()
        unlocked_skills = prof.get("unlocked_skills", [])

        # HABILIDAD 1: [ESPACIO] EMP Nova (Destruye todos los drones en pantalla)
        if event.key == pygame.K_SPACE and "emp_nova" in unlocked_skills and self.quantum_energy >= 50.0:
            self.quantum_energy -= 50.0
            num_drones = len(self.combat.drones)
            for d in list(self.combat.drones):
                self.particles.burst(d.x, d.y, (255, 220, 0), count=40, speed=10)
            self.combat.drones.clear()
            self.combat.active_target = None
            self.session_hits += max(1, num_drones)
            self.session_combo += max(1, num_drones)
            self.sound.play_combo(40)
            self.hologram.say("⚡ ¡PULSO EMP NOVA DISPARADO! ¡Drones erradicados!")
            return

        # HABILIDAD 2: [L-SHIFT / R-SHIFT] Time Overclock (Ralentiza tiempo al 25%)
        if event.key in (pygame.K_LSHIFT, pygame.K_RSHIFT) and "time_overclock" in unlocked_skills and self.quantum_energy >= 75.0:
            self.quantum_energy -= 75.0
            self.overclock_timer = 240 # 4 segundos a 60 FPS
            self.particles.burst(self.width // 2, self.height // 2, (0, 240, 255), count=60, speed=9)
            self.sound.play_switch_click()
            self.hologram.say("⏱️ ¡OVERCLOCK CUÁNTICO! Tiempo ralentizado por 4s.")
            return

        # HABILIDAD 3: [ALT] Nano-Escudo (+40 HP escudos + 3s invulnerabilidad)
        if event.key in (pygame.K_LALT, pygame.K_RALT) and "nano_shield" in unlocked_skills and self.quantum_energy >= 100.0:
            self.quantum_energy = 0.0
            self.player_shields = min(self.player_max_shields, self.player_shields + 40)
            self.shield_invuln_timer = 180 # 3 segundos invulnerabilidad
            self.particles.burst(self.width // 2, 600, (0, 255, 140), count=50, speed=8)
            self.sound.play_combo(50)
            self.hologram.say("🛡️ ¡NANO-ESCUDO! +40 HP y 3s de invulnerabilidad.")
            return

        # Mapa completo del teclado numérico derecho (Numpad)
        NUMPAD_MAP = {
            pygame.K_KP0: "0", pygame.K_KP1: "1", pygame.K_KP2: "2",
            pygame.K_KP3: "3", pygame.K_KP4: "4", pygame.K_KP5: "5",
            pygame.K_KP6: "6", pygame.K_KP7: "7", pygame.K_KP8: "8",
            pygame.K_KP9: "9", pygame.K_KP_PERIOD: ".", pygame.K_KP_DIVIDE: "/",
            pygame.K_KP_MULTIPLY: "*", pygame.K_KP_MINUS: "-", pygame.K_KP_PLUS: "+",
        }

        char = event.unicode
        if not char and event.key in NUMPAD_MAP:
            char = NUMPAD_MAP[event.key]
        elif event.key in NUMPAD_MAP:
            char = NUMPAD_MAP[event.key]

        if not char or not char.isprintable():
            return

        # Desvanecer/ocultar diálogo de Gravy inmediatamente al empezar a teclear
        self.hologram.dismiss()

        self.session_keystrokes += 1
        self.keyboard_ui.register_press(char)
        self.sound.play_switch_click()

        res = self.combat.process_key(char)
        if res and res["status"] in ("hit", "killed"):
            self.session_hits += 1
            self.session_combo += 1
            if self.session_combo > self.session_max_combo:
                self.session_max_combo = self.session_combo

            # Cargar energía cuántica con cada golpe
            self.quantum_energy = min(100.0, self.quantum_energy + (4.0 if not self.blindfold_active else 6.0))

            self.save_mgr.record_key(char, is_error=False)

            if self.session_combo % 15 == 0:
                self.sound.play_combo(self.session_combo)
                self.hologram.set_expression("happy")
                self.hologram.say(f"¡Racha x{self.session_combo}! ¡Sincronía al 100%!")

            if res["status"] == "killed":
                self.save_mgr.get_profile()["stats"]["drones_destroyed"] += 1
                if self.state == "BOSS" and self.current_boss:
                    boss_status = self.current_boss.take_damage(20)
                    if boss_status == "dead":
                        self._handle_boss_victory()
        else:
            self.session_errors += 1
            self.session_combo = 0
            diff = DIFFICULTY_MODS.get(self.mission_difficulty, DIFFICULTY_MODS[2])
            if self.shield_invuln_timer <= 0:
                self.player_shields = max(0, self.player_shields - diff["dmg"])
            self.save_mgr.record_key(char, is_error=True)
            self.hologram.set_expression("alarmed")

    def _update_combat_logic(self):
        if self.overclock_timer > 0:
            self.overclock_timer -= 1
        if self.shield_invuln_timer > 0:
            self.shield_invuln_timer -= 1

        diff = DIFFICULTY_MODS.get(self.mission_difficulty, DIFFICULTY_MODS[2])

        # Generar nuevos drones si la cola tiene palabras
        self.spawn_cooldown -= 1
        if self.spawn_cooldown <= 0 and self.word_spawn_queue and len(self.combat.drones) < 5:
            next_word = self.word_spawn_queue.pop(0)
            spawn_x = random.randint(260, 950)
            spd = (0.8 + (self.current_sector * 0.15)) * diff["speed"]
            if self.overclock_timer > 0:
                spd *= 0.25 # Ralentización Matrix
            self.combat.spawn_drone(next_word, spawn_x, y=80, speed=spd)
            self.spawn_cooldown = random.randint(30, 70)

        # Actualizar drones y detectar impactos a la base
        breaches = self.combat.update(breach_limit_y=460)
        if breaches > 0:
            dmg = breaches * (diff["dmg"] * 2)
            if self.shield_invuln_timer <= 0:
                self.player_shields = max(0, self.player_shields - dmg)
            self.session_combo = 0
            self.hologram.say("¡Drones atravesaron el cortafuegos!")

        if self.state == "BOSS" and self.current_boss:
            self.current_boss.update()

        # Condición de derrota
        if self.player_shields <= 0:
            self.state = "SUBSECTOR_SELECT"
            self.sound.play_error()
            self.hologram.say("¡Escudos agotados! Reconectando búfer de seguridad.")

        # Condición de victoria de subsector
        if not self.word_spawn_queue and not self.combat.drones and self.state == "COMBAT":
            self._handle_subsector_victory()

    def _handle_subsector_victory(self):
        elapsed = max(0.1, time.time() - self.session_start_time)
        wpm = (self.session_hits / 5.0) / (elapsed / 60.0)
        acc = (self.session_hits / max(1, self.session_keystrokes)) * 100.0

        diff = DIFFICULTY_MODS.get(self.mission_difficulty, DIFFICULTY_MODS[2])

        # Puntos ganados con multiplicador de dificultad
        base_pts = int(self.session_hits * 15 + wpm * 25 + self.session_max_combo * 10)
        pts_earned = int(base_pts * diff["pts_mult"])
        if self.blindfold_active:
            pts_earned = int(pts_earned * 1.5)

        self.save_mgr.add_points(pts_earned)
        sec_key = f"sector_{self.current_sector}"
        prof = self.save_mgr.get_profile()
        sec_prog = prof["campaign_progress"].setdefault(sec_key, {"unlocked": True, "stars": {}, "boss_beaten": False})

        # Estándares Progresivos de 5 Estrellas por Sector
        benchmarks = {
            1: {"5": (98.0, 30.0), "4": (94.0, 22.0), "3": (88.0, 16.0), "2": (80.0, 12.0)},
            2: {"5": (98.0, 38.0), "4": (95.0, 28.0), "3": (89.0, 20.0), "2": (82.0, 14.0)},
            3: {"5": (98.0, 42.0), "4": (95.0, 32.0), "3": (90.0, 22.0), "2": (82.0, 15.0)},
            4: {"5": (98.5, 50.0), "4": (96.0, 38.0), "3": (91.0, 26.0), "2": (84.0, 18.0)},
            5: {"5": (99.0, 65.0), "4": (97.0, 50.0), "3": (93.0, 35.0), "2": (86.0, 22.0)}
        }
        b = benchmarks.get(self.current_sector, benchmarks[1])

        # Calibración de estrellas según la dificultad seleccionada
        wpm_mod = diff["wpm_add"]
        acc_req = max(diff["acc_min"], b["4"][0])
        wpm_req = max(16.0, b["4"][1] + wpm_mod)

        stars = 1
        if acc >= (b["2"][0] - 5) and wpm >= max(8.0, b["2"][1] + wpm_mod * 0.4): stars = 2
        if acc >= (b["3"][0] - 2) and wpm >= max(12.0, b["3"][1] + wpm_mod * 0.7): stars = 3
        if acc >= acc_req and wpm >= wpm_req: stars = 4
        if acc >= 98.0 and wpm >= max(20.0, b["5"][1] + wpm_mod): stars = 5

        sub_id = f"{self.current_sector}.{self.current_subsector_idx+1}"
        prev_best = sec_prog["stars"].get(sub_id, 0)
        sec_prog["stars"][sub_id] = max(prev_best, stars)

        passed = (stars >= 4)
        new_skill_unlocked = None

        if passed:
            # Guardar dificultad máxima superada en este subsector
            sub_diffs = prof.setdefault("subsector_difficulty", {})
            sub_diffs[sub_id] = max(sub_diffs.get(sub_id, 0), self.mission_difficulty)

            # Desbloquear habilidades tácticas al triunfar en dificultades elevadas
            unlocked_skills = prof.setdefault("unlocked_skills", [])
            if self.mission_difficulty >= 3 and "emp_nova" not in unlocked_skills:
                unlocked_skills.append("emp_nova")
                new_skill_unlocked = "⚡ [ESPACIO] EMP NOVA (Destruye drones)"
            if self.mission_difficulty >= 4 and "time_overclock" not in unlocked_skills:
                unlocked_skills.append("time_overclock")
                new_skill_unlocked = "⏱️ [L-SHIFT] TIME OVERCLOCK (Ralentiza el tiempo)"
            if self.mission_difficulty >= 5 and "nano_shield" not in unlocked_skills:
                unlocked_skills.append("nano_shield")
                new_skill_unlocked = "🛡️ [ALT] NANO-ESCUDO (+40 HP e invulnerabilidad)"

        # Desbloquear el siguiente sector si los 10 subsectores se aprueban con al menos 4 estrellas
        qualifying = sum(1 for i in range(1, 11) if sec_prog["stars"].get(f"{self.current_sector}.{i}", 0) >= 4)
        if qualifying >= 10:
            nxt_sec = f"sector_{self.current_sector + 1}"
            if nxt_sec in prof["campaign_progress"]:
                prof["campaign_progress"][nxt_sec]["unlocked"] = True

        self.save_mgr.check_achievements(wpm, acc, self.session_max_combo, blind_mode=self.blindfold_active)
        self.save_mgr.save()

        sec_data = CAMPAIGN_SECTORS[self.current_sector]
        sub_name = sec_data["subsectors"][self.current_subsector_idx]["name"]

        miss_reasons = []
        if acc < acc_req:
            miss_reasons.append(f"Precisión {acc:.1f}% (Mínimo en {diff['name']}: {acc_req:.0f}%)")
        if wpm < wpm_req:
            miss_reasons.append(f"Velocidad {wpm:.1f} WPM (Mínimo en {diff['name']}: {wpm_req:.0f} WPM)")

        if passed:
            self.sound.play_combo(40)
            self.victory_data = {
                "title": f"¡SUBSECTOR {sub_id} APROBADO CON ÉXITO!",
                "subtitle": f"{sub_name} │ DIFICULTAD: {diff['name']} (x{diff['pts_mult']})",
                "wpm": wpm,
                "acc": acc,
                "combo": self.session_max_combo,
                "stars": stars,
                "pts_earned": pts_earned,
                "diff_badge": diff["badge"],
                "pts_mult": diff["pts_mult"],
                "new_skill": new_skill_unlocked,
                "passed": True,
                "missing": "",
                "is_boss": False
            }
            if new_skill_unlocked:
                self.hologram.say(f"¡INCREÍBLE! Has desbloqueado una nueva habilidad activa: {new_skill_unlocked}!")
            else:
                self.hologram.say(f"¡Excelente maestría! {stars}/5 estrellas en {diff['name']}. Siguiente misión desbloqueada.")
        else:
            self.sound.play_error()
            self.victory_data = {
                "title": "⚠️ CALIFICACIÓN INSUFICIENTE ⚠️",
                "subtitle": f"OBTUVISTE {stars}/5 ESTRELLAS EN {diff['name']} (REQUIERE 4★ PARA AVANZAR)",
                "wpm": wpm,
                "acc": acc,
                "combo": self.session_max_combo,
                "stars": stars,
                "pts_earned": pts_earned,
                "diff_badge": diff["badge"],
                "pts_mult": diff["pts_mult"],
                "new_skill": None,
                "passed": False,
                "missing": " y ".join(miss_reasons),
                "is_boss": False
            }
            self.hologram.say(f"Calificación insuficiente ({stars}/5 ★) en {diff['name']}. ¡Reintenta para superar la exigencia!")

        self.state = "VICTORY_SCREEN"

    def _handle_boss_victory(self):
        prof = self.save_mgr.get_profile()
        sec_key = f"sector_{self.current_sector}"
        sec_prog = prof["campaign_progress"].setdefault(sec_key, {"unlocked": True, "stars": {}, "boss_beaten": False})
        sec_prog["boss_beaten"] = True

        diff = DIFFICULTY_MODS.get(self.mission_difficulty, DIFFICULTY_MODS[2])

        # Registrar dificultad de jefe vencido
        sub_diffs = prof.setdefault("subsector_difficulty", {})
        sub_diffs[f"{self.current_sector}.B"] = max(sub_diffs.get(f"{self.current_sector}.B", 0), self.mission_difficulty)

        # Desbloquear siguiente sector
        nxt_sec = f"sector_{self.current_sector + 1}"
        if nxt_sec in prof["campaign_progress"]:
            prof["campaign_progress"][nxt_sec]["unlocked"] = True

        bonus_pts = int(15000 * self.current_sector * diff["pts_mult"])
        self.save_mgr.add_points(bonus_pts)
        prof["stats"]["bosses_defeated"] += 1
        self.save_mgr.save()

        self.sound.play_combo(50)
        sec_data = CAMPAIGN_SECTORS[self.current_sector]
        elapsed = max(0.1, time.time() - self.session_start_time)
        wpm = (self.session_hits / 5.0) / (elapsed / 60.0)
        acc = (self.session_hits / max(1, self.session_keystrokes)) * 100.0

        self.victory_data = {
            "title": f"¡JEFE DE SECTOR PURGADO!",
            "subtitle": f"{sec_data['boss_name']} // {sec_data['boss_title']}",
            "wpm": wpm,
            "acc": acc,
            "combo": self.session_max_combo,
            "stars": 3,
            "pts_earned": bonus_pts,
            "is_boss": True
        }
        self.state = "VICTORY_SCREEN"
        self.hologram.say(f"¡{sec_data['boss_name']} DESTRUIDO! ¡Siguiente sector desbloqueado!")

    def _draw_vector_star(self, surface, cx, cy, radius=18, is_filled=True, fill_color=(255, 215, 0)):
        points = []
        for i in range(10):
            angle = -math.pi / 2 + i * (math.pi / 5)
            r = radius if i % 2 == 0 else radius * 0.42
            x = cx + math.cos(angle) * r
            y = cy + math.sin(angle) * r
            points.append((x, y))

        if is_filled:
            pygame.draw.polygon(surface, fill_color, points)
            pygame.draw.polygon(surface, (255, 255, 255), points, 1)
        else:
            pygame.draw.polygon(surface, (25, 30, 42), points)
            pygame.draw.polygon(surface, (80, 90, 110), points, 1)

    def _draw_main_menu(self, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        # Título principal
        title_surf = self.font_title.render("⚡ GRAVY PROTOCOL REVOLUTION 2.0 ⚡", True, c_pri)
        sub_surf = self.font_menu.render("CYBERPUNK ACTION TYPING RPG // MOTOR GRÁFICO 2D", True, c_sec)

        self.screen.blit(title_surf, (self.width // 2 - title_surf.get_width() // 2, 70))
        self.screen.blit(sub_surf, (self.width // 2 - sub_surf.get_width() // 2, 115))

        # Avatar de Gravy
        prof = self.save_mgr.get_profile()
        self.hologram.draw(self.screen, theme, stage=prof.get("gravy_stage", 1))

        # Menú interactivo
        options = [
            ("[1] MODO CAMPAÑA: 5 SECTORES (50 SUBSECTORES + JEFES MULTI-FASE)", c_pri),
            ("[2] INVASIÓN CIBERNÉTICA INFINITA (SUPERVIVENCIA DE HORDA)", c_sec),
            ("[3] MODO ZEN // HISTORIA CYBERPUNK INMERSIVA (SIN PRESIÓN)", c_acc),
            ("[4] MERCADO NEGRO DE ALTA GAMA (CYBER-DECKS, SKINS, SOUNDPACKS)", (0, 240, 200)),
            ("[5] PASAPORTE DE OPERADOR & VITRINA DE TROFEOS HOLOGRÁFICOS", (255, 215, 0)),
            ("[0 / ESC] SALIR DEL CIBERESPACIO", (255, 60, 60))
        ]

        oy = 200
        for opt_text, opt_color in options:
            box = pygame.Rect(self.width // 2 - 380, oy, 760, 48)
            pygame.draw.rect(self.screen, (16, 20, 30), box, border_radius=6)
            pygame.draw.rect(self.screen, (50, 60, 80), box, 1, border_radius=6)
            t_render = self.font_menu.render(opt_text, True, opt_color)
            self.screen.blit(t_render, (box.x + 24, box.centery - t_render.get_height() // 2))
            oy += 60

        foot = self.font_small.render("PULSA LA TECLA NUMÉRICA [1-5] │ [F11]: Pantalla Completa", True, (150, 160, 180))
        self.screen.blit(foot, (self.width // 2 - foot.get_width() // 2, 640))

    def _draw_sector_select(self, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        title = self.font_title.render("MAPA DE LA MEGACIUDAD // SELECCIÓN DE SECTOR", True, c_pri)
        self.screen.blit(title, (60, 40))

        prof = self.save_mgr.get_profile()
        self.sector_boxes = []
        sy = 105

        for sec_id in range(1, 6):
            s_data = CAMPAIGN_SECTORS[sec_id]
            prog = prof.get("campaign_progress", {}).get(f"sector_{sec_id}", {})
            prev_prog = prof.get("campaign_progress", {}).get(f"sector_{sec_id - 1}", {})
            prev_qualifying = sum(1 for i in range(1, 11) if prev_prog.get("stars", {}).get(f"{sec_id - 1}.{i}", 0) >= 4)
            prev_beaten = prev_prog.get("boss_beaten") or prev_qualifying >= 10
            unlocked = (sec_id == 1) or prog.get("unlocked", False) or prev_beaten
            boss_beaten = prog.get("boss_beaten", False)

            stars_dict = prog.get("stars", {})
            qualifying = sum(1 for i in range(1, 11) if stars_dict.get(f"{sec_id}.{i}", 0) >= 4)
            total_stars = sum(stars_dict.values())

            box = pygame.Rect(60, sy, 1160, 92)
            self.sector_boxes.append((box, sec_id, unlocked))

            pygame.draw.rect(self.screen, (18, 22, 34) if unlocked else (12, 14, 18), box, border_radius=6)
            pygame.draw.rect(self.screen, c_pri if unlocked else (40, 45, 60), box, 2 if unlocked else 1, border_radius=6)

            tag_unlocked = "✔ [DESBLOQUEADO - Pulsa o Haz Click para ver sus 10 Misiones]" if unlocked else "🔒 [BLOQUEADO - Supera el Sector Anterior con 4★]"
            t_sec = self.font_menu.render(f"[{sec_id}] {s_data['title']}  {tag_unlocked}", True, (255, 255, 255) if unlocked else (100, 110, 120))
            self.screen.blit(t_sec, (box.x + 20, box.y + 12))

            t_lore = self.font_small.render(s_data["lore"], True, (170, 180, 200) if unlocked else (80, 90, 100))
            self.screen.blit(t_lore, (box.x + 20, box.y + 38))

            prog_str = f"PROGRESO: {qualifying}/10 SUBSECTORES APROBADOS (4★+)  │  {total_stars}/50 ESTRELLAS  │  JEFE: {'[DERROTADO]' if boss_beaten else 'DISPONIBLE'}"
            t_prog = self.font_small.render(prog_str, True, (0, 255, 160) if qualifying == 10 or boss_beaten else c_acc)
            self.screen.blit(t_prog, (box.x + 20, box.y + 62))

            sy += 104

        self.screen.blit(self.font_menu.render("[1-5]: Explorar Sector │ [Click con Ratón]: Entrar al Sector │ [ESC]: Volver al Menú Principal", True, c_acc), (60, 665))

    def _draw_subsector_select(self, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        s_data = CAMPAIGN_SECTORS[self.current_sector]
        prof = self.save_mgr.get_profile()
        sec_prog = prof.get("campaign_progress", {}).get(f"sector_{self.current_sector}", {})
        stars_dict = sec_prog.get("stars", {})
        boss_beaten = sec_prog.get("boss_beaten", False)
        total_stars = sum(stars_dict.values())
        qualifying = sum(1 for i in range(1, 11) if stars_dict.get(f"{self.current_sector}.{i}", 0) >= 4)

        # Encabezado
        title = self.font_title.render(f"📍 {s_data['title']} // 10 SUBSECTORES (4★ MÍNIMO PARA AVANZAR)", True, c_pri)
        self.screen.blit(title, (60, 24))

        sub_info = self.font_small.render(f"{s_data['lore']}  │  APROBADOS: {qualifying}/10 (4★+)  │  ESTRELLAS TOTALES: {total_stars}/50", True, (180, 190, 210))
        self.screen.blit(sub_info, (60, 60))

        # PESTAÑAS DEL SELECTOR DE 5 DIFICULTADES (Click con ratón o teclas [F1 - F5] / [TAB])
        self.difficulty_tabs = []
        tab_x = 60
        tab_w = 224
        tab_h = 32

        for d_id in range(1, 6):
            d_info = DIFFICULTY_MODS[d_id]
            is_active = (d_id == self.current_difficulty)
            d_box = pygame.Rect(tab_x, 90, tab_w, tab_h)
            self.difficulty_tabs.append((d_box, d_id))

            tab_bg = (32, 42, 60) if is_active else (14, 18, 26)
            tab_border = d_info["color"] if is_active else (50, 60, 75)
            pygame.draw.rect(self.screen, tab_bg, d_box, border_radius=6)
            pygame.draw.rect(self.screen, tab_border, d_box, 2 if is_active else 1, border_radius=6)

            indicator = "► " if is_active else ""
            tab_text = f"{indicator}[F{d_id}] {d_info['badge']} (x{d_info['pts_mult']})"
            t_col = d_info["color"] if is_active else (160, 170, 190)
            t_rnd = self.font_small.render(tab_text, True, t_col)
            self.screen.blit(t_rnd, (d_box.centerx - t_rnd.get_width() // 2, d_box.centery - t_rnd.get_height() // 2))

            tab_x += tab_w + 10

        self.subsector_boxes = []
        sub_diffs = prof.get("subsector_difficulty", {})

        # 10 Subsectores organizados en 2 columnas (5 a la izquierda, 5 a la derecha)
        # Columna 1 (1.1 a 1.5)
        for row in range(5):
            idx = row
            subsec = s_data["subsectors"][idx]
            sub_id = f"{self.current_sector}.{idx+1}"
            hotkey = str(idx + 1)
            prev_stars = stars_dict.get(f"{self.current_sector}.{idx}", 0)
            is_unlocked = (idx == 0) or (prev_stars >= 4)
            stars = stars_dict.get(sub_id, 0)
            is_passed = (stars >= 4)

            box = pygame.Rect(60, 132 + row * 66, 560, 58)
            self.subsector_boxes.append((box, idx, is_unlocked, False))

            bg_c = (20, 25, 38) if is_unlocked else (12, 14, 18)
            border_c = (0, 255, 180) if is_passed else ((255, 200, 40) if stars > 0 else (c_pri if is_unlocked else (45, 50, 65)))
            pygame.draw.rect(self.screen, bg_c, box, border_radius=6)
            pygame.draw.rect(self.screen, border_c, box, 2 if is_unlocked else 1, border_radius=6)

            name_col = (255, 255, 255) if is_unlocked else (90, 100, 115)
            t_name = self.font_menu.render(f"[{hotkey}] {subsec['name']}", True, name_col)
            self.screen.blit(t_name, (box.x + 16, box.y + 8))

            if is_unlocked:
                for s_i in range(5):
                    ms_x = box.x + 22 + s_i * 15
                    ms_y = box.y + 40
                    self._draw_vector_star(self.screen, ms_x, ms_y, radius=5, is_filled=(s_i < stars))

                # Medalla de dificultad máxima superada
                max_d = sub_diffs.get(sub_id, 0)
                diff_badge = f" │ {DIFFICULTY_MODS[max_d]['badge']}" if max_d in DIFFICULTY_MODS else ""

                if is_passed:
                    tag_t = self.font_small.render(f"               ✔ APROBADO (4★+){diff_badge}", True, (0, 255, 160))
                elif stars > 0:
                    tag_t = self.font_small.render(f"               ⚠️ REINTENTO ({stars}/5 ★ - REQUIERE 4★)", True, (255, 200, 40))
                else:
                    cur_d_name = DIFFICULTY_MODS[self.current_difficulty]["name"]
                    tag_t = self.font_small.render(f"               ⚡ LISTO │ Modo: {cur_d_name}", True, c_acc)
            else:
                tag_t = self.font_small.render(f"🔒 BLOQUEADO (Requiere 4★ en {self.current_sector}.{idx})", True, (130, 70, 70))
            self.screen.blit(tag_t, (box.x + 16, box.y + 32))

        # Columna 2 (1.6 a 1.10)
        for row in range(5):
            idx = row + 5
            subsec = s_data["subsectors"][idx]
            sub_id = f"{self.current_sector}.{idx+1}"
            hotkey = str((idx + 1) % 10)
            prev_stars = stars_dict.get(f"{self.current_sector}.{idx}", 0)
            is_unlocked = (idx == 0) or (prev_stars >= 4)
            stars = stars_dict.get(sub_id, 0)
            is_passed = (stars >= 4)

            box = pygame.Rect(660, 132 + row * 66, 560, 58)
            self.subsector_boxes.append((box, idx, is_unlocked, False))

            bg_c = (20, 25, 38) if is_unlocked else (12, 14, 18)
            border_c = (0, 255, 180) if is_passed else ((255, 200, 40) if stars > 0 else (c_pri if is_unlocked else (45, 50, 65)))
            pygame.draw.rect(self.screen, bg_c, box, border_radius=6)
            pygame.draw.rect(self.screen, border_c, box, 2 if is_unlocked else 1, border_radius=6)

            name_col = (255, 255, 255) if is_unlocked else (90, 100, 115)
            t_name = self.font_menu.render(f"[{hotkey}] {subsec['name']}", True, name_col)
            self.screen.blit(t_name, (box.x + 16, box.y + 8))

            if is_unlocked:
                for s_i in range(5):
                    ms_x = box.x + 22 + s_i * 15
                    ms_y = box.y + 40
                    self._draw_vector_star(self.screen, ms_x, ms_y, radius=5, is_filled=(s_i < stars))

                # Medalla de dificultad máxima superada
                max_d = sub_diffs.get(sub_id, 0)
                diff_badge = f" │ {DIFFICULTY_MODS[max_d]['badge']}" if max_d in DIFFICULTY_MODS else ""

                if is_passed:
                    tag_t = self.font_small.render(f"               ✔ APROBADO (4★+){diff_badge}", True, (0, 255, 160))
                elif stars > 0:
                    tag_t = self.font_small.render(f"               ⚠️ REINTENTO ({stars}/5 ★ - REQUIERE 4★)", True, (255, 200, 40))
                else:
                    cur_d_name = DIFFICULTY_MODS[self.current_difficulty]["name"]
                    tag_t = self.font_small.render(f"               ⚡ LISTO │ Modo: {cur_d_name}", True, c_acc)
            else:
                tag_t = self.font_small.render(f"🔒 BLOQUEADO (Requiere 4★ en {self.current_sector}.{idx})", True, (130, 70, 70))
            self.screen.blit(tag_t, (box.x + 16, box.y + 32))

        # Tarjeta del Jefe de Sector al fondo
        boss_box = pygame.Rect(60, 470, 1160, 76)
        self.subsector_boxes.append((boss_box, None, True, True))

        pygame.draw.rect(self.screen, (28, 14, 22), boss_box, border_radius=8)
        pygame.draw.rect(self.screen, (255, 50, 70), boss_box, 2, border_radius=8)

        boss_title_t = self.font_menu.render(f"⚠️ [B] DESAFÍO CONTRA EL JEFE DEL SECTOR: {s_data['boss_name']} ({s_data['boss_title']})", True, (255, 220, 0))
        self.screen.blit(boss_title_t, (boss_box.x + 20, boss_box.y + 14))

        boss_d = sub_diffs.get(f"{self.current_sector}.B", 0)
        boss_badge = f" │ RÉCORD: {DIFFICULTY_MODS[boss_d]['badge']}" if boss_d in DIFFICULTY_MODS else ""
        b_sub = f"HP DEL JEFE: {s_data['boss_hp']}  │  ESTADO: {'[DERROTADO' + boss_badge + ']' if boss_beaten else '¡VENCE AL JEFE PARA DESBLOQUEAR EL SIGUIENTE SECTOR!'}  │  Pulsa [B] o Haz Click"
        boss_sub_t = self.font_small.render(b_sub, True, (0, 255, 160) if boss_beaten else (255, 180, 190))
        self.screen.blit(boss_sub_t, (boss_box.x + 20, boss_box.y + 42))

        # Pie de controles
        foot_t = self.font_menu.render("[1-9 / 0]: Iniciar Subsector │ [TAB / F1-F5]: Cambiar Dificultad │ [B]: Enfrentar Jefe │ [ESC]: Volver", True, c_acc)
        self.screen.blit(foot_t, (60, 665))

    def _draw_victory_screen(self, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        vd = self.victory_data
        passed = vd.get("passed", True)

        # Panel central translúcido de victoria
        panel = pygame.Rect(self.width // 2 - 340, 70, 680, 550)
        border_col = c_pri if passed else (255, 60, 60)
        pygame.draw.rect(self.screen, (16, 20, 30), panel, border_radius=10)
        pygame.draw.rect(self.screen, border_col, panel, 2, border_radius=10)

        title_col = c_acc if passed else (255, 60, 60)
        t_main = self.font_title.render(vd.get("title", "¡MISIÓN PURGADA!"), True, title_col)
        self.screen.blit(t_main, (panel.centerx - t_main.get_width() // 2, panel.y + 24))

        t_sub = self.font_menu.render(vd.get("subtitle", ""), True, (220, 230, 245))
        self.screen.blit(t_sub, (panel.centerx - t_sub.get_width() // 2, panel.y + 60))

        # Estrellas doradas vectoriales nativas (escala de 5 estrellas)
        stars = vd.get("stars", 1)
        star_start_x = panel.centerx - 90
        star_y = panel.y + 105
        for s_idx in range(5):
            sx = star_start_x + s_idx * 45
            is_earned = (s_idx < stars)
            self._draw_vector_star(self.screen, sx, star_y, radius=18, is_filled=is_earned)

        # Texto recordatorio de mínimo
        req_hint = self.font_small.render("(Estándar de Aprobación: Mínimo 4 de 5 Estrellas)", True, (160, 170, 190))
        self.screen.blit(req_hint, (panel.centerx - req_hint.get_width() // 2, panel.y + 132))

        # Banner de Habilidad Nueva Desbloqueada si aplica
        stat_y = panel.y + 155
        if vd.get("new_skill"):
            sk_box = pygame.Rect(panel.x + 35, stat_y, panel.width - 70, 34)
            pygame.draw.rect(self.screen, (40, 20, 60), sk_box, border_radius=6)
            pygame.draw.rect(self.screen, (255, 215, 0), sk_box, 2, border_radius=6)
            t_sk = self.font_mid.render(f"🔥 ¡NUEVA HABILIDAD DESBLOQUEADA: {vd['new_skill']}! 🔥", True, (255, 220, 0))
            self.screen.blit(t_sk, (sk_box.centerx - t_sk.get_width() // 2, sk_box.centery - t_sk.get_height() // 2))
            stat_y += 42

        # Cuadrícula de estadísticas
        stats = [
            ("DIFICULTAD & MULTIPLICADOR:", f"{vd.get('diff_badge', 'OPERADOR')}  (x{vd.get('pts_mult', 1.0)} PTS)", (255, 220, 0)),
            ("VELOCIDAD ALCANZADA:", f"{vd.get('wpm', 0.0):4.1f} WPM", c_pri),
            ("PRECISIÓN DE ESCRITURA:", f"{vd.get('acc', 0.0):5.1f} %", (0, 255, 160)),
            ("RACHA MÁXIMA DE COMBO:", f"{vd.get('combo', 0)}x ACIERTOS", c_sec),
            ("CRÉDITOS OBTENIDOS:", f"+{vd.get('pts_earned', 0):,} PTS", c_acc)
        ]

        for lbl, val, col in stats:
            s_box = pygame.Rect(panel.x + 35, stat_y, panel.width - 70, 34)
            pygame.draw.rect(self.screen, (22, 26, 38), s_box, border_radius=4)
            pygame.draw.rect(self.screen, (50, 60, 80), s_box, 1, border_radius=4)

            t_l = self.font_small.render(lbl, True, (170, 180, 200))
            t_v = self.font_mid.render(val, True, col)
            self.screen.blit(t_l, (s_box.x + 16, s_box.centery - t_l.get_height() // 2))
            self.screen.blit(t_v, (s_box.right - t_v.get_width() - 16, s_box.centery - t_v.get_height() // 2))
            stat_y += 38

        # Caja de motivo si no aprobó
        if not passed and vd.get("missing"):
            m_box = pygame.Rect(panel.x + 35, stat_y, panel.width - 70, 32)
            pygame.draw.rect(self.screen, (35, 15, 20), m_box, border_radius=4)
            pygame.draw.rect(self.screen, (255, 60, 70), m_box, 1, border_radius=4)
            t_miss = self.font_small.render(f"⚠️ DEBES MEJORAR: {vd.get('missing')}", True, (255, 140, 140))
            self.screen.blit(t_miss, (m_box.centerx - t_miss.get_width() // 2, m_box.centery - t_miss.get_height() // 2))

        # Botón de acción principal
        btn_next = pygame.Rect(panel.x + 35, panel.bottom - 74, panel.width - 70, 40)
        btn_col = c_acc if passed else (255, 60, 70)
        pygame.draw.rect(self.screen, btn_col, btn_next, border_radius=6)

        if passed:
            btn_txt = self.font_menu.render("[ENTER / CLICK] CONTINUAR AL SIGUIENTE NIVEL", True, (10, 15, 20))
        else:
            btn_txt = self.font_menu.render("[ENTER / CLICK] REINTENTAR NIVEL (REQUIERE 4★)", True, (255, 255, 255))
        self.screen.blit(btn_txt, (btn_next.centerx - btn_txt.get_width() // 2, btn_next.centery - btn_txt.get_height() // 2))

        foot = self.font_small.render("[R]: Reintentar Nivel  │  [ESC]: Volver al Mapa de Misiones", True, (150, 160, 180))
        self.screen.blit(foot, (panel.centerx - foot.get_width() // 2, panel.bottom - 22))

    def _draw_combat(self, theme):
        # Barra superior y telemetría
        prof = self.save_mgr.get_profile()
        sec_title = CAMPAIGN_SECTORS[self.current_sector]["title"]
        self.hud.draw_top_bar(self.screen, theme, prof, mission_title=sec_title)

        elapsed = max(0.1, time.time() - self.session_start_time)
        wpm = (self.session_hits / 5.0) / (elapsed / 60.0)
        acc = (self.session_hits / max(1, self.session_keystrokes)) * 100.0
        cpm = int((self.session_hits / elapsed) * 60)
        pct = 100.0 if not self.word_spawn_queue else max(0, 100 - (len(self.word_spawn_queue) * 10))

        unlocked_sk = prof.get("unlocked_skills", [])
        is_overclock = (self.overclock_timer > 0)
        self.hud.draw_combat_hud(self.screen, theme, wpm, acc, self.session_combo, cpm,
                                 self.player_shields, self.player_max_shields, pct,
                                 energy_pct=self.quantum_energy, unlocked_skills=unlocked_sk,
                                 active_overclock=is_overclock)

        # Aura visual en pantalla completa para efectos de habilidades activas
        if self.shield_invuln_timer > 0:
            pygame.draw.rect(self.screen, (0, 255, 140), (0, 0, self.width, self.height), 4)
        if is_overclock:
            pygame.draw.rect(self.screen, (0, 240, 255), (0, 0, self.width, self.height), 3)

        # Jefe en pantalla si es estado BOSS
        if self.state == "BOSS" and self.current_boss:
            self.current_boss.draw(self.screen, theme)

        # Drones de combate y rayos láser
        self.combat.draw(self.screen, theme)

        # Teclado virtual y radar de dedos
        target_char = self.combat.get_current_target_char()
        self.keyboard_ui.draw(self.screen, theme, target_char=target_char, show_hands=True, blindfold=self.blindfold_active)

        # Gravy interactivo
        self.hologram.draw(self.screen, theme, stage=prof.get("gravy_stage", 1))

    def _draw_zen_mode(self, theme):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        title = self.font_title.render("☕ MODO ZEN // RELAJACIÓN Y NOVELA CYBERPUNK", True, c_pri)
        self.screen.blit(title, (60, 40))

        story_text = [
            "La lluvia de neón caía suavemente sobre los rascacielos de la megaciudad.",
            "En el silencio de tu terminal, la respiración se acompasa con el sonido de las teclas.",
            "No hay cronómetro. No hay escudos que cuidar ni drones atacando.",
            "Solo tus diez dedos fluyendo rítmicamente sobre la fila guía, descubriendo la calma digital.",
            "",
            "Respira hondo. Coloca los índices en F y J. Siente la memoria muscular de tus manos.",
            "Cada pulsación es precisa, tranquila y natural. Escribes en armonía con el ciberespacio."
        ]

        ty = 130
        for line in story_text:
            s_rend = self.font_menu.render(line, True, (230, 240, 255))
            self.screen.blit(s_rend, (80, ty))
            ty += 34

        self.keyboard_ui.draw(self.screen, theme, target_char="f", show_hands=True, blindfold=False)
        self.screen.blit(self.font_menu.render("[ESC / ENTER]: Volver al Menú Principal", True, c_acc), (60, 660))

if __name__ == "__main__":
    game = GravyRevolutionGame()
    game.run()

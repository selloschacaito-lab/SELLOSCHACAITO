import time
import os
import sys

try:
    import msvcrt
    HAS_MSVCRT = True
except ImportError:
    HAS_MSVCRT = False

from colorama import Fore, Style, Back, init
from core.typing_session import TypingSession
from ui.ascii_art import BANNER_BOSS, BANNER_VICTORY, BANNER_GAMEOVER

class BossBattle:
    """Gestiona el combate interactivo de mecanografía con barra de vida doble."""

    def __init__(self, renderer, storage, audio):
        self.renderer = renderer
        self.storage = storage
        self.audio = audio

    def get_key_nonblocking(self):
        """Lectura no bloqueante para combate en tiempo real con soporte Unicode completo (ñ)."""
        if HAS_MSVCRT:
            if msvcrt.kbhit():
                try:
                    ch = msvcrt.getwch()
                    if ch in ('\x00', '\xe0'):
                        msvcrt.getwch()
                        return None
                    return ch
                except Exception:
                    return None
            return None
        return None

    def run_boss(self, chapter_key, boss_data):
        profile = self.storage.get_profile()
        strict_mode = profile.get("strict_mode", True)
        target_text = boss_data["text"]

        upgrades = profile.get("owned_upgrades", [])
        
        boss_hp = boss_data["health"]
        boss_max_hp = boss_data["health"]
        
        base_shield = boss_data["player_shield"]
        if "shield_boost" in upgrades:
            base_shield = int(base_shield * 1.25)

        player_shield = base_shield
        player_max_shield = base_shield
        
        boss_dps = boss_data.get("boss_dps", 5)
        if "quantum_cooler" in upgrades:
            boss_dps = max(1, int(boss_dps * 0.8))

        player_dmg = boss_data.get("player_damage", 10)

        session = TypingSession(target_text, strict_mode=strict_mode)

        self.audio.switch_type = profile.get("switch_sound", "blue")
        self.audio.enabled = profile.get("audio_enabled", True)

        last_boss_tick = time.time()
        start_combat_time = time.time()

        # Intro dramática del Boss
        self.renderer.clear()
        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        print(f"{sec}{BANNER_BOSS}{rst}")
        print(f" {acc}¡ALERTA MÁXIMA DE SEGURIDAD!{rst}")
        print(f" {pri}Enemigo: {boss_data['name']} ({boss_data['title']}){rst}")
        print(f" {sec}Descripción: {boss_data['lore']}{rst}\n")
        print(f" {pri}¡Escribe rápido y sin errores para contraatacar antes de que tus escudos caigan!{rst}")
        print(f"\n {acc}Presiona cualquier tecla para iniciar el combate...{rst}")
        
        if HAS_MSVCRT:
            try:
                msvcrt.getwch()
            except Exception:
                pass

        while boss_hp > 0 and player_shield > 0:
            now = time.time()

            # El Jefe ataca periódicamente si el jugador tarda demasiado
            if now - last_boss_tick >= 1.0:
                elapsed_since_start = now - start_combat_time
                if elapsed_since_start > 3.0: # 3s de gracia al inicio
                    player_shield = max(0, player_shield - boss_dps)
                    self.audio.play_boss_attack()
                last_boss_tick = now

            # Renderizar estado del combate
            self.renderer.clear()
            self.renderer.draw_header(f"COMBATE: {boss_data['name']}", profile)
            self.renderer.render_boss_hud(boss_data['name'], boss_hp, boss_max_hp, player_shield, player_max_shield)
            self.renderer.render_hud(session, gravy_stage=profile["gravy_stage"])
            self.renderer.render_typing_area(session, show_keyboard=True)

            next_ch = session.get_next_char()
            self.renderer.render_ascii_keyboard(next_ch)

            print(f"\n {pri}[ESC / Ctrl+C]: Abortar Combate{rst}")

            # Manejo de entrada
            key = self.get_key_nonblocking()
            if key is not None:
                if key == '\x1b' or key == '\x03':
                    return False

                res = session.process_key(key)
                if res["status"] in ("correct", "completed"):
                    self.audio.play_key_click()
                    self.storage.update_key_stats(key, is_error=False)
                    
                    # Dañar al jefe en cada pulsación correcta
                    boss_hp = max(0, boss_hp - int(player_dmg / 3))
                    
                    if res.get("combo", 0) > 0 and res["combo"] % 10 == 0:
                        self.audio.play_boss_damage()
                        boss_hp = max(0, boss_hp - player_dmg) # Daño crítico de combo
                elif res["status"] == "error":
                    self.audio.play_error_buzz()
                    player_shield = max(0, player_shield - 8) # Penalización por error
                    expected = res.get("expected", "")
                    if expected:
                        self.storage.update_key_stats(expected, is_error=True)

            if session.is_completed and boss_hp > 0:
                # Si terminó el texto pero aún queda vida, reiniciar el texto para rematar
                session = TypingSession(target_text, strict_mode=strict_mode)

            time.sleep(0.03)

        # Fin del combate
        self.renderer.clear()
        if boss_hp <= 0:
            # ¡Victoria!
            self.audio.play_boss_victory()
            print(f"{pri}{BANNER_VICTORY}{rst}")
            print(f" {acc}¡EL JEFE {boss_data['name']} HA SIDO PURGADO Y NEUTRALIZADO!{rst}\n")
            
            bonus_score = 1500
            self.storage.add_points(bonus_score, xp_amount=1500)
            
            # Registrar derrota del Boss y desbloquear siguiente capítulo
            chap_prog = profile["campaign_progress"].setdefault(chapter_key, {"unlocked": True, "stars": {}, "boss_beaten": True})
            chap_prog["boss_beaten"] = True
            
            # Desbloquear siguiente capítulo
            ch_num = int(chapter_key.split("_")[1])
            next_ch_key = f"chapter_{ch_num + 1}"
            if next_ch_key in profile["campaign_progress"]:
                profile["campaign_progress"][next_ch_key]["unlocked"] = True

            profile["stats"]["bosses_defeated"] += 1
            if ch_num == 5:
                profile["achievements"]["boss_slayer"] = True

            self.storage.save()
            print(f" {pri}Recompensa por purga: +{bonus_score} Puntos y EXP.{rst}")
            print(f" {sec}¡El siguiente capítulo del sistema ha sido desbloqueado!{rst}\n")
            print(f" {acc}Presiona cualquier tecla para continuar...{rst}")
            if HAS_MSVCRT:
                msvcrt.getch()
            return True
        else:
            # Derrota
            self.audio.play_error_buzz()
            print(f"{Fore.RED + Style.BRIGHT}{BANNER_GAMEOVER}{rst}")
            print(f" {Fore.RED + Style.BRIGHT}TUS ESCUDOS HAN COLAPSADO ANTE {boss_data['name']}.{rst}\n")
            print(f" {pri}Consejo de Gravy: Recuerda mantener la postura en la fila guía para no errar pulsaciones.{rst}\n")
            print(f" {acc}Presiona cualquier tecla para reintentar...{rst}")
            if HAS_MSVCRT:
                msvcrt.getch()
            return False

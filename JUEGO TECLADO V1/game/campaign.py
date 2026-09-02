import time
import os
import sys

try:
    import msvcrt
    HAS_MSVCRT = True
except ImportError:
    HAS_MSVCRT = False

from core.typing_session import TypingSession
from content.gravy_ai import get_random_quote

class CampaignManager:
    """Gestiona el flujo de lecciones, estrellas y progresión de la campaña."""

    def __init__(self, renderer, storage, audio):
        self.renderer = renderer
        self.storage = storage
        self.audio = audio

    def get_key(self):
        """Lee una sola tecla sin esperar Enter en Windows con soporte Unicode completo (ñ, acentos, etc.)."""
        if HAS_MSVCRT:
            try:
                ch = msvcrt.getwch()
                # Teclas especiales (flechas, funciones) retornan prefijos \x00 o \xe0
                if ch in ('\x00', '\xe0'):
                    msvcrt.getwch()
                    return None
                return ch
            except Exception:
                return None
        else:
            return sys.stdin.read(1)

    def run_lesson(self, chapter_key, lesson_data, show_keyboard=True):
        """Ejecuta una lección de escritura interactiva."""
        profile = self.storage.get_profile()
        strict_mode = profile.get("strict_mode", True)
        target_text = lesson_data["text"]
        session = TypingSession(target_text, strict_mode=strict_mode)

        self.audio.switch_type = profile.get("switch_sound", "blue")
        self.audio.enabled = profile.get("audio_enabled", True)

        quote = get_random_quote("start")
        last_error = False

        while not session.is_completed:
            self.renderer.clear()
            self.renderer.draw_header(lesson_data["title"], profile)
            
            # Consejo de Gravy
            pri = self.renderer.c("primary")
            acc = self.renderer.c("accent")
            sec = self.renderer.c("secondary")
            rst = "\033[0m"
            print(f" {sec}GRAVY AI: \"{quote}\"{rst}\n")

            # HUD y área de escritura
            self.renderer.render_hud(session, gravy_stage=profile["gravy_stage"])
            self.renderer.render_typing_area(session, show_keyboard=show_keyboard)

            if show_keyboard:
                next_ch = session.get_next_char()
                self.renderer.render_ascii_keyboard(next_ch)

            print(f"\n {pri}[ESC / Ctrl+C]: Salir │ [TAB]: Alternar Teclado Visual{rst}")

            # Captura de tecla
            key = self.get_key()
            if key is None:
                continue

            # ESC o Ctrl+C para salir
            if key == '\x1b' or key == '\x03':
                return None

            # TAB para alternar teclado
            if key == '\t':
                show_keyboard = not show_keyboard
                continue

            res = session.process_key(key)
            if res["status"] in ("correct", "completed"):
                self.audio.play_key_click()
                self.storage.update_key_stats(key, is_error=False)
                if res.get("combo", 0) > 0 and res["combo"] % 15 == 0:
                    self.audio.play_combo_chime(res["combo"])
                    quote = get_random_quote("combo")
            elif res["status"] == "error":
                self.audio.play_error_buzz()
                expected = res.get("expected", "")
                if expected:
                    self.storage.update_key_stats(expected, is_error=True)
                quote = get_random_quote("error")

        # Fin de lección
        self.audio.play_level_complete()
        wpm = session.get_wpm()
        acc = session.get_accuracy()
        combo = session.max_combo
        # Calcular puntuación base y bonificaciones de módulos
        score = session.calculate_score()
        upgrades = profile.get("owned_upgrades", [])
        if "combo_overclock" in upgrades and combo >= 25:
            score = int(score * 1.5)
        if "neuro_predict" in upgrades:
            score = int(score * 1.15)

        # Calcular estrellas (1 a 3)
        target_wpm = lesson_data.get("target_wpm", 20)
        target_acc = lesson_data.get("target_acc", 90)

        stars = 1
        if acc >= target_acc and wpm >= target_wpm:
            stars = 2
        if acc >= (target_acc + 4) and wpm >= (target_wpm + 10):
            stars = 3

        # Actualizar perfil
        self.storage.add_points(score)
        chap_prog = profile["campaign_progress"].setdefault(chapter_key, {"unlocked": True, "stars": {}, "boss_beaten": False})
        lesson_id = lesson_data["id"]
        prev_stars = chap_prog["stars"].get(lesson_id, 0)
        if stars > prev_stars:
            chap_prog["stars"][lesson_id] = stars

        # Estadísticas globales
        st = profile["stats"]
        st["total_chars_typed"] += session.correct_keypresses
        st["total_errors"] += session.errors
        st["total_sessions"] += 1
        if wpm > st["best_wpm"]:
            st["best_wpm"] = wpm
        if combo > st["best_combo"]:
            st["best_combo"] = combo

        unlocked_ach = self.storage.check_achievements(wpm, acc, combo, blind_mode=not show_keyboard)
        self.storage.save()

        # Pantalla de resultados
        self._show_results(lesson_data, session, stars, score, unlocked_ach)
        return stars

    def _show_results(self, lesson_data, session, stars, score, achievements):
        self.renderer.clear()
        profile = self.storage.get_profile()
        self.renderer.draw_header("RESULTADOS DE MISIÓN", profile)

        pri = self.renderer.c("primary")
        acc = self.renderer.c("accent")
        sec = self.renderer.c("secondary")
        rst = "\033[0m"

        star_icons = "★ " * stars + "☆ " * (3 - stars)

        print(f"\n{sec}╔════════════════════════════════════════════════════════════════════════════╗{rst}")
        print(f"{sec}║  {acc}¡SUBMÓDULO COMPLETADO CON ÉXITO!{sec}{' ' * 42}║{rst}")
        print(f"{sec}║  {pri}Misión: {lesson_data['title']:<58}{sec}║{rst}")
        print(f"{sec}║  {acc}Calificación: {star_icons:<54}{sec}║{rst}")
        print(f"{sec}║  {pri}Velocidad: {session.get_wpm():>5.1f} WPM │ Precisión: {session.get_accuracy():>5.1f}% │ Combo Máx: {session.max_combo:>3}x{sec}   ║{rst}")
        print(f"{sec}║  {acc}Puntos Obtenidos: +{score} PTS │ Total Acumulado: {profile['points']} PTS{sec}{' ' * 19}║{rst}")
        print(f"{sec}╚════════════════════════════════════════════════════════════════════════════╝{rst}")

        if achievements:
            print(f"\n{acc}  🏆 ¡NUEVO LOGRO DESBLOQUEADO!{rst}")
            for a in achievements:
                print(f"  {pri}▶ {a}{rst}")

        print(f"\n {pri}Presiona cualquier tecla para continuar...{rst}")
        self.get_key()

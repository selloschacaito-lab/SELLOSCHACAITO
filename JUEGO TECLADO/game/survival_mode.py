import time
import random
import os
import sys

try:
    import msvcrt
    HAS_MSVCRT = True
except ImportError:
    HAS_MSVCRT = False

from colorama import Fore, Style
from content.levels_data import LEVELS_DATA

CYBER_WORDS = [
    "ai", "cpu", "ram", "gpu", "core", "byte", "node", "hash", "code", "loop",
    "data", "gate", "link", "root", "sudo", "cuda", "vram", "ping", "port", "host",
    "token", "logic", "array", "stack", "queue", "cache", "proxy", "async", "await",
    "neural", "matrix", "tensor", "vector", "binary", "cipher", "thread", "daemon"
]

class SurvivalMode:
    """Modo Supervivencia: Corriente continua de palabras cayendo / invasión de datos."""

    def __init__(self, renderer, storage, audio):
        self.renderer = renderer
        self.storage = storage
        self.audio = audio

    def get_key_nonblocking(self):
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

    def run(self):
        profile = self.storage.get_profile()
        self.audio.switch_type = profile.get("switch_sound", "blue")
        self.audio.enabled = profile.get("audio_enabled", True)

        shields = 100
        score = 0
        words_cleared = 0
        start_time = time.time()

        # Palabras activas en pantalla: [{"word": "cuda", "typed": "cu", "pos": 0, "speed": 1.0}]
        active_words = []
        last_spawn = time.time()
        last_drop = time.time()
        current_input = ""

        self.renderer.clear()
        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        print(f"{sec}╔════════════════════════════════════════════════════════════════════════════╗{rst}")
        print(f"{sec}║  {acc}MODO SUPERVIVENCIA: LLUVIA DE DATOS CIBERNÉTICA{sec}{' ' * 27}║{rst}")
        print(f"{sec}║  {pri}Escribe las palabras antes de que alcancen el cortafuegos inferior.{sec}     ║{rst}")
        print(f"{sec}║  {pri}Cada palabra que caiga restará 15 puntos de tus escudos.{sec}{' ' * 19}║{rst}")
        print(f"{sec}╚════════════════════════════════════════════════════════════════════════════╝{rst}")
        print(f"\n {acc}Presiona cualquier tecla para comenzar...{rst}")

        if HAS_MSVCRT:
            msvcrt.getch()

        while shields > 0:
            now = time.time()

            # Generar nuevas palabras según el tiempo
            spawn_rate = max(1.2, 3.0 - (words_cleared * 0.05))
            if now - last_spawn >= spawn_rate and len(active_words) < 5:
                w = random.choice(CYBER_WORDS)
                active_words.append({"word": w, "progress": 0, "row": 0})
                last_spawn = now

            # Caída de palabras
            if now - last_drop >= 1.0:
                for item in list(active_words):
                    item["row"] += 1
                    if item["row"] >= 8: # Llegó al límite inferior
                        shields = max(0, shields - 15)
                        self.audio.play_error_buzz()
                        active_words.remove(item)
                last_drop = now

            # Renderizado
            self.renderer.clear()
            self.renderer.draw_header("SUPERVIVENCIA: LLUVIA DE DATOS", profile)

            # Barra de escudos
            shield_bars = int((shields / 100) * 30)
            shield_str = f"{Fore.CYAN + Style.BRIGHT}{'█' * shield_bars}{Fore.BLACK + Style.BRIGHT}{'░' * (30 - shield_bars)}{rst}"
            print(f" {pri}ESCUDOS: [{shield_str}] {shields:>3}/100 │ SCORE: {acc}{score:>5}{pri} │ ELIMINADAS: {acc}{words_cleared:>3}{rst}\n")

            print(f"{pri}┌{'─' * 60}┐{rst}")
            # Renderizar matriz de 8 filas
            for r in range(8):
                row_items = [it for it in active_words if it["row"] == r]
                row_str = "   ".join([f"{Fore.GREEN}{it['word'][:it['progress']]}{Fore.YELLOW}{it['word'][it['progress']:]}{rst}" for it in row_items])
                print(f"{pri}│{rst} {row_str:<58} {pri}│{rst}")
            print(f"{pri}└{'─' * 60}┘{rst}")

            print(f"\n {pri}BUFFER ACTUAL: {Fore.YELLOW + Style.BRIGHT}{current_input}{rst}")
            print(f" {sec}[ESC / Ctrl+C]: Salir{rst}")

            # Capturar teclado
            key = self.get_key_nonblocking()
            if key is not None:
                if key == '\x1b' or key == '\x03':
                    return

                if key in ('\r', '\n', ' '):
                    # Comprobar si la palabra actual coincide con alguna activa
                    matched = None
                    for it in active_words:
                        if it["word"] == current_input:
                            matched = it
                            break
                    
                    if matched:
                        active_words.remove(matched)
                        words_cleared += 1
                        score += len(current_input) * 20
                        self.audio.play_combo_chime(words_cleared)
                        current_input = ""
                    else:
                        self.audio.play_error_buzz()
                        current_input = ""
                elif key == '\x08': # Backspace
                    current_input = current_input[:-1]
                elif len(key) == 1 and key.isprintable():
                    current_input += key.lower()
                    self.audio.play_key_click()

            time.sleep(0.04)

        # Game Over Supervivencia
        self.renderer.clear()
        self.audio.play_error_buzz()
        self.renderer.draw_header("FIN DE SUPERVIVENCIA", profile)
        print(f"\n {Fore.RED + Style.BRIGHT}¡EL CORTAFUEGOS HA COLAPSADO!{rst}\n")
        print(f" {pri}Palabras neutralizadas: {acc}{words_cleared}{rst}")
        print(f" {pri}Puntos de supervivencia: {acc}+{score} PTS{rst}\n")
        
        self.storage.add_points(score)
        print(f" {sec}Presiona cualquier tecla para volver al menú...{rst}")
        if HAS_MSVCRT:
            msvcrt.getch()

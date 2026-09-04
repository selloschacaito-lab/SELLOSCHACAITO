import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from colorama import init, Fore, Back, Style
from core.keyboard_map import get_finger_for_char, ASCII_KEYBOARD_TEMPLATE_ES
from content.gravy_ai import get_gravy_stage_data
from ui.ascii_art import BANNER_MAIN, BANNER_VICTORY, BANNER_GAMEOVER, BANNER_BOSS

init(autoreset=True)

# Mapeo de colores de temas a secuencias ANSI / Colorama
COLOR_MAP = {
    "bright_cyan": Fore.CYAN + Style.BRIGHT,
    "bright_magenta": Fore.MAGENTA + Style.BRIGHT,
    "bright_yellow": Fore.YELLOW + Style.BRIGHT,
    "bright_green": Fore.GREEN + Style.BRIGHT,
    "bright_red": Fore.RED + Style.BRIGHT,
    "bright_white": Fore.WHITE + Style.BRIGHT,
    "white": Fore.WHITE,
    "green": Fore.GREEN,
    "yellow": Fore.YELLOW,
    "magenta": Fore.MAGENTA,
    "red": Fore.RED,
    "blue": Fore.BLUE,
    "bright_blue": Fore.BLUE + Style.BRIGHT,
    "black": Fore.BLACK,
    "reset": Style.RESET_ALL
}

class Renderer:
    """Renderiza toda la interfaz TUI en consola con colores neón, ASCII y barras de vida."""

    def __init__(self, theme):
        self.theme = theme

    def set_theme(self, theme):
        self.theme = theme

    def c(self, color_key):
        val = self.theme.get(color_key, "bright_cyan")
        return COLOR_MAP.get(val, Fore.CYAN + Style.BRIGHT)

    def clear(self):
        os.system('cls' if os.name == 'nt' else 'clear')

    def draw_header(self, title, profile):
        pri = self.c("primary")
        sec = self.c("secondary")
        acc = self.c("accent")
        rst = COLOR_MAP["reset"]

        active_title = profile.get("active_title", "Script Kiddie")
        stage = profile.get("gravy_stage", 1)
        pts = profile.get("points", 0)
        lvl = profile.get("level", 1)

        print(f"{pri}╔════════════════════════════════════════════════════════════════════════════════════╗{rst}")
        print(f"{pri}║ {sec}⚡ GRAVY PROTOCOL v2.0 // CYBERPUNK TYPING ENGINE {pri}│ {acc}SYNC: 100% {pri}│ {Fore.GREEN + Style.BRIGHT}SYS: ONLINE {pri}║{rst}")
        print(f"{pri}╠════════════════════════════════════════════════════════════════════════════════════╣{rst}")
        
        row1 = f" MISIÓN: {title[:40]:<40} │ RANGO: {active_title:<18} "
        row2 = f" CRÉDITOS: {pts:>6} PTS │ NIVEL OPERADOR: {lvl:>2} │ GRAVY NÚCLEO: FASE {stage} [AGI] "
        
        print(f"{pri}║{sec}{row1:<84}{pri}║{rst}")
        print(f"{pri}║{acc}{row2:<84}{pri}║{rst}")
        print(f"{pri}╚════════════════════════════════════════════════════════════════════════════════════╝{rst}")

    def render_hud(self, session, gravy_stage=1, show_streak=True):
        """Renderiza las métricas en tiempo real con medidor de WPM y progreso."""
        wpm = session.get_wpm()
        acc = session.get_accuracy()
        combo = session.current_combo
        cpm = session.get_cpm()
        elapsed = int(session.get_elapsed_seconds())

        pri = self.c("primary")
        sec = self.c("secondary")
        acc_c = self.c("accent")
        rst = COLOR_MAP["reset"]

        # Barra de progreso del texto
        total_len = max(1, len(session.target_text))
        curr_len = session.current_idx
        pct = int((curr_len / total_len) * 100)
        bar_len = 24
        filled = int((curr_len / total_len) * bar_len)
        prog_bar = f"{Fore.GREEN + Style.BRIGHT}{'█' * filled}{Fore.BLACK + Style.BRIGHT}{'░' * (bar_len - filled)}{rst}"

        # Medidor de calor de Combo
        combo_color = Fore.YELLOW + Style.BRIGHT if combo < 20 else (Fore.MAGENTA + Style.BRIGHT if combo < 50 else Fore.RED + Style.BRIGHT)
        combo_str = f"{combo_color}{combo:>3}x COMBO{rst}"

        print(f"{pri}┌── TELEMETRÍA BIOMÉTRICA ───────────────────────────────────────────────────────────┐{rst}")
        print(f"{pri}│ {sec}VELOCIDAD: {acc_c}{wpm:>4.1f} WPM{pri} │ {sec}PRECISIÓN: {acc_c}{acc:>5.1f}%{pri} │ {sec}CPM: {acc_c}{cpm:>4}{pri} │ {combo_str} │ {sec}TIEMPO: {acc_c}{elapsed:>3}s {pri}│{rst}")
        print(f"{pri}│ {sec}PROGRESO DEL BUFFER: [{prog_bar}{sec}] {acc_c}{pct:>3}% {sec}({curr_len}/{total_len} chars){' ' * 13}{pri}│{rst}")
        print(f"{pri}└────────────────────────────────────────────────────────────────────────────────────┘{rst}")

    def render_hand_visualizer(self, active_code=""):
        """Dibuja el radar de las 2 manos resaltando el dedo exacto a utilizar."""
        pri = self.c("primary")
        acc = self.c("accent")
        rst = COLOR_MAP["reset"]

        def _hl(code, name):
            if code == active_code:
                return f"{Back.YELLOW}{Fore.BLACK}{Style.BRIGHT} {name} {rst}{pri}"
            return f" {name} "

        l4 = _hl("LI4", "MEÑIQUE")
        l3 = _hl("LI3", "ANULAR")
        l2 = _hl("LI2", "MEDIO")
        l1 = _hl("LI1", "ÍNDICE")

        r1 = _hl("LD1", "ÍNDICE")
        r2 = _hl("LD2", "MEDIO")
        r3 = _hl("LD3", "ANULAR")
        r4 = _hl("LD4", "MEÑIQUE")

        thumb = _hl("THUMB", "PULGARES [ESPACIO]")

        print(f"{pri}┌── RADAR NEUROMUSCULAR (MANO IZQUIERDA) ──┬── RADAR NEUROMUSCULAR (MANO DERECHA) ──┐{rst}")
        print(f"{pri}│ [{l4}][{l3}][{l2}][{l1}] │ [{r1}][{r2}][{r3}][{r4}] │{rst}")
        print(f"{pri}│                      CENTRO: [{thumb}]                      │{rst}")
        print(f"{pri}└────────────────────────────────────────────────────────────────────────────────────┘{rst}")

    def render_typing_area(self, session, show_keyboard=True):
        """Renderiza el texto a escribir coloreando aciertos, cursor y errores."""
        target = session.target_text
        curr_idx = session.current_idx

        pri = self.c("primary")
        acc = self.c("accent")
        corr = COLOR_MAP["bright_green"]
        err = COLOR_MAP["bright_red"]
        rst = COLOR_MAP["reset"]

        print(f"\n{pri}▶ BUFFER DE MEMORIA (ESCRIBE):{rst}\n")
        
        # Construir línea renderizada
        rendered_chars = []
        for i, ch in enumerate(target):
            if i < curr_idx:
                # Caracter ya escrito correctamente
                rendered_chars.append(f"{corr}{ch}{rst}")
            elif i == curr_idx:
                # Cursor actual (resaltado con fondo)
                display_ch = ch if ch != ' ' else '_'
                rendered_chars.append(f"{Back.WHITE}{Fore.BLACK}{Style.BRIGHT}{display_ch}{rst}")
            else:
                # Caracteres pendientes
                rendered_chars.append(f"{Fore.WHITE}{ch}{rst}")

        print("  " + "".join(rendered_chars))
        print()

        # Mostrar guía de dedos si está activa
        next_char = session.get_next_char()
        if next_char is not None and show_keyboard:
            code, finger_desc = get_finger_for_char(next_char)
            disp_next = next_char if next_char != ' ' else '[ESPACIO]'
            print(f" {pri}▶ PRÓXIMA TECLA: {acc}{disp_next}{pri} │ DEDO ASIGNADO: {Fore.YELLOW + Style.BRIGHT}{finger_desc}{rst}")
            self.render_hand_visualizer(code)

    def render_ascii_keyboard(self, active_char=None):
        """Dibuja el teclado virtual ASCII en tiempo real resaltando la tecla activa."""
        pri = self.c("primary")
        act_bg = Back.YELLOW + Fore.BLACK + Style.BRIGHT
        act_fg = Fore.YELLOW + Style.BRIGHT
        rst = COLOR_MAP["reset"]

        print(f"\n{pri}─── TECLADO TÁCTIL VIRTUAL (ESCRIBE SIN MIRAR TUS MANOS) ───{rst}")
        
        target_upper = active_char.upper() if active_char and active_char != ' ' else None
        
        for line in ASCII_KEYBOARD_TEMPLATE_ES:
            highlighted = False
            highlighted_line = line

            if active_char == ' ' and "[ESPACIO]" in line:
                highlighted_line = line.replace("[ESPACIO]", f"{act_bg} [ESPACIO] {rst}{pri}")
                highlighted = True
            elif target_upper == "F" and "[F]" in line:
                highlighted_line = line.replace("[F]", f"{act_bg} F {rst}{pri}")
                highlighted = True
            elif target_upper == "J" and "[J]" in line:
                highlighted_line = line.replace("[J]", f"{act_bg} J {rst}{pri}")
                highlighted = True
            elif target_upper:
                # Comprobar si la tecla está con espacios ej: ' A '
                if f" {target_upper} " in line:
                    highlighted_line = line.replace(f" {target_upper} ", f"{act_bg} {target_upper} {rst}{pri}")
                    highlighted = True
                elif f"[{target_upper}]" in line:
                    highlighted_line = line.replace(f"[{target_upper}]", f"{act_bg} {target_upper} {rst}{pri}")
                    highlighted = True

            print(f"{pri}{highlighted_line}{rst}")

    def render_boss_hud(self, boss_name, boss_hp, boss_max_hp, player_shield, player_max_shield):
        """Renderiza las barras de vida de combate Cyberpunk."""
        pri = self.c("primary")
        sec = self.c("secondary")
        rst = COLOR_MAP["reset"]

        # Barra del Jefe (Roja)
        boss_ratio = max(0.0, boss_hp / boss_max_hp)
        boss_bars = int(boss_ratio * 30)
        boss_bar_str = f"{Fore.RED + Style.BRIGHT}{'█' * boss_bars}{Fore.BLACK + Style.BRIGHT}{'░' * (30 - boss_bars)}{rst}"

        # Barra del Jugador / Escudos (Cyan/Verde)
        player_ratio = max(0.0, player_shield / player_max_shield)
        player_bars = int(player_ratio * 30)
        player_bar_str = f"{Fore.CYAN + Style.BRIGHT}{'█' * player_bars}{Fore.BLACK + Style.BRIGHT}{'░' * (30 - player_bars)}{rst}"

        print(f"{pri}╔════════════════════════════════════════════════════════════════════════════════════╗{rst}")
        print(f"{pri}║ {Fore.RED + Style.BRIGHT}JEFE CORRUPTO: {boss_name:<20} HP: [{boss_bar_str}] {boss_hp:>3}/{boss_max_hp} {pri}║{rst}")
        print(f"{pri}║ {Fore.CYAN + Style.BRIGHT}ESCUDOS OPERADOR:                 HP: [{player_bar_str}] {player_shield:>3}/{player_max_shield} {pri}║{rst}")
        print(f"{pri}╚════════════════════════════════════════════════════════════════════════════════════╝{rst}")

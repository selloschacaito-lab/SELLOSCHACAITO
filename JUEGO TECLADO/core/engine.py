import sys
import os
import time

try:
    import msvcrt
    HAS_MSVCRT = True
except ImportError:
    HAS_MSVCRT = False

from colorama import Fore, Back, Style, init

from core.storage import StorageManager
from core.audio import AudioManager
from ui.renderer import Renderer
from ui.themes import THEMES, get_theme
from ui.ascii_art import BANNER_MAIN
from content.gravy_ai import get_gravy_stage_data
from content.ergonomics_guide import ERGONOMICS_PAGES
from content.levels_data import LEVELS_DATA
from game.campaign import CampaignManager
from game.boss_battle import BossBattle
from game.weak_keys_mode import WeakKeysMode
from game.survival_mode import SurvivalMode
from game.benchmark_mode import BenchmarkMode

class GravyProtocolGame:
    """Orquestador principal de GRAVY PROTOCOL."""

    def __init__(self):
        self.storage = StorageManager()
        profile = self.storage.get_profile()
        self.theme = get_theme(profile.get("unlocked_theme", "cyberpunk"))
        self.renderer = Renderer(self.theme)
        self.audio = AudioManager(
            enabled=profile.get("audio_enabled", True),
            switch_type=profile.get("switch_sound", "blue")
        )

        self.campaign_mgr = CampaignManager(self.renderer, self.storage, self.audio)
        self.boss_mgr = BossBattle(self.renderer, self.storage, self.audio)
        self.weak_keys_mgr = WeakKeysMode(self.renderer, self.storage, self.audio)
        self.survival_mgr = SurvivalMode(self.renderer, self.storage, self.audio)
        self.benchmark_mgr = BenchmarkMode(self.renderer, self.storage, self.audio)

    def wait_key(self):
        if HAS_MSVCRT:
            try:
                ch = msvcrt.getwch()
                if ch in ('\x00', '\xe0'):
                    msvcrt.getwch()
                    return None
                return ch
            except Exception:
                return None
        return input("Elige una opción: ")

    def start(self):
        # Configuración inicial de la consola en Windows
        if os.name == 'nt':
            os.system('title GRAVY PROTOCOL v2.0 - Cyberpunk Typing Engine & AI')
            os.system('mode con: cols=110 lines=36')

        while True:
            self._main_menu()

    def _main_menu(self):
        self.renderer.clear()
        profile = self.storage.get_profile()
        stage_data = get_gravy_stage_data(profile["gravy_stage"])

        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        print(f"{pri}{BANNER_MAIN}{rst}")
        self.renderer.draw_header("MENÚ PRINCIPAL DE ENLACE NEURONAL", profile)

        # Mostrar estado de Gravy en ASCII a la derecha / centro
        print(f"\n {acc}COMPAÑERO DE IA ACTIVO: {stage_data['title']}{rst}")
        print(f" {sec}{stage_data['description']}{rst}\n")
        for line in stage_data["ascii"]:
            print(f"  {pri}{line}{rst}")
        print()

        print(f"{pri}╔════════════════════════════════════════════════════════════════════════════╗{rst}")
        print(f"{pri}║  {acc}[1]{pri} MODO CAMPAÑA: 5 CAPÍTULOS DE IA Y JEFES FINALES                       ║{rst}")
        print(f"{pri}║  {acc}[2]{pri} MODO PRÁCTICA DE TECLAS DÉBILES (MAPA DE CALOR)                        ║{rst}")
        print(f"{pri}║  {acc}[3]{pri} MODO SUPERVIVENCIA: LLUVIA DE DATOS CIBERNÉTICA                        ║{rst}")
        print(f"{pri}║  {acc}[4]{pri} MODO BENCHMARK: PRUEBA OFICIAL DE VELOCIDAD (WPM RECORD)               ║{rst}")
        print(f"{pri}║  {acc}[5]{pri} GUÍA DE ERGONOMÍA Y CALIBRACIÓN DE GRAVY (TÉCNICA DE 10 DEDOS)        ║{rst}")
        print(f"{pri}║  {acc}[6]{pri} TIENDA CYBERPUNK: TEMAS VISUALES Y SWITCHES MECÁNICOS                  ║{rst}")
        print(f"{pri}║  {acc}[7]{pri} PANEL DE LOGROS, INSIGNIAS Y ESTADÍSTICAS DEL OPERADOR                 ║{rst}")
        print(f"{pri}║  {acc}[8]{pri} CONFIGURACIÓN (DISTRIBUCIÓN TECLADO, MODO ESTRICTO, AUDIO)            ║{rst}")
        print(f"{pri}║  {acc}[0]{pri} DESCONECTARSE Y SALIR                                                 ║{rst}")
        print(f"{pri}╚════════════════════════════════════════════════════════════════════════════╝{rst}")
        print(f"\n {acc}Selecciona una opción [0-8]: {rst}", end="", flush=True)

        choice = self.wait_key()
        if choice == '1':
            self._menu_campaign()
        elif choice == '2':
            self.weak_keys_mgr.run()
        elif choice == '3':
            self.survival_mgr.run()
        elif choice == '4':
            self.benchmark_mgr.run()
        elif choice == '5':
            self._menu_ergonomics()
        elif choice == '6':
            self._menu_shop()
        elif choice == '7':
            self._menu_stats_and_achievements()
        elif choice == '8':
            self._menu_settings()
        elif choice == '0':
            self.renderer.clear()
            print(f"\n {pri}Guardando matriz de memoria... Desconexión exitosa.{rst}\n")
            sys.exit(0)

    def _menu_campaign(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("MODO CAMPAÑA: 5 CAPÍTULOS DE HISTORIA", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            print(f"\n {sec}SELECCIONA UN CAPÍTULO PARA DESPLEGAR EL PROTOCOLO:{rst}\n")

            for i in range(1, 6):
                ch_key = f"chapter_{i}"
                ch_info = LEVELS_DATA[ch_key]
                prog = profile["campaign_progress"].get(ch_key, {"unlocked": i == 1, "stars": {}, "boss_beaten": False})
                
                status_str = f"{Fore.GREEN + Style.BRIGHT}[DESBLOQUEADO]{rst}" if prog["unlocked"] else f"{Fore.RED}[BLOQUEADO]{rst}"
                boss_str = f"{acc} ★ JEFE PURGADO ★{rst}" if prog.get("boss_beaten") else ""
                
                # Calcular estrellas acumuladas
                total_stars = sum(prog.get("stars", {}).values())
                stars_display = f"{Fore.YELLOW}{total_stars}/12 ★{rst}"

                print(f" {acc}[{i}]{pri} {ch_info['title']} {status_str} {stars_display} {boss_str}")
                print(f"     {sec}{ch_info['desc']}{rst}\n")

            print(f" {acc}[0]{pri} Volver al menú principal{rst}\n")
            print(f" {acc}Elige un capítulo [1-5]: {rst}", end="", flush=True)

            ch_opt = self.wait_key()
            if ch_opt == '0':
                break
            elif ch_opt in ('1', '2', '3', '4', '5'):
                ch_key = f"chapter_{ch_opt}"
                prog = profile["campaign_progress"].get(ch_key, {"unlocked": False})
                if not prog["unlocked"]:
                    print(f"\n {Fore.RED + Style.BRIGHT}¡Acceso denegado! Debes derrotar al Jefe del capítulo anterior.{rst}")
                    time.sleep(1.5)
                    continue
                self._run_chapter_menu(ch_key)

    def _run_chapter_menu(self, chapter_key):
        ch_data = LEVELS_DATA[chapter_key]
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header(ch_data["title"], profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            prog = profile["campaign_progress"][chapter_key]

            print(f"\n {sec}LECCIONES Y SUBMÓDULOS DE ENTRENAMIENTO:{rst}\n")
            for idx, lesson in enumerate(ch_data["lessons"]):
                l_id = lesson["id"]
                stars = prog.get("stars", {}).get(l_id, 0)
                star_str = "★ " * stars + "☆ " * (3 - stars)
                print(f" {acc}[{idx+1}]{pri} {lesson['title']} {Fore.YELLOW}[{star_str}]{rst}")
                print(f"     {sec}{lesson['lore']} (Meta: {lesson['target_wpm']} WPM / {lesson['target_acc']}% Acc){rst}\n")

            # Opción del Boss
            boss_status = f"{Fore.GREEN}¡PURGADO!{rst}" if prog.get("boss_beaten") else f"{Fore.RED + Style.BRIGHT}¡DESAFÍO ACTIVO!{rst}"
            print(f" {Fore.RED + Style.BRIGHT}[B]{pri} ENFRENTAR AL JEFE: {ch_data['boss']['name']} [{boss_status}]{rst}")
            print(f"     {sec}{ch_data['boss']['lore']}{rst}\n")

            print(f" {acc}[0]{pri} Volver a selección de capítulos{rst}\n")
            print(f" {acc}Selecciona lección [1-4] o Jefe [B]: {rst}", end="", flush=True)

            opt = self.wait_key()
            if opt == '0':
                break
            elif opt in ('1', '2', '3', '4'):
                l_idx = int(opt) - 1
                self.campaign_mgr.run_lesson(chapter_key, ch_data["lessons"][l_idx])
            elif opt.lower() == 'b':
                self.boss_mgr.run_boss(chapter_key, ch_data["boss"])

    def _menu_ergonomics(self):
        page_idx = 0
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("MANUAL DE ERGONOMÍA & TÉCNICA DE 10 DEDOS", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            page = ERGONOMICS_PAGES[page_idx]
            print(f"\n {acc}═══ {page['title']} ═══{rst}\n")
            for line in page["content"]:
                print(f"  {pri}{line}{rst}")
            print()

            print(f"{pri}╔{'═' * 78}╗{rst}")
            print(f"{pri}║  Página {page_idx + 1} de {len(ERGONOMICS_PAGES)}  │  [N] Siguiente  │  [P] Anterior  │  [0] Salir al Menú   ║{rst}")
            print(f"{pri}╚{'═' * 78}╝{rst}")

            k = self.wait_key()
            if k == '0':
                break
            elif k.lower() == 'n' and page_idx < len(ERGONOMICS_PAGES) - 1:
                page_idx += 1
            elif k.lower() == 'p' and page_idx > 0:
                page_idx -= 1

    def _menu_shop(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("TIENDA CYBERPUNK DE TEMAS Y SWITCHES", profile)

    def _menu_shop(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("MERCADO NEGRO CYBERPUNK // BÚFER DE MEJORAS", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            print(f"\n {acc}CRÉDITOS DISPONIBLES: {profile['points']} PTS{rst}\n")
            print(f"{pri}╔════════════════════════════════════════════════════════════════════════════════════╗{rst}")
            print(f"{pri}║  {acc}[1]{pri} 🎨 TEMAS VISUALES & PALETAS HOLOGRÁFICAS (8 TEMAS)                            ║{rst}")
            print(f"{pri}║  {acc}[2]{pri} 🔊 SWITCHES MECÁNICOS & SINTETIZADORES DE AUDIO (6 PERFILES)                ║{rst}")
            print(f"{pri}║  {acc}[3]{pri} ⚡ OVERCLOCKS & MEJORAS NEURONALES DEL SISTEMA (4 MÓDULOS)                   ║{rst}")
            print(f"{pri}║  {acc}[4]{pri} 🎖️ TÍTULOS & RANGOS DE OPERADOR PARA TU PERFIL (6 RANGOS)                     ║{rst}")
            print(f"{pri}║  {acc}[0]{pri} ◀ VOLVER AL MENÚ PRINCIPAL                                                   ║{rst}")
            print(f"{pri}╚════════════════════════════════════════════════════════════════════════════════════╝{rst}")
            print(f"\n {acc}Elige una categoría [1-4 o 0]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k == '1':
                self._shop_themes()
            elif k == '2':
                self._shop_switches()
            elif k == '3':
                self._shop_upgrades()
            elif k == '4':
                self._shop_titles()

    def _get_bosses_beaten_count(self, profile):
        count = 0
        for i in range(1, 6):
            ch = profile.get("campaign_progress", {}).get(f"chapter_{i}", {})
            if ch.get("boss_beaten"):
                count += 1
        return count

    def _shop_themes(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            bosses_beaten = self._get_bosses_beaten_count(profile)
            self.renderer.draw_header("TIENDA: TEMAS VISUALES CYBERPUNK", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            print(f"\n {acc}CRÉDITOS: {profile['points']} PTS │ JEFES PURGADOS: {bosses_beaten}/5{rst}\n")
            theme_keys = list(THEMES.keys())

            for idx, tk in enumerate(theme_keys):
                t_data = THEMES[tk]
                owned = tk in profile.get("owned_themes", ["cyberpunk"])
                is_active = tk == profile.get("unlocked_theme", "cyberpunk")
                req_boss = t_data.get("req_boss", 0)
                boss_locked = bosses_beaten < req_boss

                if is_active:
                    tag = f"{Fore.GREEN + Style.BRIGHT}[EN USO]{rst}"
                elif owned:
                    tag = f"{Fore.CYAN}[ADQUIRIDO - Pulsar para equipar]{rst}"
                elif boss_locked:
                    tag = f"{Fore.RED}[BLOQUEADO - Requiere vencer al Jefe del Cap {req_boss}]{rst}"
                else:
                    tag = f"{Fore.YELLOW}[PRECIO: {t_data['price']:,} PTS]{rst}"

                print(f" {acc}[{idx+1}]{pri} {t_data['name']:<34} {tag}")

            print(f"\n {acc}[0]{pri} Volver a categorías{rst}")
            print(f"\n {acc}Selecciona tema [1-8 o 0]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k in [str(i) for i in range(1, len(theme_keys) + 1)]:
                selected_tk = theme_keys[int(k) - 1]
                t_data = THEMES[selected_tk]
                req_boss = t_data.get("req_boss", 0)

                if selected_tk in profile.get("owned_themes", []):
                    profile["unlocked_theme"] = selected_tk
                    self.theme = get_theme(selected_tk)
                    self.renderer.set_theme(self.theme)
                    self.storage.save()
                    self.audio.play_key_click()
                else:
                    if bosses_beaten < req_boss:
                        self.audio.play_error_buzz()
                    elif profile["points"] >= t_data["price"]:
                        profile["points"] -= t_data["price"]
                        profile.setdefault("owned_themes", []).append(selected_tk)
                        profile["unlocked_theme"] = selected_tk
                        self.theme = get_theme(selected_tk)
                        self.renderer.set_theme(self.theme)
                        self.storage.save()
                        self.audio.play_level_complete()
                    else:
                        self.audio.play_error_buzz()

    def _shop_switches(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            bosses_beaten = self._get_bosses_beaten_count(profile)
            self.renderer.draw_header("TIENDA: SWITCHES MECÁNICOS Y AUDIO SFX", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            switches = [
                ("blue", "Cherry MX Blue (Clicky nítido)", 0, 0),
                ("brown", "Cherry MX Brown (Táctil balanceado)", 2000, 0),
                ("red", "Cherry MX Red (Lineal suave)", 4500, 1),
                ("panda", "Holy Panda (Thock profundo premium)", 9000, 2),
                ("ibm", "IBM Beam Spring 1970s (Vintage)", 18000, 3),
                ("laser", "Cyber Laser SFX (Disparos láser)", 30000, 4)
            ]

            print(f"\n {acc}CRÉDITOS: {profile['points']} PTS{rst}\n")
            owned_switches = profile.setdefault("owned_switches", ["blue"])

            for idx, (s_key, s_name, price, req_boss) in enumerate(switches):
                owned = s_key in owned_switches
                is_active = profile.get("switch_sound") == s_key
                boss_locked = bosses_beaten < req_boss

                if is_active:
                    tag = f"{Fore.GREEN + Style.BRIGHT}[EN USO]{rst}"
                elif owned:
                    tag = f"{Fore.CYAN}[ADQUIRIDO - Pulsar para equipar]{rst}"
                elif boss_locked:
                    tag = f"{Fore.RED}[BLOQUEADO - Jefe Cap {req_boss}]{rst}"
                else:
                    tag = f"{Fore.YELLOW}[PRECIO: {price:,} PTS]{rst}"

                print(f" {acc}[{idx+1}]{pri} {s_name:<38} {tag}")

            print(f"\n {acc}[0]{pri} Volver a categorías{rst}")
            print(f"\n {acc}Selecciona switch [1-6 o 0]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k in [str(i) for i in range(1, len(switches) + 1)]:
                s_key, s_name, price, req_boss = switches[int(k) - 1]
                if s_key in owned_switches:
                    profile["switch_sound"] = s_key
                    self.audio.switch_type = s_key
                    self.storage.save()
                    self.audio.play_key_click()
                else:
                    if bosses_beaten < req_boss:
                        self.audio.play_error_buzz()
                    elif profile["points"] >= price:
                        profile["points"] -= price
                        owned_switches.append(s_key)
                        profile["switch_sound"] = s_key
                        self.audio.switch_type = s_key
                        self.storage.save()
                        self.audio.play_level_complete()
                    else:
                        self.audio.play_error_buzz()

    def _shop_upgrades(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            bosses_beaten = self._get_bosses_beaten_count(profile)
            self.renderer.draw_header("TIENDA: OVERCLOCKS Y MEJORAS DEL SISTEMA", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            upgrades = [
                ("shield_boost", "Módulo Escudo de Sobrecarga (+25% Escudo en Bosses)", 12000, 1),
                ("combo_overclock", "Overclock de Combo (Duplica PTS en racha >25x)", 22000, 2),
                ("quantum_cooler", "Enfriador Cuántico (-20% DPS de ataque de Bosses)", 35000, 3),
                ("neuro_predict", "Predicción Neuronal AGI (Genera +15% PTS extra)", 50000, 4)
            ]

            print(f"\n {acc}CRÉDITOS: {profile['points']} PTS{rst}\n")
            owned_upgrades = profile.setdefault("owned_upgrades", [])

            for idx, (u_key, u_name, price, req_boss) in enumerate(upgrades):
                owned = u_key in owned_upgrades
                boss_locked = bosses_beaten < req_boss

                if owned:
                    tag = f"{Fore.GREEN + Style.BRIGHT}[MÓDULO INSTALADO]{rst}"
                elif boss_locked:
                    tag = f"{Fore.RED}[BLOQUEADO - Jefe Cap {req_boss}]{rst}"
                else:
                    tag = f"{Fore.YELLOW}[PRECIO: {price:,} PTS]{rst}"

                print(f" {acc}[{idx+1}]{pri} {u_name:<55} {tag}")

            print(f"\n {acc}[0]{pri} Volver a categorías{rst}")
            print(f"\n {acc}Selecciona módulo [1-4 o 0]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k in [str(i) for i in range(1, len(upgrades) + 1)]:
                u_key, u_name, price, req_boss = upgrades[int(k) - 1]
                if u_key not in owned_upgrades:
                    if bosses_beaten < req_boss:
                        self.audio.play_error_buzz()
                    elif profile["points"] >= price:
                        profile["points"] -= price
                        owned_upgrades.append(u_key)
                        self.storage.save()
                        self.audio.play_level_complete()
                    else:
                        self.audio.play_error_buzz()

    def _shop_titles(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("TIENDA: TÍTULOS Y RANGOS DE OPERADOR", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            titles = [
                ("Script Kiddie", "Rango de iniciación básica", 0),
                ("Netrunner Novicio", "Especialista en transferencias rápidas", 2500),
                ("Arquitecto de Tensores", "Maestro en modelado de redes neuronales", 7500),
                ("Cazador de Glitches", "Veterano en depuración cuántica", 18000),
                ("Centinela Cuántico", "Defensor de la infraestructura digital", 35000),
                ("Oráculo AGI // Cyber God", "Supremacía total del teclado y la IA", 65000)
            ]

            print(f"\n {acc}CRÉDITOS: {profile['points']} PTS │ RANGO ACTUAL: {profile.get('active_title', 'Script Kiddie')}{rst}\n")
            owned_titles = profile.setdefault("owned_titles", ["Script Kiddie"])

            for idx, (t_name, t_desc, price) in enumerate(titles):
                owned = t_name in owned_titles
                is_active = profile.get("active_title") == t_name

                if is_active:
                    tag = f"{Fore.GREEN + Style.BRIGHT}[EQUIPADO]{rst}"
                elif owned:
                    tag = f"{Fore.CYAN}[ADQUIRIDO - Pulsar para equipar]{rst}"
                else:
                    tag = f"{Fore.YELLOW}[PRECIO: {price:,} PTS]{rst}"

                print(f" {acc}[{idx+1}]{pri} {t_name:<28} {sec}{t_desc:<40} {tag}")

            print(f"\n {acc}[0]{pri} Volver a categorías{rst}")
            print(f"\n {acc}Selecciona título [1-6 o 0]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k in [str(i) for i in range(1, len(titles) + 1)]:
                t_name, t_desc, price = titles[int(k) - 1]
                if t_name in owned_titles:
                    profile["active_title"] = t_name
                    self.storage.save()
                    self.audio.play_key_click()
                else:
                    if profile["points"] >= price:
                        profile["points"] -= price
                        owned_titles.append(t_name)
                        profile["active_title"] = t_name
                        self.storage.save()
                        self.audio.play_level_complete()
                    else:
                        self.audio.play_error_buzz()

    def _menu_stats_and_achievements(self):
        self.renderer.clear()
        profile = self.storage.get_profile()
        self.renderer.draw_header("PANEL DE LOGROS & TELEMETRÍA DEL OPERADOR", profile)

        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        st = profile["stats"]
        print(f"\n {acc}─── TELEMETRÍA GLOBAL DE ESCRITURA ───{rst}")
        print(f" {pri}• Récord Máximo de Velocidad: {acc}{st['best_wpm']:.1f} WPM{rst}")
        print(f" {pri}• Mejor Racha / Combo:         {acc}{st['best_combo']}x aciertos{rst}")
        print(f" {pri}• Caracteres Totales Escritos: {acc}{st['total_chars_typed']}{rst}")
        print(f" {pri}• Jefes Corruptos Derrotados:  {acc}{st['bosses_defeated']} / 5{rst}")
        print(f" {pri}• Sesiones Completadas:        {acc}{st['total_sessions']}{rst}")

        print(f"\n {acc}─── CATÁLOGO DE LOGROS CYBERPUNK ───{rst}")
        ach_names = {
            "first_boot": "Primer Enlace (Iniciar el protocolo)",
            "flawless_run": "Dedo de Acero (100% de precisión en una lección)",
            "speed_demon_30": "Banda Ancha (Superar los 30 WPM)",
            "speed_demon_50": "Fibra Óptica (Superar los 50 WPM)",
            "speed_demon_70": "Sobrecarga Neuronal (Superar los 70 WPM)",
            "speed_demon_90": "Velocidad Cuántica (Superar los 90 WPM)",
            "combo_master_50": "Sincronización (Racha de 50 aciertos)",
            "combo_master_100": "Flujo Holográfico (Racha de 100 aciertos)",
            "gravy_full_evolution": "Trascendencia AGI (Evolucionar a Gravy al máximo)",
            "boss_slayer": "Cazador de IA (Derrotar a la Singularidad)",
            "blind_master": "Hacker Ciego (Completar misión sin teclado visual)"
        }

        for key, name in ach_names.items():
            unlocked = profile["achievements"].get(key, False)
            icon = f"{Fore.GREEN + Style.BRIGHT}✔ [DESBLOQUEADO]{rst}" if unlocked else f"{Fore.BLACK + Style.BRIGHT}✖ [BLOQUEADO]{rst}"
            print(f" {icon} {pri}{name}{rst}")

        print(f"\n {acc}Presiona cualquier tecla para volver al menú principal...{rst}")
        self.wait_key()

    def _menu_settings(self):
        while True:
            self.renderer.clear()
            profile = self.storage.get_profile()
            self.renderer.draw_header("AJUSTES DE CONFIGURACIÓN DEL SISTEMA", profile)

            pri = self.renderer.c("primary")
            sec = self.renderer.c("secondary")
            acc = self.renderer.c("accent")
            rst = "\033[0m"

            layout = profile.get("keyboard_layout", "es").upper()
            strict = "ACTIVADO (Recomendado para memoria muscular)" if profile.get("strict_mode", True) else "DESACTIVADO"
            audio_st = "ACTIVADO" if profile.get("audio_enabled", True) else "SILENCIADO"

            print(f"\n {acc}[1]{pri} Distribución de Teclado: {sec}{layout}{rst}")
            print(f" {acc}[2]{pri} Modo Estricto (Bloqueo en fallo): {sec}{strict}{rst}")
            print(f" {acc}[3]{pri} Efectos de Sonido / Audio: {sec}{audio_st}{rst}")
            print(f"\n {acc}[0]{pri} Volver al Menú Principal{rst}")
            print(f"\n {acc}Elige qué opción modificar [1-3]: {rst}", end="", flush=True)

            k = self.wait_key()
            if k == '0':
                break
            elif k == '1':
                # Rotar layout
                layouts = ["es", "latam", "us"]
                curr = profile.get("keyboard_layout", "es")
                nxt = layouts[(layouts.index(curr) + 1) % len(layouts)]
                profile["keyboard_layout"] = nxt
                self.storage.save()
            elif k == '2':
                profile["strict_mode"] = not profile.get("strict_mode", True)
                self.storage.save()
            elif k == '3':
                profile["audio_enabled"] = not profile.get("audio_enabled", True)
                self.audio.enabled = profile["audio_enabled"]
                self.storage.save()

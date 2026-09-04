import json
import os
from datetime import datetime

DEFAULT_SAVE_PATH = os.path.join(os.path.expanduser("~"), ".gravy_protocol_save.json")

class StorageManager:
    """Gestiona el guardado automático de perfiles, puntuaciones, mapa de calor y logros."""

    def __init__(self, filepath=DEFAULT_SAVE_PATH):
        self.filepath = filepath
        self.data = self._load()

    def _default_profile(self, name="Player"):
        return {
            "name": name,
            "created_at": datetime.now().isoformat(),
            "points": 0,
            "xp": 0,
            "level": 1,
            "gravy_stage": 1,          # 1 a 5
            "active_title": "Script Kiddie",
            "owned_titles": ["Script Kiddie"],
            "unlocked_theme": "cyberpunk",
            "owned_themes": ["cyberpunk"],
            "switch_sound": "blue",
            "owned_switches": ["blue"],
            "owned_upgrades": [],      # "shield_boost", "combo_overclock", "quantum_cooler", "neuro_predict"
            "keyboard_layout": "es",   # es, latam, us
            "audio_enabled": True,
            "strict_mode": True,
            "campaign_progress": {
                "chapter_1": {"unlocked": True, "stars": {}, "boss_beaten": False},
                "chapter_2": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "chapter_3": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "chapter_4": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "chapter_5": {"unlocked": False, "stars": {}, "boss_beaten": False},
            },
            "weak_keys": {},           # {"a": {"attempts": 10, "errors": 3}, ...}
            "stats": {
                "total_chars_typed": 0,
                "total_errors": 0,
                "best_wpm": 0.0,
                "best_combo": 0,
                "bosses_defeated": 0,
                "total_sessions": 0,
                "time_played_seconds": 0
            },
            "achievements": {
                "first_boot": True,
                "flawless_run": False,        # 100% precisión en una lección
                "speed_demon_30": False,      # 30+ WPM
                "speed_demon_50": False,      # 50+ WPM
                "speed_demon_70": False,      # 70+ WPM
                "speed_demon_90": False,      # 90+ WPM
                "combo_master_50": False,     # Racha de 50
                "combo_master_100": False,    # Racha de 100
                "gravy_full_evolution": False,# Gravy nivel 5
                "boss_slayer": False,         # Derrotar al boss del cap 5
                "blind_master": False         # Completar lección sin teclado visual
            }
        }

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "profiles" not in data or "active_profile" not in data:
                        return self._create_new_data()
                    return data
            except Exception:
                return self._create_new_data()
        return self._create_new_data()

    def _create_new_data(self):
        default_prof = self._default_profile("Hacker")
        return {
            "active_profile": "Hacker",
            "profiles": {
                "Hacker": default_prof
            }
        }

    def save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error al guardar datos: {e}")
            return False

    def get_profile(self):
        active = self.data.get("active_profile", "Hacker")
        if active not in self.data.get("profiles", {}):
            self.data["profiles"][active] = self._default_profile(active)
        return self.data["profiles"][active]

    def set_active_profile(self, name):
        if name not in self.data["profiles"]:
            self.data["profiles"][name] = self._default_profile(name)
        self.data["active_profile"] = name
        self.save()

    def list_profiles(self):
        return list(self.data.get("profiles", {}).keys())

    def update_key_stats(self, char, is_error):
        char = char.lower()
        prof = self.get_profile()
        wk = prof.setdefault("weak_keys", {})
        if char not in wk:
            wk[char] = {"attempts": 0, "errors": 0}
        wk[char]["attempts"] += 1
        if is_error:
            wk[char]["errors"] += 1

    def get_worst_keys(self, top_n=5):
        prof = self.get_profile()
        wk = prof.get("weak_keys", {})
        ranked = []
        for char, stats in wk.items():
            if stats["attempts"] >= 5:
                error_rate = (stats["errors"] / stats["attempts"]) * 100
                ranked.append((char, error_rate, stats["errors"], stats["attempts"]))
        
        ranked.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in ranked[:top_n]]

    def add_points(self, points, xp_amount=None):
        prof = self.get_profile()
        prof["points"] += points
        xp = points if xp_amount is None else xp_amount
        prof["xp"] += xp
        
        # Subir nivel de jugador (1 nivel cada 1,500 XP)
        new_level = 1 + (prof["xp"] // 1500)
        prof["level"] = new_level
        
        # Evaluar evolución de GRAVY (1 a 5) con progresión calibrada
        if prof["points"] >= 45000:
            prof["gravy_stage"] = 5
            prof["achievements"]["gravy_full_evolution"] = True
        elif prof["points"] >= 20000:
            prof["gravy_stage"] = 4
        elif prof["points"] >= 8000:
            prof["gravy_stage"] = 3
        elif prof["points"] >= 2500:
            prof["gravy_stage"] = 2
        else:
            prof["gravy_stage"] = 1
            
        self.save()

    def check_achievements(self, wpm, acc, combo, blind_mode=False):
        prof = self.get_profile()
        ach = prof["achievements"]
        newly_unlocked = []

        if acc >= 100.0 and not ach.get("flawless_run"):
            ach["flawless_run"] = True
            newly_unlocked.append("Dedo de Acero (100% Precisión)")
        
        if wpm >= 30 and not ach.get("speed_demon_30"):
            ach["speed_demon_30"] = True
            newly_unlocked.append("Velocidad de Banda Ancha (30+ WPM)")

        if wpm >= 50 and not ach.get("speed_demon_50"):
            ach["speed_demon_50"] = True
            newly_unlocked.append("Velocidad Fibra Óptica (50+ WPM)")

        if wpm >= 70 and not ach.get("speed_demon_70"):
            ach["speed_demon_70"] = True
            newly_unlocked.append("Sobrecarga Neuronal (70+ WPM)")

        if wpm >= 90 and not ach.get("speed_demon_90"):
            ach["speed_demon_90"] = True
            newly_unlocked.append("Velocidad Cuántica (90+ WPM)")

        if combo >= 50 and not ach.get("combo_master_50"):
            ach["combo_master_50"] = True
            newly_unlocked.append("Combo Sincronizado (50 racha)")

        if combo >= 100 and not ach.get("combo_master_100"):
            ach["combo_master_100"] = True
            newly_unlocked.append("Flujo Holográfico (100 racha)")

        if blind_mode and not ach.get("blind_master"):
            ach["blind_master"] = True
            newly_unlocked.append("Hacker Ciego (Completar lección sin teclado visual)")

        if newly_unlocked:
            self.save()
            
        return newly_unlocked

import json
import os
from datetime import datetime

SAVE_FILE = os.path.join(os.path.expanduser("~"), ".gravy_revolution_save.json")

class SaveManager:
    """Sistema multi-perfil, mapa de calor, telemetría y desbloqueos para V2."""

    def __init__(self, filepath=SAVE_FILE):
        self.filepath = filepath
        self.data = self._load()

    def _default_profile(self, name="Operator"):
        return {
            "name": name,
            "created_at": datetime.now().isoformat(),
            "points": 0,
            "xp": 0,
            "level": 1,
            "gravy_stage": 1,
            "active_title": "Script Kiddie",
            "active_cyberdeck": "deck_mk1",
            "active_laser_skin": "cyan",
            "active_gravy_skin": "classic",
            "active_theme": "cyberpunk_neon",
            "active_switch": "blue",
            "owned_decks": ["deck_mk1"],
            "owned_lasers": ["cyan"],
            "owned_gravy_skins": ["classic"],
            "owned_themes": ["cyberpunk_neon"],
            "owned_switches": ["blue"],
            "installed_chips": [],
            "subsector_difficulty": {}, # {"1.1": 4, "1.2": 2, ...}
            "unlocked_skills": [],      # ["emp_nova", "time_overclock", "nano_shield"]
            "campaign_progress": {
                "sector_1": {"unlocked": True, "stars": {}, "boss_beaten": False},
                "sector_2": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "sector_3": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "sector_4": {"unlocked": False, "stars": {}, "boss_beaten": False},
                "sector_5": {"unlocked": False, "stars": {}, "boss_beaten": False},
            },
            "weak_keys": {},
            "stats": {
                "total_keystrokes": 0,
                "total_errors": 0,
                "drones_destroyed": 0,
                "bosses_defeated": 0,
                "best_wpm": 0.0,
                "best_combo": 0,
                "sessions_played": 0,
                "blind_sessions_completed": 0
            },
            "achievements": {
                "first_sync": True,
                "drone_hunter_10": False,
                "drone_hunter_100": False,
                "laser_master": False,
                "speed_40": False,
                "speed_60": False,
                "speed_80": False,
                "combo_50": False,
                "combo_100": False,
                "sector_1_clear": False,
                "sector_5_clear": False,
                "cyber_blindfold": False
            }
        }

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Asegurar campos nuevos en perfiles existentes
                    for p in data.get("profiles", {}).values():
                        p.setdefault("subsector_difficulty", {})
                        p.setdefault("unlocked_skills", [])
                    return data
            except Exception:
                pass
        prof = self._default_profile("Operator")
        return {"active_profile": "Operator", "profiles": {"Operator": prof}}

    def save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"[SAVE ERROR]: {e}")
            return False

    def get_profile(self):
        active = self.data.get("active_profile", "Operator")
        if active not in self.data["profiles"]:
            self.data["profiles"][active] = self._default_profile(active)
        return self.data["profiles"][active]

    def add_points(self, amount, xp=None):
        prof = self.get_profile()
        prof["points"] += amount
        gain_xp = amount if xp is None else xp
        prof["xp"] += gain_xp
        prof["level"] = 1 + (prof["xp"] // 2500)

        # Escalamiento calibrado de GRAVY (1 a 5)
        pts = prof["points"]
        if pts >= 80000:
            prof["gravy_stage"] = 5
        elif pts >= 40000:
            prof["gravy_stage"] = 4
        elif pts >= 18000:
            prof["gravy_stage"] = 3
        elif pts >= 5000:
            prof["gravy_stage"] = 2
        else:
            prof["gravy_stage"] = 1
        self.save()

    def record_key(self, char, is_error):
        char = char.lower()
        wk = self.get_profile().setdefault("weak_keys", {})
        if char not in wk:
            wk[char] = {"attempts": 0, "errors": 0}
        wk[char]["attempts"] += 1
        if is_error:
            wk[char]["errors"] += 1

    def get_heat_ratio(self, char):
        char = char.lower()
        wk = self.get_profile().get("weak_keys", {})
        if char in wk and wk[char]["attempts"] >= 3:
            return min(1.0, wk[char]["errors"] / wk[char]["attempts"])
        return 0.0

    def check_achievements(self, wpm, acc, combo, blind_mode=False):
        prof = self.get_profile()
        ach = prof["achievements"]
        newly_unlocked = []

        if wpm >= 40 and not ach.get("speed_40"):
            ach["speed_40"] = True
            newly_unlocked.append("Reflejos de Banda Ancha (40+ WPM)")
        if wpm >= 60 and not ach.get("speed_60"):
            ach["speed_60"] = True
            newly_unlocked.append("Sobrecarga Cuántica (60+ WPM)")
        if wpm >= 80 and not ach.get("speed_80"):
            ach["speed_80"] = True
            newly_unlocked.append("Velocidad Dios AGI (80+ WPM)")
        if combo >= 50 and not ach.get("combo_50"):
            ach["combo_50"] = True
            newly_unlocked.append("Sincronización Neural (50x Combo)")
        if combo >= 100 and not ach.get("combo_100"):
            ach["combo_100"] = True
            newly_unlocked.append("Flujo Holográfico Infinito (100x Combo)")
        if blind_mode and not ach.get("cyber_blindfold"):
            ach["cyber_blindfold"] = True
            newly_unlocked.append("Hacker Ciego (Completar con Velo Negro)")

        if newly_unlocked:
            self.save()
        return newly_unlocked

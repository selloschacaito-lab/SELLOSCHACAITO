import pygame
import numpy as np
import math

class SoundEngine:
    """Generador y mezclador de audio sintetizado estéreo de alta definición para Pygame."""

    def __init__(self):
        self.enabled = True
        self.music_volume = 0.6
        self.sfx_volume = 0.8
        self.switch_type = "blue"
        self.cached_sounds = {}
        
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            self.has_audio = True
            self._pregenerate_sounds()
        except Exception as e:
            print(f"[AUDIO WARN] No se pudo inicializar el mezclador de audio: {e}")
            self.has_audio = False

    def _generate_tone(self, freq=440.0, duration=0.08, wave_type="sine", decay=True):
        if not self.has_audio:
            return None
        sr = 44100
        n_samples = int(sr * duration)
        t = np.linspace(0, duration, n_samples, False)

        if wave_type == "sine":
            wave = np.sin(2 * np.pi * freq * t)
        elif wave_type == "square":
            wave = np.sign(np.sin(2 * np.pi * freq * t))
        elif wave_type == "sawtooth":
            wave = 2.0 * (t * freq - np.floor(t * freq + 0.5))
        elif wave_type == "noise":
            wave = np.random.uniform(-1, 1, n_samples)
        else:
            wave = np.sin(2 * np.pi * freq * t)

        if decay:
            envelope = np.exp(-t * (4.0 / max(0.01, duration)))
            wave = wave * envelope

        audio = (wave * 32767 * self.sfx_volume).astype(np.int16)
        stereo = np.column_stack((audio, audio))
        return pygame.sndarray.make_sound(stereo)

    def _pregenerate_sounds(self):
        # Switches mecánicos
        self.cached_sounds["switch_blue"] = self._generate_tone(1800, 0.02, "square")
        self.cached_sounds["switch_brown"] = self._generate_tone(1100, 0.025, "sine")
        self.cached_sounds["switch_red"] = self._generate_tone(650, 0.02, "sine")
        self.cached_sounds["switch_panda"] = self._generate_tone(420, 0.035, "sawtooth")
        self.cached_sounds["switch_ibm"] = self._generate_tone(2200, 0.03, "square")
        self.cached_sounds["switch_laser"] = self._generate_tone(2800, 0.04, "sawtooth")

        # Efectos de combate
        self.cached_sounds["laser_fire"] = self._generate_tone(1400, 0.06, "sawtooth")
        self.cached_sounds["drone_hit"] = self._generate_tone(320, 0.09, "noise")
        self.cached_sounds["error_buzz"] = self._generate_tone(180, 0.12, "square")
        self.cached_sounds["combo_chime"] = self._generate_tone(1200, 0.08, "sine")
        self.cached_sounds["boss_alarm"] = self._generate_tone(400, 0.15, "sawtooth")
        self.cached_sounds["shield_down"] = self._generate_tone(150, 0.2, "noise")

    def play_switch_click(self):
        if not self.enabled or not self.has_audio:
            return
        s_key = f"switch_{self.switch_type}"
        snd = self.cached_sounds.get(s_key, self.cached_sounds.get("switch_blue"))
        if snd:
            snd.set_volume(self.sfx_volume)
            snd.play()

    def play_laser(self):
        if self.enabled and self.has_audio:
            snd = self.cached_sounds.get("laser_fire")
            if snd:
                snd.set_volume(self.sfx_volume * 0.7)
                snd.play()

    def play_hit(self):
        if self.enabled and self.has_audio:
            snd = self.cached_sounds.get("drone_hit")
            if snd:
                snd.set_volume(self.sfx_volume)
                snd.play()

    def play_error(self):
        if self.enabled and self.has_audio:
            snd = self.cached_sounds.get("error_buzz")
            if snd:
                snd.set_volume(self.sfx_volume)
                snd.play()

    def play_combo(self, streak=10):
        if self.enabled and self.has_audio:
            freq = min(2200, 900 + streak * 25)
            snd = self._generate_tone(freq, 0.06, "sine")
            if snd:
                snd.set_volume(self.sfx_volume * 0.8)
                snd.play()

    def play_boss_alert(self):
        if self.enabled and self.has_audio:
            snd = self.cached_sounds.get("boss_alarm")
            if snd:
                snd.set_volume(self.sfx_volume)
                snd.play()

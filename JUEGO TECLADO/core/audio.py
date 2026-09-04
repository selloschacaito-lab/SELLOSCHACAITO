import os
import sys
import time
import threading

# Intentar usar winsound en Windows para audio sin latencia
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

class AudioManager:
    """Gestor de efectos de sonido sintetizados y switches mecánicos para terminal."""
    
    def __init__(self, enabled=True, volume=1.0, switch_type="blue"):
        self.enabled = enabled
        self.volume = volume  # 0.0 a 1.0
        self.switch_type = switch_type  # blue, brown, red
        
        # Frecuencias para switches mecánicos y sintetizadores de audio
        self.switch_freqs = {
            "blue": (1800, 15),       # Cherry MX Blue (Clicky nítido agudo)
            "brown": (1200, 12),      # Cherry MX Brown (Táctil balanceado)
            "red": (750, 10),         # Cherry MX Red (Lineal suave grave)
            "panda": (550, 20),       # Holy Panda (Thock profundo premium)
            "ibm": (2200, 25),        # IBM Beam Spring (Vintage 70s terminal)
            "laser": (3200, 10),      # Cyber Laser Beam SFX (Disparo láser)
        }

    def _play_tone_async(self, freq, duration_ms):
        if not self.enabled or not HAS_WINSOUND:
            return
        
        def _worker():
            try:
                # Ajustar frecuencia y duración básica
                f = max(37, min(32767, int(freq)))
                d = max(1, int(duration_ms))
                winsound.Beep(f, d)
            except Exception:
                pass
        
        t = threading.Thread(target=_worker, daemon=True)
        t.start()

    def play_key_click(self):
        """Sonido de pulsación correcta según el switch seleccionado."""
        if not self.enabled:
            return
        freq, dur = self.switch_freqs.get(self.switch_type, (1600, 15))
        self._play_tone_async(freq, dur)

    def play_error_buzz(self):
        """Sonido de error / fallo de tecla."""
        if not self.enabled:
            return
        self._play_tone_async(220, 70)  # Tono grave de advertencia

    def play_combo_chime(self, streak=10):
        """Sonido armónico de racha/combo."""
        if not self.enabled:
            return
        base_freq = min(2400, 1000 + (streak * 15))
        self._play_tone_async(base_freq, 25)

    def play_level_complete(self):
        """Fanfarria sintetizada al completar un nivel."""
        if not self.enabled or not HAS_WINSOUND:
            return
        
        def _fanfare():
            try:
                notes = [(523, 80), (659, 80), (784, 80), (1046, 160)]
                for freq, dur in notes:
                    winsound.Beep(freq, dur)
                    time.sleep(0.02)
            except Exception:
                pass
        
        t = threading.Thread(target=_fanfare, daemon=True)
        t.start()

    def play_boss_attack(self):
        """Efecto sonoro de ataque del jefe."""
        if not self.enabled:
            return
        self._play_tone_async(350, 90)

    def play_boss_damage(self):
        """Efecto sonoro cuando el jugador daña al jefe."""
        if not self.enabled:
            return
        self._play_tone_async(1400, 40)

    def play_boss_victory(self):
        """Fanfarria épica al derrotar a un Boss."""
        if not self.enabled or not HAS_WINSOUND:
            return
        
        def _victory():
            try:
                notes = [(440, 70), (554, 70), (659, 70), (880, 120), (1108, 200)]
                for freq, dur in notes:
                    winsound.Beep(freq, dur)
                    time.sleep(0.02)
            except Exception:
                pass
        
        t = threading.Thread(target=_victory, daemon=True)
        t.start()

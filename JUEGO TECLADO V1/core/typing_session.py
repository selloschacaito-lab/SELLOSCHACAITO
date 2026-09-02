import time

class TypingSession:
    """Calcula y gestiona las métricas de escritura en tiempo real."""

    def __init__(self, target_text, strict_mode=True):
        self.target_text = target_text
        self.strict_mode = strict_mode
        self.current_idx = 0
        self.start_time = None
        self.end_time = None
        self.total_keypresses = 0
        self.correct_keypresses = 0
        self.errors = 0
        self.current_combo = 0
        self.max_combo = 0
        self.error_positions = set()
        self.typed_chars = []
        self.is_completed = False

    def start(self):
        if self.start_time is None:
            self.start_time = time.time()

    def process_key(self, char):
        """Procesa una pulsación de tecla y actualiza las estadísticas."""
        if self.is_completed or self.current_idx >= len(self.target_text):
            return {"status": "done"}

        if self.start_time is None:
            self.start()

        self.total_keypresses += 1
        expected = self.target_text[self.current_idx]

        if char == expected:
            self.correct_keypresses += 1
            self.current_combo += 1
            if self.current_combo > self.max_combo:
                self.max_combo = self.current_combo
            
            self.typed_chars.append((char, True))
            self.current_idx += 1

            if self.current_idx >= len(self.target_text):
                self.end_time = time.time()
                self.is_completed = True
                return {"status": "completed", "char": char, "correct": True, "combo": self.current_combo}
            
            return {"status": "correct", "char": char, "correct": True, "combo": self.current_combo}
        else:
            self.errors += 1
            self.current_combo = 0
            self.error_positions.add(self.current_idx)

            if not self.strict_mode:
                self.typed_chars.append((char, False))
                self.current_idx += 1
                if self.current_idx >= len(self.target_text):
                    self.end_time = time.time()
                    self.is_completed = True
                    return {"status": "completed", "char": char, "correct": False, "combo": 0}

            return {"status": "error", "expected": expected, "typed": char, "correct": False, "combo": 0}

    def get_elapsed_seconds(self):
        if self.start_time is None:
            return 0.0
        end = self.end_time if self.end_time else time.time()
        return max(0.001, end - self.start_time)

    def get_wpm(self):
        elapsed_min = self.get_elapsed_seconds() / 60.0
        # 1 palabra estándar = 5 caracteres
        words = self.correct_keypresses / 5.0
        return round(words / elapsed_min, 1) if elapsed_min > 0 else 0.0

    def get_cpm(self):
        elapsed_min = self.get_elapsed_seconds() / 60.0
        return int(self.correct_keypresses / elapsed_min) if elapsed_min > 0 else 0

    def get_accuracy(self):
        if self.total_keypresses == 0:
            return 100.0
        acc = (self.correct_keypresses / self.total_keypresses) * 100.0
        return round(max(0.0, min(100.0, acc)), 1)

    def get_next_char(self):
        if self.current_idx < len(self.target_text):
            return self.target_text[self.current_idx]
        return None

    def calculate_score(self):
        """Calcula los puntos totales obtenidos en base a precisión, WPM y combo."""
        wpm = self.get_wpm()
        acc = self.get_accuracy()
        base_points = self.correct_keypresses * 10
        wpm_bonus = int(wpm * 15)
        accuracy_multiplier = (acc / 100.0) ** 2
        combo_bonus = self.max_combo * 5
        
        total = int((base_points + wpm_bonus + combo_bonus) * accuracy_multiplier)
        return max(0, total)

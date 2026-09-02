import random
from colorama import Fore, Style, Back
from game.campaign import CampaignManager

TECH_AI_WORDS = [
    "tensor", "gradient", "backprop", "matrix", "vector", "weights", "biases", "dataset",
    "prompt", "inference", "encoder", "decoder", "attention", "transformer", "quantum",
    "overfitting", "regularization", "softmax", "hyperparameter", "pipeline", "optimizer",
    "activation", "sigmoid", "recurrent", "convolutional", "latency", "throughput", "cluster"
]

class WeakKeysMode:
    """Genera ejercicios focalizados en las teclas con mayor tasa de error."""

    def __init__(self, renderer, storage, audio):
        self.renderer = renderer
        self.storage = storage
        self.audio = audio
        self.campaign_mgr = CampaignManager(renderer, storage, audio)

    def generate_practice_text(self, weak_keys, length=12):
        if not weak_keys:
            weak_keys = ["f", "j", "d", "k", "a", "s"]

        chosen_words = []
        for _ in range(length):
            # Priorizar palabras que contengan las letras débiles
            matching = [w for w in TECH_AI_WORDS if any(k in w for k in weak_keys)]
            if matching:
                chosen_words.append(random.choice(matching))
            else:
                # Si no hay match exacto, generar repetición rítmica de teclas
                k_group = "".join(random.sample(weak_keys, min(3, len(weak_keys))))
                chosen_words.append(k_group * 2)

        return " ".join(chosen_words)

    def run(self):
        profile = self.storage.get_profile()
        worst = self.storage.get_worst_keys(top_n=5)
        
        self.renderer.clear()
        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        self.renderer.draw_header("MODO: ENTRENAMIENTO DE TECLAS DÉBILES", profile)

        if not worst:
            print(f"\n {acc}Aún no tienes suficientes errores registrados en el mapa de calor.{rst}")
            print(f" {pri}Generando entrenamiento con las teclas clave de la Fila Guía...{rst}\n")
            worst = ["a", "s", "d", "f", "j", "k", "l", "ñ"]
        else:
            print(f"\n {Fore.RED + Style.BRIGHT}MAPA DE CALOR DETECTADO:{rst}")
            print(f" {pri}Tus teclas con mayor índice de fallo son: {acc}{', '.join(worst).upper()}{rst}\n")
            print(f" {sec}GRAVY ha generado un protocolo de refuerzo neuromuscular personalizado.{rst}\n")

        practice_text = self.generate_practice_text(worst, length=15)
        lesson_data = {
            "id": "WEAK_KEYS",
            "title": f"Refuerzo Neuronal: [{', '.join(worst).upper()}]",
            "text": practice_text,
            "target_wpm": 20,
            "target_acc": 92
        }

        print(f" {pri}Presiona cualquier tecla para comenzar la práctica...{rst}")
        self.campaign_mgr.get_key()
        self.campaign_mgr.run_lesson("weak_keys", lesson_data, show_keyboard=True)

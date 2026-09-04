from game.campaign import CampaignManager

BENCHMARK_TEXT_60 = (
    "Artificial intelligence is transforming every facet of modern engineering. "
    "To program efficient machine learning pipelines, developers must master neural architectures, "
    "matrix multiplications, and prompt optimization. True speed comes from flawless touch typing "
    "without ever looking down at the keyboard."
)

class BenchmarkMode:
    """Modo Benchmark / Speedrun de velocidad estándar (30s, 60s, 120s)."""

    def __init__(self, renderer, storage, audio):
        self.renderer = renderer
        self.storage = storage
        self.audio = audio
        self.campaign_mgr = CampaignManager(renderer, storage, audio)

    def run(self):
        profile = self.storage.get_profile()
        self.renderer.clear()
        self.renderer.draw_header("MODO: BENCHMARK SPEEDRUN (PRUEBA OFICIAL DE WPM)", profile)

        pri = self.renderer.c("primary")
        sec = self.renderer.c("secondary")
        acc = self.renderer.c("accent")
        rst = "\033[0m"

        print(f"\n {sec}PRUEBA ESTÁNDAR DE ANCHO DE BANDA MOTRIZ{rst}")
        print(f" {pri}Escribe el siguiente párrafo técnico de referencia para registrar tu récord oficial.{rst}")
        print(f" {pri}Tu mejor WPM actual: {acc}{profile['stats']['best_wpm']:.1f} WPM{rst}\n")

        lesson_data = {
            "id": "BENCHMARK_60",
            "title": "Benchmark Oficial de Mecanografía IA",
            "text": BENCHMARK_TEXT_60,
            "target_wpm": 40,
            "target_acc": 95
        }

        print(f" {acc}Presiona cualquier tecla para iniciar el cronómetro...{rst}")
        self.campaign_mgr.get_key()
        self.campaign_mgr.run_lesson("benchmark", lesson_data, show_keyboard=True)

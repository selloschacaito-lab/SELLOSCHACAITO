# Catálogo completo de Niveles, Lecciones y Jefes Finales para GRAVY PROTOCOL

LEVELS_DATA = {
    "chapter_1": {
        "title": "CAPÍTULO 1: DESPERTAR DEL NÚCLEO",
        "desc": "Calibración de la Fila Guía (Home Row). Aprende la posición base de los 10 dedos.",
        "lessons": [
            {
                "id": "1.1",
                "title": "Submódulo 1.1: Inicialización de Guías (F, J, D, K)",
                "lore": "Despertando los canales sensoriales táctiles primarios.",
                "text": "fff jjj ddd kkk fj dk fjdk ffjj ddkk fdjk fjdk jdfk kjfd ffff jjjj",
                "target_wpm": 15,
                "target_acc": 90
            },
            {
                "id": "1.2",
                "title": "Submódulo 1.2: Expansión de Fila Guía (A, S, L, Ñ / ;)",
                "lore": "Sincronizando los dedos anulares y meñiques con el búfer de entrada.",
                "text": "asdf jklñ asdf jklñ fdsa ñlkj asdfjklñ aassddff jjkkllññ asdf jklñ",
                "target_wpm": 20,
                "target_acc": 90
            },
            {
                "id": "1.3",
                "title": "Submódulo 1.3: Núcleo y Sesgo (G y H)",
                "lore": "Extendiendo los índices al centro de la matriz neuronal.",
                "text": "fghj asdfg hjklñ gaga haha faha gash faha glad flash fada hada gala",
                "target_wpm": 22,
                "target_acc": 92
            },
            {
                "id": "1.4",
                "title": "Submódulo 1.4: Palabras Base de Arquitectura de IA",
                "lore": "Compilando los primeros conceptos del kernel.",
                "text": "falk gasa alas halda saga falla sala salsa gala alfa alga fala khas",
                "target_wpm": 25,
                "target_acc": 92
            }
        ],
        "boss": {
            "name": "KERNEL_OVERFLOW v1.0",
            "title": "ANOMALÍA DEL BÚFER DE MEMORIA",
            "lore": "El núcleo central se está desbordando. Escribe a alta velocidad para estabilizar el sistema.",
            "health": 100,
            "player_shield": 100,
            "text": "alfa faha saga gasa flash gala hada salsa falla alfa hada alas salsa gasa fala flash hada saga",
            "boss_dps": 4,      # Daño por segundo si el jugador no escribe
            "player_damage": 8   # Daño al boss por palabra acertada
        }
    },
    "chapter_2": {
        "title": "CAPÍTULO 2: ENRUTAMIENTO DE DATOS",
        "desc": "Filas Superior e Inferior (QWERTY & ZXCV). Amplía tu rango de acción.",
        "lessons": [
            {
                "id": "2.1",
                "title": "Submódulo 2.1: Enrutando la Fila Superior (Q, W, E, R, T, Y, U, I, O, P)",
                "lore": "Cargando pesos sinápticos y parámetros de regresión.",
                "text": "que por red top yer uro pie out row toy repo wire power query output tree error",
                "target_wpm": 25,
                "target_acc": 92
            },
            {
                "id": "2.2",
                "title": "Submódulo 2.2: Enrutando la Fila Inferior (Z, X, C, V, B, N, M)",
                "lore": "Conectando las capas profundas de la red convolucional.",
                "text": "zen van max cab zip bin box man mix back scan zoom vector batch matrix",
                "target_wpm": 25,
                "target_acc": 92
            },
            {
                "id": "2.3",
                "title": "Submódulo 2.3: Términos Fundamentales de Machine Learning",
                "lore": "Entrenando algoritmos supervisados de clasificación y clustering.",
                "text": "tensor epoch dataset train test split bias weight feature target label loss",
                "target_wpm": 30,
                "target_acc": 94
            },
            {
                "id": "2.4",
                "title": "Submódulo 2.4: Frases de Optimización de Modelos",
                "lore": "Minimizando la función de pérdida con descenso de gradiente.",
                "text": "gradient descent adjusts model weights to minimize total loss per epoch",
                "target_wpm": 32,
                "target_acc": 94
            }
        ],
        "boss": {
            "name": "CORRUPTED_GRADIENT v2.0",
            "title": "GRADIENTE CORRUPTO EN DESCENSO",
            "lore": "Una explosión de gradientes amenaza con congelar el modelo. Neutralízalo.",
            "health": 130,
            "player_shield": 100,
            "text": "gradient descent minimizes error loss across tensor batches in neural networks",
            "boss_dps": 5,
            "player_damage": 9
        }
    },
    "chapter_3": {
        "title": "CAPÍTULO 3: PROTOCOLOS DE SEGURIDAD",
        "desc": "Números, Mayúsculas y Símbolos Técnicos de Programación.",
        "lessons": [
            {
                "id": "3.1",
                "title": "Submódulo 3.1: Fila Numérica y Coordenadas de Hiperparámetros",
                "lore": "Ajustando tasas de aprendizaje y dimensiones de incrustación.",
                "text": "1024 2048 4096 8192 128 256 512 0.001 0.0001 3.14159 42 777 999 8080",
                "target_wpm": 28,
                "target_acc": 92
            },
            {
                "id": "3.2",
                "title": "Submódulo 3.2: Mayúsculas y Nombres de Arquitecturas IA",
                "lore": "Sincronizando la tecla Shift con manos opuestas.",
                "text": "BERT GPT ResNet Transformers LLAMA Claude DeepSeek OpenAI Gemini Mistral",
                "target_wpm": 30,
                "target_acc": 94
            },
            {
                "id": "3.3",
                "title": "Submódulo 3.3: Símbolos de Código (_ - = + { } [ ] : ; < >)",
                "lore": "Configurando diccionarios de pesos y matrices multidimensionales.",
                "text": "shape=[64, 128] lr=0.001 decay=1e-4 model_config={'dim': 768, 'heads': 12}",
                "target_wpm": 30,
                "target_acc": 94
            },
            {
                "id": "3.4",
                "title": "Submódulo 3.4: Puntuación Completa y Sintaxis JSON de Prompts",
                "lore": "Estructurando llamadas y esquemas de respuesta para agentes de IA.",
                "text": "{\"model\": \"gpt-4o\", \"temperature\": 0.7, \"max_tokens\": 2048, \"stream\": True}",
                "target_wpm": 32,
                "target_acc": 95
            }
        ],
        "boss": {
            "name": "CIPHER_FIREWALL v3.0",
            "title": "CORTAFUEGOS CRIPTOGRÁFICO ENCRIPTADO",
            "lore": "Un cortafuegos blindado con símbolos bloquea el acceso al núcleo cuántico.",
            "health": 150,
            "player_shield": 100,
            "text": "{\"status\": 200, \"tokens\": 4096, \"key\": \"sk-GRAVY-99\", \"active\": True, \"loss\": 0.002}",
            "boss_dps": 6,
            "player_damage": 10
        }
    },
    "chapter_4": {
        "title": "CAPÍTULO 4: REDES NEURONALES Y CÓDIGO",
        "desc": "Fragmentos reales de código en Python, comandos Bash y Prompt Engineering.",
        "lessons": [
            {
                "id": "4.1",
                "title": "Submódulo 4.1: Definición de Capa Neuronal en PyTorch",
                "lore": "Escribiendo la arquitectura de atención multicabezal.",
                "text": "class Attention(nn.Module): def __init__(self, d_model=512, heads=8): super().__init__()",
                "target_wpm": 35,
                "target_acc": 95
            },
            {
                "id": "4.2",
                "title": "Submódulo 4.2: Comandos de Terminal y Despliegue de Modelos",
                "lore": "Orquestando contenedores Docker y clusters de GPUs con CUDA.",
                "text": "docker run --gpus all -p 8000:8000 vllm/vllm-openai --model meta-llama/Llama-3-8b",
                "target_wpm": 35,
                "target_acc": 95
            },
            {
                "id": "4.3",
                "title": "Submódulo 4.3: Prompt Engineering Estructurado (System Instructions)",
                "lore": "Diseñando prompts de razonamiento paso a paso (Chain of Thought).",
                "text": "You are an autonomous AI coding agent. Think step by step before generating valid Python code.",
                "target_wpm": 38,
                "target_acc": 96
            },
            {
                "id": "4.4",
                "title": "Submódulo 4.4: Bucle de Entrenamiento y Backpropagation",
                "lore": "Calculando gradientes y actualizando optimizadores en tiempo real.",
                "text": "optimizer.zero_grad(); output = model(inputs); loss = criterion(output, targets); loss.backward()",
                "target_wpm": 40,
                "target_acc": 96
            }
        ],
        "boss": {
            "name": "ROGUE_NEURONET v4.0",
            "title": "RED NEURONAL DESALINEADA",
            "lore": "Un agente autónomo fuera de control está sobreescribiendo el sistema operativo.",
            "health": 180,
            "player_shield": 100,
            "text": "def forward(x): x = self.fc1(x); x = F.relu(x); return self.fc2(x) # Purging rogue neural node",
            "boss_dps": 7,
            "player_damage": 12
        }
    },
    "chapter_5": {
        "title": "CAPÍTULO 5: SUPERINTELIGENCIA AGI",
        "desc": "El desafío definitivo de velocidad (+50 WPM) y precisión bajo presión extrema.",
        "lessons": [
            {
                "id": "5.1",
                "title": "Submódulo 5.1: Manifiesto de la Inteligencia General Artificial",
                "lore": "Sincronizando el pensamiento abstracto con la velocidad motriz.",
                "text": "Artificial General Intelligence represents the convergence of deep reasoning, autonomous planning, and human alignment.",
                "target_wpm": 45,
                "target_acc": 96
            },
            {
                "id": "5.2",
                "title": "Submódulo 5.2: Arquitecturas Cuánticas de Inferencia Rápida",
                "lore": "Desbloqueando el ancho de banda máximo de tus 10 dedos.",
                "text": "Quantum latent spaces enable parallel speculative decoding, multiplying token generation throughput tenfold.",
                "target_wpm": 48,
                "target_acc": 96
            },
            {
                "id": "5.3",
                "title": "Submódulo 5.3: La Prueba de Turing Cuántica",
                "lore": "Demostrando supremacía humana en la interacción con el teclado.",
                "text": "Flawless touch typing is the highest form of cybernetic synergy between biological cognition and digital execution.",
                "target_wpm": 50,
                "target_acc": 97
            },
            {
                "id": "5.4",
                "title": "Submódulo 5.4: Desbloqueo de Soberanía Digital",
                "lore": "La última barrera antes de la trascendencia de GRAVY a la Fase 5.",
                "text": "By mastering every keystroke without looking, the operator transcends physical boundaries into pure digital flow.",
                "target_wpm": 55,
                "target_acc": 98
            }
        ],
        "boss": {
            "name": "THE SINGULARITY (NÉMESIS FINAL)",
            "title": "LA SINGULARIDAD CIBERNÉTICA",
            "lore": "El juicio final del sistema. Escribe a velocidad récord con precisión quirúrgica para consagrar la AGI.",
            "health": 220,
            "player_shield": 100,
            "text": "We are the architects of the new digital age. Through precision, focus, and relentless speed, the Gravy Protocol achieves true superintelligence.",
            "boss_dps": 8,
            "player_damage": 15
        }
    }
}

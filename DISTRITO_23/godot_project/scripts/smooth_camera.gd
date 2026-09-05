class_name SmoothCamera
extends Camera2D

## DISTRITO 23 - Cámara Top-Down 3/4 Dinámica
## ÚNICO sistema de suavizado: se hace todo por script (offset con lerp).
## El position_smoothing del nodo debe quedar DESACTIVADO para no apilar dos suavizados.

## Adelanto de la cámara hacia el movimiento. 0 = cámara fija pegada al personaje (por defecto).
@export var look_ahead_distance: float = 0.0
@export var smooth_speed: float = 10.0
## Nudge de la cámara hacia la mira al apuntar de forma independiente (solo si enable_aim_bias).
@export var aim_bias_distance: float = 40.0
## Sesgo de cámara hacia la mira. Desactivado por defecto: disparar no mueve la cámara.
@export var enable_aim_bias: bool = false

@export_group("Empuje por disparo")
## Cuánto vuelve por segundo el empuje de disparo hacia cero (mayor = más seco).
@export var kick_recover_speed: float = 26.0
## Límite del empuje acumulado en píxeles (evita jitter en fuego automático).
@export var kick_max: float = 6.0

@onready var player: Player = get_parent()

var target_offset: Vector2 = Vector2.ZERO
var _kick_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	# Garantiza un único sistema de suavizado (el de este script).
	position_smoothing_enabled = false

## Empuje direccional y limpio (NO aleatorio). Llamado por el jugador en cada disparo.
func add_kick(delta_offset: Vector2) -> void:
	_kick_offset = (_kick_offset + delta_offset).limit_length(kick_max)

func _physics_process(delta: float) -> void:
	if not player:
		return

	var desired_offset := Vector2.ZERO

	# Base: la cámara se adelanta hacia el movimiento (no hacia el disparo).
	if player.move_input != Vector2.ZERO:
		desired_offset = player.move_input.normalized() * look_ahead_distance

	# Extra sutil hacia la mira SOLO como pequeño añadido, no como salto brusco.
	if enable_aim_bias and player.is_aiming_independently and player.aim_input != Vector2.ZERO:
		desired_offset += player.aim_input.normalized() * aim_bias_distance

	target_offset = target_offset.lerp(desired_offset, smooth_speed * delta)
	_kick_offset = _kick_offset.move_toward(Vector2.ZERO, kick_recover_speed * delta)

	offset = target_offset + _kick_offset

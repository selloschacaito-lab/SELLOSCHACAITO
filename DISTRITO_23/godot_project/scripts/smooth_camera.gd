class_name SmoothCamera
extends Camera2D

## DISTRITO 23 - Cámara Top-Down 3/4 Dinámica
## Se adelanta suavemente hacia el movimiento y hacia la mira

@export var look_ahead_distance: float = 120.0
@export var smooth_speed: float = 6.0
@export var aim_bias_distance: float = 80.0

@onready var player: Player = get_parent()

var target_offset: Vector2 = Vector2.ZERO

func _physics_process(delta: float) -> void:
	if not player:
		return
	
	var desired_offset = Vector2.ZERO
	
	# Si está apuntando independientemente, sesgar hacia la mira
	if player.is_aiming_independently and player.aim_input != Vector2.ZERO:
		desired_offset = player.aim_input.normalized() * (look_ahead_distance + aim_bias_distance)
	elif player.move_input != Vector2.ZERO:
		desired_offset = player.move_input.normalized() * look_ahead_distance
	
	target_offset = target_offset.lerp(desired_offset, smooth_speed * delta)
	offset = target_offset

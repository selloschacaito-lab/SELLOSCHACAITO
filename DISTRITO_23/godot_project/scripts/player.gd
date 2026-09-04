class_name Player
extends CharacterBody2D

## DISTRITO 23 - Script Modular del Jugador
## Coordina locomoción, orientación anclada y apuntado híbrido

@export_group("Movimiento")
@export var speed: float = 340.0
@export var acceleration: float = 1800.0
@export var friction: float = 2200.0

@export_group("Apuntado")
@export var rotation_speed: float = 18.0

# Referencias internas
@onready var visual: Node2D = $Visual
@onready var weapon: Node2D = $Visual/WeaponHolder/Pistol
@onready var camera: Camera2D = $Camera2D

# Estados
var move_input: Vector2 = Vector2.ZERO
var aim_input: Vector2 = Vector2.ZERO
var is_aiming_independently: bool = false
var last_facing_direction: Vector2 = Vector2.RIGHT

func _ready() -> void:
	last_facing_direction = Vector2.RIGHT

func _physics_process(delta: float) -> void:
	handle_locomotion(delta)
	handle_aim_and_rotation(delta)
	move_and_slide()

## Manejo de locomoción desacoplado
func handle_locomotion(delta: float) -> void:
	# Leer input (joystick táctil o teclado WASD)
	if move_input != Vector2.ZERO:
		velocity = velocity.move_toward(move_input * speed, acceleration * delta)
		if not is_aiming_independently:
			last_facing_direction = move_input.normalized()
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

## Manejo de orientación anclada vs independiente
func handle_aim_and_rotation(delta: float) -> void:
	var target_dir: Vector2
	
	if is_aiming_independently and aim_input != Vector2.ZERO:
		# Modo desacoplado: mira hacia donde apunta el botón derecho
		target_dir = aim_input.normalized()
	else:
		# Modo anclado: mira hacia donde se mueve o última dirección
		target_dir = last_facing_direction

	if target_dir != Vector2.ZERO:
		var target_angle = target_dir.angle()
		visual.rotation = lerp_angle(visual.rotation, target_angle, rotation_speed * delta)

## Recibe comando de disparo (llamado desde HUD o Mouse)
func fire_weapon() -> void:
	if weapon and weapon.has_method("shoot"):
		weapon.shoot(visual.rotation)

## Setters llamados por el HUD táctil o Controller
func set_move_vector(vec: Vector2) -> void:
	move_input = vec

func set_aim_vector(vec: Vector2, active: bool) -> void:
	aim_input = vec
	is_aiming_independently = active

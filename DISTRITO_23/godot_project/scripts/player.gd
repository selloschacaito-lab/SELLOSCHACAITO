class_name Player
extends CharacterBody2D

## DISTRITO 23 - Script Modular del Jugador
## Coordina locomoción, orientación anclada y apuntado híbrido

@export_group("Movimiento")
@export var speed: float = 340.0
## Aceleración alta = arranque casi inmediato, sin sensación resbaladiza.
@export var acceleration: float = 4500.0
## Fricción alta = el personaje se detiene en seco al soltar el control.
@export var friction: float = 6000.0

@export_group("Apuntado")
@export var rotation_speed: float = 18.0
## Zona muerta común para joysticks analógicos (táctil y gamepad).
@export_range(0.0, 0.5, 0.01) var stick_deadzone: float = 0.15

@export_group("Feedback de disparo")
## Retroceso visual del arma en píxeles (hacia atrás en el eje del cañón). 0 = desactivado.
@export var recoil_kick: float = 0.0
## Velocidad a la que el arma vuelve a su sitio tras el retroceso.
@export var recoil_recover_speed: float = 40.0
## Empuje direccional de cámara por disparo, en píxeles (hacia atrás del tiro). 0 = desactivado.
@export var camera_kick: float = 0.0

@export_group("Supervivencia")
## Segundos que tarda el jugador en reaparecer tras morir (placeholder hasta checkpoints).
@export var respawn_delay: float = 1.2

# Referencias internas
@onready var visual: Node2D = $Visual
@onready var sprite: Sprite2D = $Visual/Sprite2D
@onready var weapon_holder: Node2D = $Visual/WeaponHolder
@onready var weapon: Node2D = $Visual/WeaponHolder/Pistol
@onready var camera: Camera2D = $Camera2D
@onready var health: HealthComponent = $HealthComponent

# Estados
var move_input: Vector2 = Vector2.ZERO
var aim_input: Vector2 = Vector2.ZERO
var is_aiming_independently: bool = false
var last_facing_direction: Vector2 = Vector2.RIGHT

# Retroceso
var _weapon_base_pos: Vector2 = Vector2.ZERO
var _recoil_offset: float = 0.0

# Supervivencia
var _spawn_position: Vector2 = Vector2.ZERO

func _ready() -> void:
	last_facing_direction = Vector2.RIGHT
	_weapon_base_pos = weapon_holder.position
	_spawn_position = global_position
	health.damaged.connect(_on_damaged)
	health.died.connect(_on_died)

func _physics_process(delta: float) -> void:
	# Muerto: se frena y no acepta control hasta reaparecer.
	if health.is_dead():
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		move_and_slide()
		return

	handle_locomotion(delta)
	handle_aim_and_rotation(delta)
	handle_recoil(delta)
	move_and_slide()

## Recarga el arma actual (llamado desde HUD, tecla R o gamepad).
func reload_weapon() -> void:
	if health.is_dead():
		return
	if weapon and weapon.has_method("start_reload"):
		weapon.start_reload()

## Recibe daño (llamado por balas, zonas de daño, etc.)
func take_damage(amount: float) -> void:
	health.apply_damage(amount)

func _on_damaged(_amount: float) -> void:
	_flash_damage()

func _flash_damage() -> void:
	if not is_instance_valid(sprite):
		return
	sprite.modulate = Color(2.5, 0.4, 0.4, 1.0)
	await get_tree().create_timer(0.09).timeout
	if is_instance_valid(sprite) and not health.is_dead():
		sprite.modulate = Color.WHITE

## Placeholder de muerte/reaparición (Fase 2.5 lo sustituirá por checkpoints).
func _on_died() -> void:
	velocity = Vector2.ZERO
	is_aiming_independently = false
	aim_input = Vector2.ZERO
	move_input = Vector2.ZERO
	visual.modulate = Color(0.35, 0.35, 0.4, 0.55)
	await get_tree().create_timer(respawn_delay).timeout
	global_position = _spawn_position
	velocity = Vector2.ZERO
	visual.modulate = Color.WHITE
	if is_instance_valid(sprite):
		sprite.modulate = Color.WHITE
	health.full_restore()

func _unhandled_input(event: InputEvent) -> void:
	# Atajos de prueba solo en builds de depuración: K = -15 daño, L = +25 vida, J = matar.
	if not OS.is_debug_build():
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_K:
				take_damage(15.0)
			KEY_L:
				health.heal(25.0)
			KEY_J:
				take_damage(9999.0)

## Manejo de locomoción desacoplado
func handle_locomotion(delta: float) -> void:
	# Leer input (joystick táctil, WASD o stick izquierdo de gamepad)
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
		# Modo desacoplado: mira hacia donde apunta el control derecho
		target_dir = aim_input.normalized()
	else:
		# Modo anclado: mira hacia donde se mueve o última dirección
		target_dir = last_facing_direction

	if target_dir != Vector2.ZERO:
		var target_angle = target_dir.angle()
		visual.rotation = lerp_angle(visual.rotation, target_angle, rotation_speed * delta)

## Recupera suavemente el arma tras el retroceso
func handle_recoil(delta: float) -> void:
	if _recoil_offset != 0.0:
		_recoil_offset = move_toward(_recoil_offset, 0.0, recoil_recover_speed * delta)
	weapon_holder.position = _weapon_base_pos + Vector2(-_recoil_offset, 0.0)

## Dirección real hacia la que se debe disparar (sin lag de interpolación)
func get_fire_angle() -> float:
	if is_aiming_independently and aim_input != Vector2.ZERO:
		# Apuntado desacoplado: dispara EXACTO hacia la mira, no hacia el sprite girando
		return aim_input.angle()
	return visual.rotation

## Recibe comando de disparo (llamado desde HUD, Mouse o Gamepad)
func fire_weapon() -> void:
	if health.is_dead():
		return
	if weapon and weapon.has_method("shoot"):
		var did_fire: bool = weapon.shoot(get_fire_angle())
		if did_fire:
			_apply_recoil()

## Aplica retroceso visual del arma + empuje direccional de cámara (sin jitter aleatorio)
func _apply_recoil() -> void:
	_recoil_offset = recoil_kick
	if camera_kick > 0.0 and camera and camera.has_method("add_kick"):
		var shot_dir := Vector2.RIGHT.rotated(get_fire_angle())
		camera.add_kick(-shot_dir * camera_kick)

## Setters llamados por el HUD táctil, Mouse o Gamepad
func set_move_vector(vec: Vector2) -> void:
	move_input = _apply_deadzone(vec)

func set_aim_vector(vec: Vector2, active: bool) -> void:
	if active:
		aim_input = _apply_deadzone(vec)
		is_aiming_independently = aim_input != Vector2.ZERO
	else:
		aim_input = Vector2.ZERO
		is_aiming_independently = false

## Zona muerta radial con re-escalado (respuesta analógica limpia desde 0)
func _apply_deadzone(vec: Vector2) -> Vector2:
	var mag: float = vec.length()
	if mag < stick_deadzone:
		return Vector2.ZERO
	var scaled: float = (mag - stick_deadzone) / (1.0 - stick_deadzone)
	return vec.normalized() * clampf(scaled, 0.0, 1.0)

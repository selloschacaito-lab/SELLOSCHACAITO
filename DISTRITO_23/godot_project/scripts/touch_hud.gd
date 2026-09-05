class_name TouchHUD
extends CanvasLayer

## DISTRITO 23 - Entrada unificada en pantalla + PC + Gamepad
## Prioridad: Táctil > Gamepad > Teclado/Ratón
## La zona muerta analógica se aplica de forma central en player.gd (stick_deadzone).

@onready var joystick_base: Control = $JoystickLeft/Base
@onready var joystick_knob: Control = $JoystickLeft/Base/Knob
@onready var shoot_btn: Control = $ShootButtonRight/ButtonVisual
@onready var shoot_ring: Control = $ShootButtonRight/AimRing

var player: Player

# Estado Joystick izquierdo (táctil)
var joystick_active: bool = false
var joystick_center: Vector2
var joystick_max_radius: float = 80.0
var joystick_touch_index: int = -1

# Estado Botón derecho (táctil)
var shoot_active: bool = false
var shoot_center: Vector2
var shoot_drag_vector: Vector2 = Vector2.ZERO
var shoot_touch_index: int = -1
var is_dragging_aim: bool = false
var drag_threshold: float = 25.0

# Estado Gamepad
var _gamepad_moving: bool = false
var _gamepad_aiming: bool = false
## Umbral de intención del stick derecho para entrar en apuntado desacoplado.
@export var gamepad_aim_threshold: float = 0.25
## Umbral del gatillo derecho (RT) para disparar.
@export var gamepad_trigger_threshold: float = 0.15

func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	if shoot_ring:
		shoot_ring.visible = false

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		handle_screen_drag(event)

# --------------------------------------------------------------------------
# TÁCTIL
# --------------------------------------------------------------------------
func handle_screen_touch(event: InputEventScreenTouch) -> void:
	var screen_width := get_viewport().get_visible_rect().size.x

	if event.pressed:
		# Zona izquierda: Joystick de movimiento
		if event.position.x < screen_width * 0.5 and joystick_touch_index == -1:
			joystick_touch_index = event.index
			joystick_active = true
			joystick_base.global_position = event.position - (joystick_base.size * 0.5)
			joystick_center = event.position
			joystick_knob.position = joystick_base.size * 0.5

		# Zona derecha: Disparo y apuntado híbrido
		elif event.position.x >= screen_width * 0.5 and shoot_touch_index == -1:
			shoot_touch_index = event.index
			shoot_active = true
			shoot_center = event.position
			is_dragging_aim = false
			shoot_drag_vector = Vector2.ZERO
			if shoot_ring:
				shoot_ring.visible = true
				shoot_ring.global_position = event.position - (shoot_ring.size * 0.5)
			# Tap: dispara de inmediato en la orientación actual
			if player:
				player.fire_weapon()
	else:
		if event.index == joystick_touch_index:
			joystick_touch_index = -1
			joystick_active = false
			joystick_knob.position = joystick_base.size * 0.5
			if player:
				player.set_move_vector(Vector2.ZERO)

		elif event.index == shoot_touch_index:
			shoot_touch_index = -1
			shoot_active = false
			is_dragging_aim = false
			if shoot_ring:
				shoot_ring.visible = false
			# Al soltar: retorno inmediato al modo anclado a la marcha
			if player:
				player.set_aim_vector(Vector2.ZERO, false)

func handle_screen_drag(event: InputEventScreenDrag) -> void:
	if event.index == joystick_touch_index:
		var offset := event.position - joystick_center
		var clamped := offset.limit_length(joystick_max_radius)
		joystick_knob.position = (joystick_base.size * 0.5) + clamped
		if player:
			player.set_move_vector(clamped / joystick_max_radius)

	elif event.index == shoot_touch_index:
		var offset := event.position - shoot_center
		if offset.length() > drag_threshold:
			is_dragging_aim = true
			shoot_drag_vector = offset.normalized()
			if player:
				player.set_aim_vector(shoot_drag_vector, true)

# --------------------------------------------------------------------------
# BUCLE DE ENTRADA (táctil hold + gamepad + teclado/ratón)
# --------------------------------------------------------------------------
func _process(_delta: float) -> void:
	if not player:
		return

	# Fuego continuo mientras se mantiene el botón táctil derecho
	if shoot_active:
		player.fire_weapon()

	var gamepad_used := _poll_gamepad()
	_poll_keyboard_mouse(gamepad_used)

	if Input.is_action_just_pressed("ui_cancel"):
		get_tree().quit()

## Devuelve true si el gamepad está gobernando movimiento o apuntado ahora mismo.
func _poll_gamepad() -> bool:
	var pads := Input.get_connected_joypads()
	if pads.is_empty():
		return false

	var dev: int = pads[0]
	var move := Vector2(
		Input.get_joy_axis(dev, JOY_AXIS_LEFT_X),
		Input.get_joy_axis(dev, JOY_AXIS_LEFT_Y))
	var aim := Vector2(
		Input.get_joy_axis(dev, JOY_AXIS_RIGHT_X),
		Input.get_joy_axis(dev, JOY_AXIS_RIGHT_Y))
	var rt := Input.get_joy_axis(dev, JOY_AXIS_TRIGGER_RIGHT)
	var firing := rt > gamepad_trigger_threshold \
		or Input.is_joy_button_pressed(dev, JOY_BUTTON_RIGHT_SHOULDER)

	var active := false

	# Movimiento (stick izquierdo) — el táctil tiene prioridad
	if not joystick_active:
		if move.length() > 0.05:
			player.set_move_vector(move)
			_gamepad_moving = true
			active = true
		elif _gamepad_moving:
			player.set_move_vector(Vector2.ZERO)
			_gamepad_moving = false

	# Apuntado (stick derecho) — el táctil tiene prioridad
	if not shoot_active:
		if aim.length() > gamepad_aim_threshold:
			player.set_aim_vector(aim, true)
			_gamepad_aiming = true
			active = true
			if firing:
				player.fire_weapon()
		else:
			if _gamepad_aiming:
				player.set_aim_vector(Vector2.ZERO, false)
				_gamepad_aiming = false
			if firing:
				# RT sin mover el stick: dispara en la orientación anclada
				player.fire_weapon()
				active = true

	return active

func _poll_keyboard_mouse(gamepad_used: bool) -> void:
	# Movimiento WASD (si no manda ni el táctil ni el gamepad)
	if not joystick_active and not _gamepad_moving:
		var kb := Vector2(
			Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
			Input.get_action_strength("move_down") - Input.get_action_strength("move_up"))
		player.set_move_vector(kb)

	if gamepad_used:
		return

	# Ratón: apuntar/disparar (si no manda el táctil ni el gamepad)
	if not shoot_active and not _gamepad_aiming:
		if Input.is_action_pressed("shoot"):
			var to_mouse := player.get_global_mouse_position() - player.global_position
			if to_mouse.length() > 1.0:
				player.set_aim_vector(to_mouse.normalized(), true)
			player.fire_weapon()
		else:
			player.set_aim_vector(Vector2.ZERO, false)

class_name TouchHUD
extends CanvasLayer

## DISTRITO 23 - Controles táctiles en pantalla para Android
## Joystick Virtual Izquierdo + Botón Híbrido Derecho (Tap / Hold / Hold & Drag)

@onready var joystick_base: Control = $JoystickLeft/Base
@onready var joystick_knob: Control = $JoystickLeft/Base/Knob
@onready var shoot_btn: Control = $ShootButtonRight/ButtonVisual
@onready var shoot_ring: Control = $ShootButtonRight/AimRing

var player: Player

# Estado Joystick izquierdo
var joystick_active: bool = false
var joystick_center: Vector2
var joystick_max_radius: float = 80.0
var joystick_touch_index: int = -1

# Estado Botón derecho
var shoot_active: bool = false
var shoot_center: Vector2
var shoot_drag_vector: Vector2 = Vector2.ZERO
var shoot_touch_index: int = -1
var is_dragging_aim: bool = false
var drag_threshold: float = 25.0

func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	if shoot_ring:
		shoot_ring.visible = false

func _unhandled_input(event: InputEvent) -> void:
	# Soporte Touch (Android)
	if event is InputEventScreenTouch:
		handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		handle_screen_drag(event)
	
	# Soporte PC Mouse / Teclado para pruebas
	handle_pc_input(event)

func handle_screen_touch(event: InputEventScreenTouch) -> void:
	var screen_width = get_viewport().get_visible_rect().size.x
	
	if event.pressed:
		# Zona izquierda: Joystick movimiento
		if event.position.x < screen_width * 0.5 and joystick_touch_index == -1:
			joystick_touch_index = event.index
			joystick_active = true
			joystick_base.global_position = event.position - (joystick_base.size * 0.5)
			joystick_center = event.position
			joystick_knob.position = joystick_base.size * 0.5
		
		# Zona derecha: Disparo y apuntado
		elif event.position.x >= screen_width * 0.5 and shoot_touch_index == -1:
			shoot_touch_index = event.index
			shoot_active = true
			shoot_center = event.position
			is_dragging_aim = false
			shoot_drag_vector = Vector2.ZERO
			if shoot_ring:
				shoot_ring.visible = true
				shoot_ring.global_position = event.position - (shoot_ring.size * 0.5)
			# Disparar de inmediato al presionar (Tap)
			if player:
				player.fire_weapon()
	else:
		# Soltó dedo del joystick izquierdo
		if event.index == joystick_touch_index:
			joystick_touch_index = -1
			joystick_active = false
			joystick_knob.position = joystick_base.size * 0.5
			if player:
				player.set_move_vector(Vector2.ZERO)
		
		# Soltó dedo del botón derecho
		elif event.index == shoot_touch_index:
			shoot_touch_index = -1
			shoot_active = false
			is_dragging_aim = false
			if shoot_ring:
				shoot_ring.visible = false
			if player:
				player.set_aim_vector(Vector2.ZERO, false)

func handle_screen_drag(event: InputEventScreenDrag) -> void:
	# Arrastre Joystick Izquierdo
	if event.index == joystick_touch_index:
		var offset = event.position - joystick_center
		var clamped = offset.limit_length(joystick_max_radius)
		joystick_knob.position = (joystick_base.size * 0.5) + clamped
		if player:
			player.set_move_vector(clamped / joystick_max_radius)
	
	# Arrastre Botón Derecho (Apuntado Desacoplado 360°)
	elif event.index == shoot_touch_index:
		var offset = event.position - shoot_center
		if offset.length() > drag_threshold:
			is_dragging_aim = true
			shoot_drag_vector = offset.normalized()
			if player:
				player.set_aim_vector(shoot_drag_vector, true)
				player.fire_weapon() # Fuego continuo mientras arrastra

func _process(_delta: float) -> void:
	# Fuego continuo si se mantiene presionado el botón táctil
	if shoot_active and player:
		player.fire_weapon()

## Controles de respaldo para probar en PC
func handle_pc_input(_event: InputEvent) -> void:
	if not player:
		return
	
	# Salir con ESC en PC
	if Input.is_key_pressed(KEY_ESCAPE):
		get_tree().quit()

	# WASD en PC
	var pc_dir = Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	)
	if pc_dir != Vector2.ZERO and not joystick_active:
		player.set_move_vector(pc_dir.normalized())
	elif not joystick_active:
		player.set_move_vector(Vector2.ZERO)

	# Click izquierdo para disparar hacia el mouse en PC
	if Input.is_action_pressed("shoot"):
		var mouse_pos = player.get_global_mouse_position()
		var dir_to_mouse = (mouse_pos - player.global_position).normalized()
		player.set_aim_vector(dir_to_mouse, true)
		player.fire_weapon()
	elif not shoot_active:
		player.set_aim_vector(Vector2.ZERO, false)

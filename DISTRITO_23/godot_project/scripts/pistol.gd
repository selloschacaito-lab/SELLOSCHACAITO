class_name Pistol
extends Node2D

## DISTRITO 23 - Pistola Base (Placeholder Fase 1)

@export var bullet_scene: PackedScene
@export var fire_rate: float = 0.22 # segundos entre disparos
@export var bullet_speed: float = 900.0
@export var bullet_damage: float = 25.0

@onready var muzzle: Marker2D = $Muzzle
@onready var muzzle_flash: Polygon2D = $Muzzle/Flash
@onready var cooldown_timer: Timer = $CooldownTimer

var can_shoot: bool = true

func _ready() -> void:
	cooldown_timer.wait_time = fire_rate
	cooldown_timer.one_shot = true
	cooldown_timer.timeout.connect(_on_cooldown_timeout)
	if muzzle_flash:
		muzzle_flash.visible = false

func shoot(current_rotation: float) -> void:
	if not can_shoot:
		return
	
	can_shoot = false
	cooldown_timer.start()
	
	# Efecto visual de disparo (muzzle flash)
	show_flash()
	
	# Instanciar proyectil
	if bullet_scene:
		var bullet = bullet_scene.instantiate()
		bullet.global_position = muzzle.global_position
		bullet.rotation = current_rotation
		bullet.speed = bullet_speed
		bullet.damage = bullet_damage
		get_tree().current_scene.add_child(bullet)
	else:
		# Fallback si no hay bala instanciada: raycast directo
		spawn_simple_bullet(current_rotation)

func spawn_simple_bullet(rot: float) -> void:
	var b = preload("res://scenes/bullet.tscn").instantiate()
	b.global_position = muzzle.global_position
	b.rotation = rot
	b.speed = bullet_speed
	b.damage = bullet_damage
	get_tree().current_scene.add_child(b)

func show_flash() -> void:
	if muzzle_flash:
		muzzle_flash.visible = true
		await get_tree().create_timer(0.04).timeout
		muzzle_flash.visible = false

func _on_cooldown_timeout() -> void:
	can_shoot = true

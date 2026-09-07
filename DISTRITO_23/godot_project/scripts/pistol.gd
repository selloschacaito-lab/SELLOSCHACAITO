class_name Pistol
extends Node2D

## DISTRITO 23 - Pistola base con munición y recarga (Fase 2)

signal ammo_changed(magazine: int, reserve: int)
signal reload_started(duration: float)
signal reload_finished

@export_group("Balística")
@export var bullet_scene: PackedScene
@export var fire_rate: float = 0.22 # segundos entre disparos
@export var bullet_speed: float = 900.0
@export var bullet_damage: float = 25.0

@export_group("Munición")
@export var magazine_size: int = 12
@export var reserve_ammo: int = 96
@export var reload_time: float = 1.1
## Recarga sola al vaciar el cargador (si queda reserva).
@export var auto_reload: bool = true

@onready var muzzle: Marker2D = $Muzzle
@onready var muzzle_flash: Polygon2D = $Muzzle/Flash
@onready var cooldown_timer: Timer = $CooldownTimer

var can_shoot: bool = true
var current_mag: int = 0
var is_reloading: bool = false

func _ready() -> void:
	cooldown_timer.wait_time = fire_rate
	cooldown_timer.one_shot = true
	cooldown_timer.timeout.connect(_on_cooldown_timeout)
	if muzzle_flash:
		muzzle_flash.visible = false
	current_mag = magazine_size
	call_deferred("_emit_ammo")

func _emit_ammo() -> void:
	ammo_changed.emit(current_mag, reserve_ammo)

## Devuelve true solo si realmente salió un disparo (para feedback/recoil).
func shoot(current_rotation: float) -> bool:
	if not can_shoot or is_reloading:
		return false

	if current_mag <= 0:
		# Cargador vacío: intenta recargar solo, pero este disparo no sale.
		if auto_reload:
			start_reload()
		return false

	can_shoot = false
	cooldown_timer.start()
	current_mag -= 1
	ammo_changed.emit(current_mag, reserve_ammo)

	show_flash()

	if bullet_scene:
		var bullet = bullet_scene.instantiate()
		bullet.global_position = muzzle.global_position
		bullet.rotation = current_rotation
		bullet.speed = bullet_speed
		bullet.damage = bullet_damage
		get_tree().current_scene.add_child(bullet)
	else:
		spawn_simple_bullet(current_rotation)

	if current_mag <= 0 and auto_reload:
		start_reload()
	return true

## Recarga manual o automática.
func start_reload() -> void:
	if is_reloading or current_mag >= magazine_size or reserve_ammo <= 0:
		return
	is_reloading = true
	reload_started.emit(reload_time)
	await get_tree().create_timer(reload_time).timeout
	if not is_instance_valid(self):
		return
	var needed: int = magazine_size - current_mag
	var taken: int = min(needed, reserve_ammo)
	current_mag += taken
	reserve_ammo -= taken
	is_reloading = false
	reload_finished.emit()
	ammo_changed.emit(current_mag, reserve_ammo)

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
		if is_instance_valid(muzzle_flash):
			muzzle_flash.visible = false

func _on_cooldown_timeout() -> void:
	can_shoot = true

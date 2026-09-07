class_name HealthComponent
extends Node

## DISTRITO 23 - Componente reutilizable de Vida + Escudo
## Regla de diseño: el escudo absorbe primero y se regenera tras unos segundos
## sin recibir daño; la vida NO se regenera sola (requiere botiquines/módulos).
## Se puede reutilizar tal cual en enemigos.

signal health_changed(current: float, maximum: float)
signal shield_changed(current: float, maximum: float)
signal damaged(amount: float)
signal died

@export_group("Vida")
@export var max_health: float = 100.0

@export_group("Escudo")
@export var max_shield: float = 50.0
## Segundos sin recibir daño antes de que el escudo empiece a regenerar.
@export var shield_regen_delay: float = 3.0
## Puntos de escudo regenerados por segundo.
@export var shield_regen_rate: float = 30.0

@export_group("Depuración")
@export var invulnerable: bool = false

var health: float
var shield: float

var _time_since_damage: float = 0.0
var _dead: bool = false

func _ready() -> void:
	health = max_health
	shield = max_shield
	# Emitir el estado inicial para que la HUD arranque sincronizada.
	call_deferred("_emit_initial")

func _emit_initial() -> void:
	health_changed.emit(health, max_health)
	shield_changed.emit(shield, max_shield)

func _process(delta: float) -> void:
	if _dead:
		return
	_time_since_damage += delta
	if shield < max_shield and _time_since_damage >= shield_regen_delay:
		shield = minf(max_shield, shield + shield_regen_rate * delta)
		shield_changed.emit(shield, max_shield)

## Aplica daño: primero al escudo, el sobrante a la vida.
func apply_damage(amount: float) -> void:
	if _dead or invulnerable or amount <= 0.0:
		return

	_time_since_damage = 0.0
	var remaining: float = amount

	if shield > 0.0:
		var absorbed: float = minf(shield, remaining)
		shield -= absorbed
		remaining -= absorbed
		shield_changed.emit(shield, max_shield)

	if remaining > 0.0:
		health = maxf(0.0, health - remaining)
		health_changed.emit(health, max_health)

	damaged.emit(amount)

	if health <= 0.0:
		_dead = true
		died.emit()

## Cura vida (no toca el escudo).
func heal(amount: float) -> void:
	if _dead or amount <= 0.0:
		return
	health = minf(max_health, health + amount)
	health_changed.emit(health, max_health)

## Restaura todo y revive (para checkpoints / reaparición).
func full_restore() -> void:
	_dead = false
	health = max_health
	shield = max_shield
	_time_since_damage = 0.0
	health_changed.emit(health, max_health)
	shield_changed.emit(shield, max_shield)

func is_dead() -> bool:
	return _dead

func get_health_ratio() -> float:
	return health / max_health if max_health > 0.0 else 0.0

func get_shield_ratio() -> float:
	return shield / max_shield if max_shield > 0.0 else 0.0

class_name DamageArea
extends Area2D

## DISTRITO 23 - Zona que inflige daño mientras un cuerpo con take_damage() esté dentro.
## Placeholder para probar Vida + Escudo (y base para barriles/fuego/gas en Fase 5).

@export var damage_per_second: float = 22.0
## Cada cuánto se aplica el daño acumulado (segundos).
@export var tick_interval: float = 0.4

var _bodies: Array[Node] = []
var _accum: float = 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node) -> void:
	if body.has_method("take_damage") and body not in _bodies:
		_bodies.append(body)

func _on_body_exited(body: Node) -> void:
	_bodies.erase(body)

func _process(delta: float) -> void:
	if _bodies.is_empty():
		return
	_accum += delta
	if _accum < tick_interval:
		return
	var dmg: float = damage_per_second * _accum
	_accum = 0.0
	for body in _bodies:
		if is_instance_valid(body) and body.has_method("take_damage"):
			body.take_damage(dmg)

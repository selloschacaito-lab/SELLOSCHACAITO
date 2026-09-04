class_name Bullet
extends Area2D

## Proyectil 2D con detección de colisión y tiempo de vida

var speed: float = 900.0
var damage: float = 25.0
var lifetime: float = 1.6

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	get_tree().create_timer(lifetime).timeout.connect(queue_free)

func _physics_process(delta: float) -> void:
	position += Vector2.RIGHT.rotated(rotation) * speed * delta

func _on_body_entered(body: Node2D) -> void:
	if body is Player:
		return
	if body.has_method("take_damage"):
		body.take_damage(damage)
	queue_free()

func _on_area_entered(area: Area2D) -> void:
	if area.has_method("take_damage"):
		area.take_damage(damage)
	queue_free()

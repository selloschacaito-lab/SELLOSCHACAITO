class_name DummyTarget
extends StaticBody2D

## Drone de entrenamiento que reacciona a los disparos con parpadeo y escala

@export var max_health: float = 100.0
var current_health: float = 100.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var eye_light: PointLight2D = $EyeLight

func _ready() -> void:
	current_health = max_health

func take_damage(amount: float) -> void:
	current_health -= amount
	flash_hit()
	if current_health <= 0:
		respawn()

func flash_hit() -> void:
	if sprite:
		sprite.modulate = Color(2.5, 0.3, 0.3, 1.0)
		if eye_light:
			eye_light.energy = 2.5
		await get_tree().create_timer(0.08).timeout
		sprite.modulate = Color(1.0, 1.0, 1.0, 1.0)
		if eye_light:
			eye_light.energy = 0.8

func respawn() -> void:
	current_health = max_health
	if sprite:
		var tween = create_tween()
		tween.tween_property(sprite, "scale", Vector2(1.3, 1.3), 0.08)
		tween.tween_property(sprite, "scale", Vector2(1.0, 1.0), 0.08)

shader_type canvas_item;

uniform vec4 puddle_color : source_color = vec4(0.02, 0.04, 0.08, 1.0);
uniform float wetness : hint_range(0.0, 1.0) = 0.7;

void fragment() {
    vec4 base_color = texture(TEXTURE, UV);
    // Tinte oscuro de asfalto mojado que resalta las luces de neón
    vec4 wet_mix = mix(base_color, puddle_color, wetness * 0.5);
    COLOR = wet_mix;
}

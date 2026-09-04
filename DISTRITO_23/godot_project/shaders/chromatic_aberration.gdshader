shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform float offset_amount : hint_range(0.0, 10.0) = 1.8;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.35;

void fragment() {
    vec2 uv = SCREEN_UV;
    vec2 offset = vec2(offset_amount * SCREEN_PIXEL_SIZE.x, 0.0);
    
    // Aberración cromática R, G, B
    float r = texture(screen_texture, uv + offset).r;
    float g = texture(screen_texture, uv).g;
    float b = texture(screen_texture, uv - offset).b;
    
    // Viñeta oscura en las esquinas
    vec2 coord = (uv - 0.5) * 2.0;
    float vignette = 1.0 - dot(coord, coord) * vignette_intensity;
    vignette = clamp(vignette, 0.0, 1.0);
    
    COLOR = vec4(vec3(r, g, b) * vignette, 1.0);
}

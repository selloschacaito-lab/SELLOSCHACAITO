// Shaders GLSL para DTF SEMITONO (ColorPop Halftones)

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = (aPosition + 1.0) * 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uScale;
  uniform float uAngle;
  uniform int uPatternType;
  uniform float uWaveFreq;
  uniform float uWaveAmp;
  uniform float uContrast;
  uniform float uBrightness;
  uniform float uFeather;
  uniform float uSaturation;

  uniform int uColorMode;
  uniform int uPaletteId;
  uniform vec3 uCustomInk;
  uniform vec3 uCustomPaper;

  uniform int uKnockoutMode;
  uniform float uKnockoutThresh;
  uniform float uKnockoutFeather;
  uniform int uInvert;

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec2 rotate(vec2 pt, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(pt.x * c - pt.y * s, pt.x * s + pt.y * c);
  }

  vec3 getPaletteColor(int paletteId, float t) {
    t = clamp(t, 0.0, 1.0);
    if (paletteId == 0) {
      if (t < 0.33) return mix(vec3(0.08, 0.12, 0.28), vec3(0.85, 0.18, 0.22), t / 0.33);
      else if (t < 0.66) return mix(vec3(0.85, 0.18, 0.22), vec3(0.96, 0.52, 0.11), (t - 0.33) / 0.33);
      else return mix(vec3(0.96, 0.52, 0.11), vec3(0.98, 0.88, 0.35), (t - 0.66) / 0.34);
    } else if (paletteId == 1) {
      if (t < 0.33) return mix(vec3(0.24, 0.08, 0.24), vec3(0.80, 0.12, 0.35), t / 0.33);
      else if (t < 0.66) return mix(vec3(0.80, 0.12, 0.35), vec3(0.94, 0.44, 0.15), (t - 0.33) / 0.33);
      else return mix(vec3(0.94, 0.44, 0.15), vec3(0.98, 0.84, 0.24), (t - 0.66) / 0.34);
    } else if (paletteId == 2) {
      if (t < 0.5) return mix(vec3(0.04, 0.05, 0.18), vec3(0.0, 0.92, 0.95), t / 0.5);
      else return mix(vec3(0.0, 0.92, 0.95), vec3(1.0, 0.08, 0.58), (t - 0.5) / 0.5);
    } else if (paletteId == 3) {
      if (t < 0.45) return mix(vec3(0.10, 0.15, 0.40), vec3(0.85, 0.12, 0.12), t / 0.45);
      else return mix(vec3(0.85, 0.12, 0.12), vec3(0.96, 0.93, 0.82), (t - 0.45) / 0.55);
    } else {
      return mix(vec3(0.12, 0.08, 0.04), vec3(0.95, 0.75, 0.30), t);
    }
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 centeredUv = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 rotCoord = rotate(centeredUv, uAngle);

    vec2 gridPos = rotCoord * uScale;
    vec2 cellCoord = fract(gridPos) - 0.5;
    vec2 cellIndex = floor(gridPos);

    vec2 cellCenterRot = (cellIndex + 0.5) / uScale;
    vec2 cellCenterAspect = rotate(cellCenterRot, -uAngle);
    vec2 sampleUv = (cellCenterAspect / vec2(aspect, 1.0)) + 0.5;
    sampleUv = clamp(sampleUv, 0.0, 1.0);

    vec4 sampledPix = texture2D(uTexture, sampleUv);
    vec4 continuousPix = texture2D(uTexture, vUv);

    if (continuousPix.a < 0.01) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec3 hsv = rgb2hsv(sampledPix.rgb);
    hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);
    vec3 popColor = hsv2rgb(hsv);

    float lum = dot(popColor, vec3(0.299, 0.587, 0.114));
    lum = clamp((lum - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);

    // Cobertura de tinta según modo
    float inkDensity;
    if (uKnockoutMode == 1) {
      // Para prenda oscura (Knockout Black):
      // Las luces y colores llevan tinta
      inkDensity = (uInvert == 1) ? (1.0 - lum) : lum;
    } else {
      // Para prenda clara o papel blanco:
      // Las sombras llevan tinta
      inkDensity = (uInvert == 1) ? lum : (1.0 - lum);
    }
    inkDensity = clamp(inkDensity, 0.02, 0.98);

    float inInk = 0.0;
    float feather = max(uFeather, 0.005);

    if (uPatternType == 0) {
      float dist = length(cellCoord);
      float maxRadius = 0.707;
      float targetRadius = sqrt(inkDensity) * maxRadius;
      inInk = 1.0 - smoothstep(targetRadius - feather, targetRadius + feather, dist);
    } else if (uPatternType == 1) {
      float x = gridPos.x;
      float y = gridPos.y;
      float wave = sin(x * uWaveFreq * 0.1) * uWaveAmp;
      float distToLine = abs(fract(y + wave) - 0.5);
      float halfWidth = inkDensity * 0.5;
      inInk = 1.0 - smoothstep(halfWidth - feather, halfWidth + feather, distToLine);
    } else if (uPatternType == 2) {
      float x = gridPos.x;
      float y = gridPos.y;
      float wave1 = sin(x * uWaveFreq * 0.1) * uWaveAmp;
      float dist1 = abs(fract(y + wave1) - 0.5);

      float wave2 = cos(y * uWaveFreq * 0.1) * uWaveAmp;
      float dist2 = abs(fract(x + wave2) - 0.5);

      float halfWidth = inkDensity * 0.5;
      float inInk1 = 1.0 - smoothstep(halfWidth - feather, halfWidth + feather, dist1);
      float inInk2 = 1.0 - smoothstep(halfWidth - feather, halfWidth + feather, dist2);
      inInk = max(inInk1, inInk2);
    } else if (uPatternType == 3) {
      float y = gridPos.y;
      float distToLine = abs(fract(y) - 0.5);
      float halfWidth = inkDensity * 0.5;
      inInk = 1.0 - smoothstep(halfWidth - feather, halfWidth + feather, distToLine);
    } else if (uPatternType == 4) {
      float manhattanDist = abs(cellCoord.x) + abs(cellCoord.y);
      float targetDist = inkDensity * 0.9;
      inInk = 1.0 - smoothstep(targetDist - feather, targetDist + feather, manhattanDist);
    }

    vec3 inkColor = popColor;
    vec3 paperColor = vec3(1.0);

    if (uColorMode == 1) {
      inkColor = getPaletteColor(uPaletteId, lum);
      paperColor = getPaletteColor(uPaletteId, (uInvert == 1) ? 0.05 : 0.95);
    } else if (uColorMode == 2) {
      inkColor = uCustomInk;
      paperColor = uCustomPaper;
    } else if (uColorMode == 3) {
      inkColor = vec3(0.0);
      paperColor = vec3(1.0);
    }

    vec3 finalRgb = mix(paperColor, inkColor, inInk);
    float finalAlpha = continuousPix.a;

    if (uKnockoutMode == 0) {
      // 0: Fondo sólido
      finalAlpha = continuousPix.a;
    } else if (uKnockoutMode == 1) {
      // 1: Knockout Black (Prendas oscuras)
      float kAlpha = smoothstep(uKnockoutThresh - uKnockoutFeather, uKnockoutThresh + uKnockoutFeather, lum);
      finalAlpha = continuousPix.a * inInk * kAlpha;
      finalRgb = inkColor;
    } else if (uKnockoutMode == 2) {
      // 2: Knockout White (Prendas claras)
      float kAlpha = 1.0 - smoothstep(uKnockoutThresh - uKnockoutFeather, uKnockoutThresh + uKnockoutFeather, lum);
      finalAlpha = continuousPix.a * inInk * kAlpha;
      finalRgb = inkColor;
    } else if (uKnockoutMode == 3) {
      // 3: Solo Tinta
      finalAlpha = continuousPix.a * inInk;
      finalRgb = inkColor;
    }

    gl_FragColor = vec4(finalRgb, finalAlpha);
  }
`;

window.HalftoneShaders = {
  VERTEX_SHADER,
  FRAGMENT_SHADER
};

import type { IVibeShader } from '../types';

const shader: IVibeShader = {
  scale: 0.6,
  frag: `
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1347, 0.1173, 0.1219));
  q += dot(q, q.yzx + 27.41);
  return fract((q.x + q.y) * q.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 q = p;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(q);
    q = q * vec2(2.1, 1.9) + vec2(3.1, 7.3);
    a *= 0.5;
  }
  return v;
}

vec3 stars(vec2 p, float dens, float t, float px, float thr) {
  vec2 g = p * dens;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = vec2(hash(id + 13.7), hash(id + 41.3)) - 0.5;
  float d = length(f - o * 0.5);
  float r = dens * px * 0.8;
  float s = exp(-d * d / (r * r)) * step(thr, h);
  float b = clamp((h - thr) / (1.0 - thr), 0.0, 1.0);
  float tw = 1.0 - u_motion * 0.3 * (0.5 + 0.5 * sin(t * (0.5 + b) + h * 80.0));
  vec3 c = mix(vec3(0.86, 0.9, 1.0), vec3(1.0, 0.91, 0.77), hash(id + 5.3));
  return c * s * tw * (0.3 + 0.7 * b);
}

float cloud(vec2 p, float t) {
  float env = smoothstep(0.36, 0.48, p.y) * (1.0 - smoothstep(0.82, 0.97, p.y));
  float n = fbm(vec2(p.x * 1.2 + t * 0.004, p.y * 5.5 + 3.0));
  float band = 0.5 + 0.5 * sin(p.y * 22.0 + n * 3.0);
  return smoothstep(0.5, 0.8, n * (0.75 + 0.35 * band)) * env;
}

vec3 sky(vec2 p, float A, float t, float refl) {
  float H = 0.3;
  float px = 1.0 / u_res.y;
  float R = mix(0.03, 0.042, smoothstep(0.5, 1.6, A));
  vec2 sun = vec2(-0.3 * A, mix(H + 0.065, H - R * 1.3, u_night));
  float h = clamp((p.y - H) / (1.0 - H), 0.0, 1.0);
  float sdist = length((p - sun) * vec2(1.0, 1.08));
  float sunGlow = exp(-length((p - sun) * vec2(0.55, 1.4)) * 2.4);
  float az = exp(-abs(p.x - sun.x) * 1.4);

  vec3 dark = mix(vec3(0.42, 0.16, 0.3), vec3(0.16, 0.08, 0.26), smoothstep(0.0, 0.3, h));
  dark = mix(dark, vec3(0.035, 0.035, 0.11), smoothstep(0.25, 0.95, h));
  vec3 hzD = mix(vec3(0.5, 0.24, 0.38), vec3(0.96, 0.52, 0.32), az);
  dark = mix(dark, hzD, exp(-h * mix(14.0, 7.0, az)));
  dark += vec3(1.0, 0.55, 0.35) * 0.3 * sunGlow;

  vec3 light = mix(vec3(1.0, 0.83, 0.56), vec3(0.99, 0.86, 0.75), smoothstep(0.0, 0.45, h));
  light = mix(light, vec3(0.98, 0.88, 0.84), smoothstep(0.45, 1.0, h));
  vec3 hzL = mix(vec3(1.0, 0.8, 0.58), vec3(1.0, 0.76, 0.44), az);
  light = mix(light, hzL, exp(-h * mix(9.0, 5.0, az)));
  light = mix(light, vec3(1.0, 0.92, 0.66), 0.6 * sunGlow);

  vec3 st = stars(p, 60.0, t, px, 0.9) * smoothstep(0.35, 0.75, h) * (1.0 - sunGlow);
  vec2 vd = p - vec2(sun.x + 0.07, 0.74);
  float v2 = dot(vd, vd);
  st += vec3(1.0, 0.95, 0.85) * (exp(-v2 / (px * px * 2.6)) + exp(-v2 / (px * px * 16.0)) * 0.15);
  dark += st * (1.0 - refl * 0.5);

  float disc = (1.0 - smoothstep(R - px, R + px, sdist)) * (1.0 - refl);
  float bloom = exp(-sdist / (R * 1.2)) * 0.6 + exp(-sdist / (R * 5.0)) * 0.25;
  dark += vec3(1.0, 0.72, 0.45) * bloom * 0.8;
  dark = mix(dark, vec3(1.0, 0.86, 0.66), disc);
  float bloomL = exp(-sdist / (R * 1.8)) * 0.75 + exp(-sdist / (R * 8.0)) * 0.45;
  light = mix(light, vec3(1.0, 0.86, 0.55), clamp(bloomL * 0.8, 0.0, 0.85));
  light = mix(light, vec3(1.0, 0.97, 0.86), clamp(exp(-sdist / (R * 0.9)) * 0.8, 0.0, 1.0));
  vec3 face = mix(vec3(1.0, 0.99, 0.94), vec3(1.0, 0.86, 0.58), smoothstep(R * 0.5, R, sdist));
  light = mix(light, face, disc);

  float c0 = cloud(p, t);
  float c1 = cloud(p + vec2(0.0, 0.022), t);
  float L = clamp(0.45 + (c1 - c0) * 2.2, 0.0, 1.0);
  float lowK = 1.0 - smoothstep(0.4, 0.85, p.y);
  float warm = clamp(az * 0.8 + sunGlow, 0.0, 1.0);
  vec3 litD = mix(vec3(0.85, 0.32, 0.42), vec3(1.0, 0.68, 0.4), warm) * mix(0.45, 0.85, lowK);
  vec3 shD = mix(vec3(0.09, 0.05, 0.16), vec3(0.24, 0.1, 0.24), lowK);
  vec3 cD = mix(shD, litD, L * L * (0.6 + 0.4 * warm));
  vec3 litL = mix(vec3(1.0, 0.74, 0.74), vec3(1.0, 0.78, 0.56), warm);
  litL = mix(litL, vec3(1.0, 0.92, 0.7), sunGlow * 0.5);
  vec3 shL = mix(vec3(0.96, 0.84, 0.84), vec3(0.97, 0.86, 0.8), lowK);
  vec3 cL = mix(shL, litL, smoothstep(0.3, 0.9, L));
  dark = mix(dark, cD, c0 * 0.9);
  light = mix(light, cL, c0 * 0.8);
  return mix(light, dark, u_night);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float A = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * A, uv.y);
  float t = u_time;
  float H = 0.3;
  float sx = -0.3 * A;
  float az = exp(-abs(p.x - sx) * 1.4);
  float depth = H - p.y;
  vec3 col = vec3(0.0);
  if (depth <= 0.0) {
    col = sky(p, A, t, 0.0);
  } else {
    float k = 1.0 / (depth + 0.035);
    float wv = vnoise(vec2(p.x * k * 0.55, k * 1.9 - t * 0.28));
    float wv2 = vnoise(vec2(p.x * k * 1.6 + 7.0, k * 4.8 - t * 0.42));
    float rip = (wv - 0.5) + (wv2 - 0.5) * 0.5 * smoothstep(0.04, 0.14, depth);
    float amp = 0.6 + 0.4 * u_motion;
    vec2 q = vec2(p.x + rip * 0.015 * smoothstep(0.02, 0.12, depth), 2.0 * H - p.y + rip * depth * depth * 1.4 * amp);
    vec3 refl = sky(q, A, t, 1.0);
    float fres = smoothstep(0.0, H, depth);
    vec3 seaD = mix(vec3(0.23, 0.1, 0.25), vec3(0.07, 0.035, 0.1), fres);
    vec3 seaL = mix(vec3(1.0, 0.82, 0.62), vec3(0.96, 0.8, 0.76), fres);
    vec3 baseD = mix(refl * 0.7, seaD, 0.35 + 0.4 * fres);
    vec3 baseL = mix(refl, seaL, 0.3 + 0.3 * fres);
    float shade = rip * 0.12 * smoothstep(0.03, 0.1, depth);
    baseD *= 1.0 + shade * 1.4;
    baseL *= 1.0 + shade * 0.35;

    float w = 0.012 + depth * 0.55;
    float dx = (p.x - sx) / w;
    float path = exp(-dx * dx);
    float s1 = vnoise(vec2(p.x * k * 8.0, p.y * 160.0 - t * 1.2));
    float s2 = vnoise(vec2(p.x * k * 5.0 + 31.0 + t * 0.3, p.y * 110.0 + t * 0.8));
    float glint = smoothstep(0.42, 0.78, s1 * s2) * smoothstep(0.0, 0.03, depth);
    float streak = exp(-depth * 60.0) * exp(-dx * dx * 0.25);
    float sparkD = path * 0.18 + glint * (path * 0.9 + 0.05) + streak * 0.5;
    vec3 seaDc = baseD + vec3(1.0, 0.62, 0.42) * sparkD * 0.7;
    vec3 seaLc = mix(baseL, vec3(1.0, 0.8, 0.42), clamp(path * 0.45 + streak * 0.5, 0.0, 0.7));
    seaLc = mix(seaLc, vec3(1.0, 0.97, 0.84), clamp(glint * (path * 1.1 + 0.06), 0.0, 1.0));
    col = mix(seaLc, seaDc, u_night);
  }
  float hy = (p.y - H) / 0.025;
  float haze = exp(-hy * hy) * (0.35 + 0.65 * az);
  col = mix(col, mix(vec3(1.0, 0.86, 0.66), vec3(0.95, 0.55, 0.4), u_night), haze * 0.35);
  float edge = exp(-abs(depth) * u_res.y * 0.5) * (0.3 + 0.7 * az);
  col += mix(vec3(0.12, 0.1, 0.04), vec3(1.0, 0.82, 0.62) * 0.4, u_night) * edge;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

export default shader;

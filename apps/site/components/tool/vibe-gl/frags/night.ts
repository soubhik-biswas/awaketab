import type { IVibeShader } from '../types';

const shader: IVibeShader = {
  scale: 0.75,
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

float vnoise1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(vec2(i, 17.0)), hash(vec2(i + 1.0, 17.0)), u);
}

float hills(float x) {
  float v = 0.0;
  float a = 0.55;
  float y = x;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise1(y);
    y = y * 2.13 + 3.7;
    a *= 0.42;
  }
  return v;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(q);
    q = q * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float below(float y, float h, float px) {
  return 1.0 - smoothstep(h - px, h + px, y);
}

vec3 starTint(float h) {
  vec3 c = vec3(0.76, 0.85, 1.0);
  c = mix(c, vec3(1.0, 0.98, 0.95), step(0.3, h));
  c = mix(c, vec3(1.0, 0.89, 0.72), step(0.72, h));
  c = mix(c, vec3(0.84, 0.77, 1.0), step(0.9, h));
  return c;
}

vec3 stars(vec2 r, float dens, float t, float px, float thr, float seed) {
  vec2 g = r * dens;
  vec2 id = floor(g) + seed;
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = vec2(hash(id + 13.7), hash(id + 41.3)) - 0.5;
  float d = length(f - o * 0.5);
  float big = pow(hash(id + 71.9), 7.0);
  float rad = dens * px * (0.65 + 1.3 * big);
  float s = exp(-d * d / (rad * rad)) * step(thr, h);
  float b = clamp((h - thr) / (1.0 - thr), 0.0, 1.0);
  float tw = 1.0 - u_motion * 0.3 * (0.5 + 0.5 * sin(t * (0.5 + b * 1.3) + h * 90.0));
  return starTint(hash(id + 5.3)) * s * tw * (0.25 + 0.75 * b) * (1.0 + big);
}

vec3 windows(vec2 p, float hm, float tx, float A, float t, float px) {
  vec2 cell = vec2(0.0105, 0.0082);
  vec2 g = p / cell;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id + 300.0);
  vec2 o = vec2(hash(id + 11.0), hash(id + 23.0)) - 0.5;
  vec2 w = (f - o * 0.3) * cell;
  float d2 = dot(w, w);
  float cx = (id.x + 0.5) * cell.x;
  float tq = (cx - tx) / (0.13 * A + 0.05);
  float town = exp(-tq * tq);
  float depth = hm - p.y;
  float zone = smoothstep(0.004, 0.009, depth) * (1.0 - smoothstep(0.03, 0.05, depth));
  float on = step(1.0 - 0.24 * town, h) * zone;
  float r = px * 1.1;
  float core = exp(-d2 / (r * r));
  float glow = exp(-d2 / (r * r * 3.0)) * 0.3;
  float k = hash(id + 9.0);
  float fade = 0.3 + 0.7 * smoothstep(-0.3, 0.6, sin(t * (0.04 + 0.07 * k) + h * 50.0));
  fade = mix(fade, 1.0, step(0.55, k));
  vec3 c = mix(vec3(1.0, 0.77, 0.47), vec3(1.0, 0.88, 0.68), hash(id + 41.0));
  return c * (core + glow) * fade * on;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float A = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * A, uv.y);
  float t = u_time;
  float px = 1.0 / u_res.y;
  float xn = clamp(p.x / (0.5 * A), -1.0, 1.0);
  float tx = -0.28 * A;

  vec3 dark = mix(vec3(0.098, 0.09, 0.267), vec3(0.04, 0.063, 0.188), smoothstep(0.12, 0.4, p.y));
  dark = mix(dark, vec3(0.02, 0.03, 0.1), smoothstep(0.35, 0.7, p.y));
  dark = mix(dark, vec3(0.008, 0.012, 0.04), smoothstep(0.65, 1.0, p.y));
  dark += vec3(0.486, 0.36, 1.0) * 0.12 * exp(-length(vec2(p.x * 0.6, p.y * 2.2)) * 2.5);
  dark += vec3(1.0, 0.66, 0.43) * 0.07 * exp(-length(vec2((p.x - tx) * 1.6, (p.y - 0.15) * 3.0)) * 3.0);

  vec3 light = mix(vec3(0.965, 0.92, 0.933), vec3(0.914, 0.918, 0.96), smoothstep(0.12, 0.32, p.y));
  light = mix(light, vec3(0.85, 0.88, 0.96), smoothstep(0.3, 0.62, p.y));
  light = mix(light, vec3(0.77, 0.81, 0.96), smoothstep(0.62, 1.0, p.y));
  light = mix(light, vec3(1.0, 0.86, 0.8), 0.35 * exp(-length(vec2(p.x * 0.6, p.y * 2.2)) * 2.5));

  vec2 pole = vec2(-0.5 * A - 0.3, 1.25);
  float ang = t * 0.0025;
  float ca = cos(ang);
  float sa = sin(ang);
  vec2 rel = p - pole;
  vec2 r = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  float rad = length(rel);
  float rm = length(vec2(0.22 * A, 0.6) - pole);
  float bd = (rad - rm) / 0.14;
  float band = exp(-bd * bd);
  float f = fbm(r * 3.2 + 7.0);
  float ld = (rad - rm + 0.03 * (f - 0.5)) / 0.025;
  float lane = exp(-ld * ld);
  float milky = band * (0.35 + 0.9 * f * f) * (1.0 - 0.55 * lane);
  float sky = smoothstep(0.12, 0.35, p.y);
  dark += mix(vec3(0.42, 0.4, 0.85), vec3(0.6, 0.66, 0.95), f) * milky * 0.16 * sky;
  vec3 st = stars(r, 52.0, t, px, 0.82, 0.0) + stars(r, 104.0, t, px, 0.86, 31.0) * 0.6;
  st += stars(r, 210.0, t, px, 0.72, 77.0) * band * 0.5;
  dark += st * sky;

  vec2 mc = vec2(0.5 * A - 0.11 - 0.08 * A, mix(0.83, 0.79, smoothstep(0.6, 1.6, A)));
  float R = mix(0.032, 0.045, smoothstep(0.5, 1.6, A));
  vec2 m = p - mc;
  float md = length(m);
  float disc = below(md, R, px);
  float sd = length(m - vec2(-0.42, 0.16) * R);
  float lit = disc * smoothstep(R * 0.96 - px, R * 0.96 + px, sd);
  float tex = 0.86 + 0.14 * vnoise(m / R * 2.6 + 3.0);
  float beyond = max(md - R, 0.0);
  float halo = (exp(-beyond / (R * 0.9)) * 0.22 + exp(-beyond / (R * 4.0)) * 0.12) * (0.92 + 0.08 * sin(t * 0.5));
  dark += vec3(0.91, 0.87, 0.7) * halo * (1.0 - disc);
  dark = mix(dark, dark * 0.35 + vec3(0.05, 0.06, 0.1), disc);
  dark = mix(dark, vec3(0.957, 0.925, 0.84) * tex, lit);
  light = mix(light, vec3(1.0), halo * 1.4 * (1.0 - disc));
  light = mix(light, mix(light, vec3(1.0), 0.3), disc);
  light = mix(light, vec3(1.0, 0.995, 0.98) * (0.95 + 0.05 * tex), lit);

  float tq = (p.x - tx) / (0.2 * A + 0.08);
  float hf = 0.205 + 0.07 * hills(p.x * 1.7 + 2.0);
  float hm = 0.11 + 0.08 * hills(p.x * 1.25 + 20.0) + 0.05 * exp(-tq * tq);
  float hn = 0.025 + 0.075 * hills(p.x * 2.1 + 50.0) + 0.035 * smoothstep(-0.3, 0.9, xn);
  float af = below(p.y, hf, px);
  float am = below(p.y, hm, px);
  float an = below(p.y, hn, px);

  float e1 = (p.y - 0.2) / 0.045;
  float e2 = (p.y - 0.1) / 0.04;
  float mist1 = exp(-e1 * e1) * smoothstep(0.3, 0.75, fbm(vec2(p.x * 2.4 - t * 0.012, p.y * 9.0)));
  float mist2 = exp(-e2 * e2) * smoothstep(0.3, 0.75, fbm(vec2(p.x * 3.0 + t * 0.016 + 40.0, p.y * 10.0)));

  float rimF = exp(-max(hf - p.y, 0.0) * 400.0);
  vec3 farD = mix(vec3(0.075, 0.08, 0.19), vec3(0.043, 0.059, 0.153), smoothstep(0.17, 0.27, p.y));
  farD += vec3(0.5, 0.45, 0.9) * 0.05 * rimF;
  vec3 farL = mix(vec3(0.9, 0.9, 0.96), vec3(0.85, 0.875, 0.95), smoothstep(0.17, 0.27, p.y));
  dark = mix(dark, farD, af);
  light = mix(light, farL, af);
  dark = mix(dark, vec3(0.45, 0.48, 0.78), mist1 * 0.18);
  light = mix(light, vec3(1.0), mist1 * 0.55);

  vec3 win = windows(p, hm, tx, A, t, px);
  vec3 midD = mix(vec3(0.035, 0.04, 0.1), vec3(0.025, 0.033, 0.09), smoothstep(0.08, 0.2, p.y)) + win;
  vec3 midL = mix(vec3(0.83, 0.85, 0.93), vec3(0.79, 0.82, 0.92), smoothstep(0.08, 0.2, p.y));
  midL = mix(midL, vec3(1.0, 0.78, 0.5), clamp(dot(win, vec3(0.33)) * 0.6, 0.0, 0.6));
  dark = mix(dark, midD, am);
  light = mix(light, midL, am);
  dark = mix(dark, vec3(0.45, 0.48, 0.78), mist2 * 0.16);
  light = mix(light, vec3(1.0), mist2 * 0.5);

  float rimN = exp(-max(hn - p.y, 0.0) * 450.0);
  vec3 nearD = vec3(0.016, 0.02, 0.05) + vec3(0.62, 0.48, 1.0) * 0.18 * rimN;
  vec3 nearL = mix(vec3(0.73, 0.77, 0.88), vec3(0.76, 0.8, 0.9), smoothstep(0.0, 0.12, p.y));
  nearL = mix(nearL, vec3(1.0), rimN * 0.5);
  dark = mix(dark, nearD, an);
  light = mix(light, nearL, an);

  gl_FragColor = vec4(clamp(mix(light, dark, u_night), 0.0, 1.0), 1.0);
}
`,
};

export default shader;

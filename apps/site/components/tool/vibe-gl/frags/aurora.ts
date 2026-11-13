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

float vnoise1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(vec2(i, 17.0)), hash(vec2(i + 1.0, 17.0)), u);
}

float ridge(float x, float seed) {
  float v = 0.0;
  float a = 0.5;
  float y = x + seed;
  for (int i = 0; i < 5; i++) {
    float n = vnoise1(y) * 2.0 - 1.0;
    float sharp = 1.0 - abs(n);
    float dome = 1.0 - n * n;
    v += a * mix(sharp, dome, step(1.5, float(i)));
    y = y * 2.07 + 1.3;
    a *= 0.42;
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
  float big = pow(hash(id + 71.9), 6.0);
  float r = dens * px * (0.7 + 1.1 * big);
  float s = exp(-d * d / (r * r)) * step(thr, h);
  float b = clamp((h - thr) / (1.0 - thr), 0.0, 1.0);
  float tw = 1.0 - u_motion * 0.35 * (0.5 + 0.5 * sin(t * (0.6 + b * 1.2) + h * 70.0));
  vec3 c = mix(vec3(0.8, 0.87, 1.0), vec3(1.0, 0.92, 0.8), hash(id + 5.3));
  return c * s * tw * (0.3 + 0.7 * b);
}

vec4 curtain(vec2 p, float xn, float base, float amp, float fr, float seed, float t) {
  float x = p.x + t * 0.003;
  float wob = sin(x * fr + seed + t * 0.05) * 0.55 + sin(x * fr * 2.3 - seed * 1.3 - t * 0.08) * 0.22;
  wob += (vnoise1(x * fr * 0.8 + seed * 3.0 + t * 0.02) - 0.5) * 0.9;
  float e = base + amp * wob + 0.07 * (1.0 - xn * xn);
  float d = p.y - e;
  float lower = smoothstep(-0.03, 0.0, d);
  float dd = max(d, 0.0);
  float body = exp(-dd * 5.5) * (1.0 + 1.0 * exp(-dd * 55.0));
  float sx = x * 46.0 + d * 6.0 + seed * 11.0;
  float r1 = vnoise(vec2(sx, seed + 0.9 * sin(t * 0.13 + seed)));
  float r2 = vnoise(vec2(sx * 0.27 + 5.0, seed * 2.0 + 0.7 * cos(t * 0.09 + seed)));
  float rays = 0.18 + 0.82 * clamp(r1 * r1 * 0.7 + r2 * 0.5, 0.0, 1.0);
  float gn = vnoise1(x * 1.2 + seed * 5.0 + t * 0.01);
  float gaps = mix(0.12, 1.0, smoothstep(0.25, 0.75, gn));
  float s = lower * body * rays * gaps;
  float glow = exp(-abs(d) * 7.0) * 0.12 * gaps;
  float rd = (d - 0.06) / mix(0.05, 0.12, step(0.06, d));
  float fold = 0.78 + 0.22 * sin(x * fr * 4.0 + wob * 5.0 + seed);
  float fine = 0.9 + 0.1 * r1;
  float ribbon = exp(-rd * rd) * fold * fine * mix(0.35, 1.0, smoothstep(0.2, 0.8, gn));
  return vec4(d, s, glow, ribbon);
}

void addCurtain(vec4 c, float k, float hue, inout vec3 dark, inout vec3 light) {
  float d = c.x;
  vec3 td = mix(vec3(0.24, 0.96, 0.56), vec3(0.3, 0.85, 0.8), smoothstep(0.0, 0.1, d));
  td = mix(td, vec3(0.58, 0.42, 1.0), smoothstep(0.08, 0.3, d));
  dark += td * (c.y + c.z) * k;
  vec3 tl = mix(vec3(0.6, 0.9, 0.78), vec3(0.8, 0.72, 0.97), clamp(hue + smoothstep(0.0, 0.2, d) * 0.55, 0.0, 1.0));
  light = mix(light, tl, clamp(c.w * k * 0.8, 0.0, 0.5));
}

vec3 scene(vec2 p, float A, float t, float soft) {
  float H = 0.2;
  float px = 1.0 / u_res.y;
  float xn = clamp(p.x / (0.5 * A), -1.0, 1.0);
  float side = abs(xn);
  float h = clamp((p.y - H) / (1.0 - H), 0.0, 1.0);

  vec3 dark = mix(vec3(0.05, 0.11, 0.19), vec3(0.032, 0.07, 0.165), smoothstep(0.0, 0.3, h));
  dark = mix(dark, vec3(0.012, 0.016, 0.04), smoothstep(0.25, 1.0, h));
  dark += vec3(0.06, 0.2, 0.18) * 0.35 * exp(-length(vec2(p.x * 0.7, (p.y - H) * 2.6)) * 3.0);

  vec3 light = mix(vec3(0.975, 0.945, 0.95), vec3(0.94, 0.935, 0.98), smoothstep(0.0, 0.35, h));
  light = mix(light, vec3(0.88, 0.93, 0.95), smoothstep(0.35, 1.0, h));
  light = mix(light, vec3(1.0, 0.9, 0.84), 0.45 * exp(-length(vec2(p.x - 0.32 * A, (p.y - H) * 1.8)) * 3.2));

  float sideW = mix(0.65, 1.0, smoothstep(0.1, 0.6, side));
  vec4 c1 = curtain(p, xn, 0.6, 0.05, 1.6, 1.0, t);
  vec4 c2 = curtain(p, xn, 0.71, 0.06, 1.05, 4.7, t);
  vec4 c3 = curtain(p, xn, 0.5, 0.04, 2.3, 9.2, t);

  float veil = clamp((c1.y + c1.z) * 0.9 + (c2.y + c2.z) * 0.6 + (c3.y + c3.z) * 0.5, 0.0, 0.85);
  vec3 st = stars(p, 64.0, t, px, 0.9) + stars(p + vec2(3.1, 7.7), 128.0, t, px, 0.94) * 0.5;
  dark += st * 0.8 * smoothstep(0.05, 0.45, h) * (1.0 - veil);

  float hue = smoothstep(0.25, 0.75, vnoise1(p.x * 0.7 + t * 0.006 + 2.0)) * 0.6;
  addCurtain(c2, 0.45 * sideW, hue + 0.25, dark, light);
  addCurtain(c3, 0.38 * sideW, 0.6 - hue, dark, light);
  addCurtain(c1, 0.7 * sideW, hue, dark, light);

  float lift = mix(0.55, 1.0, smoothstep(0.05, 0.75, side));
  float ex = 0.004;
  float hf = H + 0.02 + 0.16 * ridge(p.x * 1.4, 3.0) * lift;
  float hf2 = H + 0.02 + 0.16 * ridge((p.x + ex) * 1.4, 3.0) * lift;
  float hn = H + 0.004 + 0.085 * ridge(p.x * 2.4 + 40.0, 11.0) * lift;
  float hn2 = H + 0.004 + 0.085 * ridge((p.x + ex) * 2.4 + 40.0, 11.0) * lift;
  float sf = (hf2 - hf) / ex;
  float sn = (hn2 - hn) / ex;
  float aaF = px * 1.2 * sqrt(1.0 + sf * sf) + soft;
  float aaN = px * 1.2 * sqrt(1.0 + sn * sn) + soft;

  float snow = smoothstep(hf - 0.06, hf - 0.004, p.y) * (0.6 + 0.4 * vnoise1(p.x * 9.0 + 4.0));
  float rimW = 0.0033 + soft;
  float rimF = exp(-max(hf - p.y, 0.0) / rimW);
  float rimN = exp(-max(hn - p.y, 0.0) / rimW);
  float rimK = 0.4 + 5.0 * (c1.z + c3.z);
  float baseF = smoothstep(H, H + 0.08, p.y);

  vec3 farD = mix(vec3(0.05, 0.09, 0.15), vec3(0.04, 0.072, 0.13), baseF) + vec3(0.025) * snow;
  farD += vec3(0.49, 0.94, 0.78) * 0.22 * rimF * rimK;
  vec3 nearD = vec3(0.02, 0.03, 0.058) + vec3(0.62, 0.48, 1.0) * 0.16 * rimN * rimK;
  vec3 farL = mix(vec3(0.85, 0.88, 0.94), vec3(0.8, 0.85, 0.92), baseF);
  farL = mix(farL, vec3(0.96, 0.975, 1.0), clamp(snow * 0.5 + rimF * 0.6, 0.0, 1.0));
  vec3 nearL = mix(vec3(0.82, 0.86, 0.92), vec3(0.75, 0.8, 0.88), smoothstep(H, hn, p.y));
  nearL = mix(nearL, vec3(1.0), rimN * 0.45);

  float mf = 1.0 - smoothstep(hf - aaF, hf + aaF, p.y);
  float mn = 1.0 - smoothstep(hn - aaN, hn + aaN, p.y);
  dark = mix(dark, farD, mf);
  dark = mix(dark, nearD, mn);
  light = mix(light, farL, mf);
  light = mix(light, nearL, mn);
  return mix(light, dark, u_night);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float A = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * A, uv.y);
  float t = u_time;
  float H = 0.2;
  float depth = H - p.y;
  vec2 q = p;
  float soft = 0.0;
  if (depth > 0.0) {
    float k = 1.0 / (depth + 0.035);
    float rip = vnoise(vec2(p.x * k * 0.35, k * 2.2 - t * 0.2)) - 0.5;
    rip += (vnoise(vec2(p.x * k * 1.2 + 9.0, k * 5.0 - t * 0.3)) - 0.5) * 0.3 * smoothstep(0.05, 0.15, depth);
    float amp = 0.6 + 0.4 * u_motion;
    q = vec2(p.x + rip * 0.004 * smoothstep(0.02, 0.12, depth), 2.0 * H - p.y + rip * depth * depth * 0.9 * amp);
    soft = depth * 0.035;
  }
  vec3 col = scene(q, A, t, soft);
  if (depth > 0.0) {
    float fres = smoothstep(0.0, H, depth);
    vec3 lakeD = mix(col * 0.6, vec3(0.025, 0.05, 0.095), 0.2 + 0.45 * fres);
    vec3 lakeL = mix(col, vec3(0.87, 0.9, 0.95), 0.25 + 0.4 * fres);
    col = mix(lakeL, lakeD, u_night);
  }
  float shore = exp(-abs(depth) * u_res.y * 0.4);
  col += mix(vec3(0.1), vec3(0.49, 0.94, 0.78) * 0.22, u_night) * shore;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

export default shader;

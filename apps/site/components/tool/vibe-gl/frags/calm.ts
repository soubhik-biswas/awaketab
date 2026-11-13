import type { IVibeShader } from '../types';

const shader: IVibeShader = {
  scale: 0.5,
  frag: `
float sm(float a, float b, float x) {
  float k = clamp((x - a) / (b - a), 0.0, 1.0);
  return k * k * (3.0 - 2.0 * k);
}

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 h22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = h21(i);
  float b = h21(i + vec2(1.0, 0.0));
  float c = h21(i + vec2(0.0, 1.0));
  float d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vn(p);
    p = p * 2.05 + vec2(4.3, 2.9);
    a *= 0.5;
  }
  return s;
}

float leafLayer(vec2 p, float cell, float seed, float t, float blur) {
  vec2 g = p / cell + seed;
  vec2 id = floor(g);
  float acc = 0.0;
  for (int j = 0; j < 9; j++) {
    float fj = float(j);
    vec2 nb = vec2(mod(fj, 3.0) - 1.0, floor(fj / 3.0) - 1.0);
    vec2 cid = id + nb;
    vec2 h = h22(cid + seed * 7.0);
    float on = step(0.18, h21(cid * 1.3 + seed));
    vec2 c = cid + 0.5 + (h - 0.5) * 0.8;
    float ang = h.x * 6.2831853 + 0.22 * sin(t * (0.4 + 0.3 * h.y) + h.y * 6.2831853);
    vec2 d = g - c;
    float ca = cos(ang);
    float sa = sin(ang);
    vec2 l = vec2(d.x * ca + d.y * sa, d.y * ca - d.x * sa);
    float sz = 0.75 + 0.5 * h.y;
    float u = l.x / (0.44 * sz);
    float v = l.y / (0.19 * sz);
    float lv = abs(v) + u * u;
    acc = max(acc, on * sm(1.0 + blur, 1.0 - blur, lv));
  }
  return acc;
}

float motes(vec2 p, float cell, float seed, float t, float sz) {
  vec2 g = p / cell + vec2(t * 0.012, t * 0.02) + seed;
  vec2 id = floor(g);
  vec2 f = fract(g);
  vec2 h = h22(id + seed * 7.0);
  float on = step(0.55, h21(id * 1.7 + seed));
  vec2 c = 0.5 + 0.3 * vec2(sin(t * (0.1 + 0.08 * h.x) + h.y * 6.2831853), cos(t * (0.09 + 0.07 * h.y) + h.x * 6.2831853));
  float d = length((f - c) * cell);
  float tw = 0.55 + 0.45 * sin(t * (0.3 + 0.3 * h.x) + h.y * 20.0);
  return on * tw * sm(sz, 0.0, d);
}

void main() {
  float n = u_night;
  float asp = u_res.x / u_res.y;
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
  float hw = 0.5 * asp;
  float t = u_time;

  float wide = sm(0.6, 1.3, asp);
  vec2 ctr = vec2(mix(0.08, 0.5 * hw + 0.06, wide), mix(0.24, 0.05, wide));
  ctr += vec2(0.02 * sin(t * 0.013), 0.01 * sin(t * 0.017));
  vec2 size = vec2(0.33, 0.42) * mix(0.62, 1.0, wide);
  vec2 q = p - ctr;
  q = vec2(q.x * 0.995 + q.y * 0.0998, q.y * 0.995 - q.x * 0.0998);
  q.x -= q.y * 0.34;
  float pz = max(1.0 + 0.4 * q.x, 0.4);
  vec2 w = q / (size * pz);

  float b = mix(0.075, 0.012, sm(-1.0, 1.0, w.y));
  float m = sm(1.0 + b, 1.0 - b, abs(w.x)) * sm(1.0 + b, 1.0 - b, abs(w.y));
  float mw = 0.04;
  m *= sm(mw - b, mw + b, abs(w.x));
  m *= sm(mw - b, mw + b, abs(w.y - 0.3));
  m *= mix(0.9, 1.03, sm(-1.0, 1.0, w.y));

  vec2 lp = p + vec2(0.025 * sin(t * 0.21), 0.012 * sin(t * 0.15 + 1.0));
  lp = vec2(lp.x * 0.88 - lp.y * 0.47, lp.y * 0.88 + lp.x * 0.47);
  float lf = max(leafLayer(lp, 0.075, 0.0, t, 0.28), leafLayer(lp, 0.12, 5.3, t * 0.8, 0.45) * 0.85);
  float clump = sm(0.38, 0.62, fbm(p * 2.2 + 7.0) + 0.3 * (w.x * 0.45 + w.y * 0.6));
  float leaf = lf * clump;
  float cloud = 0.92 + 0.08 * vn(vec2(t * 0.04, 3.0));
  float lit = m * (1.0 - 0.85 * leaf) * cloud;

  float mot = fbm(p * 1.6 + 2.0);
  float gx = sm(-hw, hw, p.x + 0.4 * p.y);
  vec3 wallD = mix(vec3(0.8, 0.805, 0.825), vec3(0.86, 0.835, 0.8), gx) * (0.985 + 0.03 * (mot - 0.5));
  vec3 wallN = mix(vec3(0.036, 0.045, 0.064), vec3(0.05, 0.057, 0.078), gx) * (0.95 + 0.1 * (mot - 0.5));
  vec2 lc = p - vec2(-hw - 0.05, -0.56);
  wallN += vec3(1.0, 0.77, 0.47) * 0.1 * exp(-dot(lc, lc) / 0.22);
  wallN += vec3(1.0, 0.77, 0.47) * 0.035 * exp(-dot(lc, lc) / 0.04);
  vec3 wall = mix(wallD, wallN, n);

  float bloom = exp(-0.4 * dot(w, w));
  wall += mix(vec3(0.06, 0.04, 0.01), vec3(0.02, 0.026, 0.042), n) * bloom * cloud;
  vec3 sunD = vec3(1.0, 0.93, 0.72);
  vec3 moonN = vec3(0.22, 0.26, 0.36);
  vec3 col = mix(wall, mix(sunD, moonN, n), clamp(lit, 0.0, 1.0));

  float beam = sm(0.25, 0.8, exp(-0.3 * dot(w, w)));
  float dust = motes(p, 0.07, 0.0, t, 0.006) + motes(p, 0.13, 3.7, t * 0.8, 0.011) * 0.55;
  col += mix(vec3(1.0, 0.97, 0.9) * 0.3, vec3(0.75, 0.82, 1.0) * 0.12, n) * dust * beam * cloud;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

export default shader;

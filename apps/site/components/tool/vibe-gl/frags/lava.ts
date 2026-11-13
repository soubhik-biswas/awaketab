import type { IVibeShader } from '../types';

const shader: IVibeShader = {
  scale: 0.5,
  frag: `
float sm(float a, float b, float x) {
  float k = clamp((x - a) / (b - a), 0.0, 1.0);
  return k * k * (3.0 - 2.0 * k);
}

float h11(float x) {
  x = fract(x * 0.1031);
  x *= x + 33.33;
  x *= x + x;
  return fract(x);
}

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
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

vec3 wax(float k) {
  vec3 a = mix(vec3(1.0, 0.76, 0.64), vec3(1.0, 0.16, 0.5), u_night);
  vec3 b = mix(vec3(0.8, 0.72, 1.0), vec3(1.0, 0.42, 0.08), u_night);
  vec3 c = mix(vec3(0.66, 0.93, 0.8), vec3(0.52, 0.26, 1.0), u_night);
  return mix(mix(a, b, step(0.5, k)), c, step(1.5, k));
}

vec3 smn(vec3 a, vec3 b, float k) {
  float h = clamp(0.5 + 0.5 * (b.x - a.x) / k, 0.0, 1.0);
  return vec3(mix(b.x, a.x, h) - k * h * (1.0 - h), mix(b.yz, a.yz, h));
}

vec3 circ(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  float l = max(length(d), 0.00001);
  return vec3(l - r, d / l);
}

vec3 caps(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  vec2 d = pa - ba * h;
  float l = max(length(d), 0.00001);
  return vec3(l - r, d / l);
}

void main() {
  float n = u_night;
  float asp = u_res.x / u_res.y;
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
  float hw = 0.5 * asp;
  float sc = clamp(0.35 + 0.6 * asp, 0.62, 1.15);
  float t = u_time;
  vec2 wp = p + 0.012 * vec2(vn(p * 4.0 + vec2(0.0, t * 0.05)) - 0.5, vn(p * 4.0 + vec2(5.2, -t * 0.04)) - 0.5);
  float ex = 0.18 * asp + 0.02;
  float ey = 0.22;

  vec3 sd = vec3(10.0, 0.0, 1.0);
  vec3 cs = vec3(0.0);
  float ws = 0.0;
  float rs = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float side = mod(fi, 2.0) * 2.0 - 1.0;
    float ha = h11(fi * 3.17 + 0.13);
    float hb = h11(fi * 5.31 + 4.71);
    float hc = h11(fi * 7.73 + 9.37);
    vec3 bl = vec3(10.0, 0.0, 1.0);
    float r = 0.1;
    if (i < 6) {
      float tt = t * 6.2831853 / (70.0 + 50.0 * ha) + hb * 6.2831853;
      float rise = 0.5 - 0.5 * cos(tt);
      float v = sin(tt);
      r = (0.068 + 0.04 * hb) * sc;
      float yh = mix(-0.6, 0.32 - r, rise);
      float yt = yh - v * r * (0.25 + abs(v));
      float yy = max(min(abs(yh), abs(yt)) - 0.7 * r, 0.0);
      float xm = ex * sqrt(max(1.0 - (yy / ey) * (yy / ey), 0.0)) + r;
      float lane = (0.58 + 0.27 * hc + 0.04 * sin(tt * 0.5 + ha * 5.0)) * hw;
      float xh = side * max(lane, xm);
      vec2 hp = vec2(xh, yh);
      vec2 tp = vec2(xh - side * 0.01 * v, yt);
      bl = smn(circ(wp, hp, r), circ(wp, tp, 0.72 * r), 0.5 * r);
    } else if (i < 8) {
      r = 0.17 * sc;
      vec2 c = vec2(side * 0.68 * hw, -0.66 + 0.02 * sin(t * 0.07 + fi));
      bl = caps(wp, c - vec2(0.2 * hw, 0.0), c + vec2(0.2 * hw, 0.0), r);
    } else {
      r = 0.05 * sc;
      float tc = t * 0.04 + 1.3;
      float v = cos(tc);
      float yh = -0.3 + 0.58 * sin(tc);
      float yt = yh - v * r * (0.25 + abs(v));
      vec2 hp = vec2(0.12 * hw * sin(t * 0.029), yh);
      bl = smn(circ(wp, hp, r), circ(wp, vec2(hp.x, yt), 0.72 * r), 0.5 * r);
    }
    sd = smn(bl, sd, 0.3 * max(r, 0.09 * sc));
    float wi = exp(-clamp(bl.x, -0.08, 0.6) * 30.0);
    cs += wax(mod(fi, 3.0)) * wi;
    ws += wi;
    rs += r * wi;
  }

  float rad = max(rs / max(ws, 0.000001), 0.02);
  vec3 alb = cs / max(ws, 0.000001);
  float s = clamp(-sd.x, 0.0, rad);
  float hs = sqrt(max(s * (2.0 * rad - s), 0.0));
  float z = hs / rad;
  float slope = (rad - s) / max(hs, 0.03 * rad);
  vec3 nrm = normalize(vec3(sd.yz * slope, 1.0));
  float px = 1.5 / u_res.y;
  float alpha = sm(px, -px, sd.x) * mix(0.7, 1.0, sm(0.0, 0.4, z));

  vec3 lb = normalize(vec3(0.1, -0.7, 0.7));
  float dif = max(dot(nrm, lb), 0.0);
  float core = sm(0.0, 0.75, z);
  float streak = sm(0.12, 0.0, abs(nrm.x + 0.4)) * sm(0.45, 0.15, abs(nrm.y - 0.12)) * sm(0.1, 0.4, z);

  vec3 hotN = mix(alb, vec3(1.0, 0.8, 0.45), 0.42);
  vec3 wn = mix(alb * 0.28 + vec3(0.02, 0.0, 0.02), alb, core);
  wn = mix(wn, hotN, sm(0.55, 1.0, z) * 0.7);
  wn *= 0.82 + 0.3 * dif;
  wn += vec3(1.0, 0.9, 0.78) * streak * 0.22;

  vec3 wd = mix(alb * 0.84, alb, core);
  wd = mix(wd, mix(alb, vec3(1.0), 0.5), sm(0.55, 1.0, z) * 0.6);
  wd *= 0.94 + 0.08 * dif;
  wd += vec3(1.0) * streak * 0.28;
  vec3 w = mix(wd, wn, n);

  vec3 ln = mix(vec3(0.07, 0.016, 0.04), vec3(0.03, 0.01, 0.045), sm(-0.5, 0.5, p.y));
  ln += vec3(0.3, 0.08, 0.03) * exp(-max(p.y + 0.5, 0.0) * 4.0) * 0.25;
  vec3 ld = mix(vec3(0.965, 0.94, 0.93), vec3(0.95, 0.945, 0.97), sm(-0.5, 0.5, p.y));
  vec3 liq = mix(ld, ln, n);

  float ax = abs(p.x / hw);
  float e1 = (ax - 0.9) / 0.035;
  float e2 = (ax - 0.78) / 0.12;
  float sheen = exp(-e1 * e1) * 0.6 + exp(-e2 * e2) * 0.25;
  liq += vec3(1.0) * sheen * mix(0.035, 0.025, n);

  float halo = exp(-max(sd.x, 0.0) / (0.07 * sc));
  liq += alb * halo * 0.3 * n;
  liq = mix(liq, alb, halo * 0.18 * (1.0 - n));

  vec3 col = mix(liq, w, alpha);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

export default shader;

import type { IVibeShader } from '../types';

const shader: IVibeShader = {
  scale: 0.7,
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
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return s;
}

vec3 lamp(float k) {
  vec3 c = vec3(1.0, 0.68, 0.32);
  c = mix(c, vec3(1.0, 0.84, 0.6), step(0.32, k));
  c = mix(c, vec3(0.42, 0.62, 1.0), step(0.55, k));
  c = mix(c, vec3(0.6, 0.45, 1.0), step(0.74, k));
  c = mix(c, vec3(1.0, 0.32, 0.36), step(0.86, k));
  c = mix(c, vec3(0.3, 0.92, 0.62), step(0.96, k));
  return c;
}

float bok(vec2 f, float rad, float edge) {
  float d = length(f);
  float m = sm(rad, rad - edge, d);
  float rim = sm(rad - edge * 3.0, rad - edge * 0.5, d);
  return m * (0.62 + 0.5 * rim);
}

vec3 layer(vec2 q, float cell, float seed, float sharp, float t, float dens) {
  vec2 o = vec2(seed * 0.37, seed * 0.61);
  vec2 g = q / cell + o;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 rn = h22(id + seed * 17.0);
  float k = h21(id * 1.31 + seed * 5.0);
  float yc = (id.y + 0.5 - o.y) * cell;
  float pr = dens * mix(0.22, 1.0, sm(0.4, -0.3, yc));
  float on = step(h21(id + seed * 29.0 + 0.5), pr);
  vec2 off = (rn - 0.5) * 0.24;
  float rad = mix(0.2, 0.32, rn.y) * mix(1.0, 0.75, sharp);
  float edge = mix(0.07, 0.03, sharp);
  float br = 0.8 + 0.2 * sin(t * 0.3 + k * 40.0);
  float lum = mix(0.45, 1.0, rn.x);
  return lamp(k) * bok(f - off, rad, edge) * on * br * lum;
}

vec3 layerN(vec2 q, float cell, float seed, float sharp, float t, float dens) {
  vec2 o = vec2(seed * 0.37, seed * 0.61);
  vec2 g = q / cell + o;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 rn = h22(id + seed * 17.0);
  float k = h21(id * 1.31 + seed * 5.0);
  vec2 cc = (id + 0.5 - o) * cell;
  float low = mix(0.06, 1.0, sm(-0.02, -0.3, cc.y));
  float side = mix(0.3, 1.0, sm(0.15, 0.65, abs(cc.x)));
  float on = step(h21(id + seed * 29.0 + 0.5), dens * low * side);
  vec2 off = (rn - 0.5) * 0.2;
  float rad = mix(0.26, 0.4, rn.y) * mix(1.0, 0.8, sharp);
  float edge = mix(0.2, 0.07, sharp);
  float br = 0.85 + 0.15 * sin(t * 0.25 + k * 40.0);
  float lum = 0.1 + 0.9 * pow(rn.x, 5.0);
  return lamp(k) * bok(f - off, rad, edge) * on * br * lum;
}

vec3 traffic(vec2 q, float t, float sharp) {
  float n = u_night;
  float rs = mix(1.0, 0.75, sharp);
  float ed = mix(0.09, 0.035, sharp) * mix(1.0, 1.8, n);
  float c1 = mix(0.06, 0.1, n);
  float g1 = q.x / c1 - t * mix(0.5, 0.3, n);
  float i1 = floor(g1);
  float j1 = h21(vec2(i1, 4.0));
  vec2 f1 = vec2(fract(g1) - 0.5 - (j1 - 0.5) * 0.2, (q.y + 0.33) / c1 + (j1 - 0.5) * 0.5);
  float b1 = mix(1.0, 0.25 + 0.75 * h21(vec2(i1, 24.0)), n);
  vec3 tail = vec3(1.0, 0.28, 0.3) * bok(f1, 0.26 * rs, ed) * step(0.5, h21(vec2(i1, 14.0))) * b1;
  float c2 = mix(0.075, 0.12, n);
  float g2 = q.x / c2 + t * mix(0.42, 0.25, n) + 3.3;
  float i2 = floor(g2);
  float j2 = h21(vec2(i2, 8.0));
  vec2 f2 = vec2(fract(g2) - 0.5 + (j2 - 0.5) * 0.2, (q.y + 0.4) / c2 + (j2 - 0.5) * 0.4);
  float b2 = mix(1.0, 0.25 + 0.75 * h21(vec2(i2, 28.0)), n);
  vec3 head = vec3(1.0, 0.9, 0.72) * bok(f2, 0.3 * rs, ed) * step(0.55, h21(vec2(i2, 18.0))) * b2;
  return tail * 0.8 + head;
}

vec3 glow(vec2 q, vec2 c, float s, vec3 col) {
  vec2 d = q - c;
  float r2 = dot(d, d);
  return col * (exp(-r2 / (s * s)) * 0.55 + exp(-r2 / (s * s * 12.0)) * 0.12);
}

float skyline(float x, float sc, float seed, float lo, float hi, float y, float b) {
  float bx = x * sc + seed;
  float i = floor(bx);
  float f = fract(bx);
  float h0 = h21(vec2(i, seed));
  float h1 = h21(vec2(i + 1.0, seed));
  float top = mix(lo, hi, mix(h0, h1, sm(0.92, 1.0, f)));
  return sm(top + b, top - b, y);
}

float wins(vec2 q, vec2 dens, float seed, float sharp) {
  vec2 g = q * dens + seed;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float on = step(0.7, h21(id + seed));
  float bl = mix(0.22, 0.08, sharp);
  float sh = sm(0.36, 0.36 - bl, abs(f.x)) * sm(0.32, 0.32 - bl, abs(f.y));
  return on * sh * (0.3 + 0.7 * h21(id * 1.7 + seed));
}

vec3 city(vec2 q, float sharp, float t) {
  float n = u_night;
  float b = mix(0.035, 0.012, sharp);
  vec3 top = mix(vec3(0.86, 0.88, 0.915), vec3(0.01, 0.014, 0.032), n);
  vec3 low = mix(vec3(0.9, 0.905, 0.92), vec3(0.13, 0.085, 0.1), n);
  vec3 col = mix(low, top, sm(-0.2, 0.55, q.y));
  float far = skyline(q.x, 3.2, 1.0, -0.12, 0.26, q.y, b);
  float near = skyline(q.x, 2.1, 7.0, -0.3, 0.06, q.y, b);
  col = mix(col, mix(vec3(0.8, 0.82, 0.86), vec3(0.03, 0.035, 0.06), n), far * 0.9);
  col += vec3(1.0, 0.75, 0.45) * wins(q, vec2(34.0, 46.0), 3.0, sharp) * far * (1.0 - near) * 0.12 * n;
  col = mix(col, mix(vec3(0.76, 0.785, 0.83), vec3(0.015, 0.018, 0.035), n), near * 0.92);
  col += vec3(1.0, 0.72, 0.42) * wins(q, vec2(22.0, 30.0), 11.0, sharp) * near * 0.16 * n;
  col += mix(vec3(0.02, 0.015, 0.0), vec3(0.2, 0.09, 0.035), n) * exp(-max(q.y + 0.5, 0.0) * 5.0);

  vec3 l = vec3(0.0);
  if (n > 0.5) {
    l += layerN(q, 0.14, 1.0, sharp, t, 0.75);
    l += layerN(q, 0.26, 2.0, sharp, t, 0.6) * 0.7;
  } else {
    l += layer(q, 0.05, 1.0, sharp, t, 0.6);
    l += layer(q, 0.095, 2.0, sharp, t, 0.45) * 0.8;
    l += layer(q, 0.2, 3.0, sharp, t, 0.3) * 0.45;
  }
  l += traffic(q, t, sharp);
  float s = mix(1.0, 0.6, sharp);
  vec3 g = glow(q, vec2(-0.95, -0.14), 0.035 * s, vec3(1.0, 0.7, 0.36));
  g += glow(q, vec2(-0.48, -0.19), 0.03 * s, vec3(1.0, 0.74, 0.42));
  g += glow(q, vec2(0.58, -0.17), 0.03 * s, vec3(1.0, 0.7, 0.36));
  g += glow(q, vec2(1.08, -0.11), 0.035 * s, vec3(1.0, 0.76, 0.46));
  g += glow(q, vec2(-0.72, 0.16), 0.06 * s, vec3(0.49, 0.36, 1.0)) * 0.6;
  g += glow(q, vec2(0.86, 0.05), 0.04 * s, vec3(0.24, 0.96, 0.56)) * 0.35;
  l += g * mix(0.35, 1.0, n);
  l *= mix(0.45, 1.0, sm(0.05, 0.5, length(q * vec2(0.75, 1.0))));

  vec2 r = vec2(q.x + q.y * 0.2, q.y);
  float cx = r.x * 85.0;
  float ci = floor(cx);
  float hr = h21(vec2(ci, 5.0));
  float yy = r.y * 2.4 + t * (0.9 + 0.6 * hr) + hr * 19.0;
  float seg = fract(yy);
  float streak = sm(0.0, 0.25, seg) * sm(0.36, 0.25, seg) * sm(0.32, 0.0, abs(fract(cx) - 0.5));
  streak *= step(0.55, hr) * step(0.4, h21(vec2(ci, floor(yy)))) * (1.0 - sharp);
  float lit = dot(l, vec3(0.33));
  col += vec3(0.62, 0.7, 0.85) * streak * (0.035 + 0.4 * lit) * n;
  col -= vec3(0.045, 0.04, 0.03) * streak * (1.0 - n);

  return 1.0 - (1.0 - col) * (1.0 - clamp(l * mix(0.28, 0.85, n), 0.0, 1.0));
}

void drop(vec2 p, vec2 c, float r, float k, inout vec4 b, inout vec2 bc) {
  if (r < 0.0008) return;
  vec2 d = (p - c) / r;
  d.y *= mix(0.9, 1.22, step(0.0, d.y));
  d.x *= 1.0 + 0.12 * d.y;
  float px = min(1.6 / (r * u_res.y), 0.6);
  float m = (1.0 - sm(1.0 - px, 1.0, length(d))) * k;
  if (m > b.x) {
    b = vec4(m, d, r);
    bc = c;
  }
}

void beads(vec2 p, float cell, float r0, float r1, float pr, float seed, float t, float k, inout vec4 b, inout vec2 bc) {
  float n = u_night;
  vec2 g = p / cell + seed;
  vec2 id = floor(g);
  float mid = mix(0.6, 1.0, sm(0.1, 0.45, length((id + 0.5 - seed) * cell)));
  float on = h21(id + seed * 3.7);
  float pn = pr * mix(0.8, 0.5, n);
  if (on > pn * mid) return;
  vec2 rn = h22(id * 1.13 + seed);
  vec2 c = (id + 0.5 + (rn - 0.5) * mix(0.2, 0.08, n) - seed) * cell;
  float life = fract(t * (0.012 + 0.012 * on / pn) + rn.x * 5.0);
  float env = sm(0.0, 0.18, life) * sm(1.0, 0.72, life);
  float sz = mix(r0 * mix(1.0, 0.7, n), r1 * mix(1.0, 1.25, n), pow(rn.y, mix(2.0, 3.0, n)));
  drop(p, c, sz * cell * env, k, b, bc);
}

float path(float y, float ci, float cyc) {
  return 0.011 * sin(y * 9.0 + ci * 3.1) + 0.006 * sin(y * 23.0 + cyc * 1.7);
}

void runs(vec2 p, float t, inout vec4 b, inout vec2 bc, inout float clr) {
  float w = 0.17;
  float ci = floor(p.x / w);
  float ph = t * (0.02 + 0.018 * h21(vec2(ci, 7.1))) + h21(vec2(ci, 2.3));
  float cyc = floor(ph);
  float f = fract(ph);
  float side = sm(0.12, 0.5, abs((ci + 0.5) * w));
  if (h21(vec2(ci, cyc + 0.5)) > 0.12 + 0.5 * side) return;
  float g = f - 0.8 * sin(f * 31.4159265) / 31.4159265;
  float y = 0.6 - g * 1.55;
  float cx = (ci + 0.5 + (h21(vec2(ci, cyc)) - 0.5) * 0.3) * w;
  float r = 0.017 + 0.009 * h21(vec2(ci, cyc + 9.0));
  drop(p, vec2(cx + path(y, ci, cyc), y), r, 1.0, b, bc);
  float dy = p.y - y;
  float len = 0.34;
  float a = clamp(dy / len, 0.0, 1.0);
  float tw = r * mix(0.62, 0.22, a);
  float xc = cx + path(p.y, ci, cyc);
  float trail = sm(tw, tw * 0.55, abs(p.x - xc)) * step(0.0, dy) * (1.0 - a);
  clr = max(clr, trail);
  float cy = 0.028;
  float yi = floor(p.y / cy);
  float by = (yi + 0.5) * cy;
  float bh = h21(vec2(ci * 13.0 + cyc, yi));
  float bd = by - y;
  if (bh > 0.5 && bd > r * 1.3 && bd < len) {
    float br = r * (0.16 + 0.22 * h21(vec2(yi, ci + cyc))) * sm(len, len * 0.4, bd);
    drop(p, vec2(cx + path(by, ci, cyc) + (bh - 0.75) * r * 0.8, by), br, 1.0, b, bc);
  }
}

void main() {
  float n = u_night;
  float asp = u_res.x / u_res.y;
  vec2 p = vec2((gl_FragCoord.x / u_res.x - 0.5) * asp, gl_FragCoord.y / u_res.y - 0.5);
  float t = u_time;
  vec4 b = vec4(0.0);
  vec2 bc = vec2(0.0);
  float clr = 0.0;
  runs(p, t, b, bc, clr);
  float k = 1.0 - clr;
  beads(p, 0.1, 0.16, 0.33, 0.5, 0.0, t, k, b, bc);
  beads(p, 0.042, 0.12, 0.3, 0.55, 0.37, t, k, b, bc);
  beads(p, 0.018, 0.1, 0.26, 0.45, 0.71, t, k, b, bc);

  vec3 bg = city(p, clr * 0.5, t);
  float fog = (0.3 + 0.4 * fbm(p * 2.4 + vec2(0.0, t * 0.003))) * (1.0 - 0.8 * clr);
  fog *= mix(0.85, 1.2, sm(0.1, -0.5, p.y));
  vec3 mist = mix(vec3(0.95, 0.955, 0.965), vec3(0.055, 0.065, 0.095), n);
  vec3 col = mix(bg, mist + bg * mix(0.04, 0.4, n), clamp(fog, 0.0, 1.0));

  if (b.x > 0.002) {
    vec2 dl = b.yz;
    float l2 = min(dot(dl, dl), 1.0);
    float l = sqrt(l2);
    vec2 q = bc - dl * b.w * 4.0 * (1.0 + 0.6 * l2);
    vec3 rf = city(q, 1.0, t);
    float away = mix(0.55, 1.0, sm(0.08, 0.45, length(p * vec2(0.75, 1.0))));

    vec3 dd = mix(rf, rf * 0.84, sm(0.55, 1.0, l));
    float spec = sm(0.3, 0.04, length(dl - vec2(-0.3, 0.42)));
    float caus = sm(0.5, 0.92, l) * sm(-0.2, -0.85, dl.y);
    dd += vec3(1.0) * spec * 0.5 * away + vec3(0.05) * caus;

    vec3 dn = mix(col, rf, 0.7) * 1.12 + vec3(0.012, 0.014, 0.02);
    float rim = sm(0.72, 0.93, l) * sm(-0.1, -0.7, dl.y);
    float hi = sm(0.2, 0.03, length(dl - vec2(-0.34, 0.46)));
    dn += vec3(0.24, 0.2, 0.16) * rim + vec3(0.9, 0.92, 1.0) * hi * 0.3 * away;

    col = mix(col, clamp(mix(dd, dn, n), 0.0, 1.0), b.x);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,
};

export default shader;

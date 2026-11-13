'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TVibe, TVibeMotion } from '@/lib/tool/settings';
import { SHADERS } from './loaders';
import type { IVibeShader } from './types';

const VERT = 'attribute vec2 p;\nvoid main() { gl_Position = vec4(p, 0.0, 1.0); }';
const PRELUDE =
  'precision highp float;\nuniform vec2 u_res;\nuniform float u_time;\nuniform float u_night;\nuniform float u_motion;\n';
const FPS: Record<Exclude<TVibeMotion, 'still'>, number> = { calm: 24, lively: 30 };
const SPEED: Record<TVibeMotion, number> = { still: 0, calm: 0.6, lively: 1 };
const STILL_AT = 37;
const MAX_PIXELS = 1_200_000;
const FADE_MS = 900;
const T0 = typeof performance === 'undefined' ? 0 : performance.now();

interface IShaderSceneProps {
  vibe: TVibe;
  night: boolean;
  motion: TVibeMotion;
  still: boolean;
  fallback: ReactNode;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
  if (process.env.NODE_ENV !== 'production') console.error(gl.getShaderInfoLog(sh));
  gl.deleteShader(sh);
  return null;
}

function program(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, PRELUDE + frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

// A vibe drawn on the GPU: one full-screen shader, drawn smaller than the screen and scaled up, at 24 or 30 frames a
// second, never in a hidden tab, once for Still, previews and reduced motion. The CSS scene shows while the shader
// loads and stays for good where WebGL is missing or its context is lost.
export function ShaderScene({ vibe, night, motion, still, fallback }: IShaderSceneProps) {
  const [loaded, setLoaded] = useState<{ vibe: TVibe; shader: IVibeShader } | null>(null);
  const [drawn, setDrawn] = useState<TVibe | null>(null);
  const [settled, setSettled] = useState<TVibe | null>(null);
  const [failed, setFailed] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const shader = loaded?.vibe === vibe ? loaded.shader : null;
  const frozen = still || motion === 'still';

  useEffect(() => {
    let live = true;
    SHADERS[vibe]().then(
      (s) => live && setLoaded({ vibe, shader: s }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [vibe]);

  useEffect(() => {
    if (!canvas || !shader) return;
    const win = canvas.ownerDocument.defaultView;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    const prog = gl ? program(gl, shader.frag) : null;
    if (!win || !gl || !prog) {
      setFailed(true);
      return;
    }
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', lost);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uNight = gl.getUniformLocation(prog, 'u_night');
    const uMotion = gl.getUniformLocation(prog, 'u_motion');
    const calm = frozen || win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = calm ? 0 : SPEED[motion];

    const draw = (now: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, calm ? STILL_AT : STILL_AT + ((now - T0) / 1000) * speed);
      gl.uniform1f(uNight, night ? 1 : 0);
      gl.uniform1f(uMotion, speed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const fit = () => {
      const ratio = Math.min(win.devicePixelRatio || 1, 2) * shader.scale;
      let w = Math.max(1, Math.round(canvas.clientWidth * ratio));
      let h = Math.max(1, Math.round(canvas.clientHeight * ratio));
      const over = Math.sqrt((w * h) / MAX_PIXELS);
      if (over > 1) {
        w = Math.round(w / over);
        h = Math.round(h / over);
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw(win.performance.now());
    };
    const ro = new win.ResizeObserver(fit);
    ro.observe(canvas);
    fit();
    setDrawn(vibe);

    let raf = 0;
    let last = 0;
    if (!calm) {
      const gap = 1000 / FPS[motion] - 2;
      const tick = (now: number) => {
        raf = win.requestAnimationFrame(tick);
        if (now - last < gap) return;
        last = now;
        draw(now);
      };
      raf = win.requestAnimationFrame(tick);
    }
    return () => {
      win.cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [canvas, shader, vibe, night, frozen, motion]);

  const shown = drawn === vibe && shader !== null && !failed;
  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setSettled(vibe), FADE_MS);
    return () => clearTimeout(id);
  }, [shown, vibe]);

  if (failed) return <>{fallback}</>;
  return (
    <>
      {settled === vibe && shown ? null : fallback}
      <canvas
        ref={setCanvas}
        className={cn('absolute inset-0 size-full transition-opacity ease-out', shown ? 'opacity-100' : 'opacity-0')}
        style={{ transitionDuration: `${String(FADE_MS)}ms` }}
      />
    </>
  );
}

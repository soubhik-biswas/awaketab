'use client';

import { Suspense, use, useEffect, useLayoutEffect, useState } from 'react';
import { FaceFrame } from './frame';
import { faceModel, type IFaceProps, toFaceId, type TFaceId, type TFaceModel } from './model';
import { loadedFace, loadFace, type TFaceDrawing } from './registry';
import { useReducedMotion } from './use-reduced-motion';

const settled = new Map<TFaceId, Promise<TFaceDrawing | null>>();

// A face that fails to load draws nothing instead of throwing; the next mount tries again.
const waitFor = (id: TFaceId): Promise<TFaceDrawing | null> => {
  let p = settled.get(id);
  const ready = loadedFace(id);
  // A face already loaded hands use() a promise React reads at once, so every render calls use() the same way.
  if (!p && ready) {
    p = Object.assign(Promise.resolve(ready), { status: 'fulfilled', value: ready });
    settled.set(id, p);
  }
  if (!p) {
    p = loadFace(id).catch(() => {
      settled.delete(id);
      return null;
    });
    settled.set(id, p);
  }
  return p;
};

function Drawing({ id, m, onDrawn }: { id: TFaceId; m: TFaceModel; onDrawn: (id: TFaceId) => void }) {
  const Draw = use(waitFor(id));
  useLayoutEffect(() => onDrawn(id), [id, onDrawn]);
  return Draw ? <Draw m={m} /> : null;
}

// One clock face: any of the 46 drawings on the 360 × 315 artboard, scaled to size, with the status caption unless bare.
export function Face(props: IFaceProps) {
  const want: TFaceId = toFaceId(props.face);
  const reduced = useReducedMotion();
  // The face on screen stays until the next one has loaded, so a swap never flashes an empty dial.
  const [shown, setShown] = useState<TFaceId>(want);
  // Motion waits until the drawing has hydrated, so GSAP never edits markup React has yet to claim.
  const [drawn, setDrawn] = useState<TFaceId | null>(null);
  if (shown !== want && loadedFace(want)) setShown(want);

  useEffect(() => {
    if (loadedFace(want)) return;
    let alive = true;
    void waitFor(want).then((d) => {
      if (alive && d) setShown(want);
    });
    return () => {
      alive = false;
    };
  }, [want]);

  const probe = faceModel({ ...props, face: shown }, { reduced });
  // Sweeping hands start from the current second whenever motion starts or the face changes.
  const key = `${shown}|${probe.live}`;
  const [anchor, setAnchor] = useState({ key, t0: probe.nowSec });
  if (anchor.key !== key) setAnchor({ key, t0: probe.nowSec });
  const t0 = anchor.key === key ? anchor.t0 : probe.nowSec;
  const m = t0 === probe.nowSec ? probe : faceModel({ ...props, face: shown }, { reduced, t0 });

  return (
    <FaceFrame m={m} bare={props.bare} framed={props.framed} drawn={drawn === shown} className={props.className}>
      <Suspense fallback={null}>
        <Drawing id={shown} m={m} onDrawn={setDrawn} />
      </Suspense>
    </FaceFrame>
  );
}

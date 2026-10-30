'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { FaceFrame } from './frame';
import { faceModel, type IFaceProps, isFaceId, type TFaceId, type TFaceModel } from './model';
import { loadedFace, loadFace, type TFaceDrawing } from './registry';
import { useReducedMotion } from './use-reduced-motion';

const settled = new Map<TFaceId, Promise<TFaceDrawing | null>>();

// A face that fails to load draws nothing instead of throwing; the next mount tries again.
const waitFor = (id: TFaceId): Promise<TFaceDrawing | null> => {
  let p = settled.get(id);
  if (!p) {
    p = loadFace(id).catch(() => {
      settled.delete(id);
      return null;
    });
    settled.set(id, p);
  }
  return p;
};

function Drawing({ id, m }: { id: TFaceId; m: TFaceModel }) {
  const Draw = loadedFace(id) ?? use(waitFor(id));
  return Draw ? <Draw m={m} /> : null;
}

// One clock face: any of the 49 drawings on the 360 × 360 artboard, scaled to size, with the status caption.
export function Face(props: IFaceProps) {
  const want: TFaceId = isFaceId(props.face) ? props.face : 'ring';
  const reduced = useReducedMotion();
  // The face on screen stays until the next one has loaded, so a swap never flashes an empty dial.
  const [shown, setShown] = useState<TFaceId>(want);
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
    <FaceFrame m={m} bare={props.bare} framed={props.framed} className={props.className}>
      <Suspense fallback={null}>
        <Drawing id={shown} m={m} />
      </Suspense>
    </FaceFrame>
  );
}

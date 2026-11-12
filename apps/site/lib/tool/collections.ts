import {
  FACE_COLLECTIONS,
  faceKind,
  toFaceId,
  type TFaceCollection,
  type TFaceId,
  type TFaceKind,
} from '@/components/face';

export type TFilter = TFaceCollection;
export type TGlanceFace = TFaceId;

export const COLLECTIONS = FACE_COLLECTIONS;

export const FILTERS: readonly TFilter[] = ['featured', 'digital', 'analog', 'ambient', 'all'];

export const tagOf = (k: TFaceId): TFaceKind => faceKind(k);

// Any stored id comes back as a face that exists: the retired LED, Pulse and Terminal move to their closest face.
export const glanceFace = (v: unknown): TFaceId => toFaceId(v);

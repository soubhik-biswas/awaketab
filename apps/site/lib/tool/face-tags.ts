import type { TTag } from '@/components/tool/kit';

// One honest tag per face at most: the newest drawings, the most striking, a few favourites and the ones made for
// dark rooms. Hot and staff pick win over new.
const HOT = ['aurora', 'liquid', 'flip', 'neon'];
const PICK = ['eclipse', 'skeleton', 'chrono', 'nixie'];
const NIGHT = ['moon', 'lcd', 'orbit', 'constellation'];
const NEW = ['glass', 'bauhaus', 'poster', 'eink', 'waveform', 'blob', 'hud', 'halo'];

export function faceTag(face: string): TTag | null {
  if (HOT.includes(face)) return 'hot';
  if (PICK.includes(face)) return 'pick';
  if (NIGHT.includes(face)) return 'night';
  if (NEW.includes(face)) return 'new';
  return null;
}

export const TAG_LABEL_KEY: Record<TTag, 'tagNew' | 'tagHot' | 'tagPick' | 'tagNight'> = {
  new: 'tagNew',
  hot: 'tagHot',
  pick: 'tagPick',
  night: 'tagNight',
};

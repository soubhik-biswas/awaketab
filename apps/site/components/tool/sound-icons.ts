import {
  Brain,
  CloudLightning,
  Coffee,
  Flame,
  MoonStar,
  Piano,
  TrainFront,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { TScene } from '@/lib/tool/sound-scenes';

export const SCENE_ICON: Record<TScene, LucideIcon> = {
  focus: Brain,
  rainy: Coffee,
  train: TrainFront,
  ocean: Waves,
  fire: Flame,
  keys: Piano,
  storm: CloudLightning,
  night: MoonStar,
};

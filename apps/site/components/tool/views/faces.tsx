'use client';

import { FaceGrid } from '@/components/face';
import { useTool } from '@/components/tool/context';
import { HELP } from '@/components/tool/kit';

export default function FacesView() {
  const { settings, device, theme, a } = useTool();
  return (
    <>
      <FaceGrid
        selected={settings.face}
        onSelect={a.setFace}
        theme={theme}
        size={device === 'phone' ? 96 : device === 'tabletL' ? 84 : 92}
        columns={device === 'tabletP' ? 5 : 3}
      />
      <span className={HELP}>Faces change only how time is drawn. Status always shows as words and an icon too.</span>
    </>
  );
}

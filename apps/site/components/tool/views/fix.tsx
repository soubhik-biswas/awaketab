'use client';

import { FixPanel } from '@/components/product/fix-panel';
import { useTool } from '@/components/tool/context';

export default function FixView() {
  const { a } = useTool();
  return (
    <FixPanel
      layout="stack"
      guideHref="/guides/chrome-energy-saver"
      onUseFallback={a.useFallback}
      onCheckAgain={a.checkAgain}
    />
  );
}

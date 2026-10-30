'use client';

import { TypedConfirm } from '@/components/product/typed-confirm';
import { useTool } from '@/components/tool/context';

export default function ClearView() {
  const { a } = useTool();
  return <TypedConfirm onConfirm={a.clearHistory} onCancel={() => a.go('history')} />;
}

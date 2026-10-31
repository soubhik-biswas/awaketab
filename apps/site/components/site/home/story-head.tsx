import type { ReactNode } from 'react';
import { Accent } from '../accent';
import { story } from '../styles';

// The head of every home section: mono eyebrow, the headline with its accent phrase, and an optional lead.
export function StoryHead({
  id,
  eyebrow,
  h,
  accent,
  lead,
}: {
  id: string;
  eyebrow: string;
  h: string;
  accent?: string;
  lead?: ReactNode;
}) {
  return (
    <div className={story.head}>
      <span className={story.eyebrow}>{eyebrow}</span>
      <h2 id={id} className={story.h2}>
        {h}
        {accent && (
          <>
            {' '}
            <Accent>{accent}</Accent>
          </>
        )}
      </h2>
      {lead && <p className={story.lead}>{lead}</p>}
    </div>
  );
}

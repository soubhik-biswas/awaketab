'use client';

import { useState } from 'react';
import { RadioGroup, ToggleGroup } from 'radix-ui';
import { cn } from '@/lib/utils';
import { sendFeedback, TOPICS, type TTopic } from '@/lib/tool/feedback';
import { toolUi, type TRating } from '@/lib/tool/ui';
import { useGlance } from '../context';
import { Note, SecLabel } from '../kit';
import { showNote } from '../overlays';
import { RATES } from '../stage';
import { PanelBody, PanelFoot } from './shell';

// Three big choices, an optional note and topic chips. Sent anonymously; no address is asked for or kept.
export function FeedbackPanel() {
  const g = useGlance();
  const { t } = g;
  const [rating, setRating] = useState<TRating>(g.ui.rating ?? 'good');
  const [topics, setTopics] = useState<TTopic[]>(['faces']);
  const [text, setText] = useState('');
  const [state, setState] = useState<'ready' | 'sending' | 'failed'>('ready');
  const send = async () => {
    setState('sending');
    const ok = await sendFeedback({ rating, topics, text, device: g.device, sessions: g.journey.sessions });
    if (!ok) {
      setState('failed');
      return;
    }
    toolUi.set({ first: false, rating: null });
    g.a.close();
    showNote(t('feedback.thanks'));
  };
  return (
    <>
      <PanelBody>
        <SecLabel>{t('feedback.how')}</SecLabel>
        <RadioGroup.Root
          value={rating}
          onValueChange={(v) => setRating(v as TRating)}
          aria-label={t('feedback.how')}
          className="grid grid-cols-3 gap-2.5"
        >
          {RATES.map(([k, e]) => {
            const on = rating === k;
            return (
              <RadioGroup.Item
                key={k}
                value={k}
                className={cn(
                  'tg-btn flex h-24 flex-col items-center justify-center gap-2 rounded-[18px] text-[14px] text-(--tg-text)',
                  on
                    ? 'border-2 border-(--tg-volt) bg-(--tg-volt-soft) font-bold'
                    : 'border border-(--tg-border) bg-(--tg-s1) font-semibold',
                )}
              >
                <span aria-hidden="true" className="text-[26px] leading-none">
                  {e}
                </span>
                <span>{t(`rate.${k}`)}</span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
        <label htmlFor="tg-feedback" className="mt-2.5 font-mono text-[12px] tracking-[.14em] text-(--tg-t2) uppercase">
          {t('feedback.note')}
        </label>
        <textarea
          id="tg-feedback"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder={t('feedback.placeholder')}
          className="min-h-28 resize-none rounded-[16px] border-[1.5px] border-(--tg-violet) bg-(--tg-field) px-4 py-3.5 text-[15px] leading-[1.5] text-(--tg-text) shadow-[0_0_0_4px_var(--tg-violet-soft2)] outline-none placeholder:text-(--tg-t3)"
        />
        <ToggleGroup.Root
          type="multiple"
          value={topics}
          onValueChange={(v) => setTopics(v as TTopic[])}
          aria-label={t('feedback.topics')}
          className="flex flex-wrap gap-2"
        >
          {TOPICS.map((k) => {
            const on = topics.includes(k);
            return (
              <ToggleGroup.Item
                key={k}
                value={k}
                className={cn(
                  'tg-btn inline-flex h-11 items-center rounded-full px-3.5 text-[14px] font-semibold',
                  on
                    ? 'border border-transparent bg-(--tg-text) text-(--tg-bg)'
                    : 'border border-(--tg-border) bg-(--tg-s1) text-(--tg-text)',
                )}
              >
                {t(`feedback.topic.${k}`)}
              </ToggleGroup.Item>
            );
          })}
        </ToggleGroup.Root>
        {state === 'failed' ? (
          <span role="alert" className="text-[13px] leading-[1.45] text-(--tg-red)">
            {t('feedback.failed')}
          </span>
        ) : null}
        <Note>{t('feedback.privacy')}</Note>
      </PanelBody>
      <PanelFoot
        primary={{
          label:
            state === 'sending' ? t('feedback.sending') : state === 'failed' ? t('feedback.retry') : t('feedback.send'),
          disabled: state === 'sending',
          go: () => void send(),
        }}
        secondary={{ label: t('feedback.later'), go: () => g.a.close() }}
      />
    </>
  );
}

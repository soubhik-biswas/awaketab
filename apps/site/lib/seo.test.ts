import { describe, expect, it } from 'vitest';
import { articleSchema, schemaDate } from './seo';

interface INode {
  '@type': string;
  [key: string]: unknown;
}

const graphOf = (schema: unknown): INode[] => (schema as { '@graph': INode[] })['@graph'];

const base = {
  canonical: 'https://awaketab.com/learn/faq',
  title: 'AwakeTab FAQ',
  description: 'Straight answers.',
  locale: 'en' as const,
  published: '2026-09-27',
  breadcrumbs: [{ name: 'Home', url: 'https://awaketab.com/' }],
};

describe('structured data for articles', () => {
  it('writes every date with a time zone', () => {
    expect(schemaDate('2026-09-27')).toBe('2026-09-27T00:00:00+00:00');
    expect(schemaDate(new Date('2026-11-13T05:30:00Z'))).toBe('2026-11-13T05:30:00.000Z');
    const article = graphOf(articleSchema({ ...base, updated: '2026-11-13' }))[0];
    expect(article?.datePublished).toBe('2026-09-27T00:00:00+00:00');
    expect(article?.dateModified).toBe('2026-11-13T00:00:00+00:00');
  });

  it('always carries an image', () => {
    expect(graphOf(articleSchema(base))[0]?.image).toBe('https://awaketab.com/og/og-01.png');
    expect(graphOf(articleSchema({ ...base, image: 'https://awaketab.com/og?v=guide' }))[0]?.image).toBe(
      'https://awaketab.com/og?v=guide',
    );
  });

  it('adds the questions as plain text, and only when there are some', () => {
    expect(graphOf(articleSchema(base)).some((node) => node['@type'] === 'FAQPage')).toBe(false);
    const faq = graphOf(
      articleSchema({
        ...base,
        faq: [{ q: 'Is it **free**?', a: 'Yes. See the [help centre](/help) for `details`.' }],
      }),
    ).find((node) => node['@type'] === 'FAQPage');
    expect(faq?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is it free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. See the help centre for details.' },
      },
    ]);
  });
});

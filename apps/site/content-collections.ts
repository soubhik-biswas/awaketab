import { defineCollection, defineConfig, type Meta } from '@content-collections/core';
import { compileMarkdown } from '@content-collections/markdown';
import { z } from 'zod';
import { LOCALES } from './i18n/locales';
import { headingIds, pipeTables, readingMinutes } from './lib/markdown';

const presets = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'custom', 'until'] as const;
const modes = ['standard', 'clock', 'focus', 'breathe', 'minimal', 'night', 'message', 'cook'] as const;
const browsers = ['chrome', 'edge', 'firefox', 'safari', 'samsung-internet', 'opera', 'brave'] as const;
const operatingSystems = ['windows', 'macos', 'linux', 'chromeos', 'android', 'ios', 'ipados'] as const;
const lockStates = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const;

const faq = z.object({ q: z.string().max(120), a: z.string().min(40).max(600) });
const text = z.string().min(1).max(700);
const step = z
  .object({
    title: z.string().min(1).max(120),
    text,
    path: z.string().max(90).optional(),
    shot: z.string().max(120).optional(),
    shotSrc: z.string().startsWith('/').optional(),
    shotWidth: z.number().int().positive().optional(),
    shotHeight: z.number().int().positive().optional(),
    short: z.string().max(40).optional(),
  })
  .strict();
const row = z
  .object({
    title: z.string().min(1).max(160),
    text: text.optional(),
    value: z.string().max(80).optional(),
    link: z
      .object({ label: z.string().max(80), href: z.string() })
      .strict()
      .optional(),
  })
  .strict();

const blocks = {
  lead: z.string().min(60).max(700).optional(),
  crumb: z.string().max(48).optional(),
  toc: z.record(z.string(), z.string().max(48)).optional(),
  facts: z
    .array(z.object({ label: z.string().max(40), value: z.string().max(40) }).strict())
    .max(4)
    .optional(),
  steps: z.array(step).min(2).max(8).optional(),
  stepsDone: z.string().max(200).optional(),
  figures: z
    .array(
      z
        .object({
          frame: z.enum(['phone', 'desktop']),
          label: z.string().max(40),
          alt: z.string().max(160),
          caption: z.string().max(160),
          src: z.string().startsWith('/').optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        })
        .strict(),
    )
    .max(2)
    .optional(),
  pills: z
    .array(z.object({ state: z.enum(lockStates), text }).strict())
    .min(2)
    .max(7)
    .optional(),
  checklist: z.array(z.string().min(1).max(200)).min(2).max(8).optional(),
  matrix: z
    .object({
      label: z.string().max(160),
      cols: z.tuple([z.string().max(24), z.string().max(24), z.string().max(24)]),
      rows: z
        .array(
          z
            .object({
              what: z.string().max(120),
              result: z.enum(['works', 'pauses', 'blocked', 'fallback', 'no', 'untested']),
              label: z.string().max(24),
              text,
            })
            .strict(),
        )
        .min(2)
        .max(12),
    })
    .strict()
    .optional(),
  rows: z.record(z.string(), z.array(row).min(1).max(10)).optional(),
  compare: z
    .object({
      label: z.string().max(160),
      what: z.string().max(24),
      cols: z
        .array(z.object({ name: z.string().max(40), us: z.boolean().default(false) }).strict())
        .min(2)
        .max(3),
      rows: z
        .array(
          z
            .object({
              what: z.string().max(80),
              cells: z.array(z.string().max(300)).min(2).max(3),
              same: z.boolean().default(false),
            })
            .strict(),
        )
        .min(3)
        .max(12),
    })
    .strict()
    .optional(),
  picks: z
    .record(
      z.string(),
      z
        .array(z.object({ title: z.string().max(120), text }).strict())
        .min(1)
        .max(6),
    )
    .optional(),
  code: z
    .record(
      z.string(),
      z.object({ lang: z.enum(['js', 'ts', 'html', 'sh', 'text']), text: z.string().min(1).max(2000) }).strict(),
    )
    .optional(),
  notes: z.record(z.string(), z.object({ kicker: z.string().max(40), text }).strict()).optional(),
  lifecycle: z
    .object({
      title: z.string().max(80),
      desc: z.string().max(400),
      edges: z
        .object({ granted: z.string(), hidden: z.string(), visible: z.string(), noApi: z.string(), tap: z.string() })
        .strict(),
      others: z.string().max(40),
      caption: z.string().max(200),
    })
    .strict()
    .optional(),
  toolNote: z.string().max(400).optional(),
};

const page = z
  .object({
    ...blocks,
    title: z.string().max(60),
    description: z.string().min(70).max(155),
    h1: z.string().max(70),
    intent: z.string().max(80),
    secondaryQueries: z.array(z.string()).max(8).default([]),
    preset: z.enum(presets).default('p30'),
    mode: z.enum(modes).default('standard'),
    locale: z.enum(LOCALES),
    reviewed: z.boolean().default(false),
    translationOf: z.string().optional(),
    lastVerified: z.coerce.date().optional(),
    browsers: z.array(z.enum(browsers)).default([]),
    os: z.array(z.enum(operatingSystems)).default([]),
    faq: z.array(faq).min(3).max(5),
    honestLimit: z.string().min(60).max(400),
    related: z.array(z.string()).min(3).max(6),
    noindex: z.boolean().default(false),
    ogTitle: z.string().max(48).optional(),
    author: z.literal('soubhik').default('soubhik'),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    content: z.string(),
  })
  .refine((entry) => entry.title.endsWith(' — AwakeTab'), { message: 'title must end with " — AwakeTab"' });

const verified = page.refine((entry) => entry.lastVerified !== undefined, { message: 'lastVerified required' });

const day = (date: Date | undefined): string | undefined => date?.toISOString().slice(0, 10);

type TPageInput = z.output<typeof page> & { _meta: Meta };

async function articleTransform(
  doc: TPageInput,
  context: Parameters<typeof compileMarkdown>[0],
  kind: 'for' | 'on' | 'vs' | 'guides' | 'learn',
) {
  const [locale = '', enSlug = ''] = doc._meta.path.split('/');
  if (locale !== doc.locale) throw new Error(`${kind}/${doc._meta.path}: frontmatter locale does not match its folder`);
  if (locale !== 'en' && doc.translationOf !== enSlug)
    throw new Error(`${kind}/${doc._meta.path}: translationOf must be "${enSlug}"`);
  const html = await compileMarkdown(
    context,
    { ...doc, content: pipeTables(doc.content) },
    { allowDangerousHtml: true },
  );
  const { lastVerified, published, updated, ...rest } = doc;
  return {
    ...rest,
    kind,
    enSlug,
    html: headingIds(html),
    minutes: readingMinutes(doc.content, doc),
    published: day(published) ?? '',
    updated: day(updated),
    lastVerified: day(lastVerified),
  };
}

const useCases = defineCollection({
  name: 'useCases',
  directory: 'content/for',
  include: '**/*.md',
  schema: page,
  transform: (doc, context) => articleTransform(doc, context, 'for'),
});

const devices = defineCollection({
  name: 'devices',
  directory: 'content/on',
  include: '**/*.md',
  schema: verified,
  transform: (doc, context) => articleTransform(doc, context, 'on'),
});

const comparisons = defineCollection({
  name: 'comparisons',
  directory: 'content/vs',
  include: '**/*.md',
  schema: verified,
  transform: (doc, context) => articleTransform(doc, context, 'vs'),
});

const guides = defineCollection({
  name: 'guides',
  directory: 'content/guides',
  include: '**/*.md',
  schema: verified,
  transform: (doc, context) => articleTransform(doc, context, 'guides'),
});

const docs = defineCollection({
  name: 'docs',
  directory: 'content/learn',
  include: '**/*.md',
  schema: page,
  transform: (doc, context) => articleTransform(doc, context, 'learn'),
});

const changelog = defineCollection({
  name: 'changelog',
  directory: '../../changelog',
  include: '*.md',
  schema: z.object({
    title: z.string().min(1).max(120),
    date: z.coerce.date(),
    release: z.coerce.string().optional(),
    type: z.enum(['new', 'fixed', 'changed']).optional(),
    content: z.string(),
  }),
  transform: async (doc, context) => {
    const html = await compileMarkdown(context, doc);
    const { date, ...rest } = doc;
    return {
      ...rest,
      id: doc._meta.path,
      date: day(date) ?? '',
      type: doc.type ?? 'new',
      items: [...html.matchAll(/<(p|li)>([\s\S]*?)<\/\1>/gu)].map((m) => m[2] ?? ''),
    };
  },
});

export default defineConfig({ content: [useCases, devices, comparisons, guides, docs, changelog] });

import type { ReactNode } from 'react';
import { fullDate } from '@/lib/dates';
import { CONTACT_EMAIL, CONTACT_MAILTO, SITE } from '@/lib/routes';
import { articleSchema } from '@/lib/seo';
import { Block, Note, Prose } from './blocks';
import { JsonLd } from './json-ld';
import { PageHero } from './page-hero';
import * as s from './styles';

export interface ILegalSection {
  id: string;
  title: string;
  summary: string;
  body: ReactNode;
}

export const legalLink = 'text-link underline underline-offset-2';

// The legal boards: crumbs, LEGAL, the dates, then each section as prose with its one-line summary first.
export function LegalPage({
  crumb,
  h1,
  lead,
  description,
  path,
  updated,
  effective,
  sections,
  other,
}: {
  crumb: string;
  h1: string;
  lead: string;
  description: string;
  path: string;
  updated: string;
  effective: string;
  sections: readonly ILegalSection[];
  other: readonly [label: string, href: string];
}) {
  const canonical = `${SITE}${path}`;
  return (
    <>
      <JsonLd
        schema={articleSchema({
          canonical,
          title: h1,
          description,
          locale: 'en',
          published: effective,
          updated,
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: crumb, url: canonical },
          ],
        })}
      />
      <PageHero
        crumbs={[{ label: 'Legal' }, { label: crumb }]}
        eyebrow="Legal"
        h1={h1}
        lead={lead}
        meta={
          <>
            <span>
              Last updated <time dateTime={updated}>{fullDate(updated)}</time>
            </span>
            <span>
              Effective <time dateTime={effective}>{fullDate(effective)}</time>
            </span>
          </>
        }
      />
      <Block label={h1}>
        <Prose
          level={2}
          items={sections.map((sec) => ({
            id: sec.id,
            h: sec.title,
            children: (
              <>
                <p className={s.proseP}>
                  <strong>In short: </strong>
                  {sec.summary}
                </p>
                <div className="flex flex-col gap-4 text-[17px] leading-[1.7] min-[700px]:text-[18px]">{sec.body}</div>
              </>
            ),
          }))}
        />
        <Note>
          Questions:{' '}
          <a href={CONTACT_MAILTO} className={legalLink}>
            {CONTACT_EMAIL}
          </a>{' '}
          ·{' '}
          <a href={other[1]} className={legalLink}>
            {other[0]}
          </a>
        </Note>
      </Block>
    </>
  );
}

import { ArrowUpRight, Github, MessageCircle, Play, Rss } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Mark } from '@/components/brand/mark';
import type { TLocale } from '@/i18n/locales';
import { MAKER_URL, panelHref, ROUTES, SOURCE_URL, toolHref } from '@/lib/routes';
import { Accent } from './accent';
import { FooterLanguage } from './footer/footer-language';
import { FooterStatus } from './footer/footer-status';
import { footGroups, supportLink } from './footer/links';
import { Maker, MAKER } from './footer/maker';
import { WordmarkLight } from './footer/wordmark-light';
import { FooterTheme } from './footer-theme';

const WORD = 'AwakeTab';
const VIEW = '0.5 -140 828.2 140';
const FRAME = { x: -20, y: -170, width: 870, height: 200 };
const GLOW = { filterUnits: 'userSpaceOnUse', x: -40, y: -190, width: 910, height: 240 } as const;
const HEART =
  'M14.2 23.2C13 21 11.2 18.6 8.9 16.4C6.6 14.3 3.4 13 2.3 9.9C1.3 7.3 2.6 4 5.6 2.9C8 1.9 10.4 3.1 11.9 5.1C12.7 6.2 13.1 7.3 13.4 8.6C13.6 7.1 15 5.5 17.2 5.3C19.9 4.9 22.1 7 21.7 9.7C21.3 12.2 18.7 13.6 16.2 15.2C13.6 16.9 10.6 19.7 7.8 23.3';

// The word is stretched to one fixed length, so its outline is the same whichever font file has arrived.
function Word({ className }: { className: string }) {
  return (
    <text className={className} x={0} y={0} textLength={827.09} lengthAdjust="spacingAndGlyphs">
      {WORD}
    </text>
  );
}

function Sheet({ children }: { children: ReactNode }) {
  return (
    <svg className="site-foot-giant-svg" viewBox={VIEW} focusable="false">
      {children}
    </svg>
  );
}

// The outlined wordmark at rest, and the three lit copies the pointer's light shows through.
function WordmarkArt() {
  const mask = { maskUnits: 'userSpaceOnUse', ...FRAME } as const;
  return (
    <>
      <Sheet>
        <defs>
          <linearGradient id="site-foot-giant-rest" gradientUnits="userSpaceOnUse" x1={0} y1={-139} x2={0} y2={0}>
            <stop offset={0} stopColor="#f2f4fa" stopOpacity={0.5} />
            <stop offset={0.72} stopColor="#f2f4fa" stopOpacity={0.3} />
            <stop offset={1} stopColor="#f2f4fa" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="site-foot-giant-hue" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={828} y2={0}>
            <stop offset={0} stopColor="#3df58e" />
            <stop offset={0.3} stopColor="#6fd6d0" />
            <stop offset={0.55} stopColor="#7cbbff" />
            <stop offset={1} stopColor="#9f7bff" />
          </linearGradient>
          <filter id="site-foot-giant-glow-wash" {...GLOW}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="soft" />
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="site-foot-giant-glow-beam" {...GLOW}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={9} result="wide" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="mid" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={1.6} result="near" />
            <feMerge>
              <feMergeNode in="wide" />
              <feMergeNode in="wide" />
              <feMergeNode in="mid" />
              <feMergeNode in="mid" />
              <feMergeNode in="near" />
              <feMergeNode in="near" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="site-foot-giant-glow-hot" {...GLOW}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="wide" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={3} result="near" />
            <feMerge>
              <feMergeNode in="wide" />
              <feMergeNode in="wide" />
              <feMergeNode in="near" />
              <feMergeNode in="near" />
              <feMergeNode in="near" />
            </feMerge>
          </filter>
          <mask id="site-foot-giant-outline" {...mask}>
            <Word className="site-foot-giant-edge" />
            <Word className="site-foot-giant-core" />
          </mask>
          <mask id="site-foot-giant-outline-lit" {...mask}>
            <Word className="site-foot-giant-edge site-foot-giant-edge-lit" />
            <Word className="site-foot-giant-core" />
          </mask>
          <mask id="site-foot-giant-fill" {...mask}>
            <Word className="site-foot-giant-body" />
          </mask>
        </defs>
        <rect
          className="site-foot-giant-ink"
          {...FRAME}
          fill="url(#site-foot-giant-rest)"
          mask="url(#site-foot-giant-outline)"
        />
      </Sheet>
      <div className="site-foot-giant-lights">
        <div className="site-foot-giant-win site-foot-giant-wash">
          <div className="site-foot-giant-art">
            <Sheet>
              <rect
                {...FRAME}
                fill="url(#site-foot-giant-hue)"
                mask="url(#site-foot-giant-outline)"
                filter="url(#site-foot-giant-glow-wash)"
              />
            </Sheet>
          </div>
        </div>
        <div className="site-foot-giant-win site-foot-giant-beam">
          <div className="site-foot-giant-art">
            <Sheet>
              <rect {...FRAME} fill="url(#site-foot-giant-hue)" fillOpacity={0.07} mask="url(#site-foot-giant-fill)" />
              <rect
                {...FRAME}
                fill="url(#site-foot-giant-hue)"
                mask="url(#site-foot-giant-outline-lit)"
                filter="url(#site-foot-giant-glow-beam)"
              />
            </Sheet>
          </div>
        </div>
        <div className="site-foot-giant-win site-foot-giant-hot">
          <div className="site-foot-giant-art">
            <Sheet>
              <rect
                {...FRAME}
                fill="url(#site-foot-giant-hue)"
                mask="url(#site-foot-giant-outline-lit)"
                filter="url(#site-foot-giant-glow-hot)"
              />
              <rect {...FRAME} fill="#f6fffb" mask="url(#site-foot-giant-outline-lit)" />
            </Sheet>
          </div>
        </div>
      </div>
      <div className="site-foot-giant-shelf">
        <span className="site-foot-giant-land">
          <span />
        </span>
      </div>
    </>
  );
}

// A hand-drawn heart that keeps drawing itself; the word it stands for is read out in its place.
function Heart({ children }: { children: ReactNode }) {
  return (
    <>
      <svg className="site-foot-heart" viewBox="0.6 1.2 22.8 22.6" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="site-foot-heart-stroke" gradientUnits="userSpaceOnUse" x1={2} y1={4} x2={22} y2={20}>
            <stop offset={0} stopColor="#3df58e" />
            <stop offset={1} stopColor="#9f7bff" />
          </linearGradient>
        </defs>
        <path pathLength={1} d={HEART} stroke="url(#site-foot-heart-stroke)" />
      </svg>
      <span className="sr-only">{children}</span>
    </>
  );
}

// The footer of the home page and every website page, always graphite whatever the page theme.
export async function SiteFooter({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.foot' });
  const english = locale === 'en';
  const foreign = (onlyEnglish?: boolean) => (onlyEnglish && !english ? 'en' : undefined);
  const support = supportLink(locale);
  return (
    <footer className="site-foot dark">
      <div className="site-foot-glow" aria-hidden="true" />
      <div className="site-foot-glow-b" aria-hidden="true" />
      <div className="site-foot-grid" aria-hidden="true" />
      <div className="site-foot-line" aria-hidden="true" />

      <div className="site-foot-cta">
        <div className="site-foot-cta-text">
          <span className="site-foot-kicker">{t('kicker')}</span>
          <strong className="site-foot-cta-h">
            {t.rich('headline', { accent: (chunks) => <Accent night>{chunks}</Accent> })}
          </strong>
          <span className="site-foot-cta-line">{t('ctaLine')}</span>
        </div>
        <div className="site-foot-cta-acts">
          <a className="site-foot-act" href={toolHref(locale)}>
            <Play className="site-foot-i site-foot-i-fill" aria-hidden="true" />
            {t('links.timer')}
          </a>
          <a className="site-foot-ghost" href={panelHref('feedback', locale)}>
            <MessageCircle className="site-foot-i" aria-hidden="true" />
            {t('feedback')}
          </a>
        </div>
      </div>

      <div className="site-foot-main">
        <div className="site-foot-brand">
          <span className="site-foot-lockup">
            <Mark size={30} tone="dark" label="" />
            <strong>{WORD}</strong>
          </span>
          <span className="site-foot-tagline">{t('tagline')}</span>
          <FooterStatus
            href={support.href}
            hrefLang={foreign(support.english)}
            native={t('status.native')}
            fallback={t('status.fallback')}
          />
          <div className="site-foot-social">
            <a href={SOURCE_URL} rel="noopener" target="_blank" aria-label={`${t('social.github')} (${t('newTab')})`}>
              <Github className="site-foot-i" aria-hidden="true" />
            </a>
            <a href={ROUTES.rss} aria-label={t('social.rss')}>
              <Rss className="site-foot-i" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="site-foot-cols">
          {footGroups(locale).map((group) => (
            <nav
              key={group.id}
              className={`site-foot-col site-foot-col-${group.id}`}
              aria-labelledby={`site-foot-${group.id}`}
            >
              <h2 id={`site-foot-${group.id}`}>{t(`groups.${group.id}`)}</h2>
              {group.links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  hrefLang={foreign(link.english)}
                  {...(link.external ? { rel: 'noopener', target: '_blank' } : {})}
                >
                  <span className="site-foot-lbl">{t(`links.${link.id}`)}</span>
                  {link.fresh && <span className="site-foot-tag">{t('new')}</span>}
                  {link.external && (
                    <>
                      <ArrowUpRight className="site-foot-i" aria-hidden="true" />
                      <span className="sr-only"> ({t('newTab')})</span>
                    </>
                  )}
                </a>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="site-foot-end">
        <WordmarkLight>
          <WordmarkArt />
        </WordmarkLight>
        <div className="site-foot-bar">
          <span className="site-foot-legal">
            <span className="site-foot-copy">{t('copyright', { year: String(new Date().getFullYear()) })}</span>
            <span className="site-foot-made">
              <span className="site-foot-made-in">
                {t.rich('made', {
                  heart: (chunks) => <Heart>{chunks}</Heart>,
                  name: () => <Maker url={MAKER_URL} label={t('makerLink', { name: MAKER })} />,
                })}
              </span>
            </span>
          </span>
          <span className="site-foot-promise">{t('cookies')}</span>
          <FooterTheme
            label={t('theme.label')}
            names={{ system: t('theme.system'), light: t('theme.light'), dark: t('theme.dark') }}
          />
          <FooterLanguage locale={locale} label={t('language')} />
        </div>
      </div>
    </footer>
  );
}

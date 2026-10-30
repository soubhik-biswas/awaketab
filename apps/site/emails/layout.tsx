import type { ReactNode } from 'react';
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'react-email';

// Email clients ignore CSS variables, so the paper theme's values are written out once here.
export const MAIL = {
  ground: '#F6F4EF',
  card: '#FFFFFF',
  line: '#DCD7CC',
  rule: '#EFECE5',
  ink: '#0B1020',
  body: '#2A3045',
  ink2: '#4B5165',
  muted: '#626777',
  note: '#F1EEE7',
  primary: '#B93D0B',
  onPrimary: '#FFFFFF',
  lamp: '#117A3B',
} as const;

export const CONTACT_EMAIL = 'support@awaketab.com';
// Left visible on purpose until the owner fills them in (handoff placeholders).
export const COMPANY_NAME = '[COMPANY NAME]';
export const COMPANY_ADDRESS = '[ADDRESS]';

const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface IMailProps {
  preview: string;
  heading: string;
  body: string;
  rows?: ReadonlyArray<readonly [string, string]>;
  action: { label: string; url: string };
  fallback: string;
  note: string;
  why: string;
}

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M32 11 A21 21 0 1 1 12.27 24.82"
        fill="none"
        stroke={MAIL.ink}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="19.95" cy="14.8" r="5.6" fill={MAIL.lamp} />
    </svg>
  );
}

function Rows({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ border: `1px solid ${MAIL.rule}`, borderRadius: 12, borderCollapse: 'separate', margin: '0 0 16px' }}
    >
      <tbody>
        {rows.map(([k, v], i) => {
          const rule = i > 0 ? `1px solid ${MAIL.rule}` : 'none';
          return (
            <tr key={k}>
              <td style={{ padding: '10px 14px', fontSize: 14, color: MAIL.ink2, borderTop: rule }}>{k}</td>
              <td
                align="right"
                style={{
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: MAIL.ink,
                  textAlign: 'right',
                  borderTop: rule,
                }}
              >
                {v}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// One reason, one action, the same action as a plain link, and a footer saying why it arrived (emails board).
export function MailLayout({ preview, heading, body, rows, action, fallback, note, why }: IMailProps): ReactNode {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: '24px 12px', background: MAIL.ground, color: MAIL.ink, fontFamily: FONT }}>
        <Container
          style={{
            maxWidth: 600,
            background: MAIL.card,
            border: `1px solid ${MAIL.line}`,
            borderRadius: 18,
            borderCollapse: 'separate',
          }}
        >
          <Section style={{ padding: '28px 28px 24px' }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: '0 0 16px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0 8px 0 0', verticalAlign: 'middle' }}>
                    <Mark />
                  </td>
                  <td
                    style={{
                      verticalAlign: 'middle',
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: '-0.035em',
                      color: MAIL.ink,
                    }}
                  >
                    Awake<span style={{ fontWeight: 500 }}>Tab</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <Heading
              as="h1"
              style={{
                margin: '0 0 16px',
                fontSize: 26,
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: MAIL.ink,
              }}
            >
              {heading}
            </Heading>
            <Text style={{ margin: '0 0 16px', fontSize: 16, lineHeight: 1.6, color: MAIL.body }}>{body}</Text>
            {rows && rows.length > 0 ? <Rows rows={rows} /> : null}
            <Button
              href={action.url}
              style={{
                display: 'inline-block',
                padding: '14px 22px',
                borderRadius: 12,
                background: MAIL.primary,
                color: MAIL.onPrimary,
                fontSize: 16,
                fontWeight: 600,
                lineHeight: '20px',
                textDecoration: 'none',
              }}
            >
              {action.label}
            </Button>
            <Text style={{ margin: '16px 0', fontSize: 13, lineHeight: 1.55, color: MAIL.ink2 }}>
              {fallback}{' '}
              <Link href={action.url} style={{ color: MAIL.lamp, textDecoration: 'underline', wordBreak: 'break-all' }}>
                {action.url}
              </Link>
            </Text>
            <Text
              style={{
                margin: 0,
                padding: '12px 14px',
                borderRadius: 12,
                background: MAIL.note,
                fontSize: 14,
                lineHeight: 1.5,
                color: MAIL.body,
              }}
            >
              {note}
            </Text>
          </Section>
          <Section style={{ padding: '16px 28px 22px', borderTop: `1px solid ${MAIL.rule}` }}>
            <Text style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: MAIL.muted }}>
              {why}
              <br />
              {COMPANY_NAME} · {COMPANY_ADDRESS} · {CONTACT_EMAIL}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

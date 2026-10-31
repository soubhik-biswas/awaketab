import type { IEmail } from './send';

export const SIGNIN_MINUTES = 15;
export const CONTACT_EMAIL = 'support@awaketab.com';
// Left visible on purpose until the owner fills them in (handoff §12).
export const COMPANY_NAME = '[COMPANY NAME]';
export const COMPANY_ADDRESS = '[ADDRESS]';

const C = {
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
};
const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

interface IMail {
  to: string;
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  rows?: Array<[string, string]>;
  action: { label: string; url: string };
  fallback: string;
  note: string;
  why: string;
}

const esc = (s: string): string =>
  s.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

const MARK =
  `<svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true" style="display:block">` +
  `<path d="M32 11 A21 21 0 1 1 12.27 24.82" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>` +
  `<circle cx="19.95" cy="14.8" r="5.6" fill="${C.lamp}"/></svg>`;

function html(m: IMail): string {
  const rows = m.rows?.length
    ? `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.rule};border-radius:12px;border-collapse:separate">` +
      m.rows
        .map(
          ([k, v], i) =>
            `<tr><td style="padding:10px 14px;font-size:14px;color:${C.ink2};${i ? `border-top:1px solid ${C.rule};` : ''}">${esc(k)}</td>` +
            `<td align="right" style="padding:10px 14px;font-size:14px;font-weight:600;color:${C.ink};text-align:right;${i ? `border-top:1px solid ${C.rule};` : ''}">${esc(v)}</td></tr>`,
        )
        .join('') +
      `</table></td></tr>`
    : '';
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(m.subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.ground};color:${C.ink};font-family:${FONT}">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.preheader)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:18px;border-collapse:separate">` +
    `<tr><td style="padding:28px 28px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:0 0 16px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 8px 0 0;vertical-align:middle">${MARK}</td>` +
    `<td style="vertical-align:middle;font-size:18px;font-weight:800;letter-spacing:-0.035em;color:${C.ink}">Awake<span style="font-weight:500">Tab</span></td></tr></table></td></tr>` +
    `<tr><td style="padding:0 0 16px"><h1 style="margin:0;font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;color:${C.ink}">${esc(m.heading)}</h1></td></tr>` +
    `<tr><td style="padding:0 0 16px;font-size:16px;line-height:1.6;color:${C.body}">${esc(m.body)}</td></tr>` +
    rows +
    `<tr><td style="padding:0 0 16px"><a href="${esc(m.action.url)}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:${C.primary};color:${C.onPrimary};font-size:16px;font-weight:600;line-height:20px;text-decoration:none">${esc(m.action.label)}</a></td></tr>` +
    `<tr><td style="padding:0 0 16px;font-size:13px;line-height:1.55;color:${C.ink2}">${esc(m.fallback)} <a href="${esc(m.action.url)}" style="color:${C.lamp};text-decoration:underline;word-break:break-all">${esc(m.action.url)}</a></td></tr>` +
    `<tr><td style="padding:12px 14px;border-radius:12px;background:${C.note};font-size:14px;line-height:1.5;color:${C.body}">${esc(m.note)}</td></tr>` +
    `</table></td></tr>` +
    `<tr><td style="padding:16px 28px 22px;border-top:1px solid ${C.rule};font-size:12px;line-height:1.6;color:${C.muted}">${esc(m.why)}<br>${esc(COMPANY_NAME)} · ${esc(COMPANY_ADDRESS)} · ${esc(CONTACT_EMAIL)}</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

function text(m: IMail): string {
  const rows = m.rows?.length ? `\n${m.rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n` : '';
  return [
    'AwakeTab',
    '',
    m.heading,
    '',
    m.body,
    rows,
    `${m.action.label}: ${m.action.url}`,
    '',
    m.note,
    '',
    '--',
    m.why,
    `${COMPANY_NAME} · ${COMPANY_ADDRESS} · ${CONTACT_EMAIL}`,
    '',
  ].join('\n');
}

function build(m: IMail): IEmail {
  return { to: m.to, subject: m.subject, html: html(m), text: text(m) };
}

export function signinEmail(to: string, url: string, minutes = SIGNIN_MINUTES): IEmail {
  return build({
    to,
    subject: 'Your AwakeTab sign-in link',
    preheader: `Works once, for ${String(minutes)} minutes.`,
    heading: 'Sign in to AwakeTab',
    body: 'Someone — hopefully you — asked to sign in with this address. Open the link on the device where you asked for it.',
    action: { label: 'Sign in to AwakeTab', url },
    fallback: 'Button not working? Paste this into your browser:',
    note: 'Didn’t ask for this? Ignore it — nothing changes, and the link expires on its own.',
    why: 'You got this because a sign-in was requested for this address.',
  });
}

export interface IReceipt {
  to: string;
  plan: 'pro_yearly' | 'pro_lifetime';
  amount: string;
  date: string;
  renews: string | null;
  manageUrl: string;
}

export function receiptEmail(r: IReceipt): IEmail {
  const yearly = r.plan === 'pro_yearly';
  return build({
    to: r.to,
    subject: 'Receipt · AwakeTab Pro',
    preheader: 'Pro is on. Here is your receipt.',
    heading: 'Thanks — Pro is on.',
    body: 'Your other devices, history, sound and Face studio are ready. Keeping a screen awake was free before and stays free.',
    rows: [
      ['Plan', yearly ? 'AwakeTab Pro · yearly' : 'AwakeTab Pro · lifetime'],
      ['Amount', r.amount],
      ['Date', r.date],
      ['Paid with', 'Polar'],
    ],
    action: { label: 'Manage billing', url: r.manageUrl },
    fallback:
      yearly && r.renews
        ? `Renews on ${r.renews}. Cancel any time from Settings → Account; Pro stays on until the end of the period. Billing link:`
        : 'A one-time purchase: it never renews. Billing link:',
    note: `Need an invoice with your company details? Reply to ${CONTACT_EMAIL} with the name and address to show.`,
    why: 'You got this because you bought AwakeTab Pro.',
  });
}

export function renewalFailedEmail(to: string, until: string, updateUrl: string): IEmail {
  return build({
    to,
    subject: 'Your Pro renewal didn’t go through',
    preheader: `Pro stays on until ${until}.`,
    heading: 'We couldn’t renew Pro.',
    body: `Polar declined the renewal. Nothing has changed yet — Pro stays on until ${until}. Update the card to keep it.`,
    action: { label: 'Update payment', url: updateUrl },
    fallback: `If nothing changes, your account moves to Free on ${until}. Presets and history stay on this device. Payment link:`,
    note: 'Keeping a screen awake never needs Pro — that part keeps working either way.',
    why: 'You got this because a Pro renewal failed for this address.',
  });
}

export function longDate(ms: number): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `${day}, ${rest}`;
}

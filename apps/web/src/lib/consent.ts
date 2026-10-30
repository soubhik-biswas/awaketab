const SETTINGS = 'at.v1.settings';
const ONBOARDING = 'at.v1.onboarding';
// The analytics question is one more dismissed tip (docs/08 §2.6); the answer is the telemetry switch (§2.1).
const CONSENT_TIP = 'analytics';

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function consentAnswered(): boolean {
  const tips = readJson(ONBOARDING)?.dismissedTips;
  return (Array.isArray(tips) && tips.includes(CONSENT_TIP)) || readJson(SETTINGS)?.telemetry === false;
}

function answerConsent(allow: boolean): void {
  try {
    const settings = readJson(SETTINGS) ?? { v: 1 };
    settings.telemetry = allow;
    localStorage.setItem(SETTINGS, JSON.stringify(settings));
    const onboarding = readJson(ONBOARDING) ?? { v: 1, dismissedTips: [] };
    const tips = Array.isArray(onboarding.dismissedTips) ? (onboarding.dismissedTips as unknown[]) : [];
    if (!tips.includes(CONSENT_TIP)) tips.push(CONSENT_TIP);
    localStorage.setItem(ONBOARDING, JSON.stringify({ ...onboarding, v: 1, dismissedTips: tips }));
  } catch {
    // private mode: the answer lasts for this page
  }
  document.documentElement.dataset.consent = '';
}

export function initConsent(): void {
  const box = document.querySelector<HTMLElement>('[data-consent-box]');
  if (!box) return;
  if (consentAnswered()) {
    document.documentElement.dataset.consent = '';
    return;
  }
  box.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-consent-pick]') : null;
    if (!btn) return;
    answerConsent(btn.dataset.consentPick === 'allow');
    document.getElementById('content')?.focus({ preventScroll: true });
  });
}

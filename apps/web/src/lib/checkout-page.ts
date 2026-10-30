import { readAccount, requestSignin, validEmail } from './account';
import { applyLaunch, fill, longDate, trackPro } from './pro-common';

export type TCheckoutStep = 'plans' | 'account' | 'check' | 'pay';
type TPlan = 'pro_yearly' | 'pro_lifetime';

const STEPS: readonly TCheckoutStep[] = ['plans', 'account', 'check', 'pay'];
const STEP_INDEX: Record<TCheckoutStep, number> = { plans: 0, account: 1, check: 1, pay: 2 };
export const FLOW_KEY = 'at.v1.checkout';

interface IFlow {
  plan: TPlan;
  email: string;
}

function readFlow(): Partial<IFlow> {
  try {
    return (JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? '{}') as Partial<IFlow> | null) ?? {};
  } catch {
    return {};
  }
}

function writeFlow(flow: IFlow): void {
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  } catch {
    // Private mode: the flow still works within this page.
  }
}

// The Polar checkout link with the address prefilled; nothing else of ours travels to Polar.
export function checkoutUrl(link: string, email: string): string {
  if (!link) return '';
  const url = new URL(link);
  if (email) url.searchParams.set('customer_email', email);
  return url.toString();
}

export function setFlowStep(root: HTMLElement, index: number): void {
  const list = root.querySelector<HTMLElement>('[data-flow-steps]');
  if (!list) return;
  list.dataset.step = String(index);
  for (const li of list.querySelectorAll<HTMLElement>('li[data-i]')) {
    const i = Number(li.dataset.i);
    li.toggleAttribute('data-done', i < index);
    if (i === index) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  }
}

export function bootCheckoutPage(root: HTMLElement, now = Date.now()): void {
  applyLaunch(root, now);
  const params = new URLSearchParams(location.search);
  const saved = readFlow();
  const flow: IFlow = {
    plan: params.get('plan') === 'lifetime' ? 'pro_lifetime' : (saved.plan ?? 'pro_yearly'),
    email: saved.email ?? readAccount()?.email ?? '',
  };
  const input = root.querySelector<HTMLInputElement>('[data-account-email]');
  const hint = root.querySelector<HTMLElement>('[data-account-hint]');
  const send = root.querySelector<HTMLButtonElement>('[data-account-send]');
  const unsent = root.querySelector<HTMLElement>('[data-unsent]');
  let busy = false;

  const paintPlan = () => {
    root.dataset.plan = flow.plan;
    for (const b of root.querySelectorAll<HTMLElement>('[data-pick]')) {
      b.setAttribute('aria-checked', String(b.dataset.pick === flow.plan));
      b.tabIndex = b.dataset.pick === flow.plan ? 0 : -1;
    }
    for (const n of root.querySelectorAll<HTMLElement>('[data-for-plan]')) n.hidden = n.dataset.forPlan !== flow.plan;
    const renews = root.querySelector<HTMLElement>('[data-renews]');
    if (renews) {
      const next = new Date(now);
      next.setFullYear(next.getFullYear() + 1);
      renews.textContent = fill(renews.dataset.tpl ?? '{date}', { date: longDate(next.getTime()) });
    }
    writeFlow(flow);
  };

  const paintEmail = () => {
    const ok = validEmail(flow.email);
    for (const n of root.querySelectorAll('[data-email-out]')) n.textContent = flow.email;
    if (input && document.activeElement !== input) input.value = flow.email;
    input?.toggleAttribute('data-valid', ok);
    if (hint) {
      hint.toggleAttribute('data-ok', ok);
      hint.removeAttribute('data-bad');
      hint.textContent = (ok ? hint.dataset.ok : hint.dataset.idle) ?? '';
    }
    send?.setAttribute('aria-disabled', String(!ok));
  };

  const go = (step: TCheckoutStep, focus = true) => {
    // Paying needs an address; anything that skips ahead without one lands on the account step.
    const target = (step === 'check' || step === 'pay') && !validEmail(flow.email) ? 'account' : step;
    root.dataset.step = target;
    for (const main of root.querySelectorAll<HTMLElement>('main[data-for]')) main.hidden = main.dataset.for !== target;
    setFlowStep(root, STEP_INDEX[target]);
    if (location.hash.slice(1) !== target)
      history.replaceState(null, '', `${location.pathname}${location.search}#${target}`);
    if (focus) root.querySelector<HTMLElement>(`main[data-for="${target}"] h1`)?.focus();
  };

  for (const b of root.querySelectorAll<HTMLElement>('[data-pick]'))
    b.addEventListener('click', () => {
      flow.plan = b.dataset.pick === 'pro_lifetime' ? 'pro_lifetime' : 'pro_yearly';
      paintPlan();
    });
  // Arrow keys move between the two plan radios, as a radiogroup should.
  root.querySelector('[role="radiogroup"]')?.addEventListener('keydown', (event) => {
    const e = event as KeyboardEvent;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    flow.plan = flow.plan === 'pro_yearly' ? 'pro_lifetime' : 'pro_yearly';
    paintPlan();
    root.querySelector<HTMLElement>(`[data-pick="${flow.plan}"]`)?.focus();
  });
  root.addEventListener('click', (event) => {
    const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-go]') : null;
    const to = el?.dataset.go as TCheckoutStep | undefined;
    if (to && STEPS.includes(to)) go(to);
  });

  input?.addEventListener('input', () => {
    flow.email = input.value.trim();
    writeFlow(flow);
    paintEmail();
  });

  root.querySelector<HTMLFormElement>('[data-account-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    if (!validEmail(flow.email)) {
      hint?.setAttribute('data-bad', '');
      input?.setAttribute('aria-invalid', 'true');
      input?.focus();
      return;
    }
    input?.removeAttribute('aria-invalid');
    busy = true;
    send?.setAttribute('aria-busy', 'true');
    void requestSignin(flow.email).then((result) => {
      busy = false;
      send?.removeAttribute('aria-busy');
      if (result === 'offline') {
        if (hint) hint.textContent = hint.dataset.offline ?? '';
        hint?.setAttribute('data-bad', '');
        return;
      }
      if (unsent) unsent.hidden = result === 'sent' || result === 'rate_limited';
      // No email provider yet: never claim a link was sent, go straight to payment instead.
      go(result === 'sent' || result === 'rate_limited' ? 'check' : 'pay');
    });
  });

  root.querySelector('[data-pay]')?.addEventListener('click', () => {
    const url = checkoutUrl(root.getAttribute(`data-link-${flow.plan}`) ?? '', flow.email);
    if (!url) return;
    trackPro('pro_checkout_click', { plan: flow.plan }, '/pro/checkout');
    location.assign(url);
  });

  paintPlan();
  paintEmail();
  const start = location.hash.slice(1) as TCheckoutStep;
  go(STEPS.includes(start) ? start : 'plans', false);
}

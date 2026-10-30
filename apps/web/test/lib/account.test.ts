import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACCOUNT_KEY, readAccount, requestSignin, signOut, validEmail, verifySignin, writeAccount } from '../../src/lib/account';
import { checkoutUrl } from '../../src/lib/checkout-page';
import { bootSigninPage } from '../../src/lib/signin-page';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('account storage', () => {
  it('validates addresses the way the sign-in form does', () => {
    expect(validEmail('sam@example.com')).toBe(true);
    expect(validEmail(' sam@example.com ')).toBe(true);
    expect(validEmail('sam@example')).toBe(false);
    expect(validEmail('sam example@x.co')).toBe(false);
  });

  it('round-trips the signed-in address and reads damage as signed out', () => {
    writeAccount('sam@example.com', 5);
    expect(readAccount()).toEqual({ v: 1, email: 'sam@example.com', signedInAt: 5 });
    localStorage.setItem(ACCOUNT_KEY, '{oops');
    expect(readAccount()).toBeNull();
    writeAccount('sam@example.com');
    signOut();
    expect(readAccount()).toBeNull();
  });
});

describe('sign-in requests', () => {
  it('maps the endpoint answers', async () => {
    const answers = [
      [202, 'sent'],
      [429, 'rate_limited'],
      [400, 'bad_email'],
      [503, 'email_unavailable'],
    ] as const;
    for (const [status, result] of answers) {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status }))));
      await expect(requestSignin('sam@example.com')).resolves.toBe(result);
    }
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    await expect(requestSignin('sam@example.com')).resolves.toBe('offline');
  });

  it('verifies a token once', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json({ ok: true, email: 'sam@example.com' }))));
    await expect(verifySignin('t')).resolves.toEqual({ ok: true, email: 'sam@example.com' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json({ error: 'expired' }, { status: 410 }))));
    await expect(verifySignin('t')).resolves.toEqual({ ok: false, offline: false });
  });
});

describe('checkout link', () => {
  it('prefills the address and nothing else', () => {
    expect(checkoutUrl('https://buy.polar.sh/abc', 'sam@example.com')).toBe(
      'https://buy.polar.sh/abc?customer_email=sam%40example.com',
    );
    expect(checkoutUrl('', 'sam@example.com')).toBe('');
  });
});

describe('sign-in page', () => {
  function mount(): HTMLElement {
    document.body.innerHTML = `
      <div data-signin-root data-state="form">
        <h1 id="signin-h1" tabindex="-1"></h1>
        <form data-signin-form>
          <input data-signin-email />
          <p data-signin-help><span data-signin-help-text data-idle="idle" data-bad="bad" data-rate="rate" data-offline="offline">idle</span></p>
          <button type="submit" data-signin-submit>Send</button>
        </form>
        <h2 data-sent-heading tabindex="-1"></h2><strong data-sent-email></strong>
        <strong data-signed-email></strong>
        <button type="button" data-signin-reset></button>
      </div>`;
    const root = document.querySelector<HTMLElement>('[data-signin-root]');
    if (!root) throw new Error('root missing');
    return root;
  }
  const submit = (root: HTMLElement, value: string) => {
    const input = root.querySelector<HTMLInputElement>('[data-signin-email]');
    if (input) input.value = value;
    root.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  };

  beforeEach(() => {
    history.replaceState(null, '', '/signin');
  });

  it('shows the inline error for a bad address without a request', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const root = mount();
    bootSigninPage(root);
    submit(root, 'sam@example');
    expect(root.querySelector('[data-signin-help-text]')?.textContent).toBe('bad');
    expect(root.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('only claims a link was sent when the server sent one', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 503 }))));
    const root = mount();
    bootSigninPage(root);
    submit(root, 'sam@example.com');
    await flush();
    expect(root.dataset.state).toBe('unavailable');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 202 }))));
    submit(root, 'sam@example.com');
    await flush();
    expect(root.dataset.state).toBe('sent');
    expect(root.querySelector('[data-sent-email]')?.textContent).toBe('sam@example.com');
  });

  it('spends the token from the fragment and clears it from the address bar', async () => {
    history.replaceState(null, '', '/signin#token=abc');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json({ ok: true, email: 'sam@example.com' }))));
    const root = mount();
    bootSigninPage(root);
    expect(location.hash).toBe('');
    expect(root.dataset.state).toBe('verifying');
    await flush();
    expect(root.dataset.state).toBe('signed');
    expect(readAccount()?.email).toBe('sam@example.com');
  });

  it('an expired or used link lands on the expired state', async () => {
    history.replaceState(null, '', '/signin#token=abc');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json({ error: 'expired' }, { status: 410 }))));
    const root = mount();
    bootSigninPage(root);
    await flush();
    expect(root.dataset.state).toBe('expired');
  });
});

import { readAccount, requestSignin, signOut, validEmail, verifySignin, writeAccount } from './account';

type TState = 'form' | 'sent' | 'unavailable' | 'verifying' | 'signed' | 'expired';

export function bootSigninPage(root: HTMLElement, loc: Location = location): void {
  const form = root.querySelector<HTMLFormElement>('[data-signin-form]');
  const input = root.querySelector<HTMLInputElement>('[data-signin-email]');
  const help = root.querySelector<HTMLElement>('[data-signin-help]');
  const helpText = root.querySelector<HTMLElement>('[data-signin-help-text]');
  const submit = root.querySelector<HTMLButtonElement>('[data-signin-submit]');
  if (!form || !input || !help || !helpText || !submit) return;
  let tried = false;
  let busy = false;

  const setState = (state: TState, focus?: string) => {
    root.dataset.state = state;
    if (focus) root.querySelector<HTMLElement>(focus)?.focus();
  };

  const showHelp = (kind: 'idle' | 'bad' | 'rate' | 'offline') => {
    const bad = kind !== 'idle';
    help.toggleAttribute('data-error', bad);
    helpText.textContent = helpText.dataset[kind] ?? '';
    if (kind === 'bad') input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const signedIn = (email: string, focus = true) => {
    for (const n of root.querySelectorAll('[data-signed-email]')) n.textContent = email;
    setState('signed', focus ? '#signin-h1' : undefined);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    const email = input.value.trim();
    tried = true;
    if (!validEmail(email)) {
      showHelp('bad');
      input.focus();
      return;
    }
    busy = true;
    submit.setAttribute('aria-busy', 'true');
    void requestSignin(email).then((result) => {
      busy = false;
      submit.removeAttribute('aria-busy');
      if (result === 'sent') {
        for (const n of root.querySelectorAll('[data-sent-email]')) n.textContent = email;
        setState('sent', '[data-sent-heading]');
      } else if (result === 'email_unavailable') setState('unavailable');
      else showHelp(result === 'bad_email' ? 'bad' : result === 'rate_limited' ? 'rate' : 'offline');
    });
  });

  // An error clears as soon as the address becomes valid, and only reappears on the next try.
  input.addEventListener('input', () => {
    if (root.dataset.state === 'unavailable') setState('form');
    if (tried && validEmail(input.value)) showHelp('idle');
  });

  root.querySelector('[data-signin-reset]')?.addEventListener('click', () => {
    input.value = '';
    tried = false;
    showHelp('idle');
    setState('form');
    input.focus();
  });

  root.querySelector('[data-signin-again]')?.addEventListener('click', () => {
    setState('form');
    input.focus();
  });

  root.querySelector('[data-signin-out]')?.addEventListener('click', () => {
    signOut();
    setState('form');
    input.focus();
  });

  const hash = new URLSearchParams(loc.hash.slice(1));
  const token = hash.get('token');
  if (token) {
    // The token leaves the address bar at once so it is never bookmarked, shared or kept in history.
    history.replaceState(null, '', `${loc.pathname}${loc.search}`);
    setState('verifying');
    void verifySignin(token).then((result) => {
      if (result.ok) signedIn(writeAccount(result.email).email);
      else if (result.offline) {
        setState('form');
        showHelp('offline');
      } else setState('expired', '#signin-h1');
    });
    return;
  }
  if (new URLSearchParams(loc.search).get('link') === 'expired') {
    setState('expired');
    return;
  }
  const account = readAccount();
  if (account) signedIn(account.email, false);
  else setState('form');
}

import { afterEach, describe, expect, it } from 'vitest';
import { classifyDenial, createWakeLock } from '../src/index.js';
import { policyBlocks } from '../src/classify.js';
import { createFakeApi } from './fake.js';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const refused = new DOMException('The request is not allowed', 'NotAllowedError');
const byPolicy = new DOMException(
  'Access to Screen Wake Lock features is disallowed by permissions policy',
  'NotAllowedError',
);
const ctx = { visible: true, secure: true, inIframe: true, ua: CHROME };

describe('classifyDenial in a frame', () => {
  it('gives no iframe advice when the policy allows the wake lock', () => {
    expect(classifyDenial(refused, { ...ctx, policyBlocks: false })).toBeNull();
    expect(classifyDenial(byPolicy, { ...ctx, policyBlocks: false })).toBeNull();
  });

  it('gives iframe_no_allow when the policy blocks it', () => {
    expect(classifyDenial(refused, { ...ctx, policyBlocks: true })).toBe('iframe_no_allow');
  });

  it('reads the error text where the browser does not expose the policy', () => {
    expect(classifyDenial(byPolicy, ctx)).toBe('iframe_no_allow');
    expect(
      classifyDenial(new DOMException("'screen-wake-lock' is not allowed by Feature-Policy", 'NotAllowedError'), ctx),
    ).toBe('iframe_no_allow');
    expect(classifyDenial(refused, ctx)).toBeNull();
  });

  it('names the page policy outside a frame', () => {
    expect(classifyDenial(refused, { ...ctx, inIframe: false, policyBlocks: true })).toBe('permissions_policy');
    expect(classifyDenial(byPolicy, { ...ctx, inIframe: false })).toBe('permissions_policy');
    expect(classifyDenial(refused, { ...ctx, inIframe: false })).toBeNull();
  });

  it('still puts an insecure page and a hidden document first', () => {
    expect(classifyDenial(refused, { ...ctx, secure: false, policyBlocks: true })).toBe('insecure_context');
    expect(classifyDenial(refused, { ...ctx, visible: false, policyBlocks: true })).toBe('hidden_document');
  });
});

describe('policyBlocks', () => {
  const docWith = (policy: unknown, key = 'featurePolicy') => ({ [key]: policy }) as unknown as Document;

  it('asks the document policy for screen-wake-lock', () => {
    const asked: string[] = [];
    const allow = (feature: string) => {
      asked.push(feature);
      return true;
    };
    expect(policyBlocks(docWith({ allowsFeature: allow }))).toBe(false);
    expect(policyBlocks(docWith({ allowsFeature: () => false }))).toBe(true);
    expect(policyBlocks(docWith({ allowsFeature: () => false }, 'permissionsPolicy'))).toBe(true);
    expect(asked).toEqual(['screen-wake-lock']);
  });

  it('cannot say without the API', () => {
    expect(policyBlocks(docWith(undefined))).toBeUndefined();
    expect(policyBlocks(undefined)).toBeUndefined();
  });
});

describe('a refusal inside a frame', () => {
  afterEach(() => {
    Object.defineProperty(window, 'self', { configurable: true, value: window });
    Object.defineProperty(window, 'top', { configurable: true, value: window });
    Reflect.deleteProperty(document, 'featurePolicy');
  });

  function inFrame(allowed: boolean) {
    Object.defineProperty(window, 'self', { configurable: true, get: () => ({}) });
    Object.defineProperty(window, 'top', { configurable: true, get: () => ({ other: true }) });
    Object.defineProperty(document, 'featurePolicy', { configurable: true, value: { allowsFeature: () => allowed } });
  }

  it('is not blamed on the frame when the frame is allowed to hold the lock', async () => {
    inFrame(true);
    const fake = createFakeApi();
    fake.rejectNextWith(refused);
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none', retry: false });
    expect(await lock.request()).toBe('denied');
    expect(lock.advice).toBeNull();
    lock.destroy();
  });

  it('is blamed on the frame when its policy blocks the lock', async () => {
    inFrame(false);
    const fake = createFakeApi();
    fake.rejectNextWith(refused);
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none', retry: false });
    expect(await lock.request()).toBe('denied');
    expect(lock.advice).toBe('iframe_no_allow');
    lock.destroy();
  });
});

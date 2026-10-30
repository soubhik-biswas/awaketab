import type { TSceneKey } from './scenes';

// The help centre board (English-only route, like the hubs): six popular topics, two more the search knows, and the
// shortcut chips under the search field.
export interface IHelpTopic {
  title: string;
  line: string;
  href: string;
  words: string;
  scene?: TSceneKey;
  link?: string;
}

export const HELP_TOPICS: readonly IHelpTopic[] = [
  {
    title: 'My screen still goes dark',
    line: 'The three causes, and one fix for each.',
    href: '/learn/honest-limits',
    words: 'sleep sleeps dim dims off black battery saver hidden tab blocked fix',
    scene: 'error',
    link: 'Fix it',
  },
  {
    title: 'Keep an iPhone or iPad awake',
    line: 'What Safari supports and Low Power Mode.',
    href: '/on/iphone-safari',
    words: 'ios ipados safari ipad iphone apple low power mode auto-lock',
    scene: 'offline',
    link: 'Read the guide',
  },
  {
    title: 'Present without dimming',
    line: 'A checklist for talks and screen shares.',
    href: '/for/presentations',
    words: 'slides presenting presentation talk screen share meeting projector',
    scene: 'presenting',
    link: 'Read the guide',
  },
  {
    title: 'Pro, billing and refunds',
    line: 'Plans, cancelling, receipts.',
    href: '/pro',
    words: 'pro price pay payment cancel refund receipt licence license subscription billing',
    scene: 'success',
    link: 'Billing help',
  },
  {
    title: 'Privacy and your data',
    line: 'What stays on your device — almost everything.',
    href: '/privacy',
    words: 'privacy data analytics telemetry cookies delete export gdpr',
    scene: 'conflict',
    link: 'Read the policy',
  },
  {
    title: 'What changed recently',
    line: 'New faces, fixes and improvements.',
    href: '/changelog',
    words: 'changelog release new version update faces fixes',
    scene: 'history',
    link: 'See the changelog',
  },
  {
    title: 'Battery saver blocks the wake lock',
    line: 'Low Power Mode, Energy Saver and battery saver can still dim the screen.',
    href: '/learn/low-power-mode-and-wake-locks',
    words: 'battery saver low power mode energy saver dark dim blocked android',
  },
  {
    title: 'The extension shows a red badge',
    line: 'What the badge colours mean and how to clear a blocked state.',
    href: '/extension',
    words: 'extension chrome edge badge red blocked toolbar pinned',
  },
];

export const HELP_CHIPS: ReadonlyArray<readonly [string, string]> = [
  ['Screen still sleeps', '/learn/honest-limits'],
  ['Battery saver', '/learn/low-power-mode-and-wake-locks'],
  ['iPhone and iPad', '/on/iphone-safari'],
  ['Extension', '/extension'],
  ['Billing', '/pro'],
];

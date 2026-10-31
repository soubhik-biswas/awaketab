import type { MetadataRoute } from 'next';
import { startHref } from '@/lib/routes';

type TWidget = {
  name: string;
  short_name: string;
  description: string;
  tag: string;
  template: string;
  ms_ac_template: string;
  data: string;
  type: string;
  auth: boolean;
  update: number;
  icons: Array<{ src: string; sizes: string; type: string }>;
  screenshots: Array<{ src: string; sizes: string; label: string }>;
};

const ICON = [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }];
// Windows asks for a picture of each widget; the app icon stands in until widget screenshots exist.
const SHOT = (label: string) => [{ src: '/icons/icon-512.png', sizes: '512x512', label }];

const widget = (tag: string, name: string, description: string): TWidget => ({
  name,
  short_name: name,
  description,
  tag,
  template: tag,
  ms_ac_template: `/widgets/${tag}.json`,
  data: '/widgets/data.json',
  type: 'application/json',
  auth: false,
  update: 900,
  icons: ICON,
  screenshots: SHOT(name),
});

// The installed app: its icons, Android shortcuts for the widgets' three presets, and Windows widgets that the
// service worker keeps in step with the open tool.
export default function manifest(): MetadataRoute.Manifest & { widgets: TWidget[] } {
  return {
    id: '/',
    name: 'AwakeTab — keep your screen awake',
    short_name: 'AwakeTab',
    description: 'Keeps your screen awake from the browser, shows when it will sleep again, then lets it sleep.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    lang: 'en',
    dir: 'ltr',
    background_color: '#070B16',
    theme_color: '#070B16',
    categories: ['utilities', 'productivity'],
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Presenting · 1 hour', short_name: 'Presenting', url: startHref('p60', 'standard'), icons: ICON },
      { name: 'Cooking · 45 minutes', short_name: 'Cooking', url: startHref('p45', 'standard'), icons: ICON },
      { name: 'Reading · 30 minutes', short_name: 'Reading', url: startHref('p30', 'standard'), icons: ICON },
      { name: 'Until I stop', short_name: 'Until I stop', url: startHref('pinf', 'standard'), icons: ICON },
    ],
    widgets: [
      widget('awake', 'Awake', 'The time left and when the screen will sleep again.'),
      widget('presets', 'Presets', 'Start Presenting, Cooking or Reading with one tap.'),
      widget('session', 'Session', 'The session with +15 min and Stop.'),
    ],
  };
}

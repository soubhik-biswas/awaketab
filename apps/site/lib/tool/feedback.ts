import type { TDevice, TRating } from '@/lib/tool/ui';

export type TTopic = 'faces' | 'ease' | 'battery' | 'other';

export const TOPICS: readonly TTopic[] = ['faces', 'ease', 'battery', 'other'];

interface IFeedback {
  rating: TRating;
  topics: TTopic[];
  text: string;
  device: TDevice;
  sessions: number;
}

// The browser's family name only, never the full user agent.
function browserName(): string {
  const ua = navigator.userAgent;
  if (/Edg\//u.test(ua)) return 'Edge';
  if (/OPR\//u.test(ua)) return 'Opera';
  if (/Firefox\//u.test(ua)) return 'Firefox';
  if (/SamsungBrowser\//u.test(ua)) return 'Samsung Internet';
  if (/Chrome\//u.test(ua)) return 'Chrome';
  if (/Safari\//u.test(ua)) return 'Safari';
  return 'Other';
}

// Anonymous: the rating, topics and note plus browser family, device size and a session count; nothing that names anyone.
export async function sendFeedback(f: IFeedback): Promise<boolean> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        rating: f.rating,
        topics: f.topics,
        text: f.text.slice(0, 1000),
        device: f.device,
        browser: browserName(),
        sessions: f.sessions,
        version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'web',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

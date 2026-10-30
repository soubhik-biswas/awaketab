export function deviceLabel(
  ua = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  touchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
): string {
  const browser = /Edg(?:e|A|iOS)?\//u.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/u.test(ua)
      ? 'Opera'
      : /SamsungBrowser\//u.test(ua)
        ? 'Samsung Internet'
        : /Firefox\/|FxiOS\//u.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS\//u.test(ua)
            ? 'Chrome'
            : /Safari\//u.test(ua)
              ? 'Safari'
              : 'Browser';
  // iPadOS 13+ reports a Mac user agent; a Mac with a touch screen is an iPad.
  const os =
    /iPad/u.test(ua) || (/Macintosh/u.test(ua) && touchPoints > 1)
      ? 'iPadOS'
      : /iPhone|iPod/u.test(ua)
        ? 'iOS'
        : /Android/u.test(ua)
          ? 'Android'
          : /CrOS/u.test(ua)
            ? 'ChromeOS'
            : /Windows/u.test(ua)
              ? 'Windows'
              : /Mac OS X|Macintosh/u.test(ua)
                ? 'macOS'
                : /Linux/u.test(ua)
                  ? 'Linux'
                  : '';
  return os ? `${browser} · ${os}` : browser;
}

export type TDeviceKind = 'laptop' | 'desktop' | 'tablet' | 'phone';

export function deviceKind(label: string): TDeviceKind {
  if (/iPad|tablet/iu.test(label)) return 'tablet';
  if (/iOS|iPhone|Android/iu.test(label)) return 'phone';
  if (/Windows|Linux|ChromeOS/iu.test(label)) return 'desktop';
  return 'laptop';
}

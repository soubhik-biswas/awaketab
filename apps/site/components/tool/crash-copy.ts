import { isLocale, type TLocale } from '@/i18n/locales';

interface ICrashCopy {
  h: string;
  d: string;
  btn: string;
}

// The same words as tool.glance.crash in the message files, kept here for the one screen that is drawn when the
// page's own layout (and the translations it loads) has failed. A test keeps the two in step.
export const CRASH_COPY: Record<TLocale, ICrashCopy> = {
  en: {
    h: 'The timer ran into a problem.',
    d: 'The screen is no longer being kept awake. Reload the page to start again.',
    btn: 'Reload',
  },
  de: {
    h: 'Der Timer hat ein Problem.',
    d: 'Der Bildschirm wird nicht mehr wach gehalten. Lade die Seite neu, um wieder zu starten.',
    btn: 'Neu laden',
  },
  es: {
    h: 'El temporizador tuvo un problema.',
    d: 'La pantalla ya no se mantiene despierta. Recarga la página para empezar de nuevo.',
    btn: 'Recargar',
  },
  fr: {
    h: 'Le minuteur a rencontré un problème.',
    d: 'L’écran n’est plus maintenu éveillé. Rechargez la page pour recommencer.',
    btn: 'Recharger',
  },
  'pt-br': {
    h: 'O timer teve um problema.',
    d: 'A tela não está mais sendo mantida acordada. Recarregue a página para começar de novo.',
    btn: 'Recarregar',
  },
  ja: {
    h: 'タイマーで問題が発生しました。',
    d: '画面のスリープ防止は止まっています。ページを再読み込みして、もう一度始めてください。',
    btn: '再読み込み',
  },
  zh: {
    h: '计时器出了点问题。',
    d: '屏幕不再保持唤醒。请重新加载页面后再开始。',
    btn: '重新加载',
  },
  hi: {
    h: 'टाइमर में गड़बड़ हो गई।',
    d: 'स्क्रीन अब जागी नहीं रखी जा रही है। फिर से शुरू करने के लिए पेज रीलोड करें।',
    btn: 'रीलोड करें',
  },
};

// The language of a page from its address: "/de/…" is German, anything without a language prefix is English.
export function crashLocale(pathname: string): TLocale {
  const first = pathname.split('/')[1]?.toLowerCase() ?? '';
  return isLocale(first) ? first : 'en';
}

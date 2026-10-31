'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TLocale } from '@/i18n/locales';

type TLinks = Partial<Record<TLocale, string>>;

const Ctx = createContext<{ links: TLinks; set: (links: TLinks) => void }>({ links: {}, set: () => undefined });

// The page tells the header's language menu where each of its translations lives.
export function LocaleLinksProvider({ children }: { children: ReactNode }) {
  const [links, set] = useState<TLinks>({});
  return <Ctx.Provider value={{ links, set }}>{children}</Ctx.Provider>;
}

export function LocaleLinks({ links }: { links: TLinks }) {
  const { set } = useContext(Ctx);
  const key = JSON.stringify(links);
  useEffect(() => {
    set(JSON.parse(key) as TLinks);
    return () => set({});
  }, [key, set]);
  return null;
}

export const useLocaleLinks = (): TLinks => useContext(Ctx).links;

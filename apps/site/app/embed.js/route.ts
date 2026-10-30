import de from '@/messages/de.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import hi from '@/messages/hi.json';
import ja from '@/messages/ja.json';
import ptBr from '@/messages/pt-br.json';
import zh from '@/messages/zh.json';
import { embedLoader, loaderConfig } from '@/lib/embed/loader';

export const dynamic = 'force-static';

type TCatalog = { embed?: { frame?: { title?: string }; attribution?: string } };

const CATALOGS: Record<string, TCatalog> = { en, es, 'pt-br': ptBr, de, fr, ja, zh, hi };

const pickAll = (read: (c: TCatalog) => string | undefined) =>
  Object.fromEntries(
    Object.entries(CATALOGS).flatMap(([lang, c]) => {
      const text = read(c) ?? read(en);
      return text ? [[lang, text]] : [];
    }),
  );

// The loader host sites paste: one IIFE, its strings inlined, cached for an hour so a fix reaches them soon.
export function GET(): Response {
  const cfg = loaderConfig(
    pickAll((c) => c.embed?.frame?.title),
    pickAll((c) => c.embed?.attribution),
  );
  const body = `(${embedLoader.toString()})(window,document.currentScript,${JSON.stringify(cfg)});\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

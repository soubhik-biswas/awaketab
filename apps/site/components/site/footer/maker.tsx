export const MAKER = 'Soubhik Biswas';

// The maker's name in the bottom bar: a link to their profile, or plain bold text while no address is set.
export function Maker({ url, label }: { url: string; label: string }) {
  if (!url) return <strong className="site-foot-maker">{MAKER}</strong>;
  return (
    <a className="site-foot-maker" href={url} rel="noopener me" target="_blank" aria-label={label}>
      {MAKER}
    </a>
  );
}

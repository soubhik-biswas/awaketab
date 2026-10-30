import { Github } from 'lucide-react';

// Google's four-colour "G" is brand art with fixed colours; Lucide has no Google mark.
const G_BLUE = '#4285F4';
const G_GREEN = '#34A853';
const G_YELLOW = '#FBBC05';
const G_RED = '#EA4335';

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={className}>
      <path
        fill={G_BLUE}
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill={G_GREEN}
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill={G_YELLOW}
        d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.27V6.62h-4A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.11Z"
      />
      <path
        fill={G_RED}
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export function GithubLogo({ className }: { className?: string }) {
  return <Github className={className} strokeWidth={1.75} aria-hidden="true" />;
}

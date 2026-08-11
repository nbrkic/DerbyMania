import { useState } from 'react';

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.7 15.8 6.3M8.2 13.3 15.8 17.7" />
    </svg>
  );
}

export function ShareInviteButton({ url, title, text, label = 'Podeli poziv' }: {
  url: string;
  title: string;
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // korisnik je otkazao deljenje
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard nije dostupan
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn-line px-4 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
    >
      <ShareIcon className="w-3.5 h-3.5" />
      {copied ? 'Link kopiran!' : label}
    </button>
  );
}

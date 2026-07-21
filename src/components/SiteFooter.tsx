import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, isNavLinkActive } from '../lib/site-nav';

export function SiteFooter() {
  const location = useLocation();

  return (
    <footer className="border-t border-ink-700 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link to="/" className="font-black tracking-tight">
          DERBY<span className="font-light text-paper-500">MANIA</span>
        </Link>
        <div className="flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className={`text-xs uppercase tracking-widest transition-colors ${
                isNavLinkActive(l.href, location.pathname) ? 'text-red-400' : 'text-paper-700 hover:text-paper-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <span className="text-xs text-paper-700 uppercase tracking-widest">© 2026 DerbyMania</span>
      </div>
    </footer>
  );
}

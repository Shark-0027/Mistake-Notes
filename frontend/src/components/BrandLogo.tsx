export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? " compact" : ""}`}>
      <span className="brand-logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <rect x="6" y="5" width="20" height="22" rx="4" />
          <path d="M10.5 11h11M10.5 15h9M10.5 19h6.5" />
          <path className="brand-underline" d="M11 23.5c2.2-1.4 4.4-1.4 6.6 0 1 .6 2.1.8 3.4.5" />
        </svg>
      </span>
      {!compact && <span className="brand-name">Mistake Notes</span>}
    </div>
  );
}


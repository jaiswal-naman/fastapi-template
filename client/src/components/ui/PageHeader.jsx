/** Hero header used at the top of every page. API unchanged: eyebrow, title, description, icon, actions. */
export function PageHeader({ eyebrow, title, description, icon: Icon, actions, children }) {
  return (
    <header className="panel-lg bracket page-enter relative overflow-hidden p-6 md:p-7">
      {/* blueprint grid + colour wells */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--c-line) / 0.55) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-line) / 0.55) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 120% at 100% 0%, #000 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 120% at 100% 0%, #000 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-brand) / 0.28), transparent 70%)' }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <div className="eyebrow">
            {Icon ? <Icon size={13} aria-hidden /> : null}
            <span>{eyebrow}</span>
          </div>
          <h2 className="font-display mt-3 text-[1.9rem] font-bold leading-[1.1] tracking-tight text-ink md:text-[2.25rem]">
            {title}
          </h2>
          {description ? <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="relative shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="relative mt-5">{children}</div> : null}
    </header>
  );
}

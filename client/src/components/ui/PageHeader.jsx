export function PageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-br from-elevated/80 via-surface to-canvas p-5 md:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(40,83,68,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(40,83,68,0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at top left, black 20%, transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-bright">
            {Icon ? <Icon size={14} aria-hidden /> : null}
            <span>{eyebrow}</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-[1.75rem]">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="relative shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

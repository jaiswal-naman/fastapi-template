/** Titled panel: consistent header row (icon + title + optional right-side slot). */
export function Panel({ title, icon: Icon, subtitle, actions, children, className = '', bodyClassName = 'p-4', flush = false }) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald/10 text-emerald-bright ring-1 ring-emerald/20">
                <Icon size={14} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 className="section-title truncate">{title}</h3>
              {subtitle ? <p className="truncate text-[11.5px] text-muted">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={flush ? '' : bodyClassName}>{children}</div>
    </section>
  );
}

export function Badge({ tone = 'neutral', children, dot = false, className = '' }) {
  const t = {
    neutral: 'border-line-strong text-muted bg-elevated/60',
    brand: 'border-emerald/35 text-emerald-bright bg-emerald/10',
    info: 'border-info/35 text-info bg-info/10',
    warn: 'border-warn/35 text-warn bg-warn/10',
    danger: 'border-danger/35 text-danger bg-danger/10',
    violet: 'border-violet/35 text-violet bg-violet/10',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-medium ${t} ${className}`}>
      {dot ? <span className="led" /> : null}
      {children}
    </span>
  );
}

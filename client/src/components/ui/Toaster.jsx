import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useLabStore } from '../../store/labStore.js';

const STYLE = {
  error: { icon: XCircle, ring: 'border-danger/40', tone: 'text-danger', bar: 'bg-danger' },
  warning: { icon: AlertTriangle, ring: 'border-warn/40', tone: 'text-warn', bar: 'bg-warn' },
  success: { icon: CheckCircle2, ring: 'border-emerald/40', tone: 'text-emerald-bright', bar: 'bg-emerald' },
  info: { icon: Info, ring: 'border-info/40', tone: 'text-info', bar: 'bg-info' },
};

/** Floating toast driven by the store's `notice`. Auto-dismisses; errors stay longer. */
export function Toaster() {
  const notice = useLabStore((s) => s.notice);
  const clear = useLabStore((s) => s.clearNotice);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(clear, notice.type === 'error' ? 8000 : 4500);
    return () => clearTimeout(t);
  }, [notice, clear]);

  if (!notice) return null;
  const s = STYLE[notice.type] || STYLE.info;
  const Icon = s.icon;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] w-[min(380px,calc(100vw-2.5rem))]" role="status" aria-live="polite">
      <div className={`animate-toast pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border bg-surface/95 p-3.5 pl-4 shadow-float backdrop-blur-xl ${s.ring}`}>
        <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
        <Icon size={18} className={`mt-0.5 shrink-0 ${s.tone}`} />
        <p className="flex-1 text-[13px] leading-snug text-ink">{notice.message}</p>
        <button type="button" onClick={clear} className="shrink-0 rounded p-0.5 text-muted hover:text-ink" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Network, Sparkles } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLabStore } from '../../store/labStore.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Panel.jsx';
import { TopologyGlyph } from './TopologyGlyph.jsx';

const PREVIEWS = {
  star: { title: 'Star', hint: 'Hub-and-spoke switch fabric', learn: 'Single point of failure, switching, fan-out', tags: ['Switch', 'PC × 3', 'Server'] },
  bus: { title: 'Bus', hint: 'Linear multi-hop delay chain', learn: 'Per-hop delay accumulation, queueing', tags: ['Chain', 'Multi-hop'] },
  ring: { title: 'Ring', hint: 'Circular switch path', learn: 'Alternate directions, redundancy', tags: ['Switch × 4', 'Endpoints'] },
  mesh: { title: 'Mesh', hint: 'Alternate router routes', learn: 'Routing around failed links', tags: ['Router × 4', 'Redundant'] },
  blank: { title: 'Blank', hint: 'Empty custom canvas', learn: 'Design your own topology from scratch', tags: ['Empty'] },
};

export function CreateLabPage() {
  const navigate = useNavigate();
  const createLab = useLabStore((s) => s.createLab);
  const setNotice = useLabStore((s) => s.setNotice);
  const [name, setName] = useState('My first lab');
  const [template, setTemplate] = useState('star');
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.templates().then((r) => setTemplates(r.templates)).catch(() => {});
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Lab name is required.');
      return;
    }
    setBusy(true);
    try {
      await createLab({ name: name.trim(), template });
      setNotice({ type: 'success', message: 'Lab created.' });
      navigate('/network');
    } catch (err) {
      setError(err.message || 'Failed to create lab.');
    } finally {
      setBusy(false);
    }
  }

  const cards = templates.length
    ? templates
    : Object.entries(PREVIEWS).map(([id, meta]) => ({ id, name: meta.title, description: meta.hint }));
  const selected = cards.find((c) => c.id === template) || cards[0];
  const meta = PREVIEWS[selected?.id] || {};

  return (
    <form onSubmit={onCreate} className="space-y-5">
      <PageHeader
        eyebrow="Create lab"
        title="Choose a starter topology"
        description="Start from a teaching template or a blank canvas. Creating a lab builds a valid graph and opens Network Playground."
        icon={Network}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="panel-lg p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="section-title">1 · Starting point</h3>
            <span className="font-mono text-[11px] text-faint">{cards.length} templates</span>
          </div>

          <fieldset className="mt-4">
            <legend className="sr-only">Starting topology template</legend>
            <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((t) => {
                const isSel = template === t.id;
                return (
                  <label
                    key={t.id}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 transition duration-200 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald ${
                      isSel
                        ? 'border-emerald bg-emerald/[0.07] shadow-[0_0_0_1px_rgb(var(--c-brand)/0.5),0_10px_30px_-14px_rgb(var(--c-brand)/0.5)]'
                        : 'border-line bg-canvas/30 hover:-translate-y-0.5 hover:border-emerald/45 hover:bg-raised/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      className="sr-only"
                      checked={isSel}
                      onChange={() => setTemplate(t.id)}
                    />
                    <span
                      className={`absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full transition ${
                        isSel ? 'scale-100 bg-emerald text-on-brand' : 'scale-75 bg-raised text-transparent opacity-0 group-hover:opacity-60'
                      }`}
                      aria-hidden
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <div className="grid h-[88px] place-items-center rounded-lg border border-line/80 bg-surface/80 px-3">
                      <TopologyGlyph id={t.id} className="h-full w-full max-w-[150px]" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-display text-[15px] font-semibold capitalize text-ink">{PREVIEWS[t.id]?.title || t.name}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.description || PREVIEWS[t.id]?.hint}</p>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* summary / submit rail */}
        <aside className="panel-lg bracket sticky top-0 space-y-5 p-5 md:p-6">
          <div>
            <h3 className="section-title">2 · Name it</h3>
            <label className="label mt-3" htmlFor="lab-name">Lab name</label>
            <input
              id="lab-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              placeholder="e.g. Campus backbone"
            />
            <div className="mt-1.5 text-right font-mono text-[10.5px] text-faint">{name.length}/80</div>
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 p-4">
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              <Sparkles size={12} className="text-emerald-bright" /> Selected
            </div>
            <div className="mt-3 grid h-24 place-items-center rounded-lg border border-line/70 bg-surface/80">
              <TopologyGlyph id={selected?.id} className="h-full w-full max-w-[170px]" />
            </div>
            <div className="font-display mt-3 text-base font-semibold capitalize text-ink">{meta.title || selected?.name}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{selected?.description}</p>
            {meta.learn ? (
              <p className="mt-2 text-[12px] leading-snug text-muted">
                <span className="font-semibold text-ink">You'll explore: </span>
                {meta.learn}
              </p>
            ) : null}
            {meta.tags ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {meta.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  Create Lab <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

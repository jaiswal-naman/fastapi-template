import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLabStore } from '../../store/labStore.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

const PREVIEWS = {
  star: { title: 'Star', hint: 'Hub-and-spoke switch fabric' },
  bus: { title: 'Bus', hint: 'Linear multi-hop delay chain' },
  ring: { title: 'Ring', hint: 'Circular switch path' },
  mesh: { title: 'Mesh', hint: 'Alternate router routes' },
  blank: { title: 'Blank', hint: 'Empty custom canvas' },
};

function MiniPreview({ id }) {
  if (id === 'star') {
    return (
      <svg viewBox="0 0 120 72" className="h-16 w-full text-emerald-bright" aria-hidden>
        <circle cx="60" cy="36" r="7" fill="currentColor" />
        <circle cx="24" cy="18" r="4" fill="#A7C4B8" />
        <circle cx="96" cy="18" r="4" fill="#A7C4B8" />
        <circle cx="24" cy="54" r="4" fill="#A7C4B8" />
        <circle cx="96" cy="54" r="4" fill="#A7C4B8" />
        <path d="M60 36L24 18M60 36L96 18M60 36L24 54M60 36L96 54" stroke="#285344" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === 'bus') {
    return (
      <svg viewBox="0 0 120 72" className="h-16 w-full" aria-hidden>
        <path d="M12 36H108" stroke="#285344" strokeWidth="2" />
        {[20, 44, 68, 92].map((x) => (
          <circle key={x} cx={x} cy="36" r="5" fill="#34D399" />
        ))}
      </svg>
    );
  }
  if (id === 'ring') {
    return (
      <svg viewBox="0 0 120 72" className="h-16 w-full" aria-hidden>
        <circle cx="60" cy="36" r="22" fill="none" stroke="#285344" strokeWidth="2" />
        <circle cx="60" cy="14" r="4" fill="#34D399" />
        <circle cx="82" cy="36" r="4" fill="#34D399" />
        <circle cx="60" cy="58" r="4" fill="#34D399" />
        <circle cx="38" cy="36" r="4" fill="#34D399" />
      </svg>
    );
  }
  if (id === 'mesh') {
    return (
      <svg viewBox="0 0 120 72" className="h-16 w-full" aria-hidden>
        <path d="M30 20L90 20L90 52L30 52Z M30 20L90 52M90 20L30 52" stroke="#285344" strokeWidth="1.5" fill="none" />
        <circle cx="30" cy="20" r="4" fill="#60A5FA" />
        <circle cx="90" cy="20" r="4" fill="#60A5FA" />
        <circle cx="90" cy="52" r="4" fill="#60A5FA" />
        <circle cx="30" cy="52" r="4" fill="#34D399" />
      </svg>
    );
  }
  return (
    <div className="flex h-16 items-center justify-center text-[11px] text-muted">Empty canvas</div>
  );
}

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

  return (
    <form onSubmit={onCreate} className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        eyebrow="Create lab"
        title="Choose a starter topology"
        description="Start from a teaching template or a blank canvas. Creating a lab builds a valid graph and opens Network Playground."
        icon={Network}
      />

      <div className="panel-lg p-5 md:p-6">
        <label className="label" htmlFor="lab-name">Lab name</label>
        <input
          id="lab-name"
          className="field max-w-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />

        <fieldset className="mt-6">
          <legend className="section-title">Starting point</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((t) => {
              const selected = template === t.id;
              return (
                <label
                  key={t.id}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selected
                      ? 'border-emerald bg-emerald/10 ring-1 ring-emerald/40'
                      : 'border-line bg-canvas/40 hover:border-emerald/45'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setTemplate(t.id)}
                  />
                  <div className="font-medium capitalize text-ink">{t.name}</div>
                  <p className="mt-1 text-xs text-muted">{t.description || PREVIEWS[t.id]?.hint}</p>
                  <div className="mt-3 rounded-lg border border-line bg-surface/80 px-2 py-1">
                    <MiniPreview id={t.id} />
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create Lab'}
          </button>
        </div>
      </div>
    </form>
  );
}

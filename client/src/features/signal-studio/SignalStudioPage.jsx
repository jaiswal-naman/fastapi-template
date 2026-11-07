import { useMemo, useState } from 'react';
import { Signal } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';

const SCHEMES = [
  { id: 'unipolar_nrz', label: 'Unipolar NRZ' },
  { id: 'polar_nrz_l', label: 'Polar NRZ-L' },
  { id: 'polar_nrz_i', label: 'Polar NRZ-I' },
  { id: 'polar_rz', label: 'Polar RZ' },
  { id: 'manchester', label: 'Manchester' },
  { id: 'differential_manchester', label: 'Differential Manchester' },
  { id: 'ami', label: 'Bipolar AMI' },
  { id: 'pseudoternary', label: 'Pseudoternary' },
  { id: 'b8zs', label: 'B8ZS' },
  { id: 'hdb3', label: 'HDB3' },
];

function Waveform({ levels, bitCount, highlightBit }) {
  if (!levels?.length) {
    return <div className="empty-state">Generate a waveform to render levels derived from the encoder.</div>;
  }
  const half = 2;
  const width = Math.max(640, levels.length * 28);
  const height = 168;
  const mid = height / 2;
  const step = width / levels.length;
  let d = '';
  levels.forEach((lvl, i) => {
    const x0 = i * step;
    const x1 = (i + 1) * step;
    const y = mid - lvl * 52;
    d += `${i === 0 ? 'M' : 'L'}${x0},${y} L${x1},${y} `;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-canvas/80">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 min-w-full" role="img" aria-label="Encoded waveform">
        <defs>
          <linearGradient id="waveStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <line x1="0" y1={mid} x2={width} y2={mid} stroke="#285344" />
        {Array.from({ length: bitCount + 1 }).map((_, i) => {
          const x = i * half * step;
          return <line key={i} x1={x} y1="0" x2={x} y2={height} stroke="#12352B" strokeDasharray="3 3" />;
        })}
        {highlightBit != null ? (
          <rect x={highlightBit * half * step} y="0" width={half * step} height={height} fill="rgba(16,185,129,0.14)" />
        ) : null}
        <path d={d.trim()} fill="none" stroke="url(#waveStroke)" strokeWidth="2.25" />
        <text x="10" y="18" fill="#A7C4B8" fontSize="11">+1</text>
        <text x="10" y={mid + 4} fill="#A7C4B8" fontSize="11">0</text>
        <text x="10" y={height - 10} fill="#A7C4B8" fontSize="11">-1</text>
      </svg>
    </div>
  );
}

export function SignalStudioPage() {
  const [bits, setBits] = useState('10100111');
  const [scheme, setScheme] = useState('manchester');
  const [compare, setCompare] = useState('ami');
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  async function generate(e) {
    e?.preventDefault();
    setError('');
    if (!/^[01]+$/.test(bits)) {
      setError('Enter only binary characters 0 and 1.');
      return;
    }
    setBusy(true);
    try {
      const a = await api.encodeSignal({ bits, scheme });
      const b = await api.encodeSignal({ bits, scheme: compare });
      setPrimary(a.result);
      setSecondary(b.result);
      setStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const levelText = useMemo(() => (primary ? primary.levels.join(' ') : ''), [primary]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Signal Studio"
        title="Line coding waveforms"
        description="Encoders run on the server. Manchester uses IEEE 802.3 (0 = high→low, 1 = low→high). Convention is shown with every result."
        icon={Signal}
      />

      <form onSubmit={generate} className="panel-lg grid gap-3 p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="bits">Binary input</label>
          <input
            id="bits"
            className="field font-mono"
            value={bits}
            onChange={(e) => setBits(e.target.value.replace(/[^01]/g, ''))}
          />
        </div>
        <div>
          <label className="label" htmlFor="scheme">Scheme</label>
          <select id="scheme" className="field" value={scheme} onChange={(e) => setScheme(e.target.value)}>
            {SCHEMES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="compare">Compare with</label>
          <select id="compare" className="field" value={compare} onChange={(e) => setCompare(e.target.value)}>
            {SCHEMES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Encoding…' : 'Generate waveform'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setBits('');
              setPrimary(null);
              setSecondary(null);
            }}
          >
            Clear
          </button>
        </div>
        {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-lg p-5">
          <h3 className="section-title">{SCHEMES.find((s) => s.id === scheme)?.label}</h3>
          {primary ? <p className="mt-1 text-xs text-muted">{primary.convention}</p> : null}
          <div className="mt-3">
            <Waveform levels={primary?.levels} bitCount={bits.length} highlightBit={primary ? step : null} />
          </div>
          {primary ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Step back
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep((s) => Math.min(bits.length - 1, s + 1))}
              >
                Step through bits
              </button>
              <span className="status-pill">Bit {step}: {bits[step] ?? '—'}</span>
            </div>
          ) : null}
          <p className="mt-3 font-mono text-xs text-muted break-all">Levels: {levelText || '—'}</p>
          {primary?.substitutions?.length ? (
            <div className="mt-2 text-xs">
              Substitutions
              <ul className="mt-1 space-y-1 font-mono text-muted">
                {primary.substitutions.map((s, i) => (
                  <li key={i}>{s.rule}: bit {s.startBit} · [{s.pattern}]</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="panel-lg p-5">
          <h3 className="section-title">Compare: {SCHEMES.find((s) => s.id === compare)?.label}</h3>
          {secondary ? <p className="mt-1 text-xs text-muted">{secondary.convention}</p> : null}
          <div className="mt-3">
            <Waveform levels={secondary?.levels} bitCount={bits.length} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {secondary?.explanation || 'Generate to compare schemes side by side. Colour is paired with axis labels and level text.'}
          </p>
        </div>
      </div>
    </div>
  );
}

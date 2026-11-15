import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight, AudioWaveform, Binary, Eraser, Pause, Play, SkipBack, SkipForward, Waves, Zap,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { Scope, signalStats } from './ScopeDisplay.jsx';

const SCHEMES = [
  { id: 'unipolar_nrz', label: 'Unipolar NRZ', family: 'NRZ', blurb: '1 = +V, 0 = 0 V for the full bit' },
  { id: 'polar_nrz_l', label: 'Polar NRZ-L', family: 'NRZ', blurb: '1 = +V, 0 = −V; level carries the bit' },
  { id: 'polar_nrz_i', label: 'Polar NRZ-I', family: 'NRZ', blurb: 'Invert the level on every 1' },
  { id: 'polar_rz', label: 'Polar RZ', family: 'RZ', blurb: '±V first half, returns to 0 V' },
  { id: 'manchester', label: 'Manchester', family: 'Biphase', blurb: 'IEEE 802.3 mid-bit transition' },
  { id: 'differential_manchester', label: 'Differential Manchester', family: 'Biphase', blurb: 'Mid-bit always; start edge = 0' },
  { id: 'ami', label: 'Bipolar AMI', family: 'Bipolar', blurb: '0 = 0 V, 1s alternate +V / −V' },
  { id: 'pseudoternary', label: 'Pseudoternary', family: 'Bipolar', blurb: '1 = 0 V, 0s alternate +V / −V' },
  { id: 'b8zs', label: 'B8ZS', family: 'Scrambled', blurb: 'AMI + 8-zero violation pattern' },
  { id: 'hdb3', label: 'HDB3', family: 'Scrambled', blurb: 'AMI + 4-zero substitution' },
];

const PRESETS = [
  { label: '10100111', bits: '10100111', note: 'Mixed' },
  { label: '11110000', bits: '11110000', note: 'Runs' },
  { label: '10101010', bits: '10101010', note: 'Alternating' },
  { label: '00000000', bits: '00000000', note: 'Zeros' },
  { label: '1000000001', bits: '1000000001', note: 'B8ZS' },
  { label: '1000011000010', bits: '1000011000010', note: 'HDB3' },
];

const schemeOf = (id) => SCHEMES.find((s) => s.id === id);

export function SignalStudioPage() {
  const [bits, setBits] = useState('10100111');
  const [scheme, setScheme] = useState('manchester');
  const [compare, setCompare] = useState('ami');
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const scopeRef = useRef(null);

  const generate = useCallback(
    async (e, override) => {
      e?.preventDefault();
      const useBits = override?.bits ?? bits;
      const useScheme = override?.scheme ?? scheme;
      const useCompare = override?.compare ?? compare;
      setError('');
      if (!/^[01]+$/.test(useBits)) {
        setError('Enter only binary characters 0 and 1.');
        return;
      }
      setBusy(true);
      setPlaying(false);
      try {
        const a = await api.encodeSignal({ bits: useBits, scheme: useScheme });
        const b = await api.encodeSignal({ bits: useBits, scheme: useCompare });
        setPrimary(a.result);
        setSecondary(b.result);
        setStep(0);
        setRunKey((k) => k + 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [bits, scheme, compare],
  );

  // Populate the scopes on first load with the default input.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    generate(null);
  }, [generate]);

  const bitCount = primary?.bits?.length ?? 0;

  // Auto-step transport
  useEffect(() => {
    if (!playing || !bitCount) return undefined;
    const t = setInterval(() => setStep((s) => (s + 1) % bitCount), 650);
    return () => clearInterval(t);
  }, [playing, bitCount]);

  const safeStep = bitCount ? Math.min(step, bitCount - 1) : 0;
  const statsA = useMemo(() => signalStats(primary?.levels), [primary]);
  const statsB = useMemo(() => signalStats(secondary?.levels), [secondary]);

  const levelText = primary ? primary.levels.join(' ') : '';
  const bitsValid = bits.length > 0;
  const activeLevels = primary ? [primary.levels[safeStep * 2], primary.levels[safeStep * 2 + 1]] : null;
  const lvl = (v) => (v > 0 ? '+V' : v < 0 ? '−V' : '0');

  const onKeyScope = (e) => {
    if (!bitCount) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); setStep((s) => Math.min(bitCount - 1, s + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setStep((s) => Math.max(0, s - 1)); }
  };

  const swap = () => {
    setScheme(compare);
    setCompare(scheme);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Signal Studio"
        title="Line coding waveforms"
        description="Encoders run on the server. Manchester uses IEEE 802.3 (0 = high→low, 1 = low→high). Convention is shown with every result."
        icon={AudioWaveform}
      />

      {/* ───────────── Controls ───────────── */}
      <form onSubmit={generate} className="panel-lg grid grid-cols-[minmax(0,1fr)] gap-6 p-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:p-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-end justify-between">
              <label className="label !mb-0" htmlFor="bits">Binary input</label>
              <span className="font-mono text-[11px] text-faint">{bits.length} bit{bits.length === 1 ? '' : 's'}</span>
            </div>
            <div className="relative mt-2">
              <Binary size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-bright" />
              <input
                id="bits"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!bitsValid}
                className={`field pl-9 font-mono text-[17px] tracking-[0.28em] ${!bitsValid ? 'border-danger/60' : ''}`}
                value={bits}
                maxLength={64}
                placeholder="10100111"
                onChange={(e) => setBits(e.target.value.replace(/[^01]/g, ''))}
              />
            </div>

            {/* live bit register preview */}
            <div className="mt-2.5 flex min-h-[28px] flex-wrap gap-1" aria-hidden>
              {bits.split('').map((b, i) => (
                <span
                  key={i}
                  className={`grid h-6 w-6 place-items-center rounded font-mono text-[12px] font-semibold ring-1 ${
                    b === '1' ? 'bg-emerald/15 text-emerald-bright ring-emerald/30' : 'bg-raised text-muted ring-line-strong'
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
            {error ? <p className="mt-2 text-[12.5px] text-danger" role="alert">{error}</p> : null}
          </div>

          <div>
            <div className="label">Quick patterns</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.bits}
                  type="button"
                  onClick={() => { setBits(p.bits); generate(null, { bits: p.bits }); }}
                  className={`rounded-lg border px-2.5 py-1.5 text-left transition hover:border-emerald/50 ${
                    bits === p.bits ? 'border-emerald/50 bg-emerald/10' : 'border-line-strong bg-elevated/50'
                  }`}
                  title={`${p.note} pattern`}
                >
                  <span className="block font-mono text-[11.5px] text-ink">{p.label.length > 10 ? `${p.label.slice(0, 9)}…` : p.label}</span>
                  <span className="block font-mono text-[9.5px] uppercase tracking-wider text-faint">{p.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="compare">Compare with (CH2)</label>
            <div className="flex gap-2">
              <select id="compare" className="field" value={compare} onChange={(e) => setCompare(e.target.value)}>
                {SCHEMES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button type="button" className="btn-secondary btn-icon shrink-0" onClick={swap} aria-label="Swap CH1 and CH2 schemes" title="Swap channels">
                <ArrowLeftRight size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={busy}>
              <Zap size={15} /> {busy ? 'Encoding…' : 'Generate waveform'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setBits(''); setPrimary(null); setSecondary(null); setPlaying(false); setError(''); }}
            >
              <Eraser size={15} /> Clear
            </button>
          </div>
        </div>

        {/* scheme picker (CH1) */}
        <div>
          <div className="flex items-end justify-between">
            <span className="label !mb-0" id="scheme-label">Scheme (CH1)</span>
            <span className="font-mono text-[11px] text-faint">{schemeOf(scheme)?.family}</span>
          </div>
          <div
            role="radiogroup"
            aria-labelledby="scheme-label"
            id="scheme"
            className="mt-2 grid gap-2 sm:grid-cols-2"
          >
            {SCHEMES.map((s) => {
              const on = scheme === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setScheme(s.id)}
                  className={`group relative rounded-xl border p-3 text-left transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${
                    on
                      ? 'border-emerald/60 bg-emerald/10 shadow-[0_0_0_1px_rgb(var(--c-brand)/0.35),0_10px_26px_-14px_rgb(var(--c-brand)/0.6)]'
                      : 'border-line bg-elevated/40 hover:border-line-strong hover:bg-raised/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-display text-[13.5px] font-semibold tracking-tight ${on ? 'text-ink' : 'text-ink/90'}`}>{s.label}</span>
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        on ? 'border-emerald bg-emerald text-on-brand' : 'border-line-strong'
                      }`}
                    >
                      {on ? <span className="h-1.5 w-1.5 rounded-full bg-on-brand" /> : null}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-muted">{s.blurb}</p>
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* ───────────── Oscilloscope ───────────── */}
      <Panel
        title="Oscilloscope"
        subtitle="CH1 and CH2 share one timebase — click a bit cell or use ← → to step"
        icon={Waves}
        bodyClassName="p-4 md:p-5"
        actions={
          primary ? (
            <div className="flex items-center gap-1.5">
              <button type="button" className="btn-secondary btn-sm btn-icon" onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label="Step back" title="Step back">
                <SkipBack size={14} />
              </button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={13} /> : <Play size={13} />}
                <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setStep((s) => Math.min(bitCount - 1, s + 1))}
                aria-label="Step through bits"
                title="Step through bits"
              >
                <span className="hidden sm:inline">Step</span> <SkipForward size={14} />
              </button>
            </div>
          ) : null
        }
      >
        <div
          ref={scopeRef}
          tabIndex={0}
          onKeyDown={onKeyScope}
          className="space-y-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          aria-label="Waveform viewer. Use left and right arrow keys to step through bits."
        >
          <Scope
            channel="CH1"
            tone="brand"
            title={schemeOf(scheme)?.label}
            convention={primary?.convention}
            levels={primary?.levels}
            bits={primary?.bits}
            activeBit={primary ? safeStep : null}
            onSelectBit={setStep}
            substitutions={primary?.substitutions || []}
            runKey={runKey}
          />
          <Scope
            channel="CH2"
            tone="accent"
            title={schemeOf(compare)?.label}
            convention={secondary?.convention}
            levels={secondary?.levels}
            bits={secondary?.bits}
            activeBit={secondary ? safeStep : null}
            onSelectBit={setStep}
            substitutions={secondary?.substitutions || []}
            runKey={runKey}
          />
        </div>

        {/* transport readout */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="status-pill">
            Bit {primary ? safeStep : '—'}: <span className="text-ink">{primary ? primary.bits[safeStep] : '—'}</span>
          </span>
          {activeLevels ? (
            <span className="status-pill">
              CH1 levels <span className="text-emerald-bright">{lvl(activeLevels[0])}</span>
              <span className="text-faint">→</span>
              <span className="text-emerald-bright">{lvl(activeLevels[1])}</span>
            </span>
          ) : null}
          {secondary ? (
            <span className="status-pill">
              CH2 levels <span className="text-accent">{lvl(secondary.levels[safeStep * 2])}</span>
              <span className="text-faint">→</span>
              <span className="text-accent">{lvl(secondary.levels[safeStep * 2 + 1])}</span>
            </span>
          ) : null}
          <span className="ml-auto hidden font-mono text-[10.5px] text-faint md:inline">← → step · click a cell to jump</span>
        </div>
      </Panel>

      {/* ───────────── Measurements ───────────── */}
      {statsA ? (
        <div className="stagger grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Bits encoded" value={bitCount} hint={`${statsA.elements} signal elements`} icon={Binary} tone="brand" />
          <MetricTile
            label="Transitions · CH1"
            value={statsA.transitions}
            hint={`${(statsA.transitions / bitCount).toFixed(2)} per bit · CH2 ${statsB?.transitions ?? '—'}`}
            icon={Zap}
            tone="accent"
          />
          <MetricTile
            label="DC component · CH1"
            value={`${statsA.dc >= 0 ? '' : '−'}${Math.abs(statsA.dc).toFixed(2)} V`}
            hint={`mean of levels · CH2 ${statsB ? `${statsB.dc < 0 ? '−' : ''}${Math.abs(statsB.dc).toFixed(2)} V` : '—'}`}
            icon={Waves}
            tone="violet"
          />
          <MetricTile
            label="Voltage levels · CH1"
            value={statsA.distinct}
            hint={`${statsA.distinct === 3 ? 'ternary (+V, 0, −V)' : 'binary'} · CH2 ${statsB?.distinct ?? '—'}`}
            icon={AudioWaveform}
            tone="info"
          />
        </div>
      ) : null}

      {/* ───────────── Explanations ───────────── */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Panel title={schemeOf(scheme)?.label} subtitle="CH1 · primary scheme" icon={AudioWaveform}>
          <p className="text-[13px] leading-relaxed text-muted">
            {primary?.explanation || 'Generate a waveform to see how the encoder maps bits onto signal levels.'}
          </p>
          {primary?.substitutions?.length ? (
            <div className="mt-4">
              <div className="label">Substitutions</div>
              <ul className="space-y-1.5">
                {primary.substitutions.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-violet/25 bg-violet/5 px-3 py-2 font-mono text-[11.5px] text-muted">
                    <Badge tone="violet">{s.rule}</Badge>
                    <span>bit {s.startBit}</span>
                    <span className="text-faint">·</span>
                    <span className="text-ink">[{s.pattern}]</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4">
            <div className="label">Levels</div>
            <p className="break-all rounded-lg border border-line bg-canvas/50 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-muted">
              Levels: {levelText || '—'}
            </p>
          </div>
        </Panel>

        <Panel title={`Compare: ${schemeOf(compare)?.label}`} subtitle="CH2 · comparison scheme" icon={ArrowLeftRight}>
          <p className="text-[13px] leading-relaxed text-muted">
            {secondary?.explanation || 'Generate to compare schemes side by side. Colour is paired with axis labels and level text.'}
          </p>
          {statsA && statsB ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-line">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Measure</th>
                    <th>CH1</th>
                    <th>CH2</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[12px]">
                  <tr><td className="text-muted">Transitions</td><td>{statsA.transitions}</td><td>{statsB.transitions}</td></tr>
                  <tr><td className="text-muted">DC component</td><td>{statsA.dc.toFixed(2)} V</td><td>{statsB.dc.toFixed(2)} V</td></tr>
                  <tr><td className="text-muted">Levels used</td><td>{statsA.distinct}</td><td>{statsB.distinct}</td></tr>
                  <tr><td className="text-muted">Substitutions</td><td>{primary.substitutions.length}</td><td>{secondary.substitutions.length}</td></tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

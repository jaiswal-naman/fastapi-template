import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Braces, Calculator, Gauge, Layers, Radio, Sigma, Signal, Waves, Zap } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';
import { Panel, Badge } from '../../components/ui/Panel.jsx';
import { InstrumentField, INSTRUMENT_CSS } from './InstrumentControls.jsx';
import { CapacityChart, DeltaChart, PcmDiagram, formatRate } from './ChannelCharts.jsx';

const TABS = [
  {
    id: 'nyquist', label: 'Nyquist', formula: 'C = 2B log₂(M)', icon: Signal,
    blurb: 'Noiseless channel limit',
    explain: 'On a noiseless channel the maximum bit rate depends only on bandwidth and how many distinct signal levels the receiver can tell apart.',
  },
  {
    id: 'shannon', label: 'Shannon', formula: 'C = B log₂(1 + SNR)', icon: Waves,
    blurb: 'Noisy channel limit',
    explain: 'Noise sets a hard ceiling: capacity grows linearly with bandwidth but only logarithmically with signal-to-noise ratio, however many levels you use.',
  },
  {
    id: 'pcm', label: 'PCM', formula: 'R = n × fs', icon: Layers,
    blurb: 'Digitising analogue audio',
    explain: 'Pulse-code modulation samples the signal fs times per second, quantises each sample to 2ⁿ levels, and sends n bits per sample.',
  },
  {
    id: 'delta', label: 'Delta Modulation', formula: 'staircase ± step', icon: Activity,
    blurb: 'One bit per sample',
    explain: 'Each bit says whether the staircase estimate should step up (1) or down (0) by a fixed Δ, so the reconstruction chases the input.',
  },
];

const DELTA_PRESETS = [
  { label: 'Default', text: '0,1,2,3,2,1,0,-1' },
  { label: 'Ramp', text: '0,1,2,3,4,5,6,7' },
  { label: 'Wave', text: '0,1.5,2.5,3,2.5,1.5,0,-1.5,-2.5,-3,-2.5,-1.5,0' },
  { label: 'Step', text: '0,0,0,5,5,5,5,0,0,0' },
];

const U = (v, u) => (
  <>
    {v}
    <span className="ml-1.5 text-[0.95rem] font-medium text-muted">{u}</span>
  </>
);

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 });

export function ChannelLabPage() {
  const [tab, setTab] = useState('nyquist');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(true);

  const [nyquist, setNyquist] = useState({ bandwidthHz: 3000, levels: 4 });
  const [shannon, setShannon] = useState({ bandwidthHz: 3000, snrDb: 30 });
  const [pcm, setPcm] = useState({ bitsPerSample: 8, sampleRateHz: 8000 });
  const [delta, setDelta] = useState({ stepSize: 1, samplesText: '0,1,2,3,2,1,0,-1' });

  const seq = useRef(0);

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setError('');
    setBusy(true);
    try {
      let body;
      if (tab === 'nyquist') body = { experiment: 'nyquist', ...nyquist };
      else if (tab === 'shannon') body = { experiment: 'shannon', ...shannon };
      else if (tab === 'pcm') body = { experiment: 'pcm', ...pcm };
      else {
        const samples = delta.samplesText
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));
        body = { experiment: 'delta', stepSize: delta.stepSize, samples };
      }
      const res = await api.channel(body);
      if (mine !== seq.current) return; // a newer request superseded this one
      setResult(res.result);
    } catch (err) {
      if (mine !== seq.current) return;
      setResult(null);
      setError(err.message);
    } finally {
      if (mine === seq.current) setBusy(false);
    }
  }, [tab, nyquist, shannon, pcm, delta]);

  // Live mode: recompute (debounced) whenever the active tab's inputs change.
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    if (!live) return undefined;
    const t = setTimeout(() => runRef.current(), 320);
    return () => clearTimeout(t);
  }, [live, tab, nyquist, shannon, pcm, delta]);

  function calculate(e) {
    e.preventDefault();
    run();
  }

  const active = TABS.find((t) => t.id === tab);
  const ActiveIcon = active.icon;

  return (
    <div className="space-y-5">
      <style>{INSTRUMENT_CSS}</style>
      <PageHeader
        eyebrow="Channel Lab"
        title="Capacity, sampling & modulation"
        description="Explore Nyquist and Shannon limits, PCM bit rate, and delta-modulation reconstruction. Results are calculated on the server — never fabricated in the UI."
        icon={Radio}
      />

      {/* experiment selector */}
      <div role="tablist" aria-label="Experiment" className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {TABS.map((t) => {
          const on = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                if (t.id === tab) return; // re-clicking the active tab must not discard its result
                setTab(t.id);
                setResult(null);
                setError('');
              }}
              className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${
                on
                  ? 'border-emerald/60 bg-emerald/10 shadow-[0_0_0_1px_rgb(var(--c-brand)/0.3),0_12px_30px_-16px_rgb(var(--c-brand)/0.65)]'
                  : 'border-line bg-surface/70 hover:-translate-y-0.5 hover:border-line-strong hover:bg-raised/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 transition ${on ? 'bg-emerald text-on-brand ring-emerald' : 'bg-raised text-muted ring-line-strong group-hover:text-ink'}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[14px] font-semibold tracking-tight text-ink">{t.label}</div>
                  <div className="truncate text-[11.5px] text-muted">{t.blurb}</div>
                </div>
              </div>
              <div className={`mt-3 rounded-md border px-2.5 py-1.5 font-mono text-[12px] ${on ? 'border-emerald/30 bg-canvas/50 text-emerald-bright' : 'border-line bg-canvas/40 text-muted'}`}>
                {t.formula}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ───────── Control panel ───────── */}
        <form onSubmit={calculate} className="panel-lg space-y-4 p-5 lg:sticky lg:top-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow"><Gauge size={12} /> Control panel</div>
              <h3 className="section-title mt-1.5">Inputs</h3>
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2 font-mono text-[11px] text-muted">
              <span className={live ? 'text-emerald-bright' : ''}>Live</span>
              <button
                type="button"
                role="switch"
                aria-checked={live}
                aria-label="Live recalculation"
                onClick={() => setLive((v) => !v)}
                className={`relative h-5 w-9 rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${live ? 'border-emerald bg-emerald/90' : 'border-line-strong bg-raised'}`}
              >
                <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${live ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </label>
          </div>

          <div className="rounded-lg border border-emerald/25 bg-emerald/[0.06] px-3 py-2 font-mono text-[12.5px] text-emerald-bright">
            <span className="text-muted">formula </span>{active.formula}
          </div>

          {tab === 'nyquist' ? (
            <div className="space-y-3">
              <InstrumentField
                label="Bandwidth B (Hz)" unit="Hz" value={nyquist.bandwidthHz}
                onChange={(v) => setNyquist({ ...nyquist, bandwidthHz: v })}
                scale="log" sliderMin={100} sliderMax={10000000}
                hint="Usable channel width. A voice line is ≈ 3 kHz."
              />
              <InstrumentField
                label="Signal levels M" unit="levels" value={nyquist.levels} min={2}
                onChange={(v) => setNyquist({ ...nyquist, levels: v })}
                scale="pow2" sliderMin={2} sliderMax={256}
                hint="Distinct amplitude levels per symbol."
              />
            </div>
          ) : null}

          {tab === 'shannon' ? (
            <div className="space-y-3">
              <InstrumentField
                label="Bandwidth B (Hz)" unit="Hz" value={shannon.bandwidthHz}
                onChange={(v) => setShannon({ ...shannon, bandwidthHz: v })}
                scale="log" sliderMin={100} sliderMax={10000000}
              />
              <InstrumentField
                label="SNR (dB)" unit="dB" value={shannon.snrDb} allowNegative step="any"
                onChange={(v) => setShannon({ ...shannon, snrDb: v })}
                scale="linear" sliderMin={-10} sliderMax={60}
                hint="Signal-to-noise ratio in decibels. +10 dB = 10×, +30 dB = 1000×."
              />
            </div>
          ) : null}

          {tab === 'pcm' ? (
            <div className="space-y-3">
              <InstrumentField
                label="Bits per sample n" unit="bits" value={pcm.bitsPerSample} min={1} step="any"
                onChange={(v) => setPcm({ ...pcm, bitsPerSample: v })}
                scale="linear" sliderMin={1} sliderMax={24}
              />
              <InstrumentField
                label="Sample rate fs (Hz)" unit="Hz" value={pcm.sampleRateHz}
                onChange={(v) => setPcm({ ...pcm, sampleRateHz: v })}
                scale="log" sliderMin={1000} sliderMax={200000}
                hint="Telephony uses 8 kHz; CD audio 44.1 kHz."
              />
            </div>
          ) : null}

          {tab === 'delta' ? (
            <div className="space-y-3">
              <InstrumentField
                label="Step size" value={delta.stepSize} min={0.01} step="any"
                onChange={(v) => setDelta({ ...delta, stepSize: v })}
                scale="log" sliderMin={0.01} sliderMax={10}
                hint="Δ added or subtracted per sample."
              />
              <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
                <label className="label" htmlFor="dm-samples">Input samples (comma-separated)</label>
                <input
                  id="dm-samples"
                  className="field font-mono"
                  value={delta.samplesText}
                  onChange={(e) => setDelta({ ...delta, samplesText: e.target.value })}
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {DELTA_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDelta({ ...delta, samplesText: p.text })}
                      className={`rounded-md border px-2 py-1 font-mono text-[11px] transition hover:border-emerald/50 ${
                        delta.samplesText === p.text ? 'border-emerald/50 bg-emerald/10 text-emerald-bright' : 'border-line-strong bg-elevated/50 text-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-[12.5px] text-danger" role="alert">{error}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>
              <Calculator size={15} /> {busy ? 'Calculating…' : 'Calculate'}
            </button>
            <span className="font-mono text-[11px] text-faint">{live ? 'recalculates as you adjust' : 'manual mode'}</span>
          </div>
        </form>

        {/* ───────── Results ───────── */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="section-title">Result</span>
              <Badge tone="info">Simulated calculation</Badge>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <span className={`led ${busy ? 'live text-warn' : result ? 'text-emerald-bright' : 'text-faint'}`} />
              {busy ? 'computing' : result ? 'server result' : 'awaiting input'}
            </span>
          </div>

          {!result ? (
            <div className="empty-state">
              Enter parameters and calculate to see capacity or reconstruction output with units.
            </div>
          ) : (
            <div key={`${tab}`} className="stagger min-w-0 space-y-4">
              {/* headline KPIs */}
              {result.capacityBps != null ? (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                  <HeroKpi label="Capacity" value={formatRate(result.capacityBps).value} unit={formatRate(result.capacityBps).unit} hint={`${result.capacityBps.toFixed(2)} bps · Simulated`} icon={Zap} />
                  <MetricTile label="Capacity" value={U(result.capacityMbps.toFixed(6), 'Mbps')} hint="Same result" icon={Gauge} tone="accent" />
                  {result.bitsPerSymbol != null ? (
                    <MetricTile label="Bits per symbol" value={result.bitsPerSymbol.toFixed(3)} hint={`log₂(${result.levels}) bits per level`} icon={Layers} tone="violet" />
                  ) : null}
                  {result.snrLinear != null ? (
                    <MetricTile label="SNR (linear)" value={result.snrLinear.toFixed(2)} hint={`${result.snrDb} dB as a power ratio`} icon={Waves} tone="violet" />
                  ) : null}
                  <MetricTile
                    label="Spectral efficiency"
                    value={U((result.capacityBps / result.bandwidthHz).toFixed(2), 'bps/Hz')}
                    hint="capacity ÷ bandwidth"
                    icon={Sigma}
                    tone="info"
                  />
                </div>
              ) : null}

              {result.bitRateBps != null ? (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                  <HeroKpi label="Bit rate" value={formatRate(result.bitRateBps).value} unit={formatRate(result.bitRateBps).unit} hint={`${result.bitRateBps.toFixed(0)} bps`} icon={Zap} />
                  <MetricTile label="Bit rate" value={U(result.bitRateBps.toFixed(0), 'bps')} hint={`${result.bitRateKbps} kbps`} icon={Gauge} tone="accent" />
                  <MetricTile label="Quantisation levels" value={fmt(2 ** result.bitsPerSample)} hint={`2^${result.bitsPerSample} amplitude steps`} icon={Layers} tone="violet" />
                  <MetricTile label="Sample period" value={U((1e6 / result.sampleRateHz).toFixed(2), 'µs')} hint={`1 / ${fmt(result.sampleRateHz)} Hz`} icon={Waves} tone="info" />
                </div>
              ) : null}

              {result.bitstream ? (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                  <MetricTile label="Samples in" value={result.inputSamples.length} hint="input points" icon={Activity} tone="accent" />
                  <MetricTile label="Bits out" value={result.bitstream.length} hint="1 bit per step" icon={Zap} />
                  <MetricTile label="Step size Δ" value={result.stepSize} hint="per sample" icon={Sigma} tone="violet" />
                </div>
              ) : null}

              {/* graph */}
              {tab === 'nyquist' && result.capacityBps != null ? (
                <CapacityChart kind="nyquist" bandwidthHz={result.bandwidthHz} levels={result.levels} capacityBps={result.capacityBps} />
              ) : null}
              {tab === 'shannon' && result.capacityBps != null ? (
                <CapacityChart kind="shannon" bandwidthHz={result.bandwidthHz} snrDb={result.snrDb} capacityBps={result.capacityBps} />
              ) : null}
              {tab === 'pcm' && result.bitRateBps != null ? (
                <PcmDiagram bitsPerSample={result.bitsPerSample} sampleRateHz={result.sampleRateHz} bitRateBps={result.bitRateBps} />
              ) : null}
              {tab === 'delta' && result.bitstream ? <DeltaChart result={result} /> : null}

              {/* formula callout */}
              <FormulaCallout tab={tab} result={result} explain={active.explain} icon={ActiveIcon} />

              {result.snrLinear != null ? (
                <p className="rounded-lg border border-line bg-canvas/40 px-3 py-2 font-mono text-xs text-muted">
                  SNR_linear = 10^(SNR_dB/10) = {result.snrLinear.toFixed(4)}
                </p>
              ) : null}

              {result.bitstream ? (
                <div className="panel p-4">
                  <div className="label">Bitstream</div>
                  <p className="break-all font-mono text-[13px] tracking-[0.2em] text-emerald-bright">{result.bitstream.join('')}</p>
                  <div className="label mt-4">Reconstruction</div>
                  <p className="break-all font-mono text-xs text-muted">{result.reconstruction.map((n) => n.toFixed(2)).join(', ')}</p>
                </div>
              ) : null}

              <details className="panel group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-[11.5px] text-muted transition hover:text-ink">
                  <Braces size={14} className="text-emerald-bright" />
                  Raw server response
                  <span className="ml-auto text-faint transition group-open:rotate-90">▸</span>
                </summary>
                <pre className="overflow-auto border-t border-line bg-canvas/60 p-4 font-mono text-[11px] leading-relaxed text-muted">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroKpi({ label, value, unit, hint, icon: Icon }) {
  return (
    <div className="metric-tile relative overflow-hidden !p-5 sm:col-span-3">
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-brand) / 0.3), transparent 70%)' }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">{label}</div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
          <Icon size={15} />
        </span>
      </div>
      <div className="relative mt-3 flex flex-wrap items-baseline gap-2">
        <span className="font-display tabular gradient-text text-[2.75rem] font-bold leading-none tracking-tight">{value}</span>
        <span className="font-display text-xl font-semibold text-muted">{unit}</span>
      </div>
      <div className="relative mt-2 font-mono text-[11.5px] text-muted">{hint}</div>
    </div>
  );
}

function FormulaCallout({ tab, result, explain, icon: Icon }) {
  let symbolic = '';
  let worked = '';
  if (tab === 'nyquist' && result.capacityBps != null) {
    symbolic = 'C = 2B · log₂(M)';
    worked = `C = 2 × ${fmt(result.bandwidthHz)} × log₂(${fmt(result.levels)}) = ${fmt(+result.capacityBps.toFixed(2))} bps`;
  } else if (tab === 'shannon' && result.capacityBps != null) {
    symbolic = 'C = B · log₂(1 + SNR)';
    worked = `C = ${fmt(result.bandwidthHz)} × log₂(1 + ${+result.snrLinear.toFixed(3)}) = ${fmt(+result.capacityBps.toFixed(2))} bps`;
  } else if (tab === 'pcm' && result.bitRateBps != null) {
    symbolic = 'R = n × fs';
    worked = `R = ${fmt(result.bitsPerSample)} × ${fmt(result.sampleRateHz)} = ${fmt(result.bitRateBps)} bps`;
  } else if (tab === 'delta' && result.bitstream) {
    symbolic = 'x̂[k] = x̂[k−1] ± Δ';
    worked = `x̂[k] = x̂[k−1] ± ${result.stepSize}   (bit 1 → +Δ, bit 0 → −Δ)`;
  } else return null;

  return (
    <div className="panel bracket p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald/10 text-emerald-bright ring-1 ring-emerald/20"><Icon size={14} /></span>
        <span className="eyebrow">Formula</span>
      </div>
      <div className="mt-3 font-mono text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]">{symbolic}</div>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-canvas/50 px-3 py-2.5 font-mono text-[13px] text-emerald-bright">
        {worked}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{explain}</p>
    </div>
  );
}

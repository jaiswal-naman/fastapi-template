import { useState } from 'react';
import { Radio } from 'lucide-react';
import { api } from '../../services/api.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { MetricTile } from '../../components/ui/MetricTile.jsx';

const TABS = [
  { id: 'nyquist', label: 'Nyquist', formula: 'C = 2B log₂(M)' },
  { id: 'shannon', label: 'Shannon', formula: 'C = B log₂(1 + SNR)' },
  { id: 'pcm', label: 'PCM', formula: 'R = n × fs' },
  { id: 'delta', label: 'Delta Modulation', formula: 'staircase ± step' },
];

export function ChannelLabPage() {
  const [tab, setTab] = useState('nyquist');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [nyquist, setNyquist] = useState({ bandwidthHz: 3000, levels: 4 });
  const [shannon, setShannon] = useState({ bandwidthHz: 3000, snrDb: 30 });
  const [pcm, setPcm] = useState({ bitsPerSample: 8, sampleRateHz: 8000 });
  const [delta, setDelta] = useState({ stepSize: 1, samplesText: '0,1,2,3,2,1,0,-1' });

  async function calculate(e) {
    e.preventDefault();
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
      setResult(res.result);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Channel Lab"
        title="Capacity, sampling & modulation"
        description="Explore Nyquist and Shannon limits, PCM bit rate, and delta-modulation reconstruction. Results are calculated on the server — never fabricated in the UI."
        icon={Radio}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              setTab(t.id);
              setResult(null);
              setError('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={calculate} className="panel-lg space-y-4 p-5">
          <div>
            <div className="section-title">Inputs</div>
            <p className="mt-1 font-mono text-xs text-emerald-bright/90">{TABS.find((t) => t.id === tab)?.formula}</p>
          </div>

          {tab === 'nyquist' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bandwidth B (Hz)" value={nyquist.bandwidthHz} onChange={(v) => setNyquist({ ...nyquist, bandwidthHz: v })} />
              <Field label="Signal levels M" value={nyquist.levels} onChange={(v) => setNyquist({ ...nyquist, levels: v })} min={2} />
            </div>
          ) : null}

          {tab === 'shannon' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bandwidth B (Hz)" value={shannon.bandwidthHz} onChange={(v) => setShannon({ ...shannon, bandwidthHz: v })} />
              <Field label="SNR (dB)" value={shannon.snrDb} onChange={(v) => setShannon({ ...shannon, snrDb: v })} allowNegative />
            </div>
          ) : null}

          {tab === 'pcm' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bits per sample n" value={pcm.bitsPerSample} onChange={(v) => setPcm({ ...pcm, bitsPerSample: v })} min={1} />
              <Field label="Sample rate fs (Hz)" value={pcm.sampleRateHz} onChange={(v) => setPcm({ ...pcm, sampleRateHz: v })} />
            </div>
          ) : null}

          {tab === 'delta' ? (
            <div className="space-y-3">
              <Field label="Step size" value={delta.stepSize} onChange={(v) => setDelta({ ...delta, stepSize: v })} min={0.01} step="any" />
              <div>
                <label className="label" htmlFor="dm-samples">Input samples (comma-separated)</label>
                <input
                  id="dm-samples"
                  className="field font-mono"
                  value={delta.samplesText}
                  onChange={(e) => setDelta({ ...delta, samplesText: e.target.value })}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Calculating…' : 'Calculate'}
          </button>
        </form>

        <div className="panel-lg space-y-4 p-5">
          <div className="section-title">Result · Simulated calculation</div>
          {!result ? (
            <div className="empty-state">
              Enter parameters and calculate to see capacity or reconstruction output with units.
            </div>
          ) : (
            <div className="space-y-4">
              {result.capacityBps != null ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Capacity" value={`${result.capacityBps.toFixed(2)} bps`} hint="Simulated" />
                  <MetricTile label="Capacity" value={`${result.capacityMbps.toFixed(6)} Mbps`} hint="Same result" />
                </div>
              ) : null}
              {result.bitRateBps != null ? (
                <MetricTile label="Bit rate" value={`${result.bitRateBps.toFixed(0)} bps`} hint={`${result.bitRateKbps} kbps`} />
              ) : null}
              {result.snrLinear != null ? (
                <p className="font-mono text-xs text-muted">SNR_linear = 10^(SNR_dB/10) = {result.snrLinear.toFixed(4)}</p>
              ) : null}
              {result.bitstream ? (
                <div>
                  <div className="label">Bitstream</div>
                  <p className="font-mono text-xs break-all text-emerald-bright">{result.bitstream.join('')}</p>
                  <div className="label mt-3">Reconstruction</div>
                  <p className="font-mono text-xs break-all text-muted">{result.reconstruction.map((n) => n.toFixed(2)).join(', ')}</p>
                </div>
              ) : null}
              <pre className="overflow-auto rounded-md border border-line bg-canvas/70 p-3 font-mono text-[11px] text-muted">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, min = 0, step = 'any', allowNegative = false }) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="field"
        value={value}
        min={allowNegative ? undefined : min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      />
    </div>
  );
}

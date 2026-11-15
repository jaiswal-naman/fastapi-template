import { Settings } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { useLabStore } from '../../store/labStore.js';

export function SettingsPage() {
  const connectionStatus = useLabStore((s) => s.connectionStatus);
  const currentLab = useLabStore((s) => s.currentLab);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Session & environment"
        description="This build uses a local demo session without authentication. Secrets are not stored in the browser."
        icon={Settings}
      />

      <section className="panel-lg divide-y divide-line p-0 overflow-hidden">
        <Row label="Session type" value="Local demo session" />
        <Row label="Realtime link" value={connectionStatus} />
        <Row label="Active lab" value={currentLab?.name || 'None'} />
        <Row label="Persistence" value="JSON store on server (server/data)" />
        <Row label="Auth" value="Not implemented (by design for v1)" />
        <Row label="Native packet capture" value="Out of scope — simulation only" />
      </section>

      <section className="panel-lg p-5 text-sm text-muted">
        <div className="section-title text-ink">Accessibility</div>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Status is never colour-only — text labels accompany indicators.</li>
          <li>2D topology and text/list fallbacks accompany the 3D scene.</li>
          <li>prefers-reduced-motion is respected in global CSS.</li>
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { useLabStore } from '../store/labStore.js';
import { OverviewPage } from '../features/dashboard/OverviewPage.jsx';
import { CreateLabPage } from '../features/topology/CreateLabPage.jsx';
import { NetworkPlaygroundPage } from '../features/topology/NetworkPlaygroundPage.jsx';
import { PacketPlaygroundPage } from '../features/packets/PacketPlaygroundPage.jsx';
import { ObservatoryPage } from '../features/observatory/ObservatoryPage.jsx';
import { SignalStudioPage } from '../features/signal-studio/SignalStudioPage.jsx';
import { ChannelLabPage } from '../features/channel-lab/ChannelLabPage.jsx';
import { ExperimentsPage } from '../features/experiments/ExperimentsPage.jsx';
import { ExperimentReportPage } from '../features/experiments/ExperimentReportPage.jsx';
import { ConceptsPage } from '../features/concepts/ConceptsPage.jsx';
import { SettingsPage } from '../features/settings/SettingsPage.jsx';

export default function App() {
  const initSocket = useLabStore((s) => s.initSocket);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="create-lab" element={<CreateLabPage />} />
        <Route path="network" element={<NetworkPlaygroundPage />} />
        <Route path="packets" element={<PacketPlaygroundPage />} />
        <Route path="observatory" element={<ObservatoryPage />} />
        <Route path="signal-studio" element={<SignalStudioPage />} />
        <Route path="channel-lab" element={<ChannelLabPage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="experiments/:experimentId" element={<ExperimentReportPage />} />
        <Route path="concepts" element={<ConceptsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Cable,
  FlaskConical,
  FolderOpen,
  LayoutGrid,
  MousePointer2,
  Network as NetworkIcon,
  PanelLeft,
  PanelRight,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { DeviceTypes } from '@datacompredia/shared';
import { nanoid } from './id.js';
import { useLabStore } from '../../store/labStore.js';
import { useChartColors } from '../../lib/theme.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Panel.jsx';
import { NetworkScene3D } from './NetworkScene3D.jsx';
import { TopologyListFallback } from './TopologyListFallback.jsx';
import { edgeTypes, nodeTypes, deviceMeta } from './NetworkKit.jsx';
import { DND_MIME, DevicePalette, EventLog, Inspector, TopologyStats } from './NetworkPanels.jsx';

const DEFAULT_LINK = { bandwidthMbps: 100, distanceKm: 1, propagationSpeedMps: 2e8, lossProbability: 0, failed: false };

function topologyToFlow(topology) {
  const nodes = (topology.nodes || []).map((n) => ({
    id: n.id,
    type: 'device',
    position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
    data: {
      label: n.label,
      deviceType: n.type,
      ip: n.ip,
      failed: n.failed,
      queueCapacity: n.queueCapacity,
      raw: n,
    },
  }));
  const edges = (topology.links || []).map((l) => ({
    id: l.id,
    type: 'link',
    source: l.source,
    target: l.target,
    data: { raw: l },
  }));
  return { nodes, edges };
}

function flowToTopology(nodes, edges, version) {
  return {
    version,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.deviceType,
      label: n.data.label,
      ip: n.data.ip,
      failed: Boolean(n.data.failed),
      queueCapacity: n.data.queueCapacity ?? 64,
      position: { x: n.position.x, y: n.position.y, z: 0 },
    })),
    links: edges.map((e) => {
      const raw = e.data?.raw || {};
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        bandwidthMbps: raw.bandwidthMbps ?? 100,
        distanceKm: raw.distanceKm ?? 1,
        propagationSpeedMps: raw.propagationSpeedMps ?? 2e8,
        lossProbability: raw.lossProbability ?? 0,
        failed: Boolean(raw.failed),
      };
    }),
  };
}

/* ─────────────────────────── Empty state (no lab loaded) ─────────────────────────── */

function NoLab() {
  const labs = useLabStore((s) => s.labs);
  const refreshLabs = useLabStore((s) => s.refreshLabs);
  const loadLab = useLabStore((s) => s.loadLab);
  const setNotice = useLabStore((s) => s.setNotice);

  useEffect(() => {
    refreshLabs().catch(() => {});
  }, [refreshLabs]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Network Playground"
        icon={NetworkIcon}
        title="No lab loaded"
        description="Create a starter topology or open a recent lab to edit devices, links and failures in 2D or 3D."
        actions={
          <Link to="/create-lab" className="btn-primary">
            <Plus size={15} /> Create Lab
          </Link>
        }
      />
      {labs.length ? (
        <section className="panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen size={15} className="text-emerald-bright" aria-hidden />
            <h3 className="section-title">Open a recent lab</h3>
          </div>
          <ul className="stagger grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {labs.slice(0, 6).map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-xl border border-line-strong bg-elevated/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald/50 hover:bg-raised/60"
                  onClick={() => loadLab(l.id).catch((e) => setNotice({ type: 'error', message: e.message }))}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
                    <FlaskConical size={17} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[14px] font-semibold text-ink">{l.name}</span>
                    <span className="block truncate font-mono text-[10.5px] text-muted">
                      {l.template} · {l.nodeCount} nodes · {l.linkCount} links
                    </span>
                  </span>
                  <Sparkles size={14} className="text-faint transition group-hover:text-emerald-bright" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────── Page ─────────────────────────────────── */

export function NetworkPlaygroundPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const topology = useLabStore((s) => s.topology);
  const unsaved = useLabStore((s) => s.unsaved);
  const updateLocalTopology = useLabStore((s) => s.updateLocalTopology);
  const saveTopology = useLabStore((s) => s.saveTopology);
  const editorMode = useLabStore((s) => s.editorMode);
  const setEditorMode = useLabStore((s) => s.setEditorMode);
  const connectFromId = useLabStore((s) => s.connectFromId);
  const viewMode = useLabStore((s) => s.viewMode);
  const setViewMode = useLabStore((s) => s.setViewMode);
  const selectNode = useLabStore((s) => s.selectNode);
  const selectLink = useLabStore((s) => s.selectLink);
  const selectedNodeId = useLabStore((s) => s.selectedNodeId);
  const selectedLinkId = useLabStore((s) => s.selectedLinkId);
  const setNodeFailure = useLabStore((s) => s.setNodeFailure);
  const setLinkFailure = useLabStore((s) => s.setLinkFailure);
  const setNotice = useLabStore((s) => s.setNotice);
  const hopAnimation = useLabStore((s) => s.hopAnimation);
  const colors = useChartColors();

  const initial = useMemo(() => topologyToFlow(topology), [topology.version, topology.nodes?.length, topology.links?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [rf, setRf] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  useEffect(() => {
    const flow = topologyToFlow(topology);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [topology, setNodes, setEdges]);

  const commit = useCallback(
    (nextNodes, nextEdges) => {
      updateLocalTopology(flowToTopology(nextNodes, nextEdges, topology.version || 0));
    },
    [topology.version, updateLocalTopology],
  );

  // React Flow reports only the dragged node(s); merge them into the full set before committing.
  const onNodeDragStop = useCallback(
    (_e, _node, dragged) => {
      const byId = new Map((dragged || []).map((d) => [d.id, d]));
      commit(
        nodes.map((n) => byId.get(n.id) || n),
        edges,
      );
    },
    [commit, nodes, edges],
  );

  function addDevice(type, position) {
    const id = `${type}-${nanoid(5)}`;
    const count = nodes.filter((n) => n.data.deviceType === type).length + 1;
    const label = `${type.toUpperCase()} ${count}`;
    const ip =
      type === DeviceTypes.PC || type === DeviceTypes.SERVER || type === DeviceTypes.ROUTER
        ? `192.0.2.${10 + nodes.length}`
        : undefined;
    const node = {
      id,
      type: 'device',
      position: position || { x: 40 + (nodes.length % 5) * 180, y: 40 + Math.floor(nodes.length / 5) * 120 },
      data: { label, deviceType: type, ip, failed: false, queueCapacity: 64 },
    };
    const next = [...nodes, node];
    setNodes(next);
    commit(next, edges);
    selectNode(id);
  }

  function onNodeClick(_e, node) {
    if (editorMode === 'connect') {
      if (!connectFromId) {
        useLabStore.setState({ connectFromId: node.id });
        setNotice({ type: 'success', message: `Connect from ${node.data.label} — select a target.` });
        return;
      }
      if (connectFromId === node.id) {
        useLabStore.setState({ connectFromId: null });
        return;
      }
      const exists = edges.some(
        (e) =>
          (e.source === connectFromId && e.target === node.id) ||
          (e.source === node.id && e.target === connectFromId),
      );
      if (exists) {
        setNotice({ type: 'error', message: 'Link already exists.' });
        useLabStore.setState({ connectFromId: null });
        return;
      }
      const link = {
        id: `l-${nanoid(6)}`,
        type: 'link',
        source: connectFromId,
        target: node.id,
        data: { raw: { ...DEFAULT_LINK } },
      };
      const nextEdges = [...edges, link];
      setEdges(nextEdges);
      commit(nodes, nextEdges);
      useLabStore.setState({ connectFromId: null });
      setNotice({ type: 'success', message: 'Link created.' });
      return;
    }
    selectNode(node.id);
  }

  function onEdgeClick(_e, edge) {
    selectLink(edge.id);
  }

  const deleteSelection = useCallback(() => {
    if (selectedNodeId) {
      const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const nextEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      commit(nextNodes, nextEdges);
      selectNode(null);
    } else if (selectedLinkId) {
      const nextEdges = edges.filter((e) => e.id !== selectedLinkId);
      setEdges(nextEdges);
      commit(nodes, nextEdges);
      selectLink(null);
    }
  }, [selectedNodeId, selectedLinkId, nodes, edges, setNodes, setEdges, commit, selectNode, selectLink]);

  function updateSelectedNode(patch) {
    const nextNodes = nodes.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n));
    setNodes(nextNodes);
    commit(nextNodes, edges);
  }

  function updateSelectedLink(patch) {
    const nextEdges = edges.map((e) => {
      if (e.id !== selectedLinkId) return e;
      return { ...e, data: { raw: { ...(e.data?.raw || {}), ...patch } } };
    });
    setEdges(nextEdges);
    commit(nodes, nextEdges);
  }

  const save = useCallback(
    () => saveTopology().catch((e) => setNotice({ type: 'error', message: e.message })),
    [saveTopology, setNotice],
  );

  // Keyboard: Ctrl/Cmd+S save · Delete/Backspace remove · Esc leaves connect mode.
  useEffect(() => {
    if (!currentLab) return undefined;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && (selectedNodeId || selectedLinkId)) {
        e.preventDefault();
        deleteSelection();
      } else if (e.key === 'Escape' && editorMode === 'connect') {
        setEditorMode('select');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentLab, save, deleteSelection, selectedNodeId, selectedLinkId, editorMode, setEditorMode]);

  const onDrop = (e) => {
    const type = e.dataTransfer.getData(DND_MIME);
    if (!type || !rf) return;
    e.preventDefault();
    const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addDevice(type, { x: Math.round(p.x - 74), y: Math.round(p.y - 36) });
  };

  // Derived render-only state (never written back into the topology).
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: n.id === selectedNodeId,
          connectSource: n.id === connectFromId,
          pulse: Boolean(hopAnimation) && hopAnimation.toNodeId === n.id,
        },
      })),
    [nodes, selectedNodeId, connectFromId, hopAnimation],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const fwd = hopAnimation && e.source === hopAnimation.fromNodeId && e.target === hopAnimation.toNodeId;
        const rev = hopAnimation && e.source === hopAnimation.toNodeId && e.target === hopAnimation.fromNodeId;
        return {
          ...e,
          type: 'link',
          data: {
            ...e.data,
            isSelected: e.id === selectedLinkId,
            active: Boolean(fwd || rev),
            dir: rev ? 'reverse' : 'forward',
            hopKey: hopAnimation ? `${hopAnimation.packetId}-${hopAnimation.hopIndex}` : 'none',
          },
        };
      }),
    [edges, hopAnimation, selectedLinkId],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedLinkId);
  const connectLabel = connectFromId ? nodes.find((n) => n.id === connectFromId)?.data.label : null;

  if (!currentLab) return <NoLab />;

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7rem)] lg:min-h-[560px]">
      {/* ───────── Toolbar ───────── */}
      <div className="panel flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5 pr-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
            <NetworkIcon size={16} aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-[14px] font-semibold text-ink">{currentLab.name}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="capitalize">{currentLab.template}</span>
              <span className="text-faint">·</span>
              <span className={`inline-flex items-center gap-1 ${unsaved ? 'text-warn' : ''}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${unsaved ? 'bg-warn' : 'bg-emerald'}`} />
                {unsaved ? 'Unsaved changes' : 'Saved'}
              </span>
            </div>
          </div>
        </div>

        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />

        <div className="seg" role="group" aria-label="Editor mode">
          <button type="button" aria-pressed={editorMode === 'select'} onClick={() => setEditorMode('select')} className="inline-flex items-center gap-1.5">
            <MousePointer2 size={13} /> Select
          </button>
          <button type="button" aria-pressed={editorMode === 'connect'} onClick={() => setEditorMode('connect')} className="inline-flex items-center gap-1.5">
            <Cable size={13} /> Connect
          </button>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm hover:!border-danger/50 hover:!text-danger"
          onClick={deleteSelection}
          disabled={!selectedNodeId && !selectedLinkId}
          aria-label="Delete selection"
        >
          <Trash2 size={14} /> <span className="hidden sm:inline">Delete</span>
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex gap-1 lg:hidden">
            <button type="button" className={`btn-secondary btn-icon ${showPalette ? '!border-emerald/60 !text-emerald-bright' : ''}`} aria-pressed={showPalette} aria-label="Toggle device palette" onClick={() => setShowPalette((v) => !v)}>
              <PanelLeft size={15} />
            </button>
            <button type="button" className={`btn-secondary btn-icon ${showInspector ? '!border-emerald/60 !text-emerald-bright' : ''}`} aria-pressed={showInspector} aria-label="Toggle inspector" onClick={() => setShowInspector((v) => !v)}>
              <PanelRight size={15} />
            </button>
          </div>

          <div className="seg" role="group" aria-label="View mode">
            <button type="button" aria-pressed={viewMode === '2d'} onClick={() => setViewMode('2d')} className="inline-flex items-center gap-1.5">
              <LayoutGrid size={13} /> 2D
            </button>
            <button type="button" aria-pressed={viewMode === '3d'} onClick={() => setViewMode('3d')} className="inline-flex items-center gap-1.5">
              <Box size={13} /> 3D
            </button>
          </div>

          <Link to="/create-lab" className="btn-secondary btn-sm">
            <Plus size={14} /> <span className="hidden md:inline">Examples / New</span>
          </Link>
          <button type="button" className={`${unsaved ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={save}>
            <Save size={14} /> Save
            {unsaved ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warn ring-2 ring-surface" aria-hidden /> : null}
          </button>
        </div>
      </div>

      {/* ───────── Workbench ───────── */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[232px_minmax(0,1fr)_304px]">
        {/* Left: palette + topology list */}
        <aside className={`panel order-2 min-h-0 flex-col gap-4 overflow-hidden p-3 lg:order-1 lg:flex ${showPalette ? 'flex' : 'hidden'}`} aria-label="Device palette">
          <DevicePalette onAdd={(type) => addDevice(type)} />
          <TopologyStats topology={topology} />
          <TopologyListFallback
            topology={topology}
            onSelectNode={selectNode}
            onSelectLink={selectLink}
            selectedNodeId={selectedNodeId}
            selectedLinkId={selectedLinkId}
          />
        </aside>

        {/* Centre: viewport */}
        <section className="panel bracket order-1 h-[62vh] min-h-[380px] overflow-hidden lg:order-2 lg:h-auto" aria-label="Network viewport">
          {viewMode === '2d' ? (
            <div className="h-full w-full" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }} onDrop={onDrop}>
              <ReactFlow
                nodes={displayNodes}
                edges={displayEdges}
                onInit={setRf}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={() => { if (editorMode === 'select') selectNode(null); }}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.22, maxZoom: 1.5 }}
                minZoom={0.25}
                maxZoom={1.8}
                style={{ background: 'transparent' }}
                className={editorMode === 'connect' ? '[&_.react-flow__node]:!cursor-crosshair' : ''}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} color={colors.grid} gap={22} size={1.6} />
                <Controls showInteractive={false} position="bottom-left" />
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  className="!hidden sm:!block"
                  style={{ width: 132, height: 88 }}
                  nodeColor={(n) => (n.data?.failed ? colors.danger : colors[deviceMeta(n.data?.deviceType).hexKey])}
                  nodeStrokeWidth={0}
                  maskColor={colors.resolved === 'dark' ? 'rgba(5,9,17,0.72)' : 'rgba(241,245,250,0.72)'}
                />
              </ReactFlow>

              {/* contextual hint */}
              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
                {editorMode === 'connect' ? (
                  <span className="status-pill animate-pop !border-accent/50 !bg-surface/90 !text-accent shadow-panel backdrop-blur">
                    <Cable size={12} />
                    {connectLabel ? `Pick a target for ${connectLabel}` : 'Connect mode · pick a source device'}
                    <span className="kbd ml-1">Esc</span>
                  </span>
                ) : (
                  <span className="status-pill !bg-surface/80 backdrop-blur">
                    <MousePointer2 size={12} /> Drag to arrange · click to inspect
                  </span>
                )}
              </div>

              {nodes.length === 0 ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
                  <div className="max-w-xs rounded-2xl border border-dashed border-line-strong bg-surface/80 p-6 text-center backdrop-blur">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-emerald/10 text-emerald-bright ring-1 ring-emerald/25">
                      <Plus size={20} />
                    </span>
                    <p className="mt-3 font-display text-[15px] font-semibold text-ink">Empty canvas</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">Click or drag a device from the palette to start building your network.</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <NetworkScene3D topology={topology} hopAnimation={hopAnimation} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
          )}
        </section>

        {/* Right: inspector + live events */}
        <aside className={`order-3 min-h-0 flex-col gap-3 lg:flex ${showInspector ? 'flex' : 'hidden'}`} aria-label="Inspector and events">
          <section className="panel flex min-h-[260px] flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/80 px-4 py-2.5">
              <h3 className="section-title">Inspector</h3>
              {selectedNode ? <Badge tone="brand">Device</Badge> : selectedEdge ? <Badge tone="info">Link</Badge> : <Badge>Idle</Badge>}
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Inspector
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                nodes={nodes}
                edges={edges}
                onUpdateNode={updateSelectedNode}
                onUpdateLink={updateSelectedLink}
                onToggleNodeFailure={() => {
                  const failed = !selectedNode.data.failed;
                  updateSelectedNode({ failed });
                  setNodeFailure(selectedNode.id, failed);
                }}
                onToggleLinkFailure={() => {
                  const failed = !selectedEdge.data?.raw?.failed;
                  updateSelectedLink({ failed });
                  setLinkFailure(selectedEdge.id, failed);
                }}
                onDelete={deleteSelection}
                onSelectNode={selectNode}
              />
            </div>
          </section>
          <section className="panel h-[200px] shrink-0 overflow-hidden" aria-label="Live events">
            <EventLog topology={topology} />
          </section>
        </aside>
      </div>
    </div>
  );
}

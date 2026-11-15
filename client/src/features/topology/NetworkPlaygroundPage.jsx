import { useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nanoid } from './id.js';
import { useLabStore } from '../../store/labStore.js';
import { DeviceTypes } from '@datacompredia/shared';
import { NetworkScene3D } from './NetworkScene3D.jsx';
import { TopologyListFallback } from './TopologyListFallback.jsx';

const PALETTE = [
  { type: DeviceTypes.PC, label: 'PC' },
  { type: DeviceTypes.ROUTER, label: 'Router' },
  { type: DeviceTypes.SWITCH, label: 'Switch' },
  { type: DeviceTypes.SERVER, label: 'Server' },
  { type: DeviceTypes.HUB, label: 'Hub' },
];

function DeviceNode({ data, selected }) {
  const failed = data.failed;
  return (
    <div
      className={`min-w-[96px] rounded-md border px-3 py-2 text-center text-xs shadow-panel ${
        failed
          ? 'border-danger bg-danger/10 text-danger'
          : selected
            ? 'border-emerald-bright bg-elevated text-emerald-bright'
            : 'border-line bg-surface text-ink'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald" />
      <div className="font-semibold uppercase tracking-wide">{data.deviceType}</div>
      <div className="mt-0.5 font-medium">{data.label}</div>
      {data.ip ? <div className="mt-0.5 font-mono text-[10px] text-muted">{data.ip}</div> : null}
      {failed ? <div className="mt-1 text-[10px]">Failed</div> : null}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald" />
    </div>
  );
}

const nodeTypes = { device: DeviceNode };

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
    source: l.source,
    target: l.target,
    animated: false,
    style: {
      stroke: l.failed ? '#FB7185' : '#34D399',
      strokeWidth: 2,
      opacity: l.failed ? 0.6 : 1,
    },
    label: l.failed ? 'Failed' : `${l.bandwidthMbps} Mbps`,
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

export function NetworkPlaygroundPage() {
  const currentLab = useLabStore((s) => s.currentLab);
  const topology = useLabStore((s) => s.topology);
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

  const initial = useMemo(() => topologyToFlow(topology), [topology.version, topology.nodes?.length, topology.links?.length]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    const flow = topologyToFlow(topology);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [topology, setNodes, setEdges]);

  const commit = useCallback(
    (nextNodes, nextEdges) => {
      const topo = flowToTopology(nextNodes, nextEdges, topology.version || 0);
      updateLocalTopology(topo);
    },
    [topology.version, updateLocalTopology],
  );

  const onNodeDragStop = useCallback(
    (_e, _node, nextNodes) => {
      commit(nextNodes || nodes, edges);
    },
    [commit, nodes, edges],
  );

  function addDevice(type) {
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
      position: { x: 40 + (nodes.length % 5) * 140, y: 40 + Math.floor(nodes.length / 5) * 100 },
      data: { label, deviceType: type, ip, failed: false, queueCapacity: 64 },
    };
    const next = [...nodes, node];
    setNodes(next);
    commit(next, edges);
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
        source: connectFromId,
        target: node.id,
        style: { stroke: '#34D399', strokeWidth: 2 },
        label: '100 Mbps',
        data: {
          raw: {
            bandwidthMbps: 100,
            distanceKm: 1,
            propagationSpeedMps: 2e8,
            lossProbability: 0,
            failed: false,
          },
        },
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

  function deleteSelection() {
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
  }

  function updateSelectedNode(patch) {
    const nextNodes = nodes.map((n) =>
      n.id === selectedNodeId ? { ...n, data: { ...n.data, ...patch } } : n,
    );
    setNodes(nextNodes);
    commit(nextNodes, edges);
  }

  function updateSelectedLink(patch) {
    const nextEdges = edges.map((e) => {
      if (e.id !== selectedLinkId) return e;
      const raw = { ...(e.data?.raw || {}), ...patch };
      return {
        ...e,
        data: { raw },
        label: raw.failed ? 'Failed' : `${raw.bandwidthMbps} Mbps`,
        style: { stroke: raw.failed ? '#FB7185' : '#34D399', strokeWidth: 2 },
      };
    });
    setEdges(nextEdges);
    commit(nodes, nextEdges);
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedLinkId);

  if (!currentLab) {
    return (
      <div className="panel-lg p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-bright">Network Playground</div>
        <h2 className="mt-2 text-xl font-semibold">No lab loaded</h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Create a starter topology or open a recent lab to edit devices, links, and failures in 2D or 3D.
        </p>
        <Link to="/create-lab" className="btn-primary mt-5 inline-flex">
          Create Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col gap-3">
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="status-pill capitalize">Topology: {currentLab.template}</div>
        <button type="button" className="btn-secondary" onClick={() => saveTopology().catch((e) => setNotice({ type: 'error', message: e.message }))}>
          Save
        </button>
        <Link to="/create-lab" className="btn-secondary">
          Examples / New
        </Link>
        <div className="ml-auto flex gap-2">
          <button type="button" className={viewMode === '2d' ? 'btn-primary' : 'btn-secondary'} onClick={() => setViewMode('2d')}>
            2D
          </button>
          <button type="button" className={viewMode === '3d' ? 'btn-primary' : 'btn-secondary'} onClick={() => setViewMode('3d')}>
            3D View
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_260px]">
        <aside className="panel flex flex-col gap-2 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Device palette</div>
          {PALETTE.map((item) => (
            <button key={item.type} type="button" className="btn-secondary w-full justify-start" onClick={() => addDevice(item.type)}>
              {item.label}
            </button>
          ))}
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Tools</div>
          <button type="button" className={editorMode === 'select' ? 'btn-primary' : 'btn-secondary'} onClick={() => setEditorMode('select')}>
            Select
          </button>
          <button type="button" className={editorMode === 'connect' ? 'btn-primary' : 'btn-secondary'} onClick={() => setEditorMode('connect')}>
            Connect
          </button>
          <button type="button" className="btn-danger" onClick={deleteSelection} disabled={!selectedNodeId && !selectedLinkId}>
            Delete
          </button>
        </aside>

        <section className="panel relative min-h-[360px] overflow-hidden">
          {viewMode === '2d' ? (
            <ReactFlow
              nodes={nodes}
              edges={edges.map((e) => ({
                ...e,
                animated: hopAnimation && (e.source === hopAnimation.fromNodeId && e.target === hopAnimation.toNodeId || e.source === hopAnimation.toNodeId && e.target === hopAnimation.fromNodeId),
              }))}
              onNodesChange={(chs) => {
                onNodesChange(chs);
              }}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#285344" gap={18} />
              <Controls />
              <MiniMap nodeColor="#10B981" maskColor="rgba(7,26,22,0.7)" />
            </ReactFlow>
          ) : (
            <NetworkScene3D topology={topology} hopAnimation={hopAnimation} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
          )}
        </section>

        <aside className="panel space-y-3 overflow-auto p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Properties</div>
          {!selectedNode && !selectedEdge ? (
            <p className="text-sm text-muted">Select a device or link.</p>
          ) : null}

          {selectedNode ? (
            <div className="space-y-2">
              <label className="label" htmlFor="node-label">Name</label>
              <input
                id="node-label"
                className="field"
                value={selectedNode.data.label}
                onChange={(e) => updateSelectedNode({ label: e.target.value })}
              />
              <div className="text-xs text-muted">Type: {selectedNode.data.deviceType}</div>
              {selectedNode.data.ip !== undefined ? (
                <>
                  <label className="label" htmlFor="node-ip">IP</label>
                  <input
                    id="node-ip"
                    className="field font-mono"
                    value={selectedNode.data.ip || ''}
                    onChange={(e) => updateSelectedNode({ ip: e.target.value })}
                  />
                </>
              ) : null}
              <label className="label" htmlFor="node-q">Queue capacity</label>
              <input
                id="node-q"
                type="number"
                min={1}
                className="field"
                value={selectedNode.data.queueCapacity ?? 64}
                onChange={(e) => updateSelectedNode({ queueCapacity: Number(e.target.value) || 1 })}
              />
              <button
                type="button"
                className={selectedNode.data.failed ? 'btn-primary w-full' : 'btn-danger w-full'}
                onClick={() => {
                  const failed = !selectedNode.data.failed;
                  updateSelectedNode({ failed });
                  setNodeFailure(selectedNode.id, failed);
                }}
              >
                {selectedNode.data.failed ? 'Recover node' : 'Trigger node failure'}
              </button>
            </div>
          ) : null}

          {selectedEdge ? (
            <div className="space-y-2">
              <div className="text-xs text-muted font-mono">{selectedEdge.source} ↔ {selectedEdge.target}</div>
              {[
                ['bandwidthMbps', 'Bandwidth (Mbps)', 0.1],
                ['distanceKm', 'Distance (km)', 0],
                ['propagationSpeedMps', 'Prop. speed (m/s)', 1],
                ['lossProbability', 'Loss probability (0–1)', 0],
              ].map(([key, label, min]) => (
                <div key={key}>
                  <label className="label" htmlFor={`link-${key}`}>{label}</label>
                  <input
                    id={`link-${key}`}
                    type="number"
                    step="any"
                    min={min}
                    className="field"
                    value={selectedEdge.data?.raw?.[key] ?? ''}
                    onChange={(e) => updateSelectedLink({ [key]: Number(e.target.value) })}
                  />
                </div>
              ))}
              <button
                type="button"
                className={selectedEdge.data?.raw?.failed ? 'btn-primary w-full' : 'btn-danger w-full'}
                onClick={() => {
                  const failed = !selectedEdge.data?.raw?.failed;
                  updateSelectedLink({ failed });
                  setLinkFailure(selectedEdge.id, failed);
                }}
              >
                {selectedEdge.data?.raw?.failed ? 'Recover link' : 'Trigger link failure'}
              </button>
            </div>
          ) : null}

          <TopologyListFallback topology={topology} onSelectNode={selectNode} />
        </aside>
      </div>
    </div>
  );
}

import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket, ClientEvents, ServerEvents } from '../services/socket.js';

export const useLabStore = create((set, get) => ({
  connectionStatus: 'Disconnected',
  labs: [],
  currentLab: null,
  topology: { nodes: [], links: [], version: 0 },
  selectedNodeId: null,
  selectedLinkId: null,
  unsaved: false,
  simulationStatus: 'idle',
  packet: null,
  timeline: [],
  liveEvents: [],
  metrics: null,
  metricsHistory: [],
  hopAnimation: null,
  notice: null,
  editorMode: 'select', // select | connect
  connectFromId: null,
  viewMode: '2d', // 2d | 3d

  setNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
  setEditorMode: (editorMode) => set({ editorMode, connectFromId: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedLinkId: null }),
  selectLink: (selectedLinkId) => set({ selectedLinkId, selectedNodeId: null }),

  initSocket: () => {
    const socket = getSocket();
    socket.on('connect', () => set({ connectionStatus: 'Connected' }));
    socket.on('disconnect', () => set({ connectionStatus: 'Disconnected' }));
    socket.on('connection:status', (p) => set({ connectionStatus: p.status || 'Connected' }));

    socket.on(ServerEvents.TOPOLOGY_UPDATED, ({ topology }) => {
      set({ topology, unsaved: false, currentLab: get().currentLab ? { ...get().currentLab, topology } : null });
    });

    socket.on(ServerEvents.PACKET_CREATED, ({ packet }) => {
      set({ packet, timeline: [], hopAnimation: null, simulationStatus: 'running' });
    });

    socket.on(ServerEvents.PACKET_ROUTE, ({ route }) => {
      const packet = get().packet ? { ...get().packet, route } : null;
      set({ packet });
    });

    socket.on(ServerEvents.PACKET_HOP, (payload) => {
      set({
        hopAnimation: payload,
        liveEvents: [...get().liveEvents.slice(-49), { ...payload, type: 'packet.hop', at: Date.now() }],
      });
    });

    socket.on(ServerEvents.PACKET_QUEUED, (payload) => {
      set({
        liveEvents: [...get().liveEvents.slice(-49), { ...payload, type: 'packet.queued', at: Date.now() }],
      });
    });

    socket.on(ServerEvents.PACKET_DROPPED, (payload) => {
      set({
        liveEvents: [...get().liveEvents.slice(-49), { ...payload, type: 'packet.dropped', at: Date.now() }],
        simulationStatus: 'failed',
      });
    });

    socket.on(ServerEvents.PACKET_RETRANSMIT, (payload) => {
      set({
        liveEvents: [...get().liveEvents.slice(-49), { ...payload, type: 'packet.retransmit', at: Date.now() }],
      });
    });

    socket.on(ServerEvents.PACKET_DELIVERED, (payload) => {
      set({
        liveEvents: [...get().liveEvents.slice(-49), { ...payload, type: 'packet.delivered', at: Date.now() }],
        simulationStatus: 'completed',
      });
    });

    socket.on(ServerEvents.METRICS_UPDATE, ({ metrics }) => {
      set({
        metrics,
        metricsHistory: [...get().metricsHistory, metrics].slice(-100),
      });
    });

    socket.on(ServerEvents.SIMULATION_STATE, (payload) => {
      const patch = { simulationStatus: payload.status };
      if (payload.packet) patch.packet = payload.packet;
      if (payload.events) patch.timeline = payload.events;
      set(patch);
    });

    socket.on(ServerEvents.SIMULATION_ERROR, (err) => {
      set({ notice: { type: 'error', message: err.message || 'Simulation error' }, simulationStatus: 'failed' });
    });

    socket.on('packet:timeline', ({ event }) => {
      set({ timeline: [...get().timeline, event] });
    });
  },

  refreshLabs: async () => {
    const { labs } = await api.listLabs();
    set({ labs });
    return labs;
  },

  loadLab: async (labId) => {
    const { lab, live } = await api.getLab(labId);
    const socket = getSocket();
    socket.emit(ClientEvents.LAB_JOIN, { labId });
    set({
      currentLab: lab,
      topology: lab.topology,
      unsaved: false,
      metrics: live?.metrics || null,
      packet: live?.lastPacket || null,
      simulationStatus: live?.simulationStatus || 'idle',
      selectedNodeId: null,
      selectedLinkId: null,
    });
    return lab;
  },

  createLab: async ({ name, template }) => {
    const { lab } = await api.createLab({ name, template });
    await get().refreshLabs();
    await get().loadLab(lab.id);
    return lab;
  },

  updateLocalTopology: (topology) => set({ topology, unsaved: true }),

  saveTopology: async () => {
    const { currentLab, topology } = get();
    if (!currentLab) throw new Error('No lab loaded.');
    const { lab } = await api.saveTopology(currentLab.id, topology);
    set({ currentLab: lab, topology: lab.topology, unsaved: false, notice: { type: 'success', message: 'Topology saved.' } });
    return lab;
  },

  transmit: ({ sourceNodeId, destinationNodeId, payload, protocol }) => {
    const { currentLab } = get();
    if (!currentLab) throw new Error('No lab loaded.');
    set({ timeline: [], liveEvents: [], hopAnimation: null, simulationStatus: 'validating' });
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      socket.emit(
        ClientEvents.PACKET_TRANSMIT,
        {
          labId: currentLab.id,
          sourceNodeId,
          destinationNodeId,
          payload,
          protocol,
        },
        (ack) => {
          if (!ack?.ok) {
            set({ notice: { type: 'error', message: ack?.message || 'Transmit failed' }, simulationStatus: 'failed' });
            reject(ack);
          } else {
            set({ simulationStatus: 'running' });
            resolve(ack);
          }
        },
      );
    });
  },

  setNodeFailure: (nodeId, failed) => {
    const { currentLab } = get();
    getSocket().emit(ClientEvents.NODE_FAILURE_SET, { labId: currentLab.id, nodeId, failed });
  },

  setLinkFailure: (linkId, failed) => {
    const { currentLab } = get();
    getSocket().emit(ClientEvents.LINK_FAILURE_SET, { labId: currentLab.id, linkId, failed });
  },

  pauseSimulation: () => {
    const { currentLab } = get();
    getSocket().emit(ClientEvents.SIMULATION_PAUSE, { labId: currentLab.id });
  },

  resumeSimulation: () => {
    const { currentLab } = get();
    getSocket().emit(ClientEvents.SIMULATION_RESUME, { labId: currentLab.id });
  },

  resetSimulation: () => {
    const { currentLab } = get();
    getSocket().emit(ClientEvents.SIMULATION_RESET, { labId: currentLab.id });
    set({ packet: null, timeline: [], hopAnimation: null, liveEvents: [] });
  },
}));

import {
  ClientEvents,
  ServerEvents,
  SimulationStatuses,
  transmitSchema,
  topologySchema,
} from '@datacompredia/shared';
import { labStore } from '../db/store.js';
import { simulateTransmission } from '../modules/packet-simulation/engine.js';

function roomName(labId) {
  return `lab:${labId}`;
}

/**
 * Map engine timeline events to Socket.IO broadcast events with wall-clock pacing.
 */
async function emitSimulation(io, labId, result, speed = 1) {
  const live = labStore.getLive(labId);
  live.lastPacket = result.packet;
  live.lastEvents = result.events;
  live.simulationStatus = SimulationStatuses.RUNNING;

  io.to(roomName(labId)).emit(ServerEvents.SIMULATION_STATE, {
    labId,
    status: SimulationStatuses.RUNNING,
  });

  io.to(roomName(labId)).emit(ServerEvents.PACKET_CREATED, { packet: result.packet });

  const maxSim = result.events.reduce((m, e) => Math.max(m, e.simTimeMs || 0), 0);
  // Cap animation duration for UX
  const wallBudgetMs = Math.min(8000, Math.max(1200, maxSim * 20));
  const scale = maxSim > 0 ? wallBudgetMs / maxSim : 1;

  for (const event of result.events) {
    while (live.paused) {
      await sleep(50);
    }
    const wait = ((event.simTimeMs || 0) * scale) / Math.max(0.1, speed);
    // schedule relative to first event by sleeping deltas would need prev — sleep absolute from start via cumulative
    // simpler: small fixed pacing between events weighted by sim delta
  }

  // Emit with relative delays between consecutive events
  let prevT = 0;
  for (const event of result.events) {
    while (live.paused) await sleep(50);
    const delta = Math.max(0, (event.simTimeMs || 0) - prevT);
    prevT = event.simTimeMs || 0;
    const wait = Math.min(800, (delta * scale) / Math.max(0.1, speed));
    if (wait > 0) await sleep(wait);

    switch (event.type) {
      case 'route.computed':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_ROUTE, {
          packetId: event.packetId,
          route: event.route,
        });
        break;
      case 'packet.queued':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_QUEUED, {
          packetId: event.packetId,
          nodeId: event.nodeId,
          queueLength: event.queueLength,
        });
        break;
      case 'packet.forwarded':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_HOP, {
          packetId: event.packetId,
          fromNodeId: event.fromNodeId,
          toNodeId: event.toNodeId,
          hopIndex: event.hopIndex,
          timing: event.timing,
        });
        break;
      case 'packet.dropped':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_DROPPED, {
          packetId: event.packetId,
          reason: event.reason,
          nodeId: event.nodeId,
        });
        break;
      case 'packet.retransmit':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_RETRANSMIT, {
          packetId: event.packetId,
          attempt: event.attempt,
          reason: event.reason,
        });
        break;
      case 'packet.acknowledged':
      case 'tcp.ack':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_ACK, {
          packetId: event.packetId,
          sequenceNumber: event.sequenceNumber ?? 1,
        });
        break;
      case 'packet.delivered':
        io.to(roomName(labId)).emit(ServerEvents.PACKET_DELIVERED, {
          packetId: event.packetId,
          totalDelayMs: event.totalDelayMs,
          hops: event.hops,
        });
        break;
      default:
        // still forward timeline event for inspector
        io.to(roomName(labId)).emit('packet:timeline', { event });
        break;
    }
  }

  const metrics = live.metrics.applyDelta(result.metricsDelta);
  io.to(roomName(labId)).emit(ServerEvents.METRICS_UPDATE, {
    timestamp: metrics.timestamp,
    metrics,
  });

  live.simulationStatus =
    result.packet.status === 'delivered'
      ? SimulationStatuses.COMPLETED
      : SimulationStatuses.FAILED;

  io.to(roomName(labId)).emit(ServerEvents.SIMULATION_STATE, {
    labId,
    status: live.simulationStatus,
    packet: result.packet,
    events: result.events,
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function registerLabSockets(io) {
  io.on('connection', (socket) => {
    socket.emit('connection:status', { status: 'Connected' });

    socket.on(ClientEvents.LAB_JOIN, async (payload, ack) => {
      try {
        const labId = payload?.labId;
        const lab = await labStore.getLab(labId);
        if (!lab) {
          const err = { code: 'NOT_FOUND', message: 'Lab not found.' };
          if (typeof ack === 'function') ack(err);
          socket.emit(ServerEvents.SIMULATION_ERROR, err);
          return;
        }
        socket.join(roomName(labId));
        const live = labStore.getLive(labId);
        const state = {
          lab,
          metrics: live.metrics.getSnapshot(),
          lastPacket: live.lastPacket,
          lastEvents: live.lastEvents,
          simulationStatus: live.simulationStatus,
        };
        socket.emit(ServerEvents.LAB_JOINED, { labId, state });
        if (typeof ack === 'function') ack({ ok: true, labId });
      } catch (err) {
        const error = { code: 'JOIN_FAILED', message: err.message };
        socket.emit(ServerEvents.SIMULATION_ERROR, error);
        if (typeof ack === 'function') ack(error);
      }
    });

    socket.on(ClientEvents.LAB_LEAVE, (payload) => {
      if (payload?.labId) socket.leave(roomName(payload.labId));
    });

    socket.on(ClientEvents.TOPOLOGY_UPDATE, async (payload, ack) => {
      try {
        const parsed = topologySchema.safeParse(payload?.topology);
        if (!parsed.success) {
          const error = {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join('; '),
          };
          if (typeof ack === 'function') ack(error);
          return;
        }
        const result = await labStore.saveTopology(payload.labId, parsed.data);
        if (!result.ok) {
          const error = { code: 'SAVE_FAILED', message: result.message };
          if (typeof ack === 'function') ack(error);
          return;
        }
        io.to(roomName(payload.labId)).emit(ServerEvents.TOPOLOGY_UPDATED, {
          topology: result.lab.topology,
          version: result.lab.topology.version,
        });
        if (typeof ack === 'function') ack({ ok: true, version: result.lab.topology.version });
      } catch (err) {
        const error = { code: 'SAVE_FAILED', message: err.message };
        if (typeof ack === 'function') ack(error);
      }
    });

    socket.on(ClientEvents.NODE_FAILURE_SET, async (payload, ack) => {
      try {
        const lab = await labStore.getLab(payload?.labId);
        if (!lab) throw new Error('Lab not found.');
        const topology = structuredClone(lab.topology);
        const node = topology.nodes.find((n) => n.id === payload.nodeId);
        if (!node) throw new Error('Node not found.');
        node.failed = Boolean(payload.failed);
        const result = await labStore.saveTopology(lab.id, topology);
        if (!result.ok) throw new Error(result.message);
        io.to(roomName(lab.id)).emit(ServerEvents.TOPOLOGY_UPDATED, {
          topology: result.lab.topology,
          version: result.lab.topology.version,
        });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        const error = { code: 'FAILURE_SET_FAILED', message: err.message };
        socket.emit(ServerEvents.SIMULATION_ERROR, error);
        if (typeof ack === 'function') ack(error);
      }
    });

    socket.on(ClientEvents.LINK_FAILURE_SET, async (payload, ack) => {
      try {
        const lab = await labStore.getLab(payload?.labId);
        if (!lab) throw new Error('Lab not found.');
        const topology = structuredClone(lab.topology);
        const link = topology.links.find((l) => l.id === payload.linkId);
        if (!link) throw new Error('Link not found.');
        link.failed = Boolean(payload.failed);
        const result = await labStore.saveTopology(lab.id, topology);
        if (!result.ok) throw new Error(result.message);
        io.to(roomName(lab.id)).emit(ServerEvents.TOPOLOGY_UPDATED, {
          topology: result.lab.topology,
          version: result.lab.topology.version,
        });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        const error = { code: 'FAILURE_SET_FAILED', message: err.message };
        socket.emit(ServerEvents.SIMULATION_ERROR, error);
        if (typeof ack === 'function') ack(error);
      }
    });

    socket.on(ClientEvents.PACKET_TRANSMIT, async (payload, ack) => {
      try {
        const parsed = transmitSchema.safeParse(payload);
        if (!parsed.success) {
          const error = {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join('; '),
          };
          if (typeof ack === 'function') ack(error);
          socket.emit(ServerEvents.SIMULATION_ERROR, error);
          return;
        }
        if (parsed.data.sourceNodeId === parsed.data.destinationNodeId) {
          const error = { code: 'VALIDATION_ERROR', message: 'Source and destination must differ.' };
          if (typeof ack === 'function') ack(error);
          return;
        }

        const lab = await labStore.getLab(parsed.data.labId);
        if (!lab) {
          const error = { code: 'NOT_FOUND', message: 'Lab not found.' };
          if (typeof ack === 'function') ack(error);
          return;
        }

        const live = labStore.getLive(lab.id);
        if (live.simulationStatus === SimulationStatuses.RUNNING && !live.paused) {
          const error = { code: 'BUSY', message: 'A simulation is already running for this lab.' };
          if (typeof ack === 'function') ack(error);
          return;
        }

        const result = simulateTransmission({
          topology: lab.topology,
          ...parsed.data,
        });

        if (typeof ack === 'function') {
          ack({ ok: true, packetId: result.packet.packetId, status: result.packet.status });
        }

        // fire-and-forget paced emission
        emitSimulation(io, lab.id, result).catch((err) => {
          socket.emit(ServerEvents.SIMULATION_ERROR, {
            code: 'EMIT_FAILED',
            message: err.message,
          });
        });
      } catch (err) {
        const error = { code: 'TRANSMIT_FAILED', message: err.message };
        socket.emit(ServerEvents.SIMULATION_ERROR, error);
        if (typeof ack === 'function') ack(error);
      }
    });

    socket.on(ClientEvents.SIMULATION_PAUSE, (payload) => {
      const live = labStore.getLive(payload?.labId);
      live.paused = true;
      io.to(roomName(payload.labId)).emit(ServerEvents.SIMULATION_STATE, {
        labId: payload.labId,
        status: SimulationStatuses.PAUSED,
      });
    });

    socket.on(ClientEvents.SIMULATION_RESUME, (payload) => {
      const live = labStore.getLive(payload?.labId);
      live.paused = false;
      io.to(roomName(payload.labId)).emit(ServerEvents.SIMULATION_STATE, {
        labId: payload.labId,
        status: SimulationStatuses.RUNNING,
      });
    });

    socket.on(ClientEvents.SIMULATION_RESET, (payload) => {
      const state = labStore.resetLive(payload?.labId);
      io.to(roomName(payload.labId)).emit(ServerEvents.SIMULATION_STATE, {
        labId: payload.labId,
        status: state.simulationStatus,
      });
      io.to(roomName(payload.labId)).emit(ServerEvents.METRICS_UPDATE, {
        timestamp: Date.now(),
        metrics: state.metrics.getSnapshot(),
      });
    });

    socket.on('disconnect', () => {
      // rooms cleaned automatically
    });
  });
}

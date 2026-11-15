import { nanoid } from 'nanoid';
import {
  PacketEventTypes,
  PacketStatuses,
  Protocols,
  TCP_MAX_RETRIES,
  TCP_RTO_FLOOR_MS,
  DEFAULT_PROCESSING_DELAY_MS,
} from '@datacompredia/shared';
import {
  findRouteBfs,
  transmissionDelayMs,
  propagationDelayMs,
  getNodeProcessingDelayMs,
} from '../routing/routing.js';

/**
 * Deterministic PRNG (mulberry32) for reproducible packet-loss in tests.
 */
export function createRng(seed = 1) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pushEvent(events, simTimeMs, type, data = {}) {
  events.push({ simTimeMs, type, ...data });
}

function linksById(topology) {
  return new Map(topology.links.map((l) => [l.id, l]));
}

function nodesById(topology) {
  return new Map(topology.nodes.map((n) => [n.id, n]));
}

/**
 * Simulate forwarding of one datagram along a route.
 * Returns hop events and final status without TCP handshake.
 */
function simulateDatagram({
  topology,
  route,
  payloadBytes,
  startTime,
  events,
  packetId,
  sequenceNumber,
  rng,
  queues,
}) {
  const linkMap = linksById(topology);
  const nodeMap = nodesById(topology);
  let t = startTime;
  let totalTx = 0;
  let totalProp = 0;
  let totalQueue = 0;
  let totalProc = 0;

  for (let hop = 0; hop < route.linkIds.length; hop += 1) {
    const fromNodeId = route.nodeIds[hop];
    const toNodeId = route.nodeIds[hop + 1];
    const link = linkMap.get(route.linkIds[hop]);
    const fromNode = nodeMap.get(fromNodeId);

    if (!link || link.failed || fromNode?.failed || nodeMap.get(toNodeId)?.failed) {
      pushEvent(events, t, PacketEventTypes.DROPPED, {
        packetId,
        reason: 'path_failed',
        nodeId: fromNodeId,
      });
      return {
        status: PacketStatuses.DROPPED,
        reason: 'path_failed',
        endTime: t,
        delays: { transmission: totalTx, propagation: totalProp, queueing: totalQueue, processing: totalProc },
        currentHop: hop,
      };
    }

    // Queueing at from-node
    const q = queues.get(fromNodeId) || { length: 0 };
    const capacity = fromNode.queueCapacity ?? 64;
    if (q.length >= capacity) {
      pushEvent(events, t, PacketEventTypes.DROPPED, {
        packetId,
        reason: 'queue_overflow',
        nodeId: fromNodeId,
      });
      return {
        status: PacketStatuses.DROPPED,
        reason: 'queue_overflow',
        endTime: t,
        delays: { transmission: totalTx, propagation: totalProp, queueing: totalQueue, processing: totalProc },
        currentHop: hop,
      };
    }

    const queueDelay = q.length * 0.05; // simplistic service delay contribution
    q.length += 1;
    queues.set(fromNodeId, q);
    totalQueue += queueDelay;
    t += queueDelay;
    pushEvent(events, t, PacketEventTypes.QUEUED, {
      packetId,
      nodeId: fromNodeId,
      queueLength: q.length,
    });

    const proc = getNodeProcessingDelayMs(fromNode) ?? DEFAULT_PROCESSING_DELAY_MS;
    totalProc += proc;
    t += proc;

    const tx = transmissionDelayMs(payloadBytes, link.bandwidthMbps);
    const prop = propagationDelayMs(link.distanceKm, link.propagationSpeedMps);
    totalTx += tx;
    totalProp += prop;
    t += tx + prop;

    // depart queue
    q.length = Math.max(0, q.length - 1);
    queues.set(fromNodeId, q);

    if (rng() < (link.lossProbability || 0)) {
      pushEvent(events, t, PacketEventTypes.DROPPED, {
        packetId,
        reason: 'link_loss',
        nodeId: toNodeId,
        fromNodeId,
        toNodeId,
        hopIndex: hop,
      });
      return {
        status: PacketStatuses.DROPPED,
        reason: 'link_loss',
        endTime: t,
        delays: { transmission: totalTx, propagation: totalProp, queueing: totalQueue, processing: totalProc },
        currentHop: hop,
      };
    }

    pushEvent(events, t, PacketEventTypes.FORWARDED, {
      packetId,
      fromNodeId,
      toNodeId,
      hopIndex: hop,
      timing: { transmissionMs: tx, propagationMs: prop, queueingMs: queueDelay, processingMs: proc },
      sequenceNumber,
    });
  }

  return {
    status: PacketStatuses.DELIVERED,
    endTime: t,
    delays: { transmission: totalTx, propagation: totalProp, queueing: totalQueue, processing: totalProc },
    currentHop: route.linkIds.length,
  };
}

/**
 * Pure simulation: given topology + transmit request, return packet + events.
 * No Socket.IO / Express dependencies.
 */
export function simulateTransmission({
  topology,
  labId,
  sourceNodeId,
  destinationNodeId,
  payload,
  protocol,
  seed = Date.now() % 1e9,
}) {
  const events = [];
  const rng = createRng(seed);
  const queues = new Map();
  const packetId = `P-${nanoid(8)}`;
  const payloadSizeBytes = Buffer.byteLength(payload, 'utf8');
  const nodeMap = nodesById(topology);

  const packet = {
    packetId,
    labId,
    sourceNodeId,
    destinationNodeId,
    sourceIp: nodeMap.get(sourceNodeId)?.ip || null,
    destinationIp: nodeMap.get(destinationNodeId)?.ip || null,
    protocol,
    sequenceNumber: 1,
    payload,
    payloadSizeBytes,
    createdAt: new Date().toISOString(),
    route: null,
    currentHop: 0,
    status: PacketStatuses.CREATED,
    delays: null,
    dropReason: null,
    attempts: 0,
    handshake: [],
  };

  pushEvent(events, 0, PacketEventTypes.CREATED, { packetId, protocol });

  const route = findRouteBfs(topology, sourceNodeId, destinationNodeId);
  if (!route) {
    packet.status = PacketStatuses.DROPPED;
    packet.dropReason = 'no_route';
    pushEvent(events, 0, PacketEventTypes.DROPPED, {
      packetId,
      reason: 'no_route',
      nodeId: sourceNodeId,
    });
    return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
  }

  packet.route = route;
  pushEvent(events, 0, PacketEventTypes.ROUTE_COMPUTED, {
    packetId,
    route,
  });

  let t = 0;

  if (protocol === Protocols.TCP_SIM) {
    // Handshake
    pushEvent(events, t, PacketEventTypes.SYN, { packetId, sequenceNumber: 0 });
    packet.handshake.push('SYN');
    const syn = simulateDatagram({
      topology,
      route,
      payloadBytes: 40,
      startTime: t,
      events,
      packetId,
      sequenceNumber: 0,
      rng,
      queues,
    });
    t = syn.endTime;
    if (syn.status === PacketStatuses.DROPPED) {
      // retry handshake limited
      let attempt = 0;
      let ok = false;
      while (attempt < TCP_MAX_RETRIES && !ok) {
        attempt += 1;
        const rto = Math.max(TCP_RTO_FLOOR_MS, (syn.endTime || 1) * 2);
        t += rto;
        pushEvent(events, t, PacketEventTypes.RETRANSMIT, {
          packetId,
          attempt,
          reason: 'syn_timeout',
        });
        const retry = simulateDatagram({
          topology,
          route,
          payloadBytes: 40,
          startTime: t,
          events,
          packetId,
          sequenceNumber: 0,
          rng,
          queues,
        });
        t = retry.endTime;
        if (retry.status === PacketStatuses.DELIVERED) ok = true;
        else if (attempt >= TCP_MAX_RETRIES) {
          packet.status = PacketStatuses.TIMED_OUT;
          packet.dropReason = 'syn_timeout';
          packet.attempts = attempt;
          packet.delays = retry.delays;
          return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
        }
      }
    }

    // Reverse path for SYN-ACK
    const reverse = { nodeIds: [...route.nodeIds].reverse(), linkIds: [...route.linkIds].reverse() };
    pushEvent(events, t, PacketEventTypes.SYN_ACK, { packetId, sequenceNumber: 0 });
    packet.handshake.push('SYN-ACK');
    const synAck = simulateDatagram({
      topology,
      route: reverse,
      payloadBytes: 40,
      startTime: t,
      events,
      packetId,
      sequenceNumber: 0,
      rng,
      queues,
    });
    t = synAck.endTime;
    if (synAck.status === PacketStatuses.DROPPED) {
      packet.status = PacketStatuses.DROPPED;
      packet.dropReason = synAck.reason;
      packet.delays = synAck.delays;
      return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
    }

    pushEvent(events, t, PacketEventTypes.ACK, { packetId, sequenceNumber: 0 });
    packet.handshake.push('ACK');
    const ackHs = simulateDatagram({
      topology,
      route,
      payloadBytes: 40,
      startTime: t,
      events,
      packetId,
      sequenceNumber: 0,
      rng,
      queues,
    });
    t = ackHs.endTime;
    if (ackHs.status === PacketStatuses.DROPPED) {
      packet.status = PacketStatuses.DROPPED;
      packet.dropReason = ackHs.reason;
      packet.delays = ackHs.delays;
      return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
    }
  }

  // Data
  let attempt = 0;
  let dataResult = simulateDatagram({
    topology,
    route,
    payloadBytes: payloadSizeBytes,
    startTime: t,
    events,
    packetId,
    sequenceNumber: 1,
    rng,
    queues,
  });
  t = dataResult.endTime;
  packet.attempts = 1;

  if (protocol === Protocols.TCP_SIM) {
    while (dataResult.status === PacketStatuses.DROPPED && attempt < TCP_MAX_RETRIES) {
      attempt += 1;
      packet.attempts = attempt + 1;
      const rto = Math.max(TCP_RTO_FLOOR_MS, 2 * Math.max(1, dataResult.endTime - (t - (dataResult.endTime || 0))));
      // simpler RTO
      const wait = Math.max(TCP_RTO_FLOOR_MS, 100);
      t += wait;
      pushEvent(events, t, PacketEventTypes.RETRANSMIT, {
        packetId,
        attempt,
        reason: dataResult.reason || 'loss',
      });
      packet.status = PacketStatuses.RETRANSMITTING;
      dataResult = simulateDatagram({
        topology,
        route,
        payloadBytes: payloadSizeBytes,
        startTime: t,
        events,
        packetId,
        sequenceNumber: 1,
        rng,
        queues,
      });
      t = dataResult.endTime;
    }

    if (dataResult.status === PacketStatuses.DELIVERED) {
      // ACK back
      const reverse = { nodeIds: [...route.nodeIds].reverse(), linkIds: [...route.linkIds].reverse() };
      const ack = simulateDatagram({
        topology,
        route: reverse,
        payloadBytes: 40,
        startTime: t,
        events,
        packetId,
        sequenceNumber: 1,
        rng,
        queues,
      });
      t = ack.endTime;
      pushEvent(events, t, PacketEventTypes.ACKNOWLEDGED, {
        packetId,
        sequenceNumber: 1,
      });
      if (ack.status === PacketStatuses.DROPPED) {
        // data delivered but ack lost — still count as delivered for teaching simplicity, note in events
        pushEvent(events, t, PacketEventTypes.DROPPED, {
          packetId,
          reason: 'ack_loss',
          nodeId: sourceNodeId,
        });
      }
    } else {
      packet.status = PacketStatuses.TIMED_OUT;
      packet.dropReason = dataResult.reason;
      packet.delays = dataResult.delays;
      packet.currentHop = dataResult.currentHop;
      return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
    }
  } else if (dataResult.status === PacketStatuses.DROPPED) {
    packet.status = PacketStatuses.DROPPED;
    packet.dropReason = dataResult.reason;
    packet.delays = dataResult.delays;
    packet.currentHop = dataResult.currentHop;
    return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
  }

  packet.status = PacketStatuses.DELIVERED;
  packet.delays = dataResult.delays;
  packet.currentHop = dataResult.currentHop;
  packet.totalDelayMs = t;
  pushEvent(events, t, PacketEventTypes.DELIVERED, {
    packetId,
    totalDelayMs: t,
    hops: route.linkIds.length,
  });

  return { packet, events, metricsDelta: buildMetricsDelta(packet, events, payloadSizeBytes) };
}

function buildMetricsDelta(packet, events, payloadSizeBytes) {
  const retransmits = events.filter((e) => e.type === PacketEventTypes.RETRANSMIT).length;
  const delivered = packet.status === PacketStatuses.DELIVERED ? 1 : 0;
  const dropped = packet.status === PacketStatuses.DROPPED || packet.status === PacketStatuses.TIMED_OUT ? 1 : 0;
  return {
    sent: 1,
    delivered,
    dropped,
    retransmits,
    payloadBitsDelivered: delivered ? payloadSizeBytes * 8 : 0,
    latencyMs: delivered ? packet.totalDelayMs || 0 : null,
    delays: packet.delays,
  };
}

import {
  DEFAULT_PROCESSING_DELAY_MS,
  REFERENCE_FRAME_BYTES,
} from '@datacompredia/shared';

function buildAdjacency(topology) {
  const nodesById = new Map(topology.nodes.map((n) => [n.id, n]));
  const adj = new Map(topology.nodes.map((n) => [n.id, []]));

  for (const link of topology.links) {
    if (link.failed) continue;
    const a = nodesById.get(link.source);
    const b = nodesById.get(link.target);
    if (!a || !b || a.failed || b.failed) continue;
    adj.get(link.source).push({ nodeId: link.target, link });
    adj.get(link.target).push({ nodeId: link.source, link });
  }

  return { nodesById, adj };
}

/**
 * Hop-count shortest path (BFS).
 * @returns {{ nodeIds: string[], linkIds: string[] } | null}
 */
export function findRouteBfs(topology, sourceId, destinationId) {
  if (sourceId === destinationId) return null;
  const { nodesById, adj } = buildAdjacency(topology);
  if (!nodesById.has(sourceId) || !nodesById.has(destinationId)) return null;
  if (nodesById.get(sourceId).failed || nodesById.get(destinationId).failed) return null;

  const queue = [sourceId];
  const prev = new Map([[sourceId, null]]);
  const prevLink = new Map();

  while (queue.length) {
    const current = queue.shift();
    if (current === destinationId) break;
    for (const edge of adj.get(current) || []) {
      if (prev.has(edge.nodeId)) continue;
      prev.set(edge.nodeId, current);
      prevLink.set(edge.nodeId, edge.link.id);
      queue.push(edge.nodeId);
    }
  }

  if (!prev.has(destinationId)) return null;

  const nodeIds = [];
  const linkIds = [];
  let cursor = destinationId;
  while (cursor) {
    nodeIds.unshift(cursor);
    const parent = prev.get(cursor);
    if (parent) linkIds.unshift(prevLink.get(cursor));
    cursor = parent;
  }

  return { nodeIds, linkIds, algorithm: 'bfs' };
}

export function linkCostMs(link, payloadBytes = REFERENCE_FRAME_BYTES) {
  const txMs = transmissionDelayMs(payloadBytes, link.bandwidthMbps);
  const propMs = propagationDelayMs(link.distanceKm, link.propagationSpeedMps);
  return txMs + propMs;
}

export function transmissionDelayMs(payloadBytes, bandwidthMbps) {
  const bits = payloadBytes * 8;
  const bps = bandwidthMbps * 1e6;
  return (bits / bps) * 1000;
}

export function propagationDelayMs(distanceKm, speedMps) {
  const meters = distanceKm * 1000;
  return (meters / speedMps) * 1000;
}

/**
 * Dijkstra using transmission+propagation delay as cost.
 */
export function findRouteDijkstra(topology, sourceId, destinationId, payloadBytes = REFERENCE_FRAME_BYTES) {
  if (sourceId === destinationId) return null;
  const { nodesById, adj } = buildAdjacency(topology);
  if (!nodesById.has(sourceId) || !nodesById.has(destinationId)) return null;
  if (nodesById.get(sourceId).failed || nodesById.get(destinationId).failed) return null;

  const dist = new Map([[sourceId, 0]]);
  const prev = new Map();
  const prevLink = new Map();
  const open = new Set([sourceId]);

  while (open.size) {
    let current = null;
    let best = Infinity;
    for (const id of open) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        current = id;
      }
    }
    open.delete(current);
    if (current === destinationId) break;

    for (const edge of adj.get(current) || []) {
      const cost = best + linkCostMs(edge.link, payloadBytes);
      if (cost < (dist.get(edge.nodeId) ?? Infinity)) {
        dist.set(edge.nodeId, cost);
        prev.set(edge.nodeId, current);
        prevLink.set(edge.nodeId, edge.link.id);
        open.add(edge.nodeId);
      }
    }
  }

  if (!prev.has(destinationId) && sourceId !== destinationId) {
    if (!dist.has(destinationId)) return null;
  }
  if (!dist.has(destinationId)) return null;

  const nodeIds = [];
  const linkIds = [];
  let cursor = destinationId;
  while (cursor !== undefined) {
    nodeIds.unshift(cursor);
    const parent = prev.get(cursor);
    if (parent !== undefined) linkIds.unshift(prevLink.get(cursor));
    cursor = parent;
    if (cursor === undefined && nodeIds[0] !== sourceId) break;
  }

  if (nodeIds[0] !== sourceId) return null;
  return { nodeIds, linkIds, algorithm: 'dijkstra', totalCostMs: dist.get(destinationId) };
}

export function getNodeProcessingDelayMs(node) {
  return node?.processingDelayMs ?? DEFAULT_PROCESSING_DELAY_MS;
}

import { topologySchema } from '@datacompredia/shared';
import { validateLinkEndpoints } from './compatibility.js';

export function validateTopology(raw) {
  const parsed = topologySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join('; '),
      issues: parsed.error.issues,
    };
  }

  const topology = parsed.data;
  const nodesById = new Map(topology.nodes.map((n) => [n.id, n]));
  if (nodesById.size !== topology.nodes.length) {
    return { ok: false, message: 'Duplicate node IDs are not allowed.' };
  }

  const linkIds = new Set();
  const undirectedPairs = new Set();

  for (const link of topology.links) {
    if (linkIds.has(link.id)) {
      return { ok: false, message: `Duplicate link ID: ${link.id}` };
    }
    linkIds.add(link.id);

    const endpoints = validateLinkEndpoints(nodesById, link.source, link.target);
    if (!endpoints.ok) return endpoints;

    const pairKey = [link.source, link.target].sort().join('::');
    if (undirectedPairs.has(pairKey)) {
      return { ok: false, message: `Duplicate undirected link between ${link.source} and ${link.target}.` };
    }
    undirectedPairs.add(pairKey);
  }

  return { ok: true, topology };
}

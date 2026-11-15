import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findRouteBfs, findRouteDijkstra, transmissionDelayMs, propagationDelayMs } from './routing.js';

const sample = {
  nodes: [
    { id: 'a', type: 'pc', label: 'A', failed: false, queueCapacity: 10 },
    { id: 'b', type: 'switch', label: 'B', failed: false, queueCapacity: 10 },
    { id: 'c', type: 'server', label: 'C', failed: false, queueCapacity: 10 },
  ],
  links: [
    { id: 'l1', source: 'a', target: 'b', bandwidthMbps: 100, distanceKm: 1, propagationSpeedMps: 2e8, lossProbability: 0, failed: false },
    { id: 'l2', source: 'b', target: 'c', bandwidthMbps: 100, distanceKm: 1, propagationSpeedMps: 2e8, lossProbability: 0, failed: false },
  ],
};

describe('routing', () => {
  it('finds BFS path', () => {
    const route = findRouteBfs(sample, 'a', 'c');
    assert.deepEqual(route.nodeIds, ['a', 'b', 'c']);
    assert.deepEqual(route.linkIds, ['l1', 'l2']);
  });

  it('excludes failed links', () => {
    const topo = structuredClone(sample);
    topo.links[0].failed = true;
    assert.equal(findRouteBfs(topo, 'a', 'c'), null);
  });

  it('excludes failed nodes', () => {
    const topo = structuredClone(sample);
    topo.nodes[1].failed = true;
    assert.equal(findRouteBfs(topo, 'a', 'c'), null);
  });

  it('computes transmission delay', () => {
    // 1500 bytes = 12000 bits at 100 Mbps = 0.12 ms
    assert.ok(Math.abs(transmissionDelayMs(1500, 100) - 0.12) < 1e-9);
  });

  it('computes propagation delay', () => {
    // 1 km at 2e8 m/s = 0.005 ms
    assert.ok(Math.abs(propagationDelayMs(1, 2e8) - 0.005) < 1e-9);
  });

  it('dijkstra finds a path', () => {
    const route = findRouteDijkstra(sample, 'a', 'c');
    assert.deepEqual(route.nodeIds, ['a', 'b', 'c']);
  });
});

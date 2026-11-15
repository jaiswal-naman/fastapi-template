import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { simulateTransmission, createRng } from './engine.js';

const topology = {
  version: 0,
  nodes: [
    { id: 'pc-1', type: 'pc', label: 'PC1', ip: '192.0.2.10', failed: false, queueCapacity: 32 },
    { id: 'sw-1', type: 'switch', label: 'SW1', failed: false, queueCapacity: 64 },
    { id: 'srv-1', type: 'server', label: 'SRV', ip: '192.0.2.20', failed: false, queueCapacity: 64 },
  ],
  links: [
    { id: 'l1', source: 'pc-1', target: 'sw-1', bandwidthMbps: 100, distanceKm: 1, propagationSpeedMps: 2e8, lossProbability: 0, failed: false },
    { id: 'l2', source: 'sw-1', target: 'srv-1', bandwidthMbps: 100, distanceKm: 1, propagationSpeedMps: 2e8, lossProbability: 0, failed: false },
  ],
};

describe('packet simulation', () => {
  it('delivers UDP_SIM without handshake', () => {
    const { packet, events } = simulateTransmission({
      topology,
      labId: 'lab-1',
      sourceNodeId: 'pc-1',
      destinationNodeId: 'srv-1',
      payload: 'hello',
      protocol: 'UDP_SIM',
      seed: 42,
    });
    assert.equal(packet.status, 'delivered');
    assert.ok(!events.some((e) => e.type === 'tcp.syn'));
    assert.ok(events.some((e) => e.type === 'packet.delivered'));
  });

  it('runs TCP_SIM handshake events', () => {
    const { packet, events } = simulateTransmission({
      topology,
      labId: 'lab-1',
      sourceNodeId: 'pc-1',
      destinationNodeId: 'srv-1',
      payload: 'hello-tcp',
      protocol: 'TCP_SIM',
      seed: 7,
    });
    assert.equal(packet.status, 'delivered');
    assert.ok(events.some((e) => e.type === 'tcp.syn'));
    assert.ok(events.some((e) => e.type === 'tcp.syn_ack'));
  });

  it('drops when no route', () => {
    const topo = structuredClone(topology);
    topo.links[0].failed = true;
    const { packet } = simulateTransmission({
      topology: topo,
      labId: 'lab-1',
      sourceNodeId: 'pc-1',
      destinationNodeId: 'srv-1',
      payload: 'x',
      protocol: 'UDP_SIM',
      seed: 1,
    });
    assert.equal(packet.status, 'dropped');
    assert.equal(packet.dropReason, 'no_route');
  });

  it('rng is deterministic', () => {
    const a = createRng(99);
    const b = createRng(99);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });
});

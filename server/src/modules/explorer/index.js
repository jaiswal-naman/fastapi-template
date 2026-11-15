import { buildPacketLessons } from './packetLessons.js';
import { buildSignalLessons } from './signalLessons.js';
import { buildChannelLessons } from './channelLessons.js';

export const GROUPS = [
  { id: 'network', label: 'Network' },
  { id: 'transport', label: 'Transport' },
  { id: 'signals', label: 'Signals' },
  { id: 'channel', label: 'Channel' },
];

let cache = null;

/**
 * Every Explorer lesson, built from the same engines the lab uses (packet simulation, routing,
 * line coding, channel maths). The runs are seeded, so the result never changes and is built once.
 */
export function getExplorer() {
  if (!cache) {
    const lessons = [...buildPacketLessons(), ...buildSignalLessons(), ...buildChannelLessons()];
    const order = new Map(GROUPS.map((g, i) => [g.id, i]));
    lessons.sort((a, b) => order.get(a.group) - order.get(b.group));
    cache = { groups: GROUPS, lessons };
  }
  return cache;
}

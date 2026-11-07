import { DeviceTypes } from '@datacompredia/shared';

function pc(id, label, ip, x, y) {
  return {
    id,
    type: DeviceTypes.PC,
    label,
    ip,
    failed: false,
    queueCapacity: 32,
    position: { x, y, z: 0 },
  };
}

function server(id, label, ip, x, y) {
  return {
    id,
    type: DeviceTypes.SERVER,
    label,
    ip,
    failed: false,
    queueCapacity: 64,
    position: { x, y, z: 0 },
  };
}

function sw(id, label, x, y) {
  return {
    id,
    type: DeviceTypes.SWITCH,
    label,
    failed: false,
    queueCapacity: 128,
    position: { x, y, z: 0 },
  };
}

function router(id, label, ip, x, y) {
  return {
    id,
    type: DeviceTypes.ROUTER,
    label,
    ip,
    failed: false,
    queueCapacity: 128,
    position: { x, y, z: 0 },
  };
}

function link(id, source, target, extras = {}) {
  return {
    id,
    source,
    target,
    bandwidthMbps: 100,
    distanceKm: 1,
    propagationSpeedMps: 2e8,
    lossProbability: 0,
    failed: false,
    ...extras,
  };
}

export const TOPOLOGY_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank custom topology',
    description: 'Empty canvas — add devices yourself.',
    topology: { nodes: [], links: [], version: 0 },
  },
  star: {
    id: 'star',
    name: 'Star',
    description: 'Three PCs and a server around a central switch.',
    topology: {
      version: 0,
      nodes: [
        sw('sw-1', 'Switch 1', 0, 0),
        pc('pc-1', 'PC 1', '192.0.2.10', -180, -120),
        pc('pc-2', 'PC 2', '192.0.2.11', 180, -120),
        pc('pc-3', 'PC 3', '192.0.2.12', -180, 120),
        server('srv-1', 'Server 1', '192.0.2.20', 180, 120),
      ],
      links: [
        link('l1', 'pc-1', 'sw-1'),
        link('l2', 'pc-2', 'sw-1'),
        link('l3', 'pc-3', 'sw-1'),
        link('l4', 'srv-1', 'sw-1'),
      ],
    },
  },
  bus: {
    id: 'bus',
    name: 'Bus',
    description: 'Linear chain of devices for hop delay demos.',
    topology: {
      version: 0,
      nodes: [
        pc('pc-1', 'PC 1', '192.0.2.10', -300, 0),
        sw('sw-1', 'Switch 1', -150, 0),
        router('r-1', 'Router 1', '198.51.100.1', 0, 0),
        sw('sw-2', 'Switch 2', 150, 0),
        server('srv-1', 'Server 1', '198.51.100.20', 300, 0),
      ],
      links: [
        link('l1', 'pc-1', 'sw-1', { distanceKm: 0.5 }),
        link('l2', 'sw-1', 'r-1', { distanceKm: 5, bandwidthMbps: 50 }),
        link('l3', 'r-1', 'sw-2', { distanceKm: 5, bandwidthMbps: 50 }),
        link('l4', 'sw-2', 'srv-1', { distanceKm: 0.5 }),
      ],
    },
  },
  ring: {
    id: 'ring',
    name: 'Ring',
    description: 'Four switches in a ring with two endpoints.',
    topology: {
      version: 0,
      nodes: [
        sw('sw-1', 'SW1', 0, -140),
        sw('sw-2', 'SW2', 140, 0),
        sw('sw-3', 'SW3', 0, 140),
        sw('sw-4', 'SW4', -140, 0),
        pc('pc-1', 'PC 1', '192.0.2.10', 0, -240),
        server('srv-1', 'Server 1', '192.0.2.20', 0, 240),
      ],
      links: [
        link('l1', 'sw-1', 'sw-2'),
        link('l2', 'sw-2', 'sw-3'),
        link('l3', 'sw-3', 'sw-4'),
        link('l4', 'sw-4', 'sw-1'),
        link('l5', 'pc-1', 'sw-1'),
        link('l6', 'srv-1', 'sw-3'),
      ],
    },
  },
  mesh: {
    id: 'mesh',
    name: 'Mesh',
    description: 'Partially meshed routers with alternate paths.',
    topology: {
      version: 0,
      nodes: [
        pc('pc-1', 'PC 1', '192.0.2.10', -220, -120),
        router('r-1', 'R1', '198.51.100.1', -80, -40),
        router('r-2', 'R2', '198.51.100.2', 80, -40),
        router('r-3', 'R3', '198.51.100.3', 0, 100),
        server('srv-1', 'Server 1', '203.0.113.20', 220, 120),
      ],
      links: [
        link('l1', 'pc-1', 'r-1'),
        link('l2', 'r-1', 'r-2', { bandwidthMbps: 100, distanceKm: 10 }),
        link('l3', 'r-1', 'r-3', { bandwidthMbps: 40, distanceKm: 20 }),
        link('l4', 'r-2', 'r-3', { bandwidthMbps: 40, distanceKm: 20 }),
        link('l5', 'r-2', 'srv-1'),
        link('l6', 'r-3', 'srv-1', { bandwidthMbps: 20, distanceKm: 30 }),
      ],
    },
  },
};

export function listTemplates() {
  return Object.values(TOPOLOGY_TEMPLATES).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
}

export function getTemplateTopology(templateId) {
  const template = TOPOLOGY_TEMPLATES[templateId];
  if (!template) return null;
  return structuredClone(template.topology);
}

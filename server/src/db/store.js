import { nanoid } from 'nanoid';
import { kv } from './kv.js';
import { getTemplateTopology } from '../modules/topology/templates.js';
import { validateTopology } from '../modules/topology/validate.js';
import { createMetricsStore } from '../modules/metrics/metrics.js';

async function readList(key) {
  return (await kv.get(key)) || [];
}

const writeList = (key, list) => kv.set(key, list);

/**
 * Live simulation state keyed by labId. Kept in memory for the running instance and
 * saved to the store so a reconnect on another instance (Vercel) still sees it.
 */
const live = new Map();

function freshLive(saved = null) {
  return {
    metrics: createMetricsStore(saved?.metrics),
    lastPacket: saved?.lastPacket ?? null,
    lastEvents: saved?.lastEvents ?? [],
    simulationStatus: saved?.simulationStatus ?? 'idle',
    paused: false,
  };
}

async function getLive(labId) {
  if (!live.has(labId)) {
    const saved = await kv.get(`live-${labId}`);
    if (!live.has(labId)) live.set(labId, freshLive(saved));
  }
  return live.get(labId);
}

async function saveLive(labId) {
  const state = live.get(labId);
  if (!state) return;
  await kv.set(`live-${labId}`, {
    metrics: state.metrics.toJSON(),
    lastPacket: state.lastPacket,
    lastEvents: state.lastEvents,
    simulationStatus: state.simulationStatus,
  });
}

export const labStore = {
  async listLabs() {
    return readList('labs');
  },

  async getLab(labId) {
    const labs = await readList('labs');
    return labs.find((l) => l.id === labId) || null;
  },

  async createLab({ name, template }) {
    const topology = getTemplateTopology(template) || getTemplateTopology('blank');
    const lab = {
      id: `lab-${nanoid(8)}`,
      name,
      template,
      topology,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionLabel: 'Local demo session',
    };
    const labs = await readList('labs');
    labs.unshift(lab);
    await writeList('labs', labs);
    return lab;
  },

  async updateLabMeta(labId, patch) {
    const labs = await readList('labs');
    const idx = labs.findIndex((l) => l.id === labId);
    if (idx < 0) return null;
    labs[idx] = {
      ...labs[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await writeList('labs', labs);
    return labs[idx];
  },

  async saveTopology(labId, topologyInput) {
    const validated = validateTopology(topologyInput);
    if (!validated.ok) return { ok: false, message: validated.message };

    const labs = await readList('labs');
    const idx = labs.findIndex((l) => l.id === labId);
    if (idx < 0) return { ok: false, message: 'Lab not found.' };

    const nextVersion = (labs[idx].topology?.version || 0) + 1;
    labs[idx].topology = { ...validated.topology, version: nextVersion };
    labs[idx].updatedAt = new Date().toISOString();
    await writeList('labs', labs);
    return { ok: true, lab: labs[idx] };
  },

  async listExperiments(labId) {
    const all = await readList('experiments');
    return all.filter((e) => e.labId === labId);
  },

  async getExperiment(experimentId) {
    const all = await readList('experiments');
    return all.find((e) => e.id === experimentId) || null;
  },

  async saveExperiment(labId, summary) {
    const lab = await this.getLab(labId);
    if (!lab) return null;
    const experiment = {
      id: `exp-${nanoid(8)}`,
      labId,
      name: summary.name || `${lab.name} experiment`,
      createdAt: new Date().toISOString(),
      topologySnapshot: structuredClone(lab.topology),
      protocol: summary.protocol || null,
      sourceNodeId: summary.sourceNodeId || null,
      destinationNodeId: summary.destinationNodeId || null,
      packetCounts: summary.packetCounts || null,
      metricsSummary: summary.metricsSummary || null,
      observations: summary.observations || '',
      packet: summary.packet || null,
      events: summary.events || [],
    };
    const all = await readList('experiments');
    all.unshift(experiment);
    await writeList('experiments', all);
    return experiment;
  },

  getLive,
  saveLive,
  async resetLive(labId) {
    live.set(labId, freshLive());
    await saveLive(labId);
    return live.get(labId);
  },
};

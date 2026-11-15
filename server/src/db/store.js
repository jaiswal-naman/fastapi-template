import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { getTemplateTopology } from '../modules/topology/templates.js';
import { validateTopology } from '../modules/topology/validate.js';
import { createMetricsStore } from '../modules/metrics/metrics.js';

const labsFile = () => path.join(config.dataDir, 'labs.json');
const experimentsFile = () => path.join(config.dataDir, 'experiments.json');

async function ensureDataDir() {
  await fs.mkdir(config.dataDir, { recursive: true });
  try {
    await fs.access(labsFile());
  } catch {
    await fs.writeFile(labsFile(), '[]', 'utf8');
  }
  try {
    await fs.access(experimentsFile());
  } catch {
    await fs.writeFile(experimentsFile(), '[]', 'utf8');
  }
}

async function readJson(file) {
  await ensureDataDir();
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(file, data) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

/** In-memory live simulation state keyed by labId */
const live = new Map();

function getLive(labId) {
  if (!live.has(labId)) {
    live.set(labId, {
      metrics: createMetricsStore(),
      lastPacket: null,
      lastEvents: [],
      simulationStatus: 'idle',
      paused: false,
    });
  }
  return live.get(labId);
}

export const labStore = {
  async listLabs() {
    return readJson(labsFile());
  },

  async getLab(labId) {
    const labs = await readJson(labsFile());
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
    const labs = await readJson(labsFile());
    labs.unshift(lab);
    await writeJson(labsFile(), labs);
    getLive(lab.id);
    return lab;
  },

  async updateLabMeta(labId, patch) {
    const labs = await readJson(labsFile());
    const idx = labs.findIndex((l) => l.id === labId);
    if (idx < 0) return null;
    labs[idx] = {
      ...labs[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await writeJson(labsFile(), labs);
    return labs[idx];
  },

  async saveTopology(labId, topologyInput) {
    const validated = validateTopology(topologyInput);
    if (!validated.ok) return { ok: false, message: validated.message };

    const labs = await readJson(labsFile());
    const idx = labs.findIndex((l) => l.id === labId);
    if (idx < 0) return { ok: false, message: 'Lab not found.' };

    const nextVersion = (labs[idx].topology?.version || 0) + 1;
    labs[idx].topology = { ...validated.topology, version: nextVersion };
    labs[idx].updatedAt = new Date().toISOString();
    await writeJson(labsFile(), labs);
    return { ok: true, lab: labs[idx] };
  },

  async listExperiments(labId) {
    const all = await readJson(experimentsFile());
    return all.filter((e) => e.labId === labId);
  },

  async getExperiment(experimentId) {
    const all = await readJson(experimentsFile());
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
    const all = await readJson(experimentsFile());
    all.unshift(experiment);
    await writeJson(experimentsFile(), all);
    return experiment;
  },

  getLive,
  resetLive(labId) {
    const state = getLive(labId);
    state.metrics.reset();
    state.lastPacket = null;
    state.lastEvents = [];
    state.simulationStatus = 'idle';
    state.paused = false;
    return state;
  },
};

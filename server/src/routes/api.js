import { Router } from 'express';
import { labCreateSchema, topologySchema } from '@datacompredia/shared';
import { labStore } from '../db/store.js';
import { listTemplates } from '../modules/topology/templates.js';
import { DEMO_SCENARIOS } from '../modules/topology/scenarios.js';
import { encode } from '../modules/signal-encoding/encoders.js';
import {
  nyquistCapacity,
  shannonCapacity,
  pcmBitRate,
  deltaModulation,
} from '../modules/channel/channel.js';

export function createApiRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'datacompredia-server' });
  });

  router.get('/topologies/templates', (_req, res) => {
    res.json({ templates: listTemplates() });
  });

  router.get('/scenarios', (_req, res) => {
    res.json({ scenarios: DEMO_SCENARIOS });
  });

  router.get('/labs', async (_req, res, next) => {
    try {
      const labs = await labStore.listLabs();
      res.json({
        labs: labs.map((l) => ({
          id: l.id,
          name: l.name,
          template: l.template,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          nodeCount: l.topology?.nodes?.length || 0,
          linkCount: l.topology?.links?.length || 0,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/labs', async (req, res, next) => {
    try {
      const parsed = labCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        });
      }
      const lab = await labStore.createLab(parsed.data);
      res.status(201).json({ lab });
    } catch (err) {
      next(err);
    }
  });

  router.get('/labs/:labId', async (req, res, next) => {
    try {
      const lab = await labStore.getLab(req.params.labId);
      if (!lab) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lab not found.' });
      const live = labStore.getLive(lab.id);
      res.json({
        lab,
        live: {
          simulationStatus: live.simulationStatus,
          metrics: live.metrics.getSnapshot(),
          lastPacket: live.lastPacket,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/labs/:labId', async (req, res, next) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : null;
      if (!name) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name is required.' });
      }
      const lab = await labStore.updateLabMeta(req.params.labId, { name });
      if (!lab) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lab not found.' });
      res.json({ lab });
    } catch (err) {
      next(err);
    }
  });

  router.put('/labs/:labId/topology', async (req, res, next) => {
    try {
      const parsed = topologySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        });
      }
      const result = await labStore.saveTopology(req.params.labId, parsed.data);
      if (!result.ok) {
        const status = result.message === 'Lab not found.' ? 404 : 400;
        return res.status(status).json({ code: status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR', message: result.message });
      }
      res.json({ lab: result.lab });
    } catch (err) {
      next(err);
    }
  });

  router.post('/labs/:labId/experiments', async (req, res, next) => {
    try {
      const experiment = await labStore.saveExperiment(req.params.labId, req.body || {});
      if (!experiment) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lab not found.' });
      res.status(201).json({ experiment });
    } catch (err) {
      next(err);
    }
  });

  router.get('/labs/:labId/experiments', async (req, res, next) => {
    try {
      const experiments = await labStore.listExperiments(req.params.labId);
      res.json({ experiments });
    } catch (err) {
      next(err);
    }
  });

  router.get('/experiments/:experimentId', async (req, res, next) => {
    try {
      const experiment = await labStore.getExperiment(req.params.experimentId);
      if (!experiment) return res.status(404).json({ code: 'NOT_FOUND', message: 'Experiment not found.' });
      res.json({ experiment });
    } catch (err) {
      next(err);
    }
  });

  router.get('/experiments', async (_req, res, next) => {
    try {
      const labs = await labStore.listLabs();
      const all = [];
      for (const lab of labs) {
        const exps = await labStore.listExperiments(lab.id);
        all.push(...exps);
      }
      all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      res.json({ experiments: all });
    } catch (err) {
      next(err);
    }
  });

  router.post('/signal/encode', (req, res) => {
    try {
      const { bits, scheme } = req.body || {};
      const result = encode(scheme, bits);
      res.json({ result, label: 'Simulated encoding' });
    } catch (err) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
    }
  });

  router.post('/channel/capacity', (req, res) => {
    try {
      const { experiment } = req.body || {};
      let result;
      if (experiment === 'nyquist') result = nyquistCapacity(req.body);
      else if (experiment === 'shannon') result = shannonCapacity(req.body);
      else if (experiment === 'pcm') result = pcmBitRate(req.body);
      else if (experiment === 'delta') result = deltaModulation(req.body);
      else {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'experiment must be nyquist, shannon, pcm, or delta.',
        });
      }
      res.json({ result, label: 'Simulated calculation' });
    } catch (err) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
    }
  });

  router.get('/labs/:labId/metrics', async (req, res, next) => {
    try {
      const lab = await labStore.getLab(req.params.labId);
      if (!lab) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lab not found.' });
      const live = labStore.getLive(lab.id);
      res.json({
        current: live.metrics.getSnapshot(),
        history: live.metrics.getHistory(),
        label: 'Simulated',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

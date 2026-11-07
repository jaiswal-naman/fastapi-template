import { z } from 'zod';
import { DeviceTypes } from '../eventNames.js';
import {
  DEFAULT_BANDWIDTH_MBPS,
  DEFAULT_DISTANCE_KM,
  DEFAULT_LOSS_PROBABILITY,
  DEFAULT_PROPAGATION_SPEED_MPS,
  DEFAULT_QUEUE_CAPACITY,
} from '../constants.js';

export const deviceTypeSchema = z.enum([
  DeviceTypes.PC,
  DeviceTypes.ROUTER,
  DeviceTypes.SWITCH,
  DeviceTypes.SERVER,
  DeviceTypes.HUB,
]);

export const nodeSchema = z.object({
  id: z.string().min(1),
  type: deviceTypeSchema,
  label: z.string().min(1).max(64),
  ip: z.string().min(7).max(45).optional(),
  failed: z.boolean().default(false),
  queueCapacity: z.number().int().positive().default(DEFAULT_QUEUE_CAPACITY),
  processingDelayMs: z.number().nonnegative().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number().optional(),
    })
    .optional(),
});

export const linkSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  bandwidthMbps: z.number().positive().default(DEFAULT_BANDWIDTH_MBPS),
  distanceKm: z.number().nonnegative().default(DEFAULT_DISTANCE_KM),
  propagationSpeedMps: z.number().positive().default(DEFAULT_PROPAGATION_SPEED_MPS),
  lossProbability: z.number().min(0).max(1).default(DEFAULT_LOSS_PROBABILITY),
  failed: z.boolean().default(false),
});

export const topologySchema = z.object({
  nodes: z.array(nodeSchema),
  links: z.array(linkSchema),
  version: z.number().int().nonnegative().default(0),
});

export const labCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  template: z.enum(['star', 'bus', 'ring', 'mesh', 'blank']).default('blank'),
});

export const transmitSchema = z.object({
  labId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  destinationNodeId: z.string().min(1),
  payload: z.string().min(1).max(2048),
  protocol: z.enum(['TCP_SIM', 'UDP_SIM']),
});

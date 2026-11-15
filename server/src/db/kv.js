import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Tiny JSON key-value store.
 * Upstash Redis when its REST env vars are set (Vercel), JSON files in DATA_DIR otherwise (local).
 */
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function fileKv() {
  const fileFor = (key) => path.join(config.dataDir, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
  return {
    kind: 'file',
    async get(key) {
      try {
        return JSON.parse(await fs.readFile(fileFor(key), 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
      }
    },
    async set(key, value) {
      await fs.mkdir(config.dataDir, { recursive: true });
      await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), 'utf8');
    },
  };
}

async function redisKv() {
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url: redisUrl, token: redisToken });
  return {
    kind: 'redis',
    get: (key) => redis.get(`dcp:${key}`),
    set: (key, value) => redis.set(`dcp:${key}`, value),
  };
}

export const kv = redisUrl && redisToken ? await redisKv() : fileKv();

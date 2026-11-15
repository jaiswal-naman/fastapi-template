import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Vercel's file system is read-only except /tmp (used only when Redis isn't configured).
  dataDir: process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/datacompredia' : path.join(__dirname, '../data')),
  host: process.env.HOST || '0.0.0.0',
};

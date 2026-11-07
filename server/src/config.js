import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dataDir: process.env.DATA_DIR || path.join(__dirname, '../data'),
  host: process.env.HOST || '0.0.0.0',
};

// Vercel Function: the whole API and the Socket.IO server (served at /api/*, see vercel.json).
import { createAppServer } from '../server/src/app.js';

export default createAppServer();

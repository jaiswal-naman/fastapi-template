// Smoke test against a running deployment: health, labs API, and a real packet over Socket.IO.
// Uses (or creates) the "Campus Backbone" star lab, so it doubles as the demo seed.
// Usage: node scripts/smoke.mjs https://your-app.vercel.app   (default http://localhost:4000)
import { io } from 'socket.io-client';

const base = (process.argv[2] || 'http://localhost:4000').replace(/\/$/, '');
const LAB_NAME = 'Campus Backbone';

async function getJson(path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

function connect() {
  const socket = io(base, { path: '/api/socket.io', transports: ['websocket'], reconnection: false });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function waitFor(socket, event, ms = 20000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), ms);
    socket.once(event, (p) => {
      clearTimeout(t);
      resolve(p);
    });
  });
}

const health = await getJson('/api/v1/health');
console.log('health:', health.status);

const { labs } = await getJson('/api/v1/labs');
let lab = labs.find((l) => l.name === LAB_NAME);
if (!lab) {
  ({ lab } = await getJson('/api/v1/labs', { method: 'POST', body: JSON.stringify({ name: LAB_NAME, template: 'star' }) }));
  console.log('created lab:', lab.id);
} else {
  console.log('using lab:', lab.id);
}

let socket = await connect();
console.log('socket connected over', socket.io.engine.transport.name);
socket.emit('lab:join', { labId: lab.id });
await waitFor(socket, 'lab:joined');

const delivered = waitFor(socket, 'packet:delivered');
const ack = await socket.emitWithAck('packet:transmit', {
  labId: lab.id,
  sourceNodeId: 'pc-1',
  destinationNodeId: 'srv-1',
  payload: 'Hello from the smoke test',
  protocol: 'TCP_SIM',
});
if (!ack?.ok) throw new Error(`transmit failed: ${JSON.stringify(ack)}`);
const d = await delivered;
console.log(`packet delivered: ${d.hops} hops, ${Number(d.totalDelayMs).toFixed(2)} ms`);
await waitFor(socket, 'metrics:update').catch(() => {});
await new Promise((r) => setTimeout(r, 500));
socket.disconnect();

// Reconnect (possibly to another instance) and check the result was saved.
socket = await connect();
socket.emit('lab:join', { labId: lab.id });
const { state } = await waitFor(socket, 'lab:joined');
socket.disconnect();
if (state.lastPacket?.packetId !== ack.packetId) throw new Error('last packet not kept after reconnect');
console.log(`after reconnect: last packet kept, ${state.metrics.sent} sent in total`);
console.log('SMOKE OK');
process.exit(0);

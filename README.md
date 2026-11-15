# DataComPredia

Interactive Data Communication and Networking laboratory.

> An interactive laboratory for understanding how data moves through networks, from binary signals to packet delivery.

**Explore. Transmit. Visualize. Understand.**

## What you see

- **Explorer** (home page, `/`): pick a topic, press Play, and watch it happen one step at a time with a plain-words explanation beside it. 23 lessons: star, bus, ring and mesh topologies, the four delays, routing, TCP handshake, TCP retransmission, UDP, ten line codes, Nyquist, Shannon, PCM and delta modulation. Every lesson is built on the server from the same engines the lab uses (`server/src/modules/explorer`), so nothing on screen is hand-drawn or made up.
- **Lab** (`/lab` and the sidebar pages): build your own topology, send your own packets, and use the Signal Studio and Channel Lab with your own values.

## Stack

- **Client:** React + Vite + Tailwind + React Flow + React Three Fiber + Recharts + Zustand + Socket.IO client
- **Server:** Node.js + Express + Socket.IO
- **Shared:** Zod schemas, event names, design tokens
- **Persistence:** JSON files in `server/data/` locally; Upstash Redis when its env vars are set (see Deploying to Vercel). Local demo session, no auth

All TCP/UDP behaviour is **application-level simulation** (`TCP_SIM` / `UDP_SIM`). The product does not capture real Ethernet frames.

## Quick start

```bash
npm install
npm run dev
```

- Client: http://localhost:5173  
- API / Socket.IO: http://localhost:4000  

Production-style (serves built client from Express when `client/dist` exists):

```bash
npm run build
npm start
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Concurrent client + server |
| `npm test` | Unit tests (routing, simulation, encoders, channel) |
| `npm run build` | Build client for static serving |

## Deploying to Vercel

The repo deploys as one Vercel project: `vercel.json` builds the client into `client/dist` and sends `/api/*` (the REST API and Socket.IO) to the function in `api/server.mjs`.

- Socket.IO is served at `/api/socket.io` and uses the WebSocket transport only. On the Hobby plan a connection is closed after 300 seconds; the client reconnects and rejoins the open lab by itself.
- For saved labs that survive restarts, add Upstash Redis from the Vercel Marketplace (Storage tab) and connect it to the project. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the server picks up. Without them, labs are kept in `/tmp` and are lost when the function restarts. The Explorer needs no storage.
- `node scripts/smoke.mjs https://your-app.vercel.app` checks health, the labs API and a real packet over the socket.

## Demo path

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

## Documentation

- [Master build spec](docs/DataComPredia_Master_Build_Spec.md)
- [Assumptions & decisions](docs/ASSUMPTIONS_AND_DECISIONS.md)
- [Implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md)
- [Socket events](docs/SOCKET_EVENTS.md)
- [Simulation formulas](docs/SIMULATION_FORMULAS.md)

## Environment

Copy `.env.example` if needed:

- `PORT` — server port (default `4000`)
- `CLIENT_ORIGIN` — CORS origin (default `http://localhost:5173`)
- `VITE_API_BASE` — optional absolute API base (default `/api/v1` via Vite proxy)
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — optional Upstash Redis for saved labs (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)
- `DATA_DIR` — optional folder for the JSON files when Redis is not set

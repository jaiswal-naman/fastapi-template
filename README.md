# DataComPredia

Interactive Data Communication and Networking laboratory.

> An interactive laboratory for understanding how data moves through networks, from binary signals to packet delivery.

**Explore. Transmit. Visualize. Understand.**

## Stack

- **Client:** React + Vite + Tailwind + React Flow + React Three Fiber + Recharts + Zustand + Socket.IO client
- **Server:** Node.js + Express + Socket.IO
- **Shared:** Zod schemas, event names, design tokens
- **Persistence:** File-backed JSON store (`server/data/`) — local demo session, no auth

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

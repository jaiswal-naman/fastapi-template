# Socket.IO event contract

Rooms: `lab:<labId>`. Client must `lab:join` before receiving lab events.

## Client → server

| Event | Payload |
|-------|---------|
| `lab:join` | `{ labId }` |
| `lab:leave` | `{ labId }` |
| `topology:update` | `{ labId, topology }` |
| `node:failure:set` | `{ labId, nodeId, failed }` |
| `link:failure:set` | `{ labId, linkId, failed }` |
| `packet:transmit` | `{ labId, sourceNodeId, destinationNodeId, payload, protocol }` |
| `simulation:pause` / `resume` / `reset` | `{ labId }` |

## Server → client

| Event | Purpose |
|-------|---------|
| `lab:joined` | Initial room state |
| `topology:updated` | Graph broadcast |
| `packet:created` / `packet:route` / `packet:queued` / `packet:hop` | Lifecycle |
| `packet:dropped` / `packet:retransmit` / `packet:ack` / `packet:delivered` | Outcomes |
| `metrics:update` | Simulated metrics snapshot |
| `simulation:state` / `simulation:error` | Status |
| `packet:timeline` | Extra timeline events (handshake markers) |
| `connection:status` | `{ status: 'Connected' }` |

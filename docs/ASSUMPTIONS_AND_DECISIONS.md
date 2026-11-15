# Assumptions and Decisions

Recorded for DataComPredia. Spec source: `docs/DataComPredia_Master_Build_Spec.md`.

## Repository choice

- Existing FastAPI/Python/Supabase template was intentionally discarded. This repository is used as a greenfield JS monorepo because no separate empty repo was available.
- Stack follows the build spec: React + Vite client, Node.js + Express + Socket.IO server, shared JS modules.

## Persistence and auth

- No user authentication in v1. Sessions are labelled **Local demo session**.
- Labs and experiments persist in an on-disk JSON store under `server/data/` (file-backed repository interface). PostgreSQL/Prisma deferred.
- Multi-user simultaneous editing is out of scope. Last-write-wins with topology `version`.

## Graph and routing

- Links are **undirected**.
- Device compatibility (allowed): EndDevice/PC ↔ Switch/Hub/Router; Server ↔ Switch/Hub/Router; Switch ↔ Router; Router ↔ Router; Switch ↔ Switch. Hub optional and treated like a multipoint repeater (no learning).
- Self-links and duplicate undirected links are rejected.
- Routing: BFS for hop-count shortest path; Dijkstra optional with cost = transmission delay for a reference 1500-byte frame + propagation delay. Default transmit route uses BFS.
- Failed nodes and failed links are excluded from routing.

## Simulation model

- Application-level **TCP_SIM** / **UDP_SIM** only. No native socket capture.
- Processing delay: fixed 0.1 ms per hop unless overridden on the node.
- Queueing: simple FIFO per node; overflow drops with reason `queue_overflow`.
- Packet loss: Bernoulli per hop using link `lossProbability`, seeded RNG for tests.
- TCP_SIM: 3-way handshake (SYN, SYN-ACK, ACK), data + ACK, RTO = 2× estimated RTT (floor 50 ms), max 3 retransmits, no congestion window / slow-start in v1.
- UDP_SIM: single datagram, no handshake, no retransmit; drop is terminal.
- Payload max length: 2048 characters. Empty payload rejected.
- Simulation clock is discrete-event; UI animation maps event timestamps to wall-clock with a configurable speed factor (default 1.0).

## Signal Studio conventions

- Manchester (IEEE 802.3): mid-bit transition; `0` = high→low, `1` = low→high.
- Differential Manchester: mid-bit transition always; `0` = transition at start of bit, `1` = no transition at start.
- B8ZS / HDB3 use standard AMI polarity with documented substitution patterns; test vectors recorded in encoder unit tests.

## Channel Lab

- Nyquist: `C = 2B log2(M)`.
- Shannon: `C = B log2(1 + SNR_linear)` where SNR_linear = 10^(SNR_dB/10).
- PCM bit rate: `n × fs`.
- Delta Modulation: fixed step size input; reconstruction is staircase ±step.

## UI / 3D

- Emerald/charcoal design tokens from the spec.
- Typography: IBM Plex Sans (UI) + IBM Plex Mono (technical values).
- 2D editor: React Flow.
- 3D: React Three Fiber + Drei; simple primitive geometries; circular layout around origin when no positions; grid floor for orientation only.
- Charts: Recharts.
- State: Zustand on the client.
- Export: CSV for experiment metrics in v1; PDF deferred.

## Native networking

- Separate native socket service is **not** in scope. All TCP/UDP behaviour is simulated.

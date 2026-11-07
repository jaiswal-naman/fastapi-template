# Implementation Checklist

Statuses: `not_started` | `in_progress` | `implemented` | `verified` | `blocked`

## Phase 0 — Audit and foundation

| ID | Requirement | Status |
|----|-------------|--------|
| P0.1 | Inspect existing repository | verified |
| P0.2 | Discard FastAPI stub; greenfield JS monorepo | verified |
| P0.3 | Create this checklist | verified |
| P0.4 | Create ASSUMPTIONS_AND_DECISIONS.md | verified |
| P0.5 | Copy master build spec into docs/ | verified |
| P0.6 | Shared event names and schemas | verified |

## Phase 1 — Foundation

| ID | Requirement | Status |
|----|-------------|--------|
| P1.1 | Monorepo package layout | verified |
| P1.2 | Express server + health | verified |
| P1.3 | Socket.IO server + connection status | verified |
| P1.4 | React + Vite client | verified |
| P1.5 | Emerald design tokens + app shell + nav | verified |
| P1.6 | Overview dashboard with empty states | verified |

## Phase 2 — Topology

| ID | Requirement | Status |
|----|-------------|--------|
| P2.1 | Graph data model + validation | verified |
| P2.2 | Device palette, add/move/select/delete | verified |
| P2.3 | Connect mode + link properties | verified |
| P2.4 | Star/Bus/Ring/Mesh/Blank templates | verified |
| P2.5 | Save/load topology REST API | verified |
| P2.6 | Node/link failure controls | verified |

## Phase 3 — Packet simulation

| ID | Requirement | Status |
|----|-------------|--------|
| P3.1 | BFS (+ Dijkstra) routing | verified |
| P3.2 | Delay / queue / loss engine | verified |
| P3.3 | packet:transmit + lifecycle events | verified |
| P3.4 | Packet inspector + event timeline | verified |

## Phase 4 — 3D

| ID | Requirement | Status |
|----|-------------|--------|
| P4.1 | Shared graph → Three.js scene | verified |
| P4.2 | Packet markers from server events | verified |
| P4.3 | Failed/congested visuals + camera | verified |
| P4.4 | 2D/text fallback | verified |

## Phase 5 — TCP/UDP + Observatory

| ID | Requirement | Status |
|----|-------------|--------|
| P5.1 | TCP_SIM handshake/ACK/retry | verified |
| P5.2 | UDP_SIM datagram behaviour | verified |
| P5.3 | Performance Observatory charts | verified |

## Phase 6 — Signal + Channel

| ID | Requirement | Status |
|----|-------------|--------|
| P6.1 | Line encoders + waveform UI | verified |
| P6.2 | B8ZS / HDB3 | verified |
| P6.3 | Nyquist / Shannon / PCM / DM | verified |

## Phase 7 — Reports and polish

| ID | Requirement | Status |
|----|-------------|--------|
| P7.1 | Save experiments + report view | verified |
| P7.2 | CSV export | verified |
| P7.3 | Demo scenarios | verified |
| P7.4 | Unit/integration tests | verified |
| P7.5 | README + DEMO_SCRIPT | verified |

## First milestone (Section 17)

| ID | Requirement | Status |
|----|-------------|--------|
| M1 | Emerald UI runs | verified |
| M2 | Create/load sample topology | verified |
| M3 | Select source/destination | verified |
| M4 | Send TCP_SIM or UDP_SIM message | verified |
| M5 | Backend computes route + delay | verified |
| M6 | Socket.IO streams packet events | verified |
| M7 | 3D animates packet on route | verified |
| M8 | Packet inspector reflects simulation | verified |
| M9 | Live metrics from real events | verified |
| M10 | Setup instructions + demo script | verified |

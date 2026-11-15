# DataComPredia

## Master Product, UX/UI, 3D Visualization, Engineering and Implementation Specification

**Document type:** Coding-agent build specification\
**Product:** DataComPredia\
**Project type:** Full-stack interactive Data Communication and
Networking laboratory\
**Status:** Implementation brief\
**Primary objective:** Build a reliable, academically accurate, polished
and genuinely interactive networking laboratory, not a static dashboard
or a collection of decorative animations.

------------------------------------------------------------------------

# 0. Instructions to the coding agent

Treat this document as the source of truth for the implementation.

## 0.1 First actions

Before changing code:

1.  Inspect the complete existing repository.
2.  Identify existing functionality, dependencies, conventions, assets,
    routes, tests and deployment configuration.
3.  Preserve useful working code. Do not replace working modules merely
    to match a preferred folder structure.
4.  Create `docs/IMPLEMENTATION_CHECKLIST.md` with each requirement in
    this document and statuses: `not_started`, `in_progress`,
    `implemented`, `verified`, or `blocked`.
5.  Create or update `docs/ASSUMPTIONS_AND_DECISIONS.md`. Record every
    decision not explicitly fixed by this specification.
6.  Create a baseline run of the current application and tests,
    recording failures before making changes.
7.  Implement in vertical slices. Keep the application runnable after
    every phase.

## 0.2 Non-negotiable rules

-   Do not invent implemented features, measurements, protocols, test
    results or deployment capabilities.
-   Do not use fake charts or hard-coded metrics in active experiments.
-   Demo data is allowed only when visibly labelled `Sample data` or
    `Demo scenario`.
-   Distinguish simulated networking behaviour from real network
    behaviour in the UI and documentation.
-   Do not claim to capture actual Ethernet frames or expose the
    browser's real TCP/UDP packets.
-   Socket.IO/WebSocket normally runs over TCP. The application's TCP
    and UDP modes are application-level simulations unless a separate
    native networking service is deliberately implemented.
-   Do not put simulation business logic inside React components,
    Express route handlers or Socket.IO handlers.
-   Do not make controls that look interactive but do nothing.
-   Do not add a library, service, API or cloud dependency without
    checking whether it is already present and whether it is necessary.
-   Do not silently change academic conventions. Document the selected
    convention and make the encoder, decoder, examples and explanation
    consistent.
-   Use JavaScript throughout unless an existing project constraint or
    dependency requires otherwise.
-   Do not invent user authentication, multi-user permissions or
    production-scale guarantees if they are not implemented.
-   If a requirement cannot be completed, record the limitation, reason
    and remaining work.

## 0.3 How to handle ambiguity

This specification separates:

-   **Specified requirement:** explicitly present in the supplied
    DataComPredia build specification.
-   **Design recommendation:** a proposed UX or engineering decision
    added to make implementation concrete.
-   **Open decision:** must be verified against the existing repository,
    course requirements or project owner.

Do not present a design recommendation as an existing product fact.
Record open decisions before implementing irreversible choices.

------------------------------------------------------------------------

# 1. Product definition

## 1.1 Product vision

DataComPredia is a browser-based interactive Data Communication and
Networking laboratory. A student should be able to:

-   Create a virtual network.
-   Add computers, routers, switches and servers.
-   Connect devices and configure links.
-   Select a source and destination.
-   Send a message through the virtual topology.
-   Watch packet forwarding hop by hop in a 2D or 3D view.
-   Inspect packet metadata, route, timestamps, delay, loss and
    retransmission events.
-   Compare simulated TCP-like and UDP-like behaviour.
-   Explore digital line coding and scrambling waveforms.
-   Experiment with channel capacity, sampling and modulation concepts.
-   Save an experiment and inspect its report.

The product should connect networking theory to a believable, testable
simulation.

## 1.2 Product principles

1.  **Correctness before spectacle.** The network graph and simulation
    engine are authoritative. The visual scene represents their state;
    it must never invent a route or packet outcome.
2.  **Visible cause and effect.** When a user changes bandwidth,
    distance, loss, queue capacity or a failure state, the resulting
    simulation should visibly and numerically reflect that change.
3.  **Progressive disclosure.** New students see clear labels and short
    explanations. Technical detail is available in inspectors, tooltips
    and event timelines.
4.  **One network model.** The 2D editor and 3D scene must represent the
    same graph state.
5.  **Readable, restrained design.** Avoid generic AI-generated
    dashboard styling, gratuitous gradients, glassmorphism, neon
    outlines, excessive glow, oversized cards and decorative data
    visualizations.
6.  **Every screen has a job.** Avoid duplicating the same metrics or
    controls across pages without a reason.
7.  **Responsive and accessible.** The main workflow must remain usable
    without relying exclusively on 3D, colour or hover.

## 1.3 Product positioning

A concise description suitable for the landing page:

> An interactive laboratory for understanding how data moves through
> networks, from binary signals to packet delivery.

Suggested product line:

**DataComPredia**\
*Explore. Transmit. Visualize. Understand.*

Do not add marketing claims such as "industry-grade", "real-world packet
capture", "real-time internet simulator" or "Cisco-certified" unless
independently substantiated.

------------------------------------------------------------------------

# 2. Users and primary jobs

The supplied specification is for a semester project and does not define
formal personas. The following are design assumptions to guide the
interface:

### Student / learner

-   Wants to understand a concept by changing inputs and seeing results.
-   Needs a guided path through an experiment.
-   Needs definitions, units, formulas and observations.
-   May be using a laptop with a trackpad or a phone.

### Faculty / evaluator

-   Wants to verify that the experiment is functional and academically
    accurate.
-   Needs visible configuration, calculations, event history and
    repeatable demo scenarios.
-   Needs a clear explanation of what is simulated.

### Project demonstrator

-   Needs preconfigured scenarios that can be launched quickly.
-   Needs a stable reset/replay path.
-   Needs the product to work even if a live network simulation has not
    yet been created.

These are interface design assumptions, not claims about researched user
behaviour.

------------------------------------------------------------------------

# 3. Information architecture

## 3.1 Primary navigation

Use a persistent left navigation rail/sidebar on desktop:

1.  Overview
2.  Network Playground
3.  Packet Playground
4.  Performance Observatory
5.  Signal Studio
6.  Channel Lab
7.  My Experiments
8.  Concepts / Help
9.  Settings

On smaller screens, use a collapsible navigation drawer. Do not compress
all labels into tiny icons without accessible names.

## 3.2 Global application shell

Every authenticated or demo application screen should share:

-   Left sidebar with product mark and navigation.
-   Main content region.
-   Compact top bar with current page title, current lab context where
    relevant, connection state and user/session menu if implemented.
-   A consistent notification area for success, warning and error
    feedback.
-   A visible unsaved-changes indicator on editable experiments.
-   A consistent empty state when no lab or experiment exists.

Authentication is optional in the original specification. If
authentication is not implemented, use a clearly labelled local demo
session rather than showing a fake user account.

## 3.3 Global status language

Use consistent labels:

-   `Connected` / `Disconnected` for Socket.IO connection state.
-   `Saved` / `Unsaved changes` for persistence state.
-   `Running` / `Paused` / `Completed` / `Failed` for simulation state.
-   `Active` / `Failed` / `Congested` for device or link state.
-   `Simulated` for simulator-derived measurements.
-   `Sample data` for non-live dashboard examples.

Do not use colour as the only indicator. Pair colour with text or an
icon.

------------------------------------------------------------------------

# 4. Visual design direction: deliberate engineering software, not AI slop

## 4.1 Design goal

Create a professional technical laboratory interface. It should feel
like carefully designed engineering software: calm, precise, spatially
clear, information-dense where useful and easy to scan.

The supplied initial design direction specifies emerald green supported
by deep charcoal/navy surfaces and high-contrast text. Retain this
identity, but use emerald as a functional accent rather than making
every component glow green.

## 4.2 Suggested colour tokens

These values are from the original build specification and should be
implemented as design tokens:

  Token                       Value Intended use
  --------------------- ----------- ---------------------------------
  Primary emerald         `#10B981` Primary actions, selected state
  Deep emerald            `#047857` Darker active/pressed state
  Bright accent           `#34D399` Focused highlights, packet path
  Main background         `#071A16` Application background
  Surface                 `#0D2620` Main panels
  Elevated surface        `#12352B` Raised panels and menus
  Main text               `#F0FDF4` Primary text
  Secondary text          `#A7C4B8` Supporting text
  Border                  `#285344` Dividers and boundaries
  Warning                 `#FBBF24` Warnings and congestion
  Error / packet drop     `#FB7185` Failures and drops
  Info                    `#60A5FA` Informational state

### Additional neutral recommendation

Use a restrained neutral scale for hierarchy, for example: - Near-black
green for the application canvas. - Dark charcoal-green for panels. -
Slightly lighter green-grey for elevated controls. - Muted grey-green
for secondary labels. - Off-white for primary text.

If adding neutral tokens, document the exact values in the theme file.
Do not create arbitrary one-off colours in individual components.

## 4.3 Typography

Design recommendation:

-   Use one highly legible UI sans-serif family throughout.
-   Use tabular numerals for measurements, counters, timestamps and
    metric values.
-   Use monospace only for packet IDs, IP addresses, binary strings,
    code-like values and event names.
-   Avoid oversized hero typography inside working laboratory screens.
-   Use a clear type scale and consistent line height.
-   Do not use tiny low-contrast labels for important controls.

Typography scale recommendation: - Page title: 24--28 px desktop. -
Section title: 16--20 px. - Panel title: 14--16 px. - Body: 13--15 px. -
Supporting text: 12--13 px, never below 11 px for essential
information. - Metric value: 22--28 px depending on available space.

These are design recommendations, not existing implementation facts.

## 4.4 Layout and spacing

-   Use a consistent spacing scale based on 4 px increments.
-   Use a 12-column desktop content grid where appropriate.
-   Align panel edges and headings.
-   Use restrained corner radii. Avoid pill-shaped everything.
-   Prefer clear borders and surface contrast over large shadows.
-   Avoid unnecessary cards nested inside cards.
-   Avoid large blank hero areas on operational screens.
-   Keep the topology editor and 3D scene as the dominant content on
    their screens.
-   Ensure important controls remain visible without scrolling at common
    laptop sizes.

## 4.5 Visual elements to avoid

Do not use: - Random decorative graphs unrelated to actual data. - Fake
live activity feeds. - Random percentages or fabricated latency
values. - Excessive neon glow around every node and button. -
Glassmorphism on every panel. - Huge gradient headings. - Generic
AI-dashboard card grids repeated on every page. - Decorative 3D objects
that do not represent network devices. - Animated backgrounds that
compete with the topology. - Unnecessary mascots, robot imagery or
AI-themed visual clichés. - Emoji as the primary device iconography. -
Colour-only status communication.

## 4.6 Motion principles

Motion should communicate state changes: - Packet movement shows
forwarding. - A link highlight shows the active hop. - A node state
transition shows failure or recovery. - A chart updates when simulation
events change metrics. - A waveform step-through highlights the current
bit.

Use short, purposeful transitions. Respect `prefers-reduced-motion`.
Provide pause, replay or step controls for educational animations where
feasible. Never use animation as the only way to communicate a result.

------------------------------------------------------------------------

# 5. Screen specifications and wireframes

The wireframes below are structural, not final pixel-perfect designs.
Build the layout and interactions first, then refine spacing and
styling. Preserve the hierarchy and required controls.

## 5.1 Screen 01: Dashboard / Overview

### Purpose

Give the user a clear starting point and direct access to the main
experiments.

### Desktop wireframe

``` text
┌────────────────┬──────────────────────────────────────────────────────────┐
│ DATACOMPREDIA  │ Overview                         Connection: Connected   │
│                ├──────────────────────────────────────────────────────────┤
│ Overview       │ Welcome back / Welcome to DataComPredia                  │
│ Network Lab    │ Short description                                        │
│ Packet Lab     │                                                          │
│ Observatory    │ [Create Lab] [Continue Experiment] [Explore Concepts]    │
│ Signal Studio  │                                                          │
│ Channel Lab    │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ Experiments    │ │Active    │ │Packets   │ │Delivery  │ │Average       │  │
│ Concepts      │ │labs      │ │sent      │ │ratio     │ │latency       │  │
│ Settings       │ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                │                                                          │
│                │ ┌─────────────────────────┐ ┌──────────────────────────┐ │
│                │ │ Recent experiments      │ │ Live activity            │ │
│                │ │ Name / date / status    │ │ Event / time / node       │ │
│                │ │ Open / continue         │ │ Only while lab is active │ │
│                │ └─────────────────────────┘ └──────────────────────────┘ │
│                │                                                          │
│                │ Quick access: Network Playground | Signal Studio | Lab  │
└────────────────┴──────────────────────────────────────────────────────────┘
```

### Required components

-   Welcome heading and short explanation.
-   `Create Lab` action.
-   `Continue Experiment` action when a saved experiment exists.
-   `Explore Concepts` action.
-   Summary metrics:
    -   Active labs.
    -   Packets transmitted.
    -   Delivery ratio.
    -   Average latency.
-   Recent experiments list.
-   Live activity feed driven by Socket.IO events while a lab is active.
-   Shortcuts to Network Playground, Signal Studio and Performance
    Observatory.

### Behaviour

-   If no experiment has run, do not invent live values. Show empty
    states or clearly labelled demo data.
-   If a lab is active, dashboard metrics must be derived from the
    simulation metrics service.
-   Clicking a recent experiment opens that experiment.
-   `Create Lab` opens the create-lab flow.
-   `Continue Experiment` opens the most recently active saved
    experiment, if available.
-   If no saved experiment exists, show a helpful empty state rather
    than a dead button.

### Empty state

Explain that no experiments have been created and provide one primary
`Create your first lab` action.

------------------------------------------------------------------------

## 5.2 Screen 02: Create Lab / Choose a starter topology

### Purpose

Start a new lab without forcing the user to construct every node
manually.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ Create a new lab                                                         │
│ Name [________________________]                                          │
│                                                                          │
│ Choose a starting point                                                  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ Star       │ │ Bus        │ │ Ring       │ │ Mesh       │             │
│ │ preview    │ │ preview    │ │ preview    │ │ preview    │             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
│                                                                          │
│ [Blank custom topology]                                                  │
│                                                                          │
│                                      [Cancel] [Create Lab]               │
└──────────────────────────────────────────────────────────────────────────┘
```

### Required behaviour

-   Allow a lab name.
-   Offer Star, Bus, Ring, Mesh and Custom/blank topology templates.
-   Show a simple preview for each topology.
-   Creating a lab should create a valid graph and navigate to Network
    Playground.
-   Validate the lab name.
-   Show loading and error feedback.
-   Do not create a lab silently if the request fails.

------------------------------------------------------------------------

## 5.3 Screen 03: Network Playground, 2D topology editor

### Purpose

Provide precise graph editing and configuration.

### Desktop wireframe

``` text
┌────────────────┬──────────────────────────────────────────────────────────┐
│ Sidebar        │ Network Playground        Lab: Example topology           │
│                ├──────────────────────────────────────────────────────────┤
│                │ [Topology: Custom v] [Save] [Load] [Examples v] [3D View]│
│                ├──────────────┬───────────────────────────────┬───────────┤
│                │ Device       │                               │ Properties│
│                │ palette      │       2D topology canvas       │           │
│                │              │                               │ Selection │
│                │ PC           │    [PC]────[Switch]────[PC]    │ Name      │
│                │ Router       │              │                │ Type      │
│                │ Switch       │           [Router]             │ IP        │
│                │ Server       │              │                │ Queue cap │
│                │ Hub optional │           [Server]             │           │
│                │              │                               │ Link props│
│                │              │                               │ Bandwidth │
│                │              │                               │ Distance  │
│                │              │                               │ Loss      │
│                ├──────────────┴───────────────────────────────┴───────────┤
│                │ [Select] [Connect] [Delete] [Fit] [Undo if implemented]  │
└────────────────┴──────────────────────────────────────────────────────────┘
```

### Required device types

-   End device / PC.
-   Router.
-   Switch.
-   Server.
-   Hub is optional.

### Required editing operations

-   Add node.
-   Select node or link.
-   Move node.
-   Rename node.
-   Delete node.
-   Connect two compatible nodes.
-   Remove link.
-   Configure link properties.
-   Configure router/switch queue capacity.
-   Save topology.
-   Reload topology.
-   Load example topology.
-   Trigger node failure.
-   Trigger link failure.
-   Show connectivity changes after failures.

### Link properties

-   Bandwidth in Mbps.
-   Distance in km.
-   Propagation speed in m/s.
-   Packet-loss probability/percentage.
-   Failed state.

### Node properties

-   Name/label.
-   Device type.
-   IP address.
-   Failed state.
-   Queue capacity where relevant.
-   Position in graph/scene.

Use documentation IP ranges in examples, such as `192.0.2.0/24` and
`198.51.100.0/24`. Do not expose real user IP addresses.

### Editing interaction recommendations

-   Use a clear `Select` mode and `Connect` mode.
-   In connect mode, selecting a source node and then a target node
    creates a link.
-   Show a visible temporary connection line while selecting the second
    endpoint.
-   Prevent duplicate links unless the graph model explicitly supports
    parallel links.
-   Prevent self-links unless deliberately supported.
-   Validate compatible device combinations according to the project's
    chosen rules. The original specification does not define a full
    compatibility matrix, so document the chosen rules.
-   Provide keyboard deletion with confirmation where destructive.
-   Provide a clear selected state.
-   Show unsaved changes.
-   Provide zoom, pan and fit-to-view.
-   Avoid making drag the only way to move or connect devices. Provide
    accessible alternatives where feasible.

### Failure state

A failed node or link must visibly change appearance and must be
excluded by routing. Do not merely change its colour while leaving
routing unaffected.

### Save behaviour

-   Save the canonical graph representation.
-   Confirm success.
-   On failure, preserve local edits and show an error.
-   If concurrent edits are not supported, do not imply collaboration.

------------------------------------------------------------------------

## 5.4 Screen 04: Network Playground, 3D visualization

### Purpose

Offer an immersive view of the same network graph, without creating a
second network model.

### Critical architectural rule

The 3D view and 2D editor must use the same topology graph state. They
must not maintain separate nodes, links, failure flags or routes.

### Wireframe

``` text
┌────────────────┬──────────────────────────────────────────────────────────┐
│ Sidebar        │ Network Playground                         [2D] [3D]     │
│                ├──────────────────────────────────────────────────────────┤
│                │ Lab: Example network    [Run] [Pause] [Reset camera]     │
│                │                                                          │
│                │                  3D NETWORK SCENE                        │
│                │                                                          │
│                │       PC 1 ───── Switch ───── Router                     │
│                │         \                    /                           │
│                │          \                  /                            │
│                │           └──── Server ────┘                             │
│                │                                                          │
│                │     Device labels, link states, packet markers           │
│                │                                                          │
│                ├──────────────────────────────────────────────────────────┤
│                │ Legend: Active | Failed | Congested | Packet             │
│                │ Selected device/link details or compact inspector        │
└────────────────┴──────────────────────────────────────────────────────────┘
```

### Required 3D technology

-   Three.js.
-   React Three Fiber.
-   Drei.

### Required scene elements

-   Distinct visual representations for PC, router, switch and server.
-   Links rendered as lines or tubes between devices.
-   Device labels.
-   Status indicators.
-   Animated packet markers travelling along the selected route.
-   Visual states for active, failed, congested and selected
    nodes/links.
-   Orbit controls.
-   Zoom.
-   Pan.
-   Reset-camera action.
-   Legend.
-   Accessible 2D fallback.

### 3D visual direction

The 3D environment should be technical and restrained, not a decorative
sci-fi scene.

Recommended approach: - Dark, low-contrast grid floor used only to
communicate spatial orientation. - Simple, recognisable device geometry
with consistent scale. - Distinct silhouettes for PC, router, switch and
server. - Thin links with sufficient contrast against the background. -
Emerald for active route or healthy link. - Muted neutral for inactive
links. - Amber for congestion. - Rose/red for failure or packet drop. -
Small, readable labels anchored to devices. - A subtle selected outline
or highlight. - No giant floating holograms, random particles, unrelated
buildings or decorative data streams.

The exact geometry and iconography are design choices. They must remain
consistent across the application.

### Scene interaction

-   Orbit: rotate around the topology.
-   Pan: move the camera target.
-   Zoom: move closer/farther.
-   Reset camera: restore a useful overview.
-   Select device: show the same node properties as the 2D editor.
-   Select link: show the same link properties as the 2D editor.
-   Hover may provide a concise tooltip, but essential information must
    also be available on click/focus.
-   Packet marker position must be derived from authoritative packet
    lifecycle events and the route.
-   If a node or link fails, the scene must update from the shared graph
    state.
-   Switching between 2D and 3D must preserve current selection and
    topology state where possible.

### Performance requirements

-   Use lightweight geometry.
-   Use instancing where appropriate.
-   Avoid excessive per-frame React state updates.
-   Use `useFrame` for animation.
-   Avoid rebuilding the whole scene on every metrics update.
-   Keep packet animation independent from unrelated dashboard
    rendering.
-   Provide a quality fallback on low-performance devices.
-   Do not let a 3D rendering error prevent access to the 2D editor.

### Accessibility and fallback

-   Provide a 2D topology view.
-   Provide a text/list representation of nodes and links.
-   Provide keyboard-accessible device selection.
-   Do not encode failure or congestion by colour alone.
-   Respect reduced-motion settings.

### Important limitation

The original specification does not prescribe exact 3D models, camera
coordinates, physics, lighting or a specific node layout algorithm.
Choose a simple consistent implementation and record those choices. Do
not claim that these design recommendations came from the original
specification.

------------------------------------------------------------------------

## 5.5 Screen 05: Packet Playground, transmit panel

### Purpose

Let the user send a message between two nodes and watch its simulated
journey.

### Wireframe

``` text
┌────────────────┬──────────────────────────────────────────────────────────┐
│ Sidebar        │ Packet Playground                                        │
│                ├──────────────────────┬───────────────────────────────────┤
│                │ Transmit message     │ Network route view                 │
│                │                      │                                   │
│                │ Source [PC 1      v] │ PC 1 ─ Switch ─ Router ─ Server   │
│                │ Destination [Srv v] │                                   │
│                │ Mode [TCP_SIM     v] │ Packet marker / active hop         │
│                │                      │                                   │
│                │ Message              │                                   │
│                │ [_________________]  │                                   │
│                │                      │                                   │
│                │ [Transmit]           │ Status: Ready                      │
│                ├──────────────────────┴───────────────────────────────────┤
│                │ Simulation status | elapsed time | packet count          │
└────────────────┴──────────────────────────────────────────────────────────┘
```

### Required inputs

-   Source node.
-   Destination node.
-   Message payload.
-   Protocol mode: `TCP_SIM` or `UDP_SIM`.
-   Transmit action.

### Required behaviour

1.  Validate source, destination and payload.
2.  Verify both selected nodes exist and are eligible.
3.  Find a route through the current graph.
4.  Calculate per-hop transmission and propagation delays.
5.  Apply queueing if enabled.
6.  Apply configured packet loss.
7.  Emit packet lifecycle events.
8.  Update packet state and metrics.
9.  Show delivered, dropped, timed-out or retransmitted state as
    appropriate.

### Validation

-   Source and destination must be different unless the product
    explicitly supports loopback.
-   Both must exist in the current lab.
-   Payload must be non-empty unless empty payloads are deliberately
    supported.
-   Enforce a documented payload length limit.
-   Do not accept client-supplied route, status or metrics as
    authoritative.

### TCP-like simulation

Show: - SYN. - SYN-ACK. - ACK. - Data segments. - Acknowledgements. -
Sequence numbers. - Timeout. - Retransmission when simulated loss
occurs.

Label this clearly as **TCP behaviour simulation**, not a real TCP
stack.

### UDP-like simulation

Show: - Connectionless datagram flow. - No handshake. - No automatic
retransmission. - A visible drop if loss occurs. - Explanation that UDP
itself does not guarantee delivery.

### UI states

-   Ready.
-   Validating.
-   Running.
-   Paused.
-   Delivered.
-   Dropped.
-   Timed out.
-   Error.
-   Disconnected from real-time service.

Do not show `Delivered` until the simulation engine emits the
authoritative delivery result.

------------------------------------------------------------------------

## 5.6 Screen 06: Packet details and event timeline

### Purpose

Allow a student or evaluator to inspect exactly what happened to a
packet.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ Packet Playground / Packet #P-1024                                       │
├───────────────────────────────┬──────────────────────────────────────────┤
│ Packet inspector              │ Event timeline                           │
│                               │                                          │
│ Packet ID                     │ 00.000  packet.created                    │
│ Source / destination           │ 00.010  route.computed                    │
│ Source / destination IP        │ 00.020  packet.queued                     │
│ Protocol                      │ 00.035  packet.forwarded                  │
│ Payload size                  │ 00.050  packet.acknowledged                │
│ Sequence number               │ 00.060  packet.delivered                   │
│ Route / hop count              │                                          │
│ Current status                │                                          │
│                               │                                          │
│ Per-hop delay breakdown       │                                          │
│ Transmission delay            │                                          │
│ Propagation delay             │                                          │
│ Queueing delay                │                                          │
│ Total simulated delay         │                                          │
│ Drop/retry reason             │                                          │
└───────────────────────────────┴──────────────────────────────────────────┘
```

### Required packet fields

-   `packetId`
-   `labId`
-   `sourceNodeId`
-   `destinationNodeId`
-   `sourceIp`
-   `destinationIp`
-   `protocol` (`TCP_SIM` or `UDP_SIM`)
-   `sequenceNumber`
-   `payload`
-   `payloadSizeBytes`
-   `createdAt`
-   `route`
-   `currentHop`
-   `status`

### Packet inspector fields

-   Source/destination device and IP.
-   Protocol mode.
-   Payload size.
-   Sequence number.
-   Route and hop count.
-   Current status.
-   Per-hop timestamps.
-   Transmission, propagation and queueing delay.
-   Total observed simulated delay.
-   Drop/retry reason, if any.

### Event timeline

Support chronological events such as: - `packet.created` -
`route.computed` - `packet.queued` - `packet.forwarded` -
`packet.dropped` - `packet.acknowledged` - `packet.delivered` -
`packet.retransmit`

Use exact event names consistently across the server, client, tests and
documentation.

------------------------------------------------------------------------

## 5.7 Screen 07: Performance Observatory

### Purpose

Show simulator-derived performance metrics during transmission.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ Performance Observatory                Lab: Example       [Time window]  │
├────────────┬────────────┬────────────┬────────────┬──────────────────────┤
│ Throughput │ Latency    │ Jitter     │ Packet loss│ Delivery ratio       │
├─────────────────────────────────────┬────────────────────────────────────┤
│ Throughput over time                │ Latency over time                  │
│ [time-series chart]                 │ [time-series chart]                │
├─────────────────────────────────────┼────────────────────────────────────┤
│ Packet counts                       │ Queue lengths / link utilization   │
│ Sent / Delivered / Dropped           │ [chart or table]                   │
├─────────────────────────────────────┴────────────────────────────────────┤
│ Retransmissions | Per-link utilization | Per-node queue lengths          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Required metrics

-   Throughput (bits/s or Mbps).
-   Packets sent, delivered and dropped.
-   Packet delivery ratio.
-   Packet loss percentage.
-   Average and current latency.
-   Transmission delay.
-   Propagation delay.
-   Queueing delay.
-   Jitter.
-   Retransmission count.
-   Per-link utilization.
-   Per-node queue length.

### Metric definitions

-   Transmission delay: `packetSizeBits / linkRateBitsPerSecond`.
-   Propagation delay:
    `distanceMeters / propagationSpeedMetersPerSecond`.
-   Nodal delay: `processing + queueing + transmission + propagation`.
-   Jitter: variation in packet delay. For this project, document the
    exact estimator used, for example mean absolute difference between
    consecutive packet delays.
-   Throughput: successfully delivered payload bits divided by the
    selected measurement interval.
-   Packet delivery ratio: `deliveredPackets / sentPackets × 100`.

### Display rules

-   Label all values as simulated.
-   Show units.
-   Explain each metric with a tooltip or help text.
-   Use a rolling time window.
-   Charts must update from actual simulation events.
-   Do not invent measurements for a lab that has not run.
-   Define how zero packets, zero-duration windows and missing samples
    are handled.
-   Avoid misleading smoothing or interpolation that suggests
    measurements not collected.

### Chart recommendations

Use line charts for time series, bars for discrete counts and tables for
per-node/per-link detail. Keep axes, units, legends and time ranges
visible. Use Recharts as suggested in the original specification unless
an existing chart library is already used.

------------------------------------------------------------------------

## 5.8 Screen 08: Signal Studio

### Purpose

Convert a binary string into line-coded waveforms and explain the
encoding.

### Wireframe

``` text
┌────────────────┬─────────────────────────────────────────────────────────┐
│ Sidebar        │ Signal Studio                                           │
│                ├─────────────────────────┬───────────────────────────────┤
│                │ Input                   │ Waveform                       │
│                │ Binary [10100111____]   │                                │
│                │                         │  +1 ┌─┐   ┌────┐               │
│                │ Scheme [Manchester v]   │  0  ┘ └─┐ ┌┘    └─             │
│                │ [Generate waveform]     │ -1      └─┘                    │
│                │                         │  Bit boundaries / time axis    │
│                │ [Step through bits]     │                                │
│                ├─────────────────────────┴───────────────────────────────┤
│                │ Compare schemes: NRZ-L | NRZ-I | Manchester | AMI       │
│                │ Encoded levels | transitions | substitutions            │
└────────────────┴─────────────────────────────────────────────────────────┘
```

### Required encoders

-   Unipolar NRZ.
-   Polar NRZ-L.
-   Polar NRZ-I.
-   Polar RZ.
-   Manchester.
-   Differential Manchester.
-   Bipolar AMI.
-   Pseudoternary.
-   B8ZS.
-   HDB3.

### Requirements

-   Accept only binary characters `0` and `1`.
-   Show bit boundaries.
-   Show voltage levels.
-   Show transition markers.
-   Provide a legend.
-   Provide a short rule description for each encoding.
-   Show encoded level sequence.
-   Show substitutions for B8ZS and HDB3.
-   Compare two or more schemes side by side.
-   Provide step-through mode highlighting the current bit.
-   Show exact substituted pattern and polarity/violation rule for
    B8ZS/HDB3.

### Convention requirements

Manchester and Differential Manchester conventions can vary. The UI must
state the selected convention. Encoder, decoder, examples and
explanation must use the same convention. Do not silently switch
convention between screens.

### Interaction details

-   Validate input before rendering.
-   Preserve input when switching schemes.
-   Allow clearing/resetting input.
-   Step forward/back through bits if implemented.
-   Highlight the current bit and corresponding waveform interval.
-   Provide a textual sequence for users who cannot interpret the chart.
-   Avoid using colour alone to distinguish voltage levels.

------------------------------------------------------------------------

## 5.9 Screen 09: Channel Lab

### Purpose

Provide interactive calculators and visual experiments for
communication-channel concepts.

### Wireframe

``` text
┌────────────────┬─────────────────────────────────────────────────────────┐
│ Sidebar        │ Channel Lab                                              │
│                ├─────────────────────────────────────────────────────────┤
│                │ [Nyquist] [Shannon] [PCM] [Delta Modulation]             │
│                ├────────────────────────┬────────────────────────────────┤
│                │ Inputs                 │ Result                          │
│                │ Bandwidth              │ Formula                         │
│                │ Signal levels          │ Substituted values               │
│                │ SNR / SNR dB           │ Calculated capacity               │
│                │ Sampling frequency     │ Explanation and assumptions     │
│                │ Quantization bits      │ Visualization                    │
│                │ [Calculate / Run]      │                                 │
│                └────────────────────────┴────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────────┘
```

### Required experiments and formulas

-   Nyquist capacity: `C = 2B log2(M)` for an ideal noiseless channel.
-   Shannon capacity: `C = B log2(1 + SNR)` for a noisy channel, with
    linear SNR.
-   Convert SNR dB to linear: `SNR = 10^(SNRdB/10)`.
-   PCM sampling: `fs >= 2 × fmax`.
-   PCM quantization levels: `L = 2^n`.
-   Delta modulation: illustrate staircase approximation and
    slope-overload/quantization noise.

### Inputs

Allow configuration of: - Bandwidth. - Number of signal levels. - SNR. -
SNR in dB where relevant. - Sampling frequency. - Maximum signal
frequency. - Quantization bits. - Delta-modulation step size where
applicable.

The original specification does not define the full Delta Modulation
parameter model. Confirm the academic convention and document it before
implementation.

### Result requirements

-   Show formula.
-   Show substituted values.
-   Show result with units.
-   Explain assumptions.
-   Validate domains and units.
-   For Shannon, convert dB to linear SNR before using the formula.
-   Do not mix Hz, kHz, bits/s and Mbps without explicit conversion.

------------------------------------------------------------------------

## 5.10 Screen 10: My Experiments

### Purpose

Let users find, reopen and compare saved experiments.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ My Experiments                                  [Create new experiment]  │
├──────────────────────────────────────────────────────────────────────────┤
│ Search [________________]   Filter [All v]   Sort [Recent v]             │
├──────────────────────────────────────────────────────────────────────────┤
│ Experiment name      Type          Updated       Status       [Open]      │
│ TCP vs UDP           Packet lab    Date/time     Saved        [Open]      │
│ Mesh failure         Topology      Date/time     Saved        [Open]      │
│ Manchester encoding  Signal        Date/time     Saved        [Open]      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Requirements

-   List saved experiment history.
-   Open experiment details.
-   Show experiment name and date.
-   Show status and experiment type where available.
-   Provide empty, loading and error states.
-   Do not imply cloud sync or multi-device access unless persistence
    and identity are implemented.

The original specification permits persistence per user or per local
demo session.

------------------------------------------------------------------------

## 5.11 Screen 11: Experiment Report

### Purpose

Present the experiment configuration, results and observations in a
readable form.

### Required report content

-   Experiment name and date.
-   Topology diagram/snapshot.
-   Configuration.
-   Packet counts and protocol mode.
-   Metric charts and summary statistics.
-   Encoding/channel experiments performed.
-   Key observations.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ Experiment Report                         [Export PDF] [Export CSV]       │
├───────────────────────────────────┬──────────────────────────────────────┤
│ Experiment details                │ Results summary                      │
│ Name                               │ Metric / value                       │
│ Date                               │ Delivery ratio                       │
│ Configuration                      │ Average latency                      │
│ Protocol                           │ Throughput                           │
├───────────────────────────────────┴──────────────────────────────────────┤
│ Topology snapshot                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ Charts and observations                                                  │
│                                                                          │
│ Key observations                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Export

PDF or CSV export is desirable if feasible, as specified in the original
brief. If only one format is implemented, label it accurately. Do not
show an export button for an unsupported format.

------------------------------------------------------------------------

## 5.12 Screen 12: Concepts / Help

### Purpose

Explain the concepts used by the simulator and make the product
approachable to first-time students.

### Suggested structure

-   Networking basics.
-   Topologies.
-   Routing.
-   Packet switching.
-   TCP and UDP simulation.
-   Delay and throughput.
-   Line encoding.
-   Scrambling.
-   Nyquist and Shannon.
-   PCM and Delta Modulation.
-   How to interpret experiment reports.

### Requirements

-   Use concise explanations tied to the actual controls.
-   Link explanations to relevant screens or experiments.
-   Do not add unverified syllabus coverage claims.
-   Distinguish general textbook concepts from the specific simulation
    assumptions.

------------------------------------------------------------------------

# 6. Core data model

Represent a topology as a graph with stable node IDs and link IDs.

## 6.1 Example topology

``` js
const topology = {
  nodes: [
    {
      id: "pc-1",
      type: "pc",
      label: "Sender",
      ipAddress: "192.0.2.10",
      position: { x: 0, y: 0, z: 0 },
      failed: false,
      queueCapacity: 20
    },
    {
      id: "router-1",
      type: "router",
      label: "Router 1",
      ipAddress: "192.0.2.1",
      position: { x: 4, y: 0, z: 0 },
      failed: false,
      queueCapacity: 50
    }
  ],
  links: [
    {
      id: "link-1",
      source: "pc-1",
      target: "router-1",
      bandwidthMbps: 10,
      distanceKm: 2,
      propagationSpeedMps: 200000000,
      lossRate: 0.01,
      failed: false
    }
  ]
};
```

This is an example data shape from the supplied build specification.
Extend it only when necessary and document schema changes.

## 6.2 Graph rules

-   Stable unique node IDs.
-   Stable unique link IDs.
-   A route is an ordered list of node IDs and link IDs.
-   Ignore failed nodes and links during routing.
-   Return a clear no-route error when destination is unreachable.
-   Ensure links reference existing nodes.
-   Ensure node and link properties are validated.
-   Define whether links are directed or undirected. The supplied
    specification does not explicitly settle this. For a basic wired
    lab, undirected links are a reasonable recommendation, but record
    the decision.

## 6.3 Example packet shape

``` js
const packet = {
  packetId: "packet-001",
  labId: "lab-001",
  sourceNodeId: "pc-1",
  destinationNodeId: "server-1",
  sourceIp: "192.0.2.10",
  destinationIp: "198.51.100.10",
  protocol: "TCP_SIM",
  sequenceNumber: 1,
  payload: "Hello network",
  payloadSizeBytes: 13,
  createdAt: "ISO-8601 timestamp",
  route: [],
  currentHop: 0,
  status: "created"
};
```

The example timestamp is a placeholder format, not a measured value.
Define a consistent status enum in shared schemas.

------------------------------------------------------------------------

# 7. Simulation engine requirements

## 7.1 Separation of concerns

The simulation engine must: - Be deterministic when supplied
deterministic inputs. - Be testable without React, Express or
Socket.IO. - Receive validated graph and transmission inputs. - Return
state transitions and events. - Not directly manipulate the 3D scene. -
Not rely on browser animation timers as the source of truth.

The backend owns authoritative packet state and timestamps. The frontend
animates the received events.

## 7.2 Routing

-   BFS for shortest hop count on unweighted links.
-   Dijkstra for lowest configured link cost.
-   Ignore failed nodes and links.
-   Return clear no-route errors.
-   Document the cost function used by Dijkstra. An example is
    propagation plus transmission cost, but the exact cost function must
    be explicitly selected.

## 7.3 Delay calculations

For packet length `L` bits, link rate `R` bits/s, distance `d` metres
and propagation speed `s` metres/s:

``` js
const transmissionDelaySeconds = L / R;
const propagationDelaySeconds = d / s;

const nodalDelaySeconds =
  processingDelaySeconds +
  queueingDelaySeconds +
  transmissionDelaySeconds +
  propagationDelaySeconds;
```

Convert Mbps to bits/s and km to metres before calculations.

## 7.4 Simulation clock

Use a simulation clock or scheduled event queue rather than arbitrary UI
timers as the source of truth.

-   Backend determines packet state and timestamps.
-   Frontend animates events it receives.
-   A configurable presentation speed multiplier may change visual
    playback speed.
-   Presentation speed must not alter the underlying formulas or
    reported simulation measurements.
-   Define pause, resume and reset semantics.
-   Handle client disconnect and reconnect without corrupting simulation
    state.

## 7.5 Queueing

-   Enqueue packets at forwarding devices when queueing is enabled.
-   Respect configured queue capacity.
-   Define queue overflow behaviour and record it. The original brief
    does not prescribe the exact drop policy.
-   Track per-node queue length.
-   Calculate queueing delay using a documented model. Do not claim a
    detailed real-router scheduling model unless implemented.

## 7.6 Packet loss

-   Apply configured loss probability at the relevant link.
-   Inject the random-number function so tests can be deterministic.
-   Record exact link and reason for every simulated drop.
-   Use a documented random sampling strategy.
-   Avoid flaky tests based on uncontrolled randomness.

## 7.7 TCP-like simulation

-   Demonstrate SYN, SYN-ACK and ACK.
-   Demonstrate data segments and acknowledgements.
-   Track sequence numbers.
-   Demonstrate timeout and retransmission when simulated loss occurs.
-   Clearly label the feature as a TCP behaviour simulation.

The original brief does not define a complete TCP congestion-control or
windowing model. Do not imply that these are implemented unless they are
added and tested.

## 7.8 UDP-like simulation

-   No handshake.
-   No automatic retransmission.
-   Show datagram drop when loss occurs.
-   Explain that UDP does not guarantee delivery.

------------------------------------------------------------------------

# 8. Backend and frontend architecture

## 8.1 Suggested technology

### Frontend

-   React + JavaScript + Vite.
-   React Router.
-   Tailwind CSS.
-   React Three Fiber + Drei + Three.js.
-   Socket.IO Client.
-   Zustand or Redux Toolkit for shared lab state.
-   Recharts for metrics.
-   React Flow optional for 2D topology editing.
-   Lucide React icons.

### Backend

-   Node.js + Express.
-   Socket.IO server.
-   JavaScript ES modules.
-   Zod for request/event validation.
-   Prisma + PostgreSQL, or MongoDB only if PostgreSQL is unavailable in
    the actual project environment.
-   Dedicated simulation service layer.

Check the existing repository before selecting or replacing libraries.

## 8.2 Architecture overview

``` text
React Browser
  ├── Dashboard
  ├── Topology Editor (2D)
  ├── Network Scene (3D)
  ├── Packet Inspector
  ├── Event Timeline
  ├── Performance Observatory
  ├── Signal Studio
  ├── Channel Lab
  └── Socket.IO Client
          |
          | HTTP REST + Socket.IO
          v
Express + Socket.IO Server
  ├── REST API
  ├── Authentication (optional)
  ├── Lab / Topology Service
  ├── Packet Simulation Engine
  ├── Routing Engine
  ├── Metrics Engine
  ├── Signal Encoding Engine
  ├── Experiment / Report Service
  └── Persistence Layer
          |
          v
      PostgreSQL
```

## 8.3 Responsibility boundaries

-   REST: create/read/update labs, save topology, load examples, fetch
    experiment history.
-   Socket.IO: join/leave lab rooms, transmit packet commands, stream
    packet events, stream metrics, broadcast topology changes.
-   Simulation engine: deterministic business logic, independent of
    React and Socket.IO.
-   Socket gateway: validates client commands, invokes engine and
    broadcasts returned events.
-   Database: durable labs and experiment summaries.
-   Transient animation events do not all need to be persisted.

For a single-machine semester demo, in-memory simulation state is
acceptable initially. Keep a repository interface so persistence can be
added without rewriting the engine.

## 8.4 Suggested folder structure

Use the existing repository structure if it is already coherent.
Otherwise, a monorepo may follow:

``` text
datacompredia/
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── SOCKET_EVENTS.md
│   ├── SIMULATION_FORMULAS.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── ASSUMPTIONS_AND_DECISIONS.md
│   └── DEMO_SCRIPT.md
├── client/
│   └── src/
│       ├── app/
│       ├── assets/
│       ├── components/
│       ├── features/
│       │   ├── dashboard/
│       │   ├── topology/
│       │   ├── packets/
│       │   ├── observatory/
│       │   ├── signal-studio/
│       │   ├── channel-lab/
│       │   ├── experiments/
│       │   └── concepts/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       ├── styles/
│       └── utils/
├── server/
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── sockets/
│       ├── modules/
│       │   ├── topology/
│       │   ├── routing/
│       │   ├── packet-simulation/
│       │   ├── metrics/
│       │   ├── signal-encoding/
│       │   ├── channel/
│       │   └── experiments/
│       ├── db/
│       ├── utils/
│       └── tests/
└── shared/
    ├── eventNames.js
    ├── schemas/
    └── constants/
```

------------------------------------------------------------------------

# 9. REST API proposal

Use `/api/v1` as the base path.

  ------------------------------------------------------------------------------
  Method                  Endpoint                       Purpose
  ----------------------- ------------------------------ -----------------------
  GET                     `/health`                      Server health

  POST                    `/labs`                        Create a lab

  GET                     `/labs`                        List labs

  GET                     `/labs/:labId`                 Get lab and topology

  PATCH                   `/labs/:labId`                 Update lab metadata

  PUT                     `/labs/:labId/topology`        Save topology graph

  GET                     `/topologies/templates`        Get starter templates

  POST                    `/labs/:labId/experiments`     Save experiment summary

  GET                     `/labs/:labId/experiments`     List experiment history

  GET                     `/experiments/:experimentId`   Get experiment details

  POST                    `/signal/encode`               Encode bit string,
                                                         optional REST
                                                         implementation

  POST                    `/channel/capacity`            Calculate channel
                                                         capacity
  ------------------------------------------------------------------------------

Validate all inputs on the server. Return consistent JSON errors with an
error code and readable message.

The API table is a proposal from the supplied specification. Inspect the
repository and adapt endpoint names if equivalent working endpoints
already exist.

------------------------------------------------------------------------

# 10. Socket.IO event contract

All lab events should be scoped to a room named `lab:<labId>`. A client
must join a lab room before receiving its live events. Validate that the
lab exists and that the client is allowed to join it.

## 10.1 Client to server

  -----------------------------------------------------------------------------------------------------------------
  Event                   Example payload                                                   Purpose
  ----------------------- ----------------------------------------------------------------- -----------------------
  `lab:join`              `{ labId }`                                                       Join lab room

  `lab:leave`             `{ labId }`                                                       Leave lab room

  `topology:update`       `{ labId, topology }`                                             Update graph

  `node:failure:set`      `{ labId, nodeId, failed }`                                       Toggle node failure

  `link:failure:set`      `{ labId, linkId, failed }`                                       Toggle link failure

  `packet:transmit`       `{ labId, sourceNodeId, destinationNodeId, payload, protocol }`   Start transmission

  `simulation:pause`      `{ labId }`                                                       Pause simulation

  `simulation:resume`     `{ labId }`                                                       Resume simulation

  `simulation:reset`      `{ labId }`                                                       Reset transient state
  -----------------------------------------------------------------------------------------------------------------

## 10.2 Server to client

  --------------------------------------------------------------------------------------------------------
  Event                   Example payload                                          Purpose
  ----------------------- -------------------------------------------------------- -----------------------
  `lab:joined`            `{ labId, state }`                                       Initial room state

  `topology:updated`      `{ topology, version }`                                  Broadcast graph change

  `packet:created`        `{ packet }`                                             Packet created

  `packet:route`          `{ packetId, route }`                                    Route selected

  `packet:queued`         `{ packetId, nodeId, queueLength }`                      Packet enters queue

  `packet:hop`            `{ packetId, fromNodeId, toNodeId, hopIndex, timing }`   Packet advances

  `packet:dropped`        `{ packetId, reason, nodeId }`                           Packet lost

  `packet:retransmit`     `{ packetId, attempt, reason }`                          TCP-like retry

  `packet:ack`            `{ packetId, sequenceNumber }`                           Acknowledgement

  `packet:delivered`      `{ packetId, totalDelayMs, hops }`                       Delivery complete

  `metrics:update`        `{ timestamp, metrics }`                                 Live metric snapshot

  `simulation:error`      `{ code, message }`                                      Recoverable simulation
                                                                                   error
  --------------------------------------------------------------------------------------------------------

Use acknowledgements/timeouts for commands that need confirmation. Add
event version numbers or timestamps to avoid applying stale topology
updates. Do not broadcast arbitrary unvalidated client objects.

------------------------------------------------------------------------

# 11. Signal encoding implementation requirements

Create isolated, testable encoder functions. Each encoder should accept
validated input and return a structured result containing: - Input
bits. - Encoded levels or symbols. - Transition positions. - Any
substitutions. - Convention/configuration used. - Explanation metadata
needed by the UI.

Do not implement the waveform only as a hard-coded SVG. The rendered
waveform must be derived from encoder output.

Test each scheme against documented examples and edge cases. For B8ZS
and HDB3, test long zero runs, polarity state and substitution rules.

The original specification names the required schemes but does not
include full algorithm pseudocode or all convention choices. Verify the
algorithms against the course's prescribed textbook/lab manual or
another authoritative reference before claiming correctness. Record the
source/convention used in the project documentation.

------------------------------------------------------------------------

# 12. Experiment persistence and reporting

Persist durable lab and experiment data. High-frequency transient
animation events do not all need to be stored.

A saved experiment should contain enough information to reproduce or
explain: - Experiment name and date. - Topology snapshot or reference. -
Link and node configuration. - Protocol mode. - Source and
destination. - Packet counts. - Metrics summary. - Signal/channel
experiments performed. - Key observations.

The original specification permits persistence per user or per local
demo session. Authentication is optional. Do not imply account-based
cross-device persistence if only local demo-session storage is
implemented.

------------------------------------------------------------------------

# 13. Quality, validation, security and resilience

## 13.1 Functional quality

-   No dead buttons.
-   Every primary action has loading, success and error feedback.
-   A user can create a topology, save it, reload it and transmit a
    packet.
-   A packet visibly follows a valid route in the 3D view.
-   A failed link changes routing or causes a clear delivery failure.
-   TCP-like mode demonstrates handshake/ACK/retry behaviour.
-   UDP-like mode demonstrates no handshake and no automatic retry.
-   Metrics update from actual simulation events.
-   Encoding output follows documented conventions.
-   Channel formulas use correct units and linear SNR where required.

## 13.2 Security and robustness

-   Validate every REST body, query and Socket.IO payload.
-   Limit payload length and event frequency.
-   Do not trust client-supplied packet status, metrics or route
    results.
-   Add basic rate limiting to REST endpoints.
-   Keep secrets in environment variables.
-   Configure CORS explicitly.
-   Handle disconnects and stale lab sessions.
-   Avoid exposing real network traffic or private IP details in public
    demos.

## 13.3 Accessibility

-   Keyboard focus must be visible.
-   Inputs must have labels.
-   Buttons must have accessible names.
-   Statuses must not rely on colour alone.
-   Charts must have textual summaries or accessible data alternatives.
-   The topology must have a usable 2D and text/list representation.
-   Respect reduced-motion preferences.
-   Ensure contrast is adequate for essential content.

## 13.4 Responsive behaviour

Desktop is the primary editing environment because topology editing and
3D interaction need space. Still: - Sidebar collapses on
tablet/mobile. - Panels stack on narrow screens. - Forms remain usable
on mobile. - Charts can scroll or reflow without hiding labels. - 3D
view has a usable mobile camera interaction and a 2D fallback. - Avoid
horizontal overflow in ordinary forms and reports.

------------------------------------------------------------------------

# 14. Testing plan

## 14.1 Unit tests

Write unit tests for: - BFS and Dijkstra route selection. - Failed
node/link exclusion. - Transmission delay formula. - Propagation delay
formula. - Queue delay calculations. - Packet-loss behaviour with
deterministic random values. - TCP-like retry behaviour. - UDP-like drop
behaviour. - NRZ-L. - NRZ-I. - RZ. - Manchester. - Differential
Manchester. - AMI. - Pseudoternary. - B8ZS. - HDB3. - Nyquist
capacity. - Shannon capacity. - SNR dB-to-linear conversion. - PCM
sampling and quantization calculations. - Delta Modulation logic
according to the selected documented model.

## 14.2 Integration tests

Test: - Creating a lab and saving topology. - Loading a topology
template. - Joining a Socket.IO room. - Transmitting a packet and
receiving lifecycle events. - Invalid payload handling. - Unreachable
destination handling. - Node/link failure affecting routing. -
Pause/resume/reset behaviour. - Saving and retrieving an experiment.

## 14.3 UI tests

Test critical journeys: 1. Create a lab from a template. 2. Add a node
and connect it. 3. Edit link bandwidth and save. 4. Switch from 2D to 3D
and verify graph consistency. 5. Select source/destination and transmit.
6. Inspect packet details and timeline. 7. Trigger a failure and observe
route/delivery change. 8. Run a line-encoding example. 9. Calculate a
channel-capacity result. 10. Open and export an experiment report where
export is implemented.

## 14.4 Visual QA

-   Check all screens at common desktop and mobile viewport sizes.
-   Check empty, loading, error, success and disconnected states.
-   Check keyboard focus and labels.
-   Check text contrast.
-   Check 3D rendering performance.
-   Check reduced-motion behaviour.
-   Check that no fake data appears as live data.

Do not claim tests passed unless they were run and the results were
observed.

------------------------------------------------------------------------

# 15. Required demonstration scenarios

Include these preconfigured scenarios so an evaluator can see the
application working quickly:

1.  **Basic delivery:** PC → Switch → Router → Server. Send a short
    message and inspect every hop.
2.  **Topology failure:** break one link in a mesh network and show an
    alternate route.
3.  **No route:** break the only path in a star-like topology and show
    packet failure.
4.  **TCP vs UDP:** configure packet loss and compare handshake, ACK and
    retry behaviour with UDP datagram loss.
5.  **Congestion:** reduce bandwidth and queue capacity, send multiple
    packets and observe queueing delay and throughput.
6.  **Encoding:** encode `10100111` using NRZ-L, NRZ-I, Manchester and
    AMI.
7.  **Scrambling:** encode long zero sequences and inspect B8ZS/HDB3
    substitutions.
8.  **Channel capacity:** change bandwidth and SNR and compare
    Nyquist/Shannon results.

Each scenario must have: - A clear name. - A short learning objective. -
A known initial topology/configuration. - A reset action. - Expected
observations documented. - No fabricated result values.

------------------------------------------------------------------------

# 16. Development phases and exit criteria

## Phase 0: Repository audit and design foundation

-   Inspect repository.
-   Create implementation checklist.
-   Record assumptions and decisions.
-   Confirm app runs.
-   Define design tokens and global shell.
-   Define shared schemas and event names.

**Exit:** Existing code is understood, baseline is recorded, application
still runs, design system and shared contracts are in place.

## Phase 1: Foundation

-   Monorepo or existing project setup.
-   React client and Express server.
-   Emerald design system.
-   Responsive shell.
-   Health endpoint.
-   Socket.IO connection status.
-   Dashboard and navigation.

**Exit:** Frontend and backend run locally; client connects to
Socket.IO.

## Phase 2: Network graph and topology editor

-   Graph data model.
-   Device palette and node placement.
-   Links and link configuration.
-   Star, Ring, Mesh and Bus templates.
-   Save/load topology API.
-   Failure controls.

**Exit:** User can create, edit, save and reload a topology.

## Phase 3: Packet simulation

-   BFS and Dijkstra.
-   Packet model and forwarding engine.
-   Delay formulas, queues and packet loss.
-   Packet transmit Socket.IO command and lifecycle events.
-   Packet inspector and event timeline.

**Exit:** A packet travels across a multi-hop topology and metrics are
calculated.

## Phase 4: Three.js visualization

-   Render devices and links in 3D.
-   Animate packet markers from server events.
-   Show failed/congested state.
-   Add camera controls and 2D fallback.
-   Ensure shared graph state.

**Exit:** 3D view accurately reflects the same graph and packet state as
the editor.

## Phase 5: TCP/UDP behaviour and Observatory

-   TCP-like handshake, sequence, ACK and retry.
-   UDP-like datagram behaviour.
-   Rolling metrics and charts.
-   Node/link failure controls.

**Exit:** Evaluator can compare simulated TCP and UDP behaviour and
observe performance changes.

## Phase 6: Signal Studio and Channel Lab

-   Implement line encoders and waveform rendering.
-   Add B8ZS and HDB3.
-   Add Nyquist/Shannon, PCM and Delta Modulation experiments.

**Exit:** Input bits generate correct, documented waveforms and channel
calculations.

## Phase 7: Reports and polish

-   Save experiments.
-   Export a report or CSV.
-   Add guided demo scenarios.
-   Add tests, error handling, documentation and deployment
    configuration.

**Exit:** Stable end-to-end project demonstration.

------------------------------------------------------------------------

# 17. First milestone: definition of done

The first milestone is complete only when:

-   Emerald DataComPredia interface runs.
-   User can create or load a sample topology.
-   User can select source and destination devices.
-   User can send a message in simulated TCP or UDP mode.
-   Backend computes a route and delay.
-   Socket.IO streams packet events to the browser.
-   3D scene animates the packet across the route.
-   Packet inspector reflects the simulation.
-   Live metrics reflect actual simulation events.
-   Project includes setup instructions and a short demo script.

Prioritize a small, correct, impressive end-to-end system over many
unfinished modules.

------------------------------------------------------------------------

# 18. Coding-agent delivery protocol

At the end of each phase, report:

1.  What was implemented.
2.  Files created or modified.
3.  Existing functionality preserved.
4.  Tests added.
5.  Exact tests run and their observed results.
6.  Known limitations.
7.  Open decisions.
8.  How to run the application.
9.  Which checklist items are now `verified`.

Do not report a requirement as complete merely because a component or
screen exists. It is complete only when the interaction works and its
acceptance criteria are verified.

Before final delivery: - Run the full available test suite. - Run
lint/build checks if configured. - Verify the first milestone end to
end. - Verify all primary buttons. - Verify 2D/3D state consistency. -
Verify simulator formulas and units. - Verify no live metric is
fabricated. - Update README and demo script. - Provide a concise list of
known limitations.

------------------------------------------------------------------------

# 19. Open decisions that must not be silently guessed

The supplied source specification does not fully define the following.
Inspect course material, existing code or ask the project owner where
needed. Otherwise choose a reasonable implementation and record the
choice.

1.  Exact device-link compatibility matrix.
2.  Whether links are directed or undirected.
3.  Dijkstra link-cost formula.
4.  Queue scheduling and overflow/drop policy.
5.  Processing delay model.
6.  TCP-like retransmission timeout and retry limit.
7.  TCP-like segment/window/congestion-control scope.
8.  UDP payload fragmentation behaviour, if any.
9.  Exact Manchester and Differential Manchester convention.
10. Exact B8ZS/HDB3 convention and test vectors.
11. Delta Modulation step-size and reconstruction model.
12. Exact 3D device geometry and layout algorithm.
13. Exact chart sampling/aggregation interval.
14. Authentication and user identity scope.
15. Database choice if the current repository environment differs from
    the recommendation.
16. Whether PDF and CSV export are both feasible.
17. Whether multi-user simultaneous editing is in scope.
18. Whether a separate native socket service is in scope. The default is
    application-level simulation only.

If an item is not needed for the first milestone, defer it and document
that it is deferred.

------------------------------------------------------------------------

# 20. Final instruction

Build DataComPredia as a real, academically defensible interactive
laboratory. The 3D view should make the network easier to understand,
not distract from it. The UI should look like carefully crafted
engineering software, not a generic AI-generated admin template. The
simulation engine, not the animation, determines what happened.

**Correct graph state → correct simulation → truthful events and metrics
→ clear 2D/3D visualization → useful experiment report.**

That is the product's core contract.

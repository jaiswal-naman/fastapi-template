import { PacketEventTypes as E, PacketStatuses, Protocols } from '@datacompredia/shared';
import { simulateTransmission } from '../packet-simulation/engine.js';
import { getTemplateTopology } from '../topology/templates.js';
import { findRouteDijkstra } from '../routing/routing.js';
import { num, ms } from './format.js';

/** Flow-table columns shared by every packet lesson. */
const COLUMNS = [
  { key: 'time', label: 'Arrives', align: 'right' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'type', label: 'Type' },
  { key: 'info', label: 'What it says', grow: true },
  { key: 'size', label: 'Size', align: 'right' },
];

const LEGEND = [
  { tone: 'info', label: 'Handshake' },
  { tone: 'brand', label: 'Data' },
  { tone: 'violet', label: 'Acknowledgement' },
  { tone: 'danger', label: 'Lost' },
];

const TONE = { SYN: 'info', 'SYN-ACK': 'info', ACK: 'info', DATA: 'brand', 'DATA-ACK': 'violet' };

const SAYS = {
  SYN: 'Can we talk?',
  'SYN-ACK': 'Yes. Can you hear me too?',
  ACK: 'I hear you. Connection open.',
  'DATA-ACK': 'Got it, thanks.',
};

function hopNote(node, kind, toLabel, destLabel) {
  const what = kind === 'DATA' ? 'packet' : 'segment';
  if (node.type === 'switch') {
    return `${node.label} reads the destination address and passes the ${what} out of the port that leads to ${toLabel}.`;
  }
  if (node.type === 'router') {
    return `${node.label} looks up ${destLabel} in its routing table and forwards the ${what} to ${toLabel}.`;
  }
  return `${node.label} puts the ${what} on its cable to ${toLabel}.`;
}

/**
 * Run the real engine once and turn its event timeline into explorer frames.
 * Each frame is one thing to look at: the idle sender, the chosen path, one hop, a timeout, the result.
 */
export function runFrames({ topology, protocol, source, dest, payload, payloadLabel, seed = 7, tag = '', info, introNote }) {
  const { packet, events } = simulateTransmission({
    topology,
    labId: 'explorer',
    sourceNodeId: source,
    destinationNodeId: dest,
    payload,
    protocol,
    seed,
  });
  const node = new Map(topology.nodes.map((n) => [n.id, n]));
  const label = (id) => node.get(id)?.label ?? id;
  const linkBetween = (a, b) =>
    topology.links.find((l) => (l.source === a && l.target === b) || (l.source === b && l.target === a));
  const failed = topology.links.filter((l) => l.failed).map((l) => l.id);
  const lossy = topology.links.filter((l) => l.lossProbability > 0).map((l) => ({ id: l.id, percent: Math.round(l.lossProbability * 100) }));
  const route = packet.route;
  const shown = payloadLabel ?? `"${payload}"`;
  const frames = [];
  const push = (phase, frame) => frames.push({ phase: tag + phase, route: route?.linkIds ?? [], failed, lossy, ...frame });

  push('intro', {
    route: [],
    at: source,
    note: introNote ?? `${label(source)} has ${shown} for ${label(dest)}.`,
    detail: [
      { label: 'Sender', value: `${label(source)}${node.get(source)?.ip ? ` (${node.get(source).ip})` : ''}` },
      { label: 'Receiver', value: `${label(dest)}${node.get(dest)?.ip ? ` (${node.get(dest).ip})` : ''}` },
      { label: 'Message', value: `${shown}, ${num(packet.payloadSizeBytes)} bytes` },
      { label: 'Transport', value: protocol === Protocols.TCP_SIM ? 'TCP (simulated)' : 'UDP (simulated)' },
    ],
  });

  if (!route) {
    push('failed', {
      route: [],
      at: source,
      note: `There is no working path from ${label(source)} to ${label(dest)}, so the packet is dropped at once.`,
      detail: [{ label: 'Result', value: 'No route' }],
    });
    return { frames, packet, route: null };
  }

  push('route', {
    at: source,
    note: `Path chosen: ${route.nodeIds.map(label).join(' → ')}.`,
    detail: [
      { label: 'Path', value: route.nodeIds.map(label).join(' → ') },
      { label: 'Hops', value: String(route.linkIds.length) },
      { label: 'Rule', value: 'Fewest hops' },
    ],
  });

  const order = protocol === Protocols.TCP_SIM ? ['SYN', 'SYN-ACK', 'ACK', 'DATA', 'DATA-ACK'] : ['DATA'];
  const endOf = (kind) => (kind === 'SYN-ACK' || kind === 'DATA-ACK' ? source : dest);
  let p = 0;
  let attempt = 1;
  let lastTime = 0;

  for (const ev of events) {
    const isHop = ev.type === E.FORWARDED;
    const isLoss = ev.type === E.DROPPED && ev.reason === 'link_loss';
    if (isHop || isLoss) {
      const kind = order[Math.min(p, order.length - 1)];
      const link = linkBetween(ev.fromNodeId, ev.toNodeId);
      const size = kind === 'DATA' ? packet.payloadSizeBytes : 40;
      const phase = kind === 'DATA' && attempt > 1 ? `DATA${attempt}` : kind;
      const typeLabel = kind === 'DATA-ACK' ? 'ACK' : kind;
      const says = kind === 'DATA' ? shown : SAYS[kind];
      const detail = [
        { label: 'Carrying', value: `${typeLabel}, ${num(size)} bytes` },
        { label: 'Hop', value: `${label(ev.fromNodeId)} → ${label(ev.toNodeId)}` },
        { label: 'Cable', value: `${num(link.bandwidthMbps)} Mbps, ${num(link.distanceKm)} km` },
      ];
      if (isHop) {
        const t = ev.timing;
        detail.push(
          { label: 'Processing', value: ms(t.processingMs) },
          { label: 'Queueing', value: ms(t.queueingMs) },
          { label: 'Transmission', value: ms(t.transmissionMs), hint: `${num(size * 8)} bits ÷ ${num(link.bandwidthMbps)} Mbps` },
          { label: 'Propagation', value: ms(t.propagationMs), hint: `${num(link.distanceKm)} km ÷ ${num(link.propagationSpeedMps / 1000)} km/s` },
          { label: 'Arrives at', value: ms(ev.simTimeMs) },
        );
      } else {
        detail.push({ label: 'Result', value: 'Lost on this cable' });
      }
      push(phase, {
        hop: { from: ev.fromNodeId, to: ev.toNodeId, linkId: link.id, kind: typeLabel, tone: isLoss ? 'danger' : TONE[kind], lost: isLoss },
        note: isLoss
          ? `The ${kind === 'DATA' ? 'packet' : 'segment'} leaves ${label(ev.fromNodeId)} but never reaches ${label(ev.toNodeId)}. Noise on the cable destroyed it.`
          : hopNote(node.get(ev.fromNodeId), kind, label(ev.toNodeId), label(endOf(kind))),
        row: {
          tone: isLoss ? 'danger' : TONE[kind],
          time: isLoss ? 'never' : ms(ev.simTimeMs),
          from: label(ev.fromNodeId),
          to: label(ev.toNodeId),
          type: typeLabel,
          info: isLoss ? 'Lost on this cable' : info ? info(ev, link, size) : says,
          size: `${num(size)} B`,
        },
        detail,
      });
      if (isHop && ev.toNodeId === endOf(kind)) p += 1;
    } else if (ev.type === E.RETRANSMIT) {
      const waited = ev.simTimeMs - lastTime;
      attempt += 1;
      push('TIMEOUT', {
        at: source,
        note: `${label(source)} started a timer when it sent the data. ${ms(waited)} pass with no acknowledgement, so it decides the packet is lost.`,
        row: {
          tone: 'warn',
          time: ms(ev.simTimeMs),
          from: label(source),
          to: '',
          type: 'TIMEOUT',
          info: `No ACK after ${ms(waited)}. Send again.`,
          size: '',
        },
        detail: [
          { label: 'Waited', value: ms(waited) },
          { label: 'Heard back', value: 'Nothing' },
          { label: 'Decision', value: `Send again (attempt ${attempt})` },
        ],
      });
    } else if (ev.type === E.DROPPED) {
      push('failed', {
        at: ev.nodeId,
        note: `The packet is dropped at ${label(ev.nodeId)}.`,
        detail: [{ label: 'Reason', value: ev.reason.replace(/_/g, ' ') }],
      });
    }
    lastTime = ev.simTimeMs;
  }

  if (packet.status === PacketStatuses.DELIVERED) {
    const d = packet.delays;
    push('done', {
      at: dest,
      note: `${label(dest)} has the message. Total time: ${ms(packet.totalDelayMs)}.`,
      detail: [
        { label: 'Result', value: 'Delivered' },
        { label: 'Total time', value: ms(packet.totalDelayMs) },
        { label: 'Hops', value: String(route.linkIds.length) },
        { label: 'Data trip: processing', value: ms(d.processing) },
        { label: 'Data trip: transmission', value: ms(d.transmission) },
        { label: 'Data trip: propagation', value: ms(d.propagation) },
        { label: 'Data trip: queueing', value: ms(d.queueing) },
      ],
    });
  } else if (frames[frames.length - 1].phase !== `${tag}failed`) {
    push('failed', {
      at: source,
      note: `${label(dest)} never receives the message.`,
      detail: [
        { label: 'Result', value: 'Not delivered' },
        { label: 'Reason', value: (packet.dropReason || 'lost').replace(/_/g, ' ') },
      ],
    });
  }

  return { frames, packet, route };
}

/** First seed whose run satisfies `want`, so lossy lessons replay the same story every time. */
function findSeed(run, want) {
  for (let seed = 1; seed <= 4000; seed += 1) {
    if (want(run(seed))) return seed;
  }
  throw new Error('Explorer: no seed produces the wanted run.');
}

const phasesOf = (r) => r.frames.map((f) => f.phase);
const lostCount = (r) => r.frames.filter((f) => f.hop?.lost).length;

function withLoss(topology, linkId, probability) {
  const t = structuredClone(topology);
  t.links.find((l) => l.id === linkId).lossProbability = probability;
  return t;
}

function withFailed(topology, linkId) {
  const t = structuredClone(topology);
  t.links.find((l) => l.id === linkId).failed = true;
  return t;
}

function finish({ steps, frames, ...lesson }) {
  let current = 0;
  const placed = frames.map(({ phase, ...frame }) => {
    const i = steps.findIndex((s) => s.phases.includes(phase));
    if (i >= 0) current = i;
    return { step: current, ...frame };
  });
  return {
    kind: 'packet',
    columns: COLUMNS,
    legend: LEGEND,
    ...lesson,
    steps: steps.map(({ phases, ...s }) => s),
    frames: placed,
  };
}

const pathText = (topology, route) => {
  const label = new Map(topology.nodes.map((n) => [n.id, n.label]));
  return route.nodeIds.map((id) => label.get(id)).join(' → ');
};

/* ------------------------------------------------------------------ */

function topologyLesson({ id, title, subtitle, template, text, facts, layout, pathStep, hopStep, doneStep, extra }) {
  const topology = getTemplateTopology(template);
  const run = runFrames({ topology, protocol: Protocols.UDP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server' });
  const ctx = { total: ms(run.packet.totalDelayMs), hops: run.route.linkIds.length, path: pathText(topology, run.route) };
  const steps = [
    { title: 'The layout', subtitle: layout.subtitle, body: layout.body, phases: ['intro'] },
    { title: 'The path', subtitle: pathStep.subtitle, body: pathStep.body(ctx), phases: ['route'] },
    { title: 'Hop by hop', subtitle: hopStep.subtitle, body: hopStep.body(ctx), phases: ['DATA'] },
    { title: 'Delivered', subtitle: doneStep.subtitle, body: doneStep.body(ctx), phases: ['done'] },
  ];
  let frames = run.frames;
  if (extra) {
    const broken = withFailed(topology, extra.failLink);
    const second = runFrames({ topology: broken, protocol: Protocols.UDP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server', tag: 'B:', introNote: 'The same message again, but now one cable is cut.' });
    steps.push(
      ...extra.steps({
        ...ctx,
        total2: second.route ? ms(second.packet.totalDelayMs) : null,
        path2: second.route ? pathText(broken, second.route) : null,
      }),
    );
    frames = [...frames, ...second.frames];
  }
  return finish({
    id,
    title,
    subtitle,
    group: 'network',
    layer: { n: 2, name: 'Data link' },
    overview: { text, facts },
    lab: { to: '/create-lab', label: 'Build this network in the lab' },
    topology,
    steps,
    frames,
  });
}

export function buildPacketLessons() {
  const lessons = [];

  lessons.push(
    topologyLesson({
      id: 'topology-star',
      title: 'Star topology',
      subtitle: 'Everyone plugs into one switch',
      template: 'star',
      text: 'In a star, every device has its own cable to one central switch. To reach anyone, a message goes to the switch first and the switch passes it on. Almost every home and office network is built this way.',
      facts: [
        { label: 'Devices', value: '3 PCs, 1 server, 1 switch' },
        { label: 'Cables', value: '4, one per device' },
        { label: 'Longest trip', value: '2 hops' },
        { label: 'If a cable breaks', value: 'Only that device is cut off' },
        { label: 'If the switch breaks', value: 'Everyone is cut off' },
      ],
      layout: {
        subtitle: 'One switch in the middle',
        body: 'PC 1 wants to send "Hello server" to Server 1. They are not wired to each other. Each has a single cable, and both cables end at Switch 1.',
      },
      pathStep: {
        subtitle: 'Only one way to go',
        body: (c) => `There is exactly one route: ${c.path}. That is ${c.hops} hops.`,
      },
      hopStep: {
        subtitle: 'The switch passes it on',
        body: () => 'The packet travels up the first cable to the switch. The switch reads the destination address and sends the packet down the one cable that leads to the server. The other PCs never see it.',
      },
      doneStep: {
        subtitle: 'Server 1 has the message',
        body: (c) => `The message arrived ${c.total} after it was sent. Adding a new PC to a star is easy: run one more cable to the switch.`,
      },
      extra: {
        failLink: 'l4',
        steps: () => [
          {
            title: 'A cable breaks',
            subtitle: 'The weak point of a star',
            body: 'Now the cable between Switch 1 and Server 1 is cut. The server has no other cable, so there is no path at all and the packet is dropped before it leaves. The three PCs can still talk to each other.',
            phases: ['B:intro', 'B:failed'],
          },
        ],
      },
    }),
  );

  lessons.push(
    topologyLesson({
      id: 'topology-bus',
      title: 'Bus topology',
      subtitle: 'Devices in a single line',
      template: 'bus',
      text: 'In a bus, devices sit along one line of cable. A classic bus is a single shared wire. This lab models it as a chain, where each device hands the message to the next one. It is cheap to build and uses little cable, but every message passes through everything in between.',
      facts: [
        { label: 'Devices', value: '5 in a row' },
        { label: 'Cables', value: '4' },
        { label: 'End to end', value: '4 hops' },
        { label: 'If a middle cable breaks', value: 'The line splits in two' },
        { label: 'Cost', value: 'Lowest of all layouts' },
      ],
      layout: {
        subtitle: 'One line, end to end',
        body: 'PC 1 sits at one end and Server 1 at the other. Between them are two switches and a router, joined one after another.',
      },
      pathStep: {
        subtitle: 'Straight down the line',
        body: (c) => `The only route is along the line: ${c.path}. That is ${c.hops} hops.`,
      },
      hopStep: {
        subtitle: 'Passed from neighbour to neighbour',
        body: () => 'Each device receives the packet, takes a moment to read it, and sends it to the next device. Every hop adds a little delay, so a long line is a slow line.',
      },
      doneStep: {
        subtitle: 'Four hops later',
        body: (c) => `The message took ${c.total}. Compare that with the star, where the same message needs only 2 hops.`,
      },
      extra: {
        failLink: 'l2',
        steps: () => [
          {
            title: 'A cable breaks',
            subtitle: 'The line is cut in two',
            body: 'Now the cable between Switch 1 and Router 1 is cut. PC 1 is on one side, Server 1 on the other, and there is no second line to use. The packet is dropped before it leaves. One break anywhere in a bus stops all traffic across it.',
            phases: ['B:intro', 'B:failed'],
          },
        ],
      },
    }),
  );

  lessons.push(
    topologyLesson({
      id: 'topology-ring',
      title: 'Ring topology',
      subtitle: 'A closed loop with two ways round',
      template: 'ring',
      text: 'In a ring, each switch has exactly two neighbours and the cables form a closed loop. A message can travel round in either direction, so a single broken cable does not cut anyone off.',
      facts: [
        { label: 'Devices', value: '4 switches in a loop, 1 PC, 1 server' },
        { label: 'Cables in the loop', value: '4' },
        { label: 'Ways round', value: '2' },
        { label: 'If one cable breaks', value: 'Traffic goes the other way' },
        { label: 'If two cables break', value: 'The ring splits' },
      ],
      layout: {
        subtitle: 'Four switches in a loop',
        body: 'PC 1 is attached to SW1 and Server 1 to SW3, on the opposite side of the ring. Between them the loop offers two routes: one through SW2, the other through SW4.',
      },
      pathStep: {
        subtitle: 'Both ways are equally short',
        body: (c) => `Each way round is ${c.hops} hops. The lab picks ${c.path}.`,
      },
      hopStep: {
        subtitle: 'Round the loop',
        body: () => 'The packet enters the ring at SW1 and is passed from switch to switch until it reaches the one the server is attached to.',
      },
      doneStep: {
        subtitle: 'Half way round the ring',
        body: (c) => `Delivered in ${c.total}. Next, see what the loop is really for.`,
      },
      extra: {
        failLink: 'l1',
        steps: (c) => [
          {
            title: 'A cable breaks',
            subtitle: 'SW1 to SW2 goes down',
            body: `The cable the packet just used is now cut. The ring still connects everyone, because there is another way round: ${c.path2}.`,
            phases: ['B:intro', 'B:route'],
          },
          {
            title: 'The other way round',
            subtitle: 'Same message, new path',
            body: `The packet goes round through SW4 and still arrives, in ${c.total2}. A bus or a star would have lost the connection.`,
            phases: ['B:DATA', 'B:done'],
          },
        ],
      },
    }),
  );

  lessons.push(
    topologyLesson({
      id: 'topology-mesh',
      title: 'Mesh topology',
      subtitle: 'Several paths between any two points',
      template: 'mesh',
      text: 'In a mesh, routers have links to several other routers, so there is more than one path between two points. It needs more cable and more ports, but the network survives failures and can choose the better path. The internet backbone is a mesh.',
      facts: [
        { label: 'Devices', value: '3 routers, 1 PC, 1 server' },
        { label: 'Router links', value: '3, every router to every other' },
        { label: 'Paths PC 1 to Server 1', value: 'More than one' },
        { label: 'If one link breaks', value: 'Traffic takes another path' },
        { label: 'Cost', value: 'Highest of all layouts' },
      ],
      layout: {
        subtitle: 'Three routers, all linked',
        body: 'R1, R2 and R3 are each connected to the other two. PC 1 enters at R1. Server 1 can be reached from R2 or from R3.',
      },
      pathStep: {
        subtitle: 'Pick one of several',
        body: (c) => `The lab picks ${c.path}: ${c.hops} hops. Going through R3 would also work.`,
      },
      hopStep: {
        subtitle: 'Router to router',
        body: () => 'Each router looks at the destination address, checks its table, and forwards the packet to the next router on the way.',
      },
      doneStep: {
        subtitle: 'Arrived by the short way',
        body: (c) => `Delivered in ${c.total}. Now break the link it used.`,
      },
      extra: {
        failLink: 'l2',
        steps: (c) => [
          {
            title: 'A link breaks',
            subtitle: 'R1 to R2 goes down',
            body: `The direct link between R1 and R2 is cut. The routers work out a new path: ${c.path2}.`,
            phases: ['B:intro', 'B:route'],
          },
          {
            title: 'A different path',
            subtitle: 'Slower, but it arrives',
            body: `The detour uses slower, longer links, so the trip takes ${c.total2} instead of ${c.total}. The message still gets there, which is the whole point of a mesh.`,
            phases: ['B:DATA', 'B:done'],
          },
        ],
      },
    }),
  );

  /* --- Delay ------------------------------------------------------- */
  {
    const topology = getTemplateTopology('bus');
    const run = runFrames({
      topology,
      protocol: Protocols.UDP_SIM,
      source: 'pc-1',
      dest: 'srv-1',
      payload: 'A'.repeat(1000),
      payloadLabel: 'a 1,000-byte packet',
      info: (ev) => {
        const t = ev.timing;
        return `Process ${ms(t.processingMs)} + wait ${ms(t.queueingMs)} + send ${ms(t.transmissionMs)} + travel ${ms(t.propagationMs)}`;
      },
    });
    const d = run.packet.delays;
    lessons.push(
      finish({
        id: 'delay',
        title: 'The four delays',
        subtitle: 'Why a packet takes time to arrive',
        group: 'network',
        layer: { n: 3, name: 'Network' },
        overview: {
          text: 'A packet loses time in four ways at every hop. The device must read it (processing), it may wait behind other packets (queueing), its bits must be pushed onto the cable one after another (transmission), and the signal must travel the length of the cable (propagation). Add the four up at each hop to get the total.',
          facts: [
            { label: 'Processing', value: 'Time to read the header' },
            { label: 'Queueing', value: 'Time waiting in line' },
            { label: 'Transmission', value: 'Packet size ÷ link speed (L ÷ R)' },
            { label: 'Propagation', value: 'Cable length ÷ signal speed (d ÷ s)' },
            { label: 'Per hop', value: 'Sum of all four' },
          ],
        },
        lab: { to: '/observatory', label: 'Measure delays in the lab' },
        topology,
        steps: [
          {
            title: 'The packet',
            subtitle: '1,000 bytes to send',
            body: 'PC 1 sends one packet of 1,000 bytes (8,000 bits) to Server 1 at the far end of the line. The cables are not all the same: the two in the middle are slower and longer.',
            phases: ['intro'],
          },
          {
            title: 'The path',
            subtitle: 'Four hops',
            body: `The packet will cross ${run.route.linkIds.length} cables: ${pathText(topology, run.route)}.`,
            phases: ['route'],
          },
          {
            title: 'Add up each hop',
            subtitle: 'Process, wait, send, travel',
            body: 'Watch the numbers on the right at each hop. Transmission is 8,000 bits divided by the cable speed, so the slower middle cables take twice as long. Propagation is the cable length divided by 200,000 km/s, so the longer cables take longer.',
            phases: ['DATA'],
          },
          {
            title: 'The total',
            subtitle: 'All hops added together',
            body: `End to end the packet took ${ms(run.packet.totalDelayMs)}: processing ${ms(d.processing)}, queueing ${ms(d.queueing)}, transmission ${ms(d.transmission)}, propagation ${ms(d.propagation)}. Queueing is zero here because the network is empty.`,
            phases: ['done'],
          },
        ],
        frames: run.frames,
      }),
    );
  }

  /* --- Routing ----------------------------------------------------- */
  {
    const topology = getTemplateTopology('mesh');
    const label = new Map(topology.nodes.map((n) => [n.id, n.label]));
    const a = findRouteDijkstra(topology, 'pc-1', 'srv-1');
    // Path B is the other 3-hop way round: block R1-R2 and R2-R3 so the search must go straight through R3.
    const b = findRouteDijkstra(withFailed(withFailed(topology, 'l2'), 'l4'), 'pc-1', 'srv-1');
    const run = runFrames({ topology, protocol: Protocols.UDP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server' });
    if (a.linkIds.length !== b.linkIds.length) throw new Error('Explorer: the routing lesson needs two paths with equal hop counts.');
    const sameAsEngine = a.linkIds.join() === run.route.linkIds.join();
    const text = (r) => r.nodeIds.map((id) => label.get(id)).join(' → ');
    const candidates = [
      { linkIds: a.linkIds, tone: 'brand', label: 'A' },
      { linkIds: b.linkIds, tone: 'warn', label: 'B' },
    ];
    const [intro, , ...rest] = run.frames;
    const compare = (phase, note, rows) =>
      rows.map((row, i) => ({
        phase,
        route: [],
        failed: [],
        lossy: [],
        candidates,
        at: 'pc-1',
        note,
        row,
        detail: [
          { label: 'Path A', value: text(a) },
          { label: 'Path B', value: text(b) },
          { label: 'Hops', value: `A: ${a.linkIds.length}, B: ${b.linkIds.length}` },
          ...(phase === 'cmp-delay'
            ? [{ label: 'Delay for a 1,500-byte frame', value: `A: ${ms(a.totalCostMs)}, B: ${ms(b.totalCostMs)}` }]
            : []),
        ],
        key: `${phase}-${i}`,
      }));
    const frames = [
      { ...intro, candidates },
      ...compare('cmp-hops', 'Count the cables on each path.', [
        { tone: 'brand', time: '', from: 'PC 1', to: 'Server 1', type: 'PATH A', info: `${text(a)}: ${a.linkIds.length} hops`, size: '' },
        { tone: 'warn', time: '', from: 'PC 1', to: 'Server 1', type: 'PATH B', info: `${text(b)}: ${b.linkIds.length} hops`, size: '' },
      ]),
      ...compare('cmp-delay', 'Add the transmission and propagation delay of every cable on each path.', [
        { tone: 'brand', time: ms(a.totalCostMs), from: 'PC 1', to: 'Server 1', type: 'PATH A', info: `Delay cost ${ms(a.totalCostMs)}`, size: '' },
        { tone: 'warn', time: ms(b.totalCostMs), from: 'PC 1', to: 'Server 1', type: 'PATH B', info: `Delay cost ${ms(b.totalCostMs)}`, size: '' },
      ]),
      ...rest,
    ].map(({ key, ...f }) => f);
    lessons.push(
      finish({
        id: 'routing',
        title: 'Routing',
        subtitle: 'Choosing between two paths',
        group: 'network',
        layer: { n: 3, name: 'Network' },
        overview: {
          text: 'When there is more than one path, routers need a rule for picking one. The simplest rule counts hops and takes the fewest. A smarter rule gives every link a cost, such as its delay, and takes the path with the lowest total. Both are shortest-path searches; they differ only in what "short" means.',
          facts: [
            { label: 'Fewest hops', value: 'Breadth-first search' },
            { label: 'Lowest cost', value: "Dijkstra's algorithm" },
            { label: 'Cost used here', value: 'Transmission + propagation delay' },
            { label: 'Hop count is used by', value: 'RIP' },
            { label: 'Link cost is used by', value: 'OSPF' },
          ],
        },
        lab: { to: '/network', label: 'Edit link speeds in the lab' },
        topology,
        steps: [
          {
            title: 'Two ways to the server',
            subtitle: 'Through R2 or through R3',
            body: `From PC 1 everything goes to R1 first. From there, path A is ${text(a)} and path B is ${text(b)}.`,
            phases: ['intro'],
          },
          {
            title: 'Count the hops',
            subtitle: 'A tie',
            body: `Both paths have ${a.linkIds.length} hops. Counting hops cannot tell them apart, so a hop-count rule simply takes the first one it finds.`,
            phases: ['cmp-hops'],
          },
          {
            title: 'Add up the delay',
            subtitle: 'Now there is a clear winner',
            body: `The links are not equal. Path B uses slower and longer cables. For a 1,500-byte frame, path A costs ${ms(a.totalCostMs)} and path B costs ${ms(b.totalCostMs)}. A cost-based rule picks path A.`,
            phases: ['cmp-delay'],
          },
          {
            title: 'Send it',
            subtitle: 'Along the chosen path',
            body: sameAsEngine
              ? 'The packet follows path A. Each router repeats the same decision for itself and forwards the packet one hop closer.'
              : 'The packet follows the path the lab engine chose by hop count.',
            phases: ['DATA'],
          },
          {
            title: 'Delivered',
            subtitle: 'By the cheaper path',
            body: `The message arrived in ${ms(run.packet.totalDelayMs)}.`,
            phases: ['done'],
          },
        ],
        frames,
      }),
    );
  }

  /* --- TCP handshake ---------------------------------------------- */
  {
    const topology = getTemplateTopology('star');
    const run = runFrames({ topology, protocol: Protocols.TCP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server' });
    const firstData = run.frames.find((f) => f.phase === 'DATA');
    const lastHandshake = [...run.frames].reverse().find((f) => f.phase === 'ACK');
    lessons.push(
      finish({
        id: 'tcp-handshake',
        title: 'TCP handshake',
        subtitle: 'Agree to talk before sending',
        group: 'transport',
        layer: { n: 4, name: 'Transport' },
        overview: {
          text: 'TCP does not just fire data at the other side. First the two computers exchange three short messages to check that each can hear the other. Only then is data sent, and every piece of data must be acknowledged. This is what makes TCP reliable.',
          facts: [
            { label: 'Step 1', value: 'SYN: "can we talk?"' },
            { label: 'Step 2', value: 'SYN-ACK: "yes, can you hear me?"' },
            { label: 'Step 3', value: 'ACK: "I hear you"' },
            { label: 'After data', value: 'Receiver sends an ACK' },
            { label: 'Used by', value: 'Web pages, email, file transfer' },
          ],
        },
        lab: { to: '/packets', label: 'Send your own TCP message' },
        topology,
        steps: [
          {
            title: 'The message',
            subtitle: 'PC 1 wants a reliable delivery',
            body: 'PC 1 has "Hello server" for Server 1 and wants to be sure it arrives. With TCP, it must open a connection first. The path is PC 1 → Switch 1 → Server 1.',
            phases: ['intro', 'route'],
          },
          {
            title: 'SYN',
            subtitle: 'PC 1 asks to talk',
            body: 'PC 1 sends a small SYN segment. It carries no data, only the request to open a connection. SYN is short for synchronise.',
            phases: ['SYN'],
          },
          {
            title: 'SYN-ACK',
            subtitle: 'Server 1 answers',
            body: 'Server 1 replies with SYN-ACK. The ACK half says "I got your SYN". The SYN half asks the same question back: "can you hear me?"',
            phases: ['SYN-ACK'],
          },
          {
            title: 'ACK',
            subtitle: 'PC 1 confirms',
            body: 'PC 1 answers with ACK. Now both sides have sent something and had it confirmed, so both know the line works in both directions. The connection is open.',
            phases: ['ACK'],
          },
          {
            title: 'Send the data',
            subtitle: 'Now the real message',
            body: `Only now does the actual message travel. It leaves ${lastHandshake.row.time} after PC 1 first asked, and that waiting time is the price of the handshake.`,
            phases: ['DATA'],
          },
          {
            title: 'Acknowledge the data',
            subtitle: 'Server 1 says "got it"',
            body: 'Server 1 sends an ACK for the data. Until this ACK arrives, PC 1 does not know whether the message made it. If no ACK came, PC 1 would send the data again.',
            phases: ['DATA-ACK'],
          },
          {
            title: 'Done',
            subtitle: 'Delivered and confirmed',
            body: `The whole exchange took ${ms(run.packet.totalDelayMs)} and ${run.frames.filter((f) => f.hop).length} trips over a cable, to deliver one ${firstData.row.size.replace(' B', '-byte')} message. UDP would have done it in 2 trips, with no guarantee.`,
            phases: ['done'],
          },
        ],
        frames: run.frames,
      }),
    );
  }

  /* --- TCP retransmission ------------------------------------------ */
  {
    const topology = withLoss(getTemplateTopology('star'), 'l4', 0.3);
    const run = (seed) => runFrames({ topology, protocol: Protocols.TCP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server', seed });
    const seed = findSeed(run, (r) => {
      const ph = phasesOf(r);
      const lost = r.frames.filter((f) => f.hop?.lost);
      return r.packet.status === PacketStatuses.DELIVERED && lost.length === 1 && lost[0].phase === 'DATA' && ph.includes('DATA2') && ph.includes('DATA-ACK');
    });
    const r = run(seed);
    const timeout = r.frames.find((f) => f.phase === 'TIMEOUT');
    lessons.push(
      finish({
        id: 'tcp-retransmit',
        title: 'TCP loss and retransmission',
        subtitle: 'A lost packet is sent again',
        group: 'transport',
        layer: { n: 4, name: 'Transport' },
        overview: {
          text: 'Cables are noisy and packets do get lost. TCP copes with a simple trick: after sending data it starts a timer. If the acknowledgement does not come back before the timer runs out, it assumes the packet was lost and sends it again.',
          facts: [
            { label: 'How loss is noticed', value: 'No ACK before the timer ends' },
            { label: 'What TCP does', value: 'Sends the same data again' },
            { label: 'Timer here', value: timeout.detail[0].value },
            { label: 'Tries before giving up', value: '3 retries' },
            { label: 'Bad cable in this run', value: 'Switch 1 to Server 1, 30% loss' },
          ],
        },
        lab: { to: '/packets', label: 'Try it on a lossy link' },
        topology,
        steps: [
          {
            title: 'The message',
            subtitle: 'A noisy cable on the way',
            body: 'PC 1 sends "Hello server" to Server 1 over TCP. The cable between Switch 1 and Server 1 is faulty and destroys about 3 packets in 10.',
            phases: ['intro', 'route'],
          },
          {
            title: 'Handshake',
            subtitle: 'SYN, SYN-ACK, ACK',
            body: 'The three handshake segments happen to get through, so the connection opens normally.',
            phases: ['SYN', 'SYN-ACK', 'ACK'],
          },
          {
            title: 'The data is lost',
            subtitle: 'It never reaches the server',
            body: 'PC 1 sends the data. It reaches the switch, but on the faulty cable it is destroyed. Nobody tells PC 1: the packet is simply gone.',
            phases: ['DATA'],
          },
          {
            title: 'Timeout',
            subtitle: 'Silence is the signal',
            body: `PC 1 has been waiting for an ACK. After ${timeout.detail[0].value} of silence its timer runs out, and it concludes the packet was lost.`,
            phases: ['TIMEOUT'],
          },
          {
            title: 'Send it again',
            subtitle: 'Same data, second try',
            body: 'PC 1 sends exactly the same data again. This time the cable behaves and the packet reaches Server 1.',
            phases: ['DATA2'],
          },
          {
            title: 'Acknowledged',
            subtitle: 'Now PC 1 knows',
            body: 'Server 1 sends its ACK. The timer is cancelled and PC 1 knows the message arrived.',
            phases: ['DATA-ACK'],
          },
          {
            title: 'Done',
            subtitle: 'Delivered, but late',
            body: `The message arrived after ${ms(r.packet.totalDelayMs)}. Almost all of that was the wait for the timer. Reliability costs time, and that is the trade TCP makes.`,
            phases: ['done'],
          },
        ],
        frames: r.frames,
      }),
    );
  }

  /* --- UDP --------------------------------------------------------- */
  {
    const clean = getTemplateTopology('star');
    const lossy = withLoss(clean, 'l4', 0.3);
    const first = runFrames({ topology: clean, protocol: Protocols.UDP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server' });
    const run = (seed) => runFrames({ topology: lossy, protocol: Protocols.UDP_SIM, source: 'pc-1', dest: 'srv-1', payload: 'Hello server', seed, tag: 'B:', introNote: 'The same message again, this time over a faulty cable.' });
    const seed = findSeed(run, (r) => r.packet.status !== PacketStatuses.DELIVERED && lostCount(r) === 1);
    const second = run(seed);
    lessons.push(
      finish({
        id: 'udp',
        title: 'UDP',
        subtitle: 'Send and hope',
        group: 'transport',
        layer: { n: 4, name: 'Transport' },
        overview: {
          text: 'UDP is the simple transport protocol. It puts the data in a packet and sends it: no handshake, no acknowledgement, no retry. That makes it fast and light, and it means a lost packet stays lost unless the application notices by itself.',
          facts: [
            { label: 'Handshake', value: 'None' },
            { label: 'Acknowledgement', value: 'None' },
            { label: 'If a packet is lost', value: 'Nothing happens' },
            { label: 'Good for', value: 'Calls, games, live video, DNS' },
            { label: 'Compared with TCP', value: 'Faster, but no guarantee' },
          ],
        },
        lab: { to: '/packets', label: 'Send your own UDP message' },
        topology: clean,
        steps: [
          {
            title: 'The message',
            subtitle: 'No connection to open',
            body: 'PC 1 has "Hello server" for Server 1. With UDP there is nothing to set up. The path is PC 1 → Switch 1 → Server 1.',
            phases: ['intro', 'route'],
          },
          {
            title: 'Just send it',
            subtitle: 'Straight away',
            body: 'The data leaves immediately. Compare this with TCP, where three handshake segments have to cross the network first.',
            phases: ['DATA'],
          },
          {
            title: 'Delivered',
            subtitle: 'And nobody says so',
            body: `The message arrived in ${ms(first.packet.totalDelayMs)}. Server 1 sends nothing back, so PC 1 has no idea whether it worked. This time it did.`,
            phases: ['done'],
          },
          {
            title: 'Now a bad cable',
            subtitle: 'Same message, faulty link',
            body: 'Send the same message again, but now the cable between Switch 1 and Server 1 destroys about 3 packets in 10.',
            phases: ['B:intro', 'B:route'],
          },
          {
            title: 'Lost, and nobody knows',
            subtitle: 'No timer, no retry',
            body: 'The packet dies on the faulty cable. UDP has no acknowledgement and no timer, so PC 1 never finds out and never sends it again. In a video call you would see this as a brief glitch, which is better than freezing while waiting for a resend.',
            phases: ['B:DATA', 'B:failed'],
          },
        ],
        frames: [...first.frames, ...second.frames],
      }),
    );
  }

  return lessons;
}

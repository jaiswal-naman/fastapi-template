import { encode } from '../signal-encoding/encoders.js';

const lv = (v) => (v > 0 ? '+V' : v < 0 ? '−V' : '0 V');

const COLUMNS = [
  { key: 'bit', label: 'Bit' },
  { key: 'first', label: 'First half' },
  { key: 'second', label: 'Second half' },
  { key: 'why', label: 'Why', grow: true },
];

const amiPulse = (c) =>
  c.lastPulse === 0
    ? `a pulse. It is the first one, so it is ${lv(c.a)}.`
    : `a pulse, opposite to the last one, so ${lv(c.a)}.`;

/**
 * One entry per line code. `why` explains a single bit from the encoder's real output:
 * c = { bit, a, b (levels of the two half-bits), prev (level just before), lastPulse, sub, pos }.
 */
const SCHEMES = [
  {
    scheme: 'unipolar_nrz',
    title: 'Unipolar NRZ',
    subtitle: 'Voltage on for 1, off for 0',
    bits: '10110001',
    text: 'The simplest line code there is. A 1 is sent as a positive voltage and a 0 as no voltage at all. NRZ means "non-return to zero": the level holds for the whole bit and does not drop back in the middle.',
    rule: '1 is sent as +V for the whole bit. 0 is sent as 0 V for the whole bit. The signal never goes negative.',
    notice: 'Look at the three 0s in a row: the line is flat, and the receiver has no edge to keep its clock in step. The signal also sits above zero on average (a DC component), which wastes power and cannot pass through transformers.',
    facts: [
      { label: 'Levels', value: '+V and 0 V' },
      { label: 'Clock built in', value: 'No' },
      { label: 'DC component', value: 'Yes' },
      { label: 'Long runs', value: 'Flat line for 0s and for 1s' },
    ],
    why: (c) => `Bit is ${c.bit}: hold ${lv(c.a)} for the whole bit.`,
  },
  {
    scheme: 'polar_nrz_l',
    title: 'Polar NRZ-L',
    subtitle: 'The level is the bit',
    bits: '10110001',
    text: 'NRZ-L uses two voltages, one positive and one negative. The L stands for level: the voltage level during the bit tells you what the bit is.',
    rule: '1 is sent as +V and 0 as −V, each held for the whole bit. (Some textbooks draw it the other way round. The idea is the same.)',
    notice: 'Using +V and −V removes most of the DC problem when 1s and 0s are balanced. A long run of the same bit is still a flat line, so the clock problem remains. And if the two wires are swapped by mistake, every bit is read wrong.',
    facts: [
      { label: 'Levels', value: '+V and −V' },
      { label: 'Clock built in', value: 'No' },
      { label: 'DC component', value: 'Only if 1s and 0s are unbalanced' },
      { label: 'Used in', value: 'Serial ports (RS-232)' },
    ],
    why: (c) => `Bit is ${c.bit}: hold ${lv(c.a)} for the whole bit.`,
  },
  {
    scheme: 'polar_nrz_i',
    title: 'Polar NRZ-I',
    subtitle: 'A change means 1',
    bits: '10110001',
    text: 'In NRZ-I the voltage level itself means nothing. What matters is whether the level changes at the start of the bit. The I stands for invert.',
    rule: 'Look at the start of each bit. If the bit is 1, flip the level. If the bit is 0, leave it alone. The line starts at +V.',
    notice: 'A run of 1s now gives an edge on every bit, which helps the clock. A run of 0s is still flat. Swapping the wires no longer matters, because only changes carry meaning.',
    facts: [
      { label: 'Levels', value: '+V and −V' },
      { label: 'Clock built in', value: 'Only during 1s' },
      { label: 'Wires swapped', value: 'Still works' },
      { label: 'Used in', value: 'USB' },
    ],
    why: (c) =>
      c.bit === 1
        ? `Bit is 1: flip at the start, from ${lv(c.prev)} to ${lv(c.a)}.`
        : `Bit is 0: no change, the line stays at ${lv(c.a)}.`,
  },
  {
    scheme: 'polar_rz',
    title: 'Polar RZ',
    subtitle: 'Back to zero in every bit',
    bits: '10110001',
    text: 'RZ means "return to zero". Each bit is signalled in its first half only, and the line always comes back to 0 V for the second half. That gives every single bit an edge.',
    rule: '1: +V for the first half. 0: −V for the first half. In the second half the signal always returns to 0 V.',
    notice: 'Every bit has an edge in the middle, so the receiver can lock its clock even through long runs. The price is three voltage levels and twice as many changes, so it needs about twice the bandwidth of NRZ.',
    facts: [
      { label: 'Levels', value: '+V, 0 V and −V' },
      { label: 'Clock built in', value: 'Yes, every bit' },
      { label: 'DC component', value: 'No' },
      { label: 'Bandwidth', value: 'About twice NRZ' },
    ],
    why: (c) => `Bit is ${c.bit}: ${lv(c.a)} for the first half, then back to 0 V.`,
  },
  {
    scheme: 'manchester',
    title: 'Manchester',
    subtitle: 'The edge in the middle is the bit',
    bits: '10110001',
    text: 'Manchester coding puts a voltage change in the middle of every bit. The direction of that change is the data, and the change itself is the clock. Classic 10 Mbps Ethernet uses it.',
    rule: '0: start high and drop to low in the middle. 1: start low and rise to high in the middle. (This is the IEEE 802.3 convention.)',
    notice: 'There is an edge in the middle of every bit, no matter what the data is, so the clock travels inside the signal. Each bit spends half its time high and half low, so there is no DC component. The cost is twice the bandwidth of NRZ.',
    facts: [
      { label: 'Levels', value: '+V and −V' },
      { label: 'Clock built in', value: 'Yes, every bit' },
      { label: 'DC component', value: 'No' },
      { label: 'Used in', value: '10 Mbps Ethernet' },
    ],
    why: (c) =>
      c.bit === 0
        ? 'Bit is 0: start high, drop to low in the middle.'
        : 'Bit is 1: start low, rise to high in the middle.',
  },
  {
    scheme: 'differential_manchester',
    title: 'Differential Manchester',
    subtitle: 'An edge at the start means 0',
    bits: '10110001',
    text: 'Like Manchester, there is always a change in the middle of the bit, used only as the clock. The data is carried by something else: whether there is also a change at the start of the bit.',
    rule: 'Every bit flips in the middle. If the bit is 0, it also flips at the start. If the bit is 1, there is no flip at the start. The line starts at +V.',
    notice: 'The clock is in every bit, and because only changes matter, it still works if the wires are swapped. Token Ring networks used it.',
    facts: [
      { label: 'Levels', value: '+V and −V' },
      { label: 'Clock built in', value: 'Yes, every bit' },
      { label: 'Wires swapped', value: 'Still works' },
      { label: 'Used in', value: 'Token Ring' },
    ],
    why: (c) =>
      c.bit === 0
        ? `Bit is 0: flip at the start (${lv(c.prev)} to ${lv(c.a)}), then flip again in the middle.`
        : `Bit is 1: no flip at the start (stays ${lv(c.a)}), then the usual flip in the middle.`,
  },
  {
    scheme: 'ami',
    title: 'Bipolar AMI',
    subtitle: '1s alternate between +V and −V',
    bits: '10110001',
    text: 'AMI stands for alternate mark inversion. A 0 is no voltage. A 1 is a pulse, and each pulse has the opposite sign to the one before it.',
    rule: '0: the line stays at 0 V. 1: send a pulse, with the opposite sign to the previous pulse. The first pulse is +V.',
    notice: 'Positive and negative pulses cancel out, so there is no DC component. Two pulses with the same sign in a row can only be an error, so mistakes are easy to spot. The weakness: a long run of 0s is a flat line. B8ZS and HDB3 exist to fix exactly that.',
    facts: [
      { label: 'Levels', value: '+V, 0 V and −V' },
      { label: 'Clock built in', value: 'Only during 1s' },
      { label: 'DC component', value: 'No' },
      { label: 'Used in', value: 'Early T1 lines, ISDN' },
    ],
    why: (c) => (c.bit === 0 ? 'Bit is 0: no pulse, the line stays at 0 V.' : `Bit is 1: ${amiPulse(c)}`),
  },
  {
    scheme: 'pseudoternary',
    title: 'Pseudoternary',
    subtitle: 'AMI turned inside out',
    bits: '10110001',
    text: 'Pseudoternary is AMI with the roles swapped. Here it is the 0s that become alternating pulses, and the 1s that are sent as no voltage.',
    rule: '1: the line stays at 0 V. 0: send a pulse, with the opposite sign to the previous pulse. The first pulse is +V.',
    notice: 'It has the same strengths as AMI: no DC component and easy error spotting. The weakness is mirrored too: here it is a long run of 1s that leaves the line flat.',
    facts: [
      { label: 'Levels', value: '+V, 0 V and −V' },
      { label: 'Clock built in', value: 'Only during 0s' },
      { label: 'DC component', value: 'No' },
      { label: 'Used in', value: 'ISDN basic rate interface' },
    ],
    why: (c) => (c.bit === 1 ? 'Bit is 1: no pulse, the line stays at 0 V.' : `Bit is 0: ${amiPulse(c)}`),
  },
  {
    scheme: 'b8zs',
    title: 'B8ZS',
    subtitle: 'Break up eight zeros',
    bits: '1000000001',
    text: 'B8ZS is AMI with a fix for its one weakness. Whenever eight 0s arrive in a row, the sender replaces them with a special pattern of pulses, so the line never stays flat for long.',
    rule: 'Send as AMI. But eight 0s in a row are replaced by the pattern 000VB0VB. V is a "violation": a pulse with the same sign as the pulse before it, which AMI never does. B is a normal pulse.',
    notice: 'The receiver sees two rule-breaking pulses in exactly this pattern, knows it cannot be an error, and puts eight 0s back. The data is unchanged and the clock stays locked. North American T1 lines use it.',
    facts: [
      { label: 'Based on', value: 'AMI' },
      { label: 'Replaces', value: 'Eight 0s in a row' },
      { label: 'Pattern', value: '000VB0VB' },
      { label: 'Used in', value: 'T1 lines (North America)' },
    ],
    marks: { 3: 'V', 4: 'B', 6: 'V', 7: 'B' },
    why: (c) => {
      if (!c.sub) return c.bit === 0 ? 'Bit is 0: no pulse, 0 V.' : `Bit is 1: ${amiPulse(c)}`;
      if (c.pos === 3 || c.pos === 6) return `V: a pulse of ${lv(c.a)}, the same sign as the pulse before it. This breaks the AMI rule on purpose.`;
      if (c.pos === 4 || c.pos === 7) return `B: a normal pulse of ${lv(c.a)}, opposite to the one before it.`;
      return 'One of the eight 0s. This position in the pattern stays at 0 V.';
    },
  },
  {
    scheme: 'hdb3',
    title: 'HDB3',
    subtitle: 'Never more than three zeros',
    bits: '110000100001',
    text: 'HDB3 is the European answer to the same problem B8ZS solves. It is AMI, but it never lets more than three 0s in a row reach the line: every run of four 0s is replaced by a pattern that contains a pulse.',
    rule: 'Send as AMI. But four 0s in a row become 000V or B00V. V is a pulse that breaks the alternating rule. If an odd number of pulses were sent since the last replacement, use 000V. If even, use B00V. That choice makes the V pulses alternate in sign, so no DC builds up.',
    notice: 'Both kinds of replacement appear in this example. The receiver spots each violation, knows a replacement happened, and restores the four 0s. European E1 lines use it.',
    facts: [
      { label: 'Based on', value: 'AMI' },
      { label: 'Replaces', value: 'Four 0s in a row' },
      { label: 'Patterns', value: '000V or B00V' },
      { label: 'Used in', value: 'E1 lines (Europe)' },
    ],
    marks: (sub) => (sub.rule.endsWith('B00V') ? { 0: 'B', 3: 'V' } : { 3: 'V' }),
    why: (c) => {
      if (!c.sub) return c.bit === 0 ? 'Bit is 0: no pulse, 0 V.' : `Bit is 1: ${amiPulse(c)}`;
      const name = c.sub.rule.endsWith('B00V') ? 'B00V' : '000V';
      if (c.pos === 3) return `V of ${name}: a pulse of ${lv(c.a)}, the same sign as the pulse before it. This breaks the rule on purpose.`;
      if (c.pos === 0 && name === 'B00V') return `B of B00V: an extra pulse of ${lv(c.a)} that follows the normal alternating rule.`;
      return `One of the four 0s. This position in ${name} stays at 0 V.`;
    },
  },
];

function lineCodeLesson(meta) {
  const result = encode(meta.scheme, meta.bits);
  const { bits, levels, substitutions } = result;
  const n = bits.length;
  const subAt = (i) => substitutions.find((s) => i >= s.startBit && i < s.startBit + s.length);

  const marks = [];
  for (const sub of substitutions) {
    const map = typeof meta.marks === 'function' ? meta.marks(sub) : meta.marks;
    for (const [pos, text] of Object.entries(map || {})) marks.push({ slot: sub.startBit + Number(pos), text });
  }

  const frames = [
    {
      step: 0,
      show: { wave: 0 },
      note: `The bits to send, left to right: ${meta.bits}.`,
      detail: [
        { label: 'Bits', value: meta.bits },
        { label: 'Count', value: String(n) },
      ],
    },
    { step: 1, show: { wave: 0 }, note: 'Each bit gets one slot on the time axis. Press Step to encode them one at a time.', detail: meta.facts },
  ];

  let lastPulse = 0;
  for (let i = 0; i < n; i += 1) {
    const a = levels[2 * i];
    const b = levels[2 * i + 1];
    const prev = i === 0 ? 1 : levels[2 * i - 1];
    const sub = subAt(i);
    const why = meta.why({ bit: bits[i], a, b, prev, lastPulse, sub, pos: sub ? i - sub.startBit : null });
    frames.push({
      step: 2,
      show: { wave: i + 1 },
      slot: i,
      note: why,
      row: { tone: sub ? 'warn' : 'brand', bit: String(bits[i]), first: lv(a), second: lv(b), why },
      detail: [
        { label: 'Bit number', value: `${i + 1} of ${n}` },
        { label: 'Bit value', value: String(bits[i]) },
        { label: 'Level before', value: i === 0 && !['polar_nrz_i', 'differential_manchester'].includes(meta.scheme) ? 'Idle' : lv(prev) },
        { label: 'First half', value: lv(a) },
        { label: 'Second half', value: lv(b) },
      ],
    });
    if (a !== 0) lastPulse = a;
  }

  frames.push({
    step: 3,
    show: { wave: n },
    note: 'The finished signal, exactly as it would appear on the wire.',
    detail: meta.facts,
  });

  return {
    id: meta.scheme.replace(/_/g, '-'),
    title: meta.title,
    subtitle: meta.subtitle,
    group: 'signals',
    layer: { n: 1, name: 'Physical' },
    kind: 'scope',
    overview: { text: meta.text, facts: meta.facts },
    lab: { to: '/signal-studio', label: 'Try your own bits' },
    columns: COLUMNS,
    legend: substitutions.length
      ? [{ tone: 'brand', label: 'Normal AMI' }, { tone: 'warn', label: 'Replacement pattern' }]
      : [{ tone: 'brand', label: 'Signal on the wire' }],
    steps: [
      {
        title: 'The bits',
        subtitle: 'What we want to send',
        body: `We want to send the bits ${meta.bits}. A wire cannot carry 1s and 0s, only voltage. A line code is the rule that turns each bit into a voltage shape.`,
      },
      { title: 'The rule', subtitle: 'How one bit becomes voltage', body: meta.rule },
      { title: 'Bit by bit', subtitle: 'Apply the rule to each bit', body: 'Follow the highlighted slot. The line on the right says why the signal does what it does for this bit.' },
      { title: 'What to notice', subtitle: 'Strengths and weaknesses', body: meta.notice },
    ],
    scope: {
      slots: n,
      y: { min: -1.5, max: 1.5, ticks: [{ v: 1, label: '+V' }, { v: 0, label: '0' }, { v: -1, label: '−V' }] },
      top: { caption: 'Bits', labels: bits.map(String) },
      traces: [{ id: 'wave', type: 'step', perSlot: 2, values: levels, tone: 'brand', progressive: true }],
      marks,
    },
    frames,
  };
}

export function buildSignalLessons() {
  return SCHEMES.map(lineCodeLesson);
}
